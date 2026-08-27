import { printTicketTCP, generateEscPosBuffer, sanitizeEscPosText } from '../src/services/printerService';
import { CartItem, Product } from '../src/store/useCartStore';

const productA: Product = { id: 'product-a', name: 'Producto A', price: 10, category: 'category-a', kitchenStation: 'station_a' };
const productB: Product = { id: 'product-b', name: 'Producto B', price: 20, category: 'category-b', kitchenStation: 'station_b' };
const items: CartItem[] = [
  { product: productA, quantity: 2, notes: 'nota de prueba', status: 'pending', round: 1 },
  { product: productB, quantity: 1, status: 'pending', round: 1 },
];

describe('printerService', () => {
  test('sanitiza caracteres no compatibles con ESC/POS', () => {
    expect(sanitizeEscPosText('Artículo con Piñón ¡Mesa!')).toBe('Articulo con Pinon Mesa!');
  });

  test('genera tickets de cliente y cocina por estación', () => {
    expect(generateEscPosBuffer('3', items, 40, { showPrices: true }).length).toBeGreaterThan(50);
    expect(generateEscPosBuffer('3', items, 0, { isKitchenComanda: true, station: 'station_a' }).length).toBeGreaterThan(30);
    expect(generateEscPosBuffer('3', items, 0, { isKitchenComanda: true, station: 'station_b' }).length).toBeGreaterThan(30);
  });

  test('envía el ticket por la cola TCP', async () => {
    await expect(printTicketTCP('Llevar', items, 40, { showPrices: true })).resolves.toBe(true);
  });
});
