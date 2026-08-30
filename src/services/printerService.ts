// src/services/printerService.ts
import TcpSocket from 'react-native-tcp-socket';
import { Buffer } from 'buffer';
import { CartItem, PaymentMethod } from '../store/useCartStore';
import { SUPABASE_CONFIG } from '../config/supabaseConfig';

const PRINTER_CONFIG = {
  host: SUPABASE_CONFIG.printerHost,
  port: SUPABASE_CONFIG.printerPort,
  timeout: 4000,
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
  station?: 'station_a' | 'station_b' | 'all';
  currentRound?: number;
  paymentMethod?: PaymentMethod;
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

  let targetItems = items;
  if (isKitchen && station !== 'all') {
    targetItems = items.filter((it) => {
      const itemStation = it.product.kitchenStation || 'station_a';
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
      station === 'station_a'
        ? 'ESTACION DE COCINA 1'
        : station === 'station_b'
        ? 'ESTACION DE COCINA 2'
        : 'COMANDA GENERAL';

    addBytes(ESC_POS.TXT_BOLD_ON);
    addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
    addText(`*** ${stationLabel} ***\n`);
    addText(`MESA: ${tableNumber ? tableNumber.toUpperCase() : 'S/N'}\n`);
    addBytes(ESC_POS.TXT_NORMAL);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    addText(`Ronda: #${currentRound} | Hora: ${new Date().toLocaleTimeString()}\n`);
    addText('================================\n');

    const newItems = targetItems.filter(
      (it) => it.status === 'pending' || (it.round && it.round === currentRound)
    );
    const previousItems = targetItems.filter(
      (it) => it.status === 'sent_to_kitchen' && it.round && it.round < currentRound
    );

    const itemsToPrint = newItems.length > 0 ? newItems : targetItems;

    addBytes(ESC_POS.ALIGN_LEFT);
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`--- A PREPARAR (Ronda #${currentRound}) ---\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);

    itemsToPrint.forEach((it) => {
      addBytes(ESC_POS.TXT_BOLD_ON);
      addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
      addText(` > ${it.quantity}x ${it.product.name}\n`);
      addBytes(ESC_POS.TXT_NORMAL);
      addBytes(ESC_POS.TXT_BOLD_OFF);
      if (it.notes && it.notes.trim().length > 0) {
        addText(`    * NOTA: ${it.notes.trim()}\n`);
      }
      addText('\n');
    });

    if (previousItems.length > 0 && newItems.length > 0) {
      addBytes(ESC_POS.ALIGN_CENTER);
      addText('--- RONDAS ANTERIORES ---\n');
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
    addText('Metodo de Pago: Efectivo\n');
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
 * Transmisión Socket TCP a la impresora térmica con manejo de ciclo de vida seguro
 */
const executeSocketTransmission = (
  payload: Uint8Array,
  host: string,
  port: number,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    let client: any = null;
    let isSettled = false;

    const cleanup = () => {
      if (client) {
        try {
          client.removeAllListeners();
          client.destroy();
        } catch {}
        client = null;
      }
    };

    const finishSuccess = () => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        resolve(true);
      }
    };

    const finishError = (err: any) => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(err);
      }
    };

    try {
      client = TcpSocket.createConnection({ host, port }, () => {
        try {
          const buffer = Buffer.from(payload);
          client.write(buffer, (err?: any) => {
            if (err) {
              finishError(err);
              return;
            }
            setTimeout(finishSuccess, 180);
          });
        } catch (writeErr) {
          finishError(writeErr);
        }
      });

      client.setTimeout(PRINTER_CONFIG.timeout);

      client.on('timeout', () => {
        finishError(new Error(`Timeout: Impresora en ${host}:${port} no respondió.`));
      });

      client.on('error', (err: any) => {
        finishError(err);
      });

      client.on('close', () => {
        finishSuccess();
      });
    } catch (createErr) {
      finishError(createErr);
    }
  });
};

/**
 * Cola de impresión autorrecuperable (FIFO):
 * Garantiza que si una impresión falla o tiene jitter de red,
 * NUNCA bloquee ni aborte las impresiones futuras de la aplicación.
 */
class RobustPrinterQueue {
  private queue: (() => Promise<boolean>)[] = [];
  private isProcessing = false;

  public enqueue(job: () => Promise<boolean>): Promise<boolean> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        try {
          const ok = await job();
          resolve(ok);
          return ok;
        } catch (err) {
          console.warn('[PrinterQueue] Fallo en envio a impresora:', err);
          resolve(false);
          return false;
        }
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch {}
    }
    this.isProcessing = false;
    if (this.queue.length > 0) {
      setTimeout(() => this.processNext(), 100);
    }
  }
}

const printerQueue = new RobustPrinterQueue();

let lastPrintSignature = '';
let lastPrintTime = 0;

export const printTicketTCP = async (
  tableNumber: string,
  items: CartItem[],
  total: number,
  options?: PrintOptions,
  customHost?: string,
  customPort?: number,
): Promise<boolean> => {
  if (!items || items.length === 0) return true;

  const signature = `${tableNumber}_${total}_${items.length}_${options?.isKitchenComanda ? 'k' : 'b'}_${options?.currentRound || 1}`;
  const now = Date.now();

  // Antirrebote ultra-rápido de 350ms para evitar dobles clics accidentales en pantalla táctil
  if (signature === lastPrintSignature && now - lastPrintTime < 350) {
    return true;
  }

  lastPrintSignature = signature;
  lastPrintTime = now;

  const payload = generateEscPosBuffer(tableNumber, items, total, options);
  const host = customHost || PRINTER_CONFIG.host;
  const port = customPort || PRINTER_CONFIG.port;

  return printerQueue.enqueue(() => executeSocketTransmission(payload, host, port));
};
