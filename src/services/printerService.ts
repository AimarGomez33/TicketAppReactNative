// src/services/printerService.ts
import TcpSocket from 'react-native-tcp-socket';
import { Buffer } from 'buffer';
import { CartItem } from '../store/useCartStore';

const PRINTER_CONFIG = {
  host: '192.168.100.200',
  port: 9100,
  timeout: 3500,
};

const ESC_POS = {
  INIT: [0x1b, 0x40],
  ALIGN_CENTER: [0x1b, 0x61, 0x01],
  ALIGN_LEFT: [0x1b, 0x61, 0x00],
  ALIGN_RIGHT: [0x1b, 0x61, 0x02],
  TXT_BOLD_ON: [0x1b, 0x45, 0x01],
  TXT_BOLD_OFF: [0x1b, 0x45, 0x00],
  TXT_DOUBLE_HEIGHT: [0x1b, 0x21, 0x10],
  TXT_DOUBLE_SIZE: [0x1b, 0x21, 0x30],
  TXT_NORMAL: [0x1b, 0x21, 0x00],
  CUT_PAPER: [0x1d, 0x56, 0x42, 0x00],
};

export interface PrintOptions {
  showPrices?: boolean;
  isKitchenComanda?: boolean;
  station?: 'mexican' | 'american_tacos' | 'all';
  currentRound?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  amountPaid?: number;
  change?: number;
  isReprint?: boolean;
  orderId?: string;
}

export const generateEscPosBuffer = (
  tableNumber: string,
  items: CartItem[],
  total: number,
  options?: PrintOptions,
): Uint8Array => {
  const showPrices = options?.showPrices ?? true;
  const isKitchen = options?.isKitchenComanda ?? (!showPrices);
  const currentRound = options?.currentRound || 1;
  const station = options?.station || 'all';

  // Filtrar ítems por estación si se especifica comanda de cocina
  let targetItems = items;
  if (isKitchen && station !== 'all') {
    targetItems = items.filter(it => {
      const itemStation = it.product.kitchenStation || 'mexican';
      return itemStation === station;
    });
  }

  const bytes: number[] = [];
  const addBytes = (arr: number[]) => bytes.push(...arr);
  const addText = (text: string) => {
    for (let i = 0; i < text.length; i++) {
      bytes.push(text.charCodeAt(i));
    }
  };

  addBytes(ESC_POS.INIT);
  addBytes(ESC_POS.ALIGN_CENTER);
  addBytes(ESC_POS.TXT_BOLD_ON);
  addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
  addText('ANTOJITOS MEXICANOS MARGARITA\n');
  addBytes(ESC_POS.TXT_NORMAL);
  addBytes(ESC_POS.TXT_BOLD_OFF);

  if (isKitchen) {
    const stationLabel =
      station === 'mexican'
        ? 'COCINA 1: MEXICANA / ANTOJITOS'
        : station === 'american_tacos'
        ? 'COCINA 2: TACOS Y AMERICANA'
        : 'COMANDA GENERAL';

    addBytes(ESC_POS.TXT_BOLD_ON);
    addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
    addText(`*** ${stationLabel} ***\n`);
    addText(`MESA: ${tableNumber ? tableNumber.toUpperCase() : 'S/N'}\n`);
    addBytes(ESC_POS.TXT_NORMAL);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText(`Ronda Actual: #${currentRound} | Hora: ${new Date().toLocaleTimeString()}\n`);
    addText('================================\n');

    // Separar platillos nuevos (pending o de la ronda actual) vs anteriores (ya enviados)
    const newItems = targetItems.filter(it => it.status === 'pending' || (it.round && it.round === currentRound));
    const previousItems = targetItems.filter(it => it.status === 'sent_to_kitchen' && it.round && it.round < currentRound);

    addBytes(ESC_POS.ALIGN_LEFT);

    // Sección 1: Nuevos Platillos a Preparar
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`[!] A PREPARAR (Ronda ${currentRound}):\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText('--------------------------------\n');

    const itemsToPrint = newItems.length > 0 ? newItems : targetItems;
    itemsToPrint.forEach(({ product, quantity, notes }) => {
      addBytes(ESC_POS.TXT_BOLD_ON);
      addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
      addText(` > ${quantity}x ${product.name}\n`);
      addBytes(ESC_POS.TXT_NORMAL);
      addBytes(ESC_POS.TXT_BOLD_OFF);
      if (notes && notes.trim().length > 0) {
        addText(`    * NOTA: ${notes.trim()}\n`);
      }
      addText('\n');
    });

    // Sección 2: Platillos Anteriores ya enviados (Contexto para cocina)
    if (previousItems.length > 0 && newItems.length > 0) {
      addText('\n');
      addBytes(ESC_POS.TXT_BOLD_ON);
      addText('[v] YA ENVIADOS ANTERIORMENTE:\n');
      addBytes(ESC_POS.TXT_BOLD_OFF);
      addText('--------------------------------\n');
      previousItems.forEach(({ product, quantity, notes, round }) => {
        addText(` - (${quantity}x) ${product.name} [Ronda ${round || 1}]\n`);
        if (notes && notes.trim().length > 0) {
          addText(`    * ${notes.trim()}\n`);
        }
      });
    }

    addBytes(ESC_POS.ALIGN_CENTER);
    addText('\n================================\n');
    const totalQty = targetItems.reduce((sum, it) => sum + it.quantity, 0);
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`Total en esta comanda: ${totalQty} articulos\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText('¡Comanda lista para preparar!\n\n\n');

  } else {
    // Ticket de Cobro / Cliente / Mostrador
    if (options?.isReprint) {
      addBytes(ESC_POS.TXT_BOLD_ON);
      addText('*** REIMPRESION DE TICKET ***\n');
      addBytes(ESC_POS.TXT_BOLD_OFF);
    }
    addBytes(ESC_POS.TXT_BOLD_ON);
    const isTakeout =
      !tableNumber ||
      tableNumber.toLowerCase() === 'llevar' ||
      tableNumber.toLowerCase() === 'para llevar' ||
      tableNumber.toLowerCase() === 'mostrador';

    const titleHeader = isTakeout
      ? 'PEDIDO: PARA LLEVAR'
      : `CONSUMO: MESA ${tableNumber.toUpperCase()}`;
    addText(`${titleHeader}\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText(`Fecha: ${new Date().toLocaleString()}\n`);
    addText('--------------------------------\n');

    addBytes(ESC_POS.ALIGN_LEFT);
    items.forEach(({ product, quantity, notes }) => {
      const itemSubtotal = (product.price * quantity).toFixed(2);
      addBytes(ESC_POS.TXT_BOLD_ON);
      addText(`${quantity}x ${product.name}\n`);
      addBytes(ESC_POS.TXT_BOLD_OFF);
      if (notes && notes.trim().length > 0) {
        addText(`   * Nota: ${notes.trim()}\n`);
      }
      addText(`   $${product.price.toFixed(2)} c/u  -->  $${itemSubtotal}\n`);
    });

    addBytes(ESC_POS.ALIGN_CENTER);
    addText('--------------------------------\n');
    addBytes(ESC_POS.TXT_BOLD_ON);
    addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
    addText(`TOTAL A PAGAR: $${total.toFixed(2)}\n`);
    addBytes(ESC_POS.TXT_NORMAL);
    addBytes(ESC_POS.TXT_BOLD_OFF);

    if (options?.paymentMethod) {
      const methodLabel =
        options.paymentMethod === 'cash'
          ? 'EFECTIVO'
          : options.paymentMethod === 'card'
          ? 'TARJETA'
          : 'TRANSFERENCIA';
      addText(`Metodo de Pago: ${methodLabel}\n`);
      if (options.amountPaid && options.amountPaid > 0) {
        addText(`Pagado: $${options.amountPaid.toFixed(2)} | Cambio: $${(options.change || 0).toFixed(2)}\n`);
      }
    }

    addText('--------------------------------\n');
    addText('¡Muchas gracias por su preferencia!\n\n\n');
  }

  addBytes(ESC_POS.CUT_PAPER);
  return new Uint8Array(bytes);
};

// Encolado secuencial para que 2 tickets nunca compitan por el socket al mismo tiempo
let printQueue = Promise.resolve(true);

const executeSinglePrint = (
  payload: Uint8Array,
  host: string,
  port: number,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    let isFinished = false;
    let dataSent = false;
    let client: any = null;

    const cleanup = () => {
      if (client) {
        try {
          client.destroy();
        } catch {}
      }
    };

    client = TcpSocket.createConnection({ host, port }, () => {
      try {
        client.write(Buffer.from(payload), (err?: any) => {
          if (err && !dataSent) {
            if (!isFinished) {
              isFinished = true;
              cleanup();
              reject(err);
            }
            return;
          }

          dataSent = true;
          // Espera de 200ms para vaciar buffers en la interfaz de red antes de destruir
          setTimeout(() => {
            if (!isFinished) {
              isFinished = true;
              cleanup();
              resolve(true);
            }
          }, 200);
        });
      } catch (err) {
        if (!isFinished) {
          isFinished = true;
          cleanup();
          reject(err);
        }
      }
    });

    client.setTimeout(PRINTER_CONFIG.timeout);

    client.on('timeout', () => {
      if (!isFinished) {
        isFinished = true;
        cleanup();
        if (dataSent) {
          resolve(true);
        } else {
          reject(new Error(`Timeout: La impresora en ${host}:${port} no respondió`));
        }
      }
    });

    client.on('error', (error: any) => {
      if (!isFinished) {
        // Si los bytes ya se escribieron a la impresora, ignoramos errores de reset de cierre
        if (dataSent) {
          isFinished = true;
          cleanup();
          resolve(true);
        } else {
          isFinished = true;
          cleanup();
          reject(error);
        }
      }
    });

    client.on('close', () => {
      if (!isFinished) {
        isFinished = true;
        resolve(true);
      }
    });
  });
};

export const printTicketTCP = async (
  tableNumber: string,
  items: CartItem[],
  total: number,
  options?: PrintOptions,
  customHost?: string,
  customPort?: number,
): Promise<boolean> => {
  const payload = generateEscPosBuffer(tableNumber, items, total, options);
  const host = customHost || PRINTER_CONFIG.host;
  const port = customPort || PRINTER_CONFIG.port;

  const task = async () => {
    return executeSinglePrint(payload, host, port);
  };

  printQueue = printQueue.then(task).catch(task);
  return printQueue;
};
