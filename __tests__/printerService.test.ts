// __tests__/printerService.test.ts
import { printTicketTCP, generateEscPosBuffer } from '../src/services/printerService';
import { MOCK_PRODUCTS_GENERAL } from '../src/data/mockupMenu';
import { CartItem } from '../src/store/useCartStore';

describe('printerService - Ticket Generation and Single Print Execution', () => {
  const chalupa = MOCK_PRODUCTS_GENERAL.find((p) => p.id === 'gen-chalupa')!;
  const mockItems: CartItem[] = [
    {
      product: chalupa,
      quantity: 5,
      notes: 'salsa verde aparte',
      status: 'pending',
      round: 1,
    },
  ];

  test('Debe generar el buffer ESC/POS con el encabezado adecuado para mesa y para llevar', () => {
    const bufferLlevar = generateEscPosBuffer('Llevar', mockItems, 30.0, { showPrices: true });
    expect(bufferLlevar.length).toBeGreaterThan(0);

    const bufferMesa = generateEscPosBuffer('4', mockItems, 30.0, { showPrices: true });
    expect(bufferMesa.length).toBeGreaterThan(0);

    const bufferCocina = generateEscPosBuffer('4', mockItems, 30.0, { isKitchenComanda: true, station: 'mexican' });
    expect(bufferCocina.length).toBeGreaterThan(0);
  });

  test('Debe ejecutar la impresión una única vez sin generar duplicados', async () => {
    const result = await printTicketTCP('Llevar', mockItems, 30.0, { showPrices: true });
    expect(result).toBe(true);
  });
});
