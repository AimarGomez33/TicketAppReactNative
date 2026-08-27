import { Product, useCartStore } from '../src/store/useCartStore';

const catalog: Product[] = [
  { id: 'product-a', name: 'Producto A', price: 10, category: 'category-a', kitchenStation: 'station_a' },
  { id: 'product-b', name: 'Producto B', price: 25, category: 'category-b', kitchenStation: 'station_b' },
  { id: 'product-c', name: 'Producto C', price: 15, category: 'category-b', kitchenStation: 'station_b' },
];

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ menuProducts: catalog, menuCategories: [] });
    useCartStore.getState().clearCart();
    useCartStore.getState().clearQuickSale();
    useCartStore.getState().setTableNumber('3');
  });

  test('separa productos por estación y calcula el total', () => {
    const [first, second, third] = catalog;
    const store = useCartStore.getState();
    store.addQuantity(first, 4);
    store.addQuantity(second, 1);
    store.addQuantity(third, 2, 'nota de prueba');

    const items = Object.values(useCartStore.getState().cart);
    expect(items.filter(item => item.product.kitchenStation === 'station_a')).toHaveLength(1);
    expect(items.filter(item => item.product.kitchenStation === 'station_b')).toHaveLength(2);
    expect(useCartStore.getState().getTotal()).toBe(95);
  });

  test('actualiza el estado de cocina de un producto', () => {
    const product = catalog[0];
    useCartStore.getState().addQuantity(product, 2);
    useCartStore.getState().updateItemKitchenStatus('3', product.id, 'preparing');
    expect(useCartStore.getState().tables['3'].cart[product.id].status).toBe('preparing');
  });

  test('crea y edita una venta rápida sin duplicar historial', async () => {
    const [first, second] = catalog;
    const store = useCartStore.getState();
    store.addQuickSaleItem(first, 1);
    store.addQuickSaleItem(second, 2);
    const order = await store.createQuickSaleOrder('Llevar');

    expect(order?.total).toBe(60);
    expect(useCartStore.getState().ordersHistory).toHaveLength(1);

    useCartStore.getState().loadQuickSaleOrderForEdit(order!.id);
    useCartStore.getState().addQuickSaleItem(first, 1);
    await useCartStore.getState().updateAndSaveQuickSaleOrder(order!.id, '4');

    const saved = useCartStore.getState().ordersHistory[0];
    expect(saved.id).toBe(order!.id);
    expect(saved.tableNumber).toBe('4');
    expect(saved.total).toBe(70);
  });

  test('agrega un producto con precio abierto', () => {
    useCartStore.getState().addCustomExtraItem(25.5, 'Concepto de prueba', 'nota', false);
    const items = Object.values(useCartStore.getState().cart);
    expect(items).toHaveLength(1);
    expect(items[0].product.price).toBe(25.5);
  });
});
