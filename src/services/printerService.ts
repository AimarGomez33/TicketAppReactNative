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
  currentRound?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  amountPaid?: number;
  change?: number;
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
    addBytes(ESC_POS.TXT_BOLD_ON);
    addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
    addText(`*** COMANDA COCINA - MESA ${tableNumber || 'S/N'} ***\n`);
    addBytes(ESC_POS.TXT_NORMAL);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText(`Ronda Actual: #${currentRound} | Hora: ${new Date().toLocaleTimeString()}\n`);
    addText('================================\n');

    // Separar platillos nuevos (pending o de la ronda actual) vs anteriores (ya enviados)
    const newItems = items.filter(it => it.status === 'pending' || (it.round && it.round === currentRound));
    const previousItems = items.filter(it => it.status === 'sent_to_kitchen' && it.round && it.round < currentRound);

    addBytes(ESC_POS.ALIGN_LEFT);

    // Sección 1: Nuevos Platillos a Preparar
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`[!] NUEVOS A PREPARAR (Ronda ${currentRound}):\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText('--------------------------------\n');

    if (newItems.length === 0) {
      // Si todos estaban marcados, imprimir todos
      items.forEach(({ product, quantity, notes }) => {
        addBytes(ESC_POS.TXT_BOLD_ON);
        addText(` > ${quantity}x ${product.name}\n`);
        addBytes(ESC_POS.TXT_BOLD_OFF);
        if (notes && notes.trim().length > 0) {
          addText(`    * NOTA: ${notes.trim()}\n`);
        }
        addText('\n');
      });
    } else {
      newItems.forEach(({ product, quantity, notes }) => {
        addBytes(ESC_POS.TXT_BOLD_ON);
        addText(` > ${quantity}x ${product.name}\n`);
        addBytes(ESC_POS.TXT_BOLD_OFF);
        if (notes && notes.trim().length > 0) {
          addText(`    * NOTA: ${notes.trim()}\n`);
        }
        addText('\n');
      });
    }

    // Sección 2: Platillos Anteriores ya enviados (Contexto para cocina)
    if (previousItems.length > 0) {
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
    const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`Total Acumulado Mesa: ${totalQty} articulos\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText('¡Comanda enviada a cocina!\n\n\n');

  } else {
    // Ticket de Cobro / Cliente
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`TICKET DE CONSUMO - MESA ${tableNumber || 'S/N'}\n`);
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

export const printTicketTCP = (
  tableNumber: string,
  items: CartItem[],
  total: number,
  options?: PrintOptions,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const payload = generateEscPosBuffer(tableNumber, items, total, options);

    const client = TcpSocket.createConnection(
      { host: PRINTER_CONFIG.host, port: PRINTER_CONFIG.port },
      () => {
        client.write(Buffer.from(payload));
        client.destroy();
        resolve(true);
      },
    );

    client.setTimeout(PRINTER_CONFIG.timeout);

    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Timeout: Impresora 192.168.100.200 no responde'));
    });

    client.on('error', error => {
      client.destroy();
      reject(error);
    });
  });
};
