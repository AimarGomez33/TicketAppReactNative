// src/services/printerService.ts
import TcpSocket from 'react-native-tcp-socket';
import { Buffer } from 'buffer';
import { CartItem } from '../store/useCartStore';
import { SUPABASE_CONFIG } from '../config/supabaseConfig';

const PRINTER_CONFIG = {
  host: SUPABASE_CONFIG.printerHost,
  port: SUPABASE_CONFIG.printerPort,
  timeout: 3000, // 3 segundos max para no congelar la UI
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

/**
 * Sanitiza texto para impresoras térmicas ESC/POS:
 * Remueve acentos y caracteres especiales que congelan el buffer de la impresora
 */
export const sanitizeEscPosText = (text: string): string => {
  return text
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[ñ]/g, 'n')
    .replace(/[Ñ]/g, 'N')
    .replace(/[¿¡]/g, '')
    .replace(/[^\x20-\x7E\n\r\t]/g, ''); // Solo caracteres ASCII imprimibles
};

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
    targetItems = items.filter((it) => {
      const itemStation = it.product.kitchenStation || 'mexican';
      return itemStation === station;
    });
  }

  const bytes: number[] = [];
  const addBytes = (arr: number[]) => bytes.push(...arr);
  const addText = (text: string) => {
    const cleanText = sanitizeEscPosText(text);
    for (let i = 0; i < cleanText.length; i++) {
      bytes.push(cleanText.charCodeAt(i));
    }
  };

  addBytes(ESC_POS.INIT);
  addBytes(ESC_POS.ALIGN_CENTER);
  addBytes(ESC_POS.TXT_BOLD_ON);
  addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
  const headerName = (SUPABASE_CONFIG.restaurantName || 'TICKET APP POS').toUpperCase();
  addText(`${headerName}\n`);
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
    const newItems = targetItems.filter(
      (it) => it.status === 'pending' || (it.round && it.round === currentRound)
    );
    const previousItems = targetItems.filter(
      (it) => it.status === 'sent_to_kitchen' && it.round && it.round < currentRound
    );

    if (newItems.length > 0) {
      addBytes(ESC_POS.TXT_BOLD_ON);
      addText(`--- PLATILLOS A PREPARAR (Ronda #${currentRound}) ---\n`);
      addBytes(ESC_POS.TXT_BOLD_OFF);
      addBytes(ESC_POS.ALIGN_LEFT);

      newItems.forEach((it) => {
        addBytes(ESC_POS.TXT_BOLD_ON);
        addText(`[ ] ${it.quantity}x ${it.product.name}\n`);
        addBytes(ESC_POS.TXT_BOLD_OFF);
        if (it.notes && it.notes.trim().length > 0) {
          addText(`    * NOTA: ${it.notes.trim()}\n`);
        }
      });
      addText('\n');
    }

    if (previousItems.length > 0) {
      addBytes(ESC_POS.ALIGN_CENTER);
      addText('--- RONDAS ANTERIORES (YA ENVIADAS) ---\n');
      addBytes(ESC_POS.ALIGN_LEFT);
      previousItems.forEach((it) => {
        addText(`  (R#${it.round || 1}) ${it.quantity}x ${it.product.name} ${it.notes ? `(${it.notes})` : ''}\n`);
      });
      addText('\n');
    }

    addBytes(ESC_POS.ALIGN_CENTER);
    addText('================================\n\n\n');
    addBytes(ESC_POS.CUT_PAPER);
    return new Uint8Array(bytes);
  }

  // --- TICKET DE CUENTA / CLIENTE ---
  addBytes(ESC_POS.ALIGN_CENTER);
  if (options?.isReprint) {
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText('*** REIMPRESION DE TICKET ***\n');
    addBytes(ESC_POS.TXT_BOLD_OFF);
  }
  addText(`MESA / ORDEN: ${tableNumber ? tableNumber.toUpperCase() : 'MOSTRADOR'}\n`);
  if (options?.orderId) {
    addText(`Folio: #${options.orderId.slice(-6).toUpperCase()}\n`);
  }
  addText(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`);
  addText('================================\n');

  addBytes(ESC_POS.ALIGN_LEFT);
  addBytes(ESC_POS.TXT_BOLD_ON);
  addText('CANT  DESCRIPCION         TOTAL\n');
  addBytes(ESC_POS.TXT_BOLD_OFF);
  addText('--------------------------------\n');

  targetItems.forEach((it) => {
    const qtyStr = it.quantity.toString().padEnd(4, ' ');
    const lineTotal = (it.product.price * it.quantity).toFixed(2);
    const lineTotalStr = `$${lineTotal}`.padStart(9, ' ');
    const nameMaxLen = 32 - 4 - 9;
    const nameTruncated = it.product.name.slice(0, nameMaxLen).padEnd(nameMaxLen, ' ');

    addText(`${qtyStr}${nameTruncated}${lineTotalStr}\n`);
    if (it.notes && it.notes.trim().length > 0) {
      addText(`   * ${it.notes.trim()}\n`);
    }
  });

  addText('--------------------------------\n');
  addBytes(ESC_POS.ALIGN_RIGHT);
  addBytes(ESC_POS.TXT_BOLD_ON);
  addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
  addText(`TOTAL: $${total.toFixed(2)}\n`);
  addBytes(ESC_POS.TXT_NORMAL);
  addBytes(ESC_POS.TXT_BOLD_OFF);

  if (options?.paymentMethod) {
    addBytes(ESC_POS.ALIGN_LEFT);
    const methodStr =
      options.paymentMethod === 'cash'
        ? 'Efectivo'
        : options.paymentMethod === 'card'
        ? 'Tarjeta'
        : 'Transferencia';
    addText(`Metodo de Pago: ${methodStr}\n`);
    if (options.amountPaid && options.amountPaid > 0) {
      addText(`Recibido: $${options.amountPaid.toFixed(2)}\n`);
      addText(`Cambio:   $${(options.change || 0).toFixed(2)}\n`);
    }
  }

  addBytes(ESC_POS.ALIGN_CENTER);
  addText('\n¡Gracias por su preferencia!\n');
  addText('================================\n\n\n');
  addBytes(ESC_POS.CUT_PAPER);

  return new Uint8Array(bytes);
};

/**
 * Transmisión Socket TCP a la impresora (Ejecución individual limpia sin duplicados)
 */
const executeSocketTransmission = (
  payload: Uint8Array,
  host: string,
  port: number,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    let client: any = null;
    let isFinished = false;
    let dataSent = false;

    const cleanup = () => {
      if (client) {
        try {
          client.removeAllListeners();
          client.destroy();
        } catch {}
        client = null;
      }
    };

    try {
      client = TcpSocket.createConnection({ host, port }, () => {
        try {
          const buffer = Buffer.from(payload);
          client.write(buffer, (err?: any) => {
            if (err) {
              if (!isFinished) {
                isFinished = true;
                cleanup();
                reject(err);
              }
              return;
            }

            dataSent = true;
            // 200ms para corte de papel y finalización
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
            reject(new Error(`Timeout: Impresora en ${host}:${port} no respondió.`));
          }
        }
      });

      client.on('error', (error: any) => {
        if (!isFinished) {
          isFinished = true;
          cleanup();
          if (dataSent) {
            resolve(true);
          } else {
            reject(error);
          }
        }
      });

      client.on('close', () => {
        if (!isFinished) {
          isFinished = true;
          cleanup();
          resolve(true);
        }
      });
    } catch (createErr) {
      cleanup();
      reject(createErr);
    }
  });
};

/**
 * Deduplicador estricto para evitar imprimir 2 o 3 veces el mismo ticket
 */
let lastPrintFingerprint = '';
let lastPrintTimestamp = 0;
let isPrintLocked = false;

export const printTicketTCP = async (
  tableNumber: string,
  items: CartItem[],
  total: number,
  options?: PrintOptions,
  customHost?: string,
  customPort?: number,
): Promise<boolean> => {
  const currentFingerprint = `${tableNumber}_${total}_${items.length}_${options?.isKitchenComanda ? 'kitchen' : 'bill'}_${options?.currentRound || 1}`;
  const now = Date.now();

  // Si se envió EXACTAMENTE el mismo ticket hace menos de 2.5 segundos, descartar duplicado
  if (currentFingerprint === lastPrintFingerprint && now - lastPrintTimestamp < 2500) {
    console.log('🛡️ Descartando impresión duplicada prevenida por deduplicador.');
    return true;
  }

  if (isPrintLocked) {
    console.log('🛡️ Impresión en progreso, evitando colisión de socket.');
    return true;
  }

  isPrintLocked = true;
  lastPrintFingerprint = currentFingerprint;
  lastPrintTimestamp = now;

  const payload = generateEscPosBuffer(tableNumber, items, total, options);
  const host = customHost || PRINTER_CONFIG.host;
  const port = customPort || PRINTER_CONFIG.port;

  try {
    const result = await executeSocketTransmission(payload, host, port);
    isPrintLocked = false;
    return result;
  } catch (err) {
    isPrintLocked = false;
    throw err;
  }
};
