jest.mock('../src/services/printerService', () => ({
  printTicketTCP: jest.fn().mockRejectedValue(new Error('Impresora no disponible')),
}));

import { printTicketTCP } from '../src/services/printerService';
import { Product, useCartStore } from '../src/store/useCartStore';

const product: Product = {
  id: 'payment-product',
  name: 'Producto de pago',
  price: 25,
  category: 'pruebas',
};

describe('payment flow', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.setState({ ordersHistory: [], tableNumber: '' });
    useCartStore.getState().setTableNumber('8');
  });

  it('records the cash payment even when printing is unavailable', async () => {
    useCartStore.getState().addQuantity(product, 2);

    await useCartStore.getState().completePayment('cash', 50, 0);

    expect(printTicketTCP).not.toHaveBeenCalled();
    expect(useCartStore.getState().ordersHistory).toHaveLength(1);
    expect(useCartStore.getState().ordersHistory[0]).toMatchObject({
      tableNumber: '8',
      total: 50,
      paymentMethod: 'cash',
    });
    expect(useCartStore.getState().tableNumber).toBe('');
  });
});
