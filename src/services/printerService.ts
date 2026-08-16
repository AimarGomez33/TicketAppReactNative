// src/services/printerService.ts
import TcpSocket from 'react-native-tcp-socket';
import { Buffer } from 'buffer';
import { CartItem } from '../store/useCartStore';

const PRINTER_CONFIG = {
  host: '192.168.100.200',
  port: 9100,
  timeout: 3000,
};

const ESC_POS = {
  INIT: [0x1b, 0x40],
  ALIGN_CENTER: [0x1b, 0x61, 0x01],
  ALIGN_LEFT: [0x1b, 0x61, 0x00],
  TXT_BOLD_ON: [0x1b, 0x45, 0x01],
  TXT_BOLD_OFF: [0x1b, 0x45, 0x00],
  TXT_DOUBLE_HEIGHT: [0x1b, 0x21, 0x10],
  TXT_NORMAL: [0x1b, 0x21, 0x00],
  CUT_PAPER: [0x1d, 0x56, 0x42, 0x00],
};

export const generateEscPosBuffer = (
  tableNumber: string,
  items: CartItem[],
  total: number,
): Uint8Array => {
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
  addText('ANTOJITOS MARGARITA\n');
  addBytes(ESC_POS.TXT_NORMAL);
  addBytes(ESC_POS.TXT_BOLD_OFF);
  addText(`Mesa: ${tableNumber || 'S/N'}\n`);
  addText(`Fecha: ${new Date().toLocaleString()}\n`);
  addText('--------------------------------\n');

  addBytes(ESC_POS.ALIGN_LEFT);
  items.forEach(({ product, quantity, notes }) => {
    const itemTotal = (product.price * quantity).toFixed(2);
    addBytes(ESC_POS.TXT_BOLD_ON);
    addText(`${quantity}x ${product.name}\n`);
    addBytes(ESC_POS.TXT_BOLD_OFF);
    if (notes && notes.trim().length > 0) {
      addText(`   * NOTA: ${notes.trim()}\n`);
    }
    addText(`    $${product.price.toFixed(2)} c/u  ->  $${itemTotal}\n`);
  });

  addBytes(ESC_POS.ALIGN_CENTER);
  addText('--------------------------------\n');
  addBytes(ESC_POS.TXT_BOLD_ON);
  addBytes(ESC_POS.TXT_DOUBLE_HEIGHT);
  addText(`TOTAL: $${total.toFixed(2)}\n`);
  addBytes(ESC_POS.TXT_NORMAL);
  addBytes(ESC_POS.TXT_BOLD_OFF);
  addText('--------------------------------\n\n');
  addText('¡Gracias por su compra!\n\n\n');

  addBytes(ESC_POS.CUT_PAPER);

  return new Uint8Array(bytes);
};

export const printTicketTCP = (
  tableNumber: string,
  items: CartItem[],
  total: number,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const payload = generateEscPosBuffer(tableNumber, items, total);

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
