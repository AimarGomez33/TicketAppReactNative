import { useCartStore } from '../src/store/useCartStore';
import { MOCK_PRODUCTS_GENERAL } from '../src/data/mockupMenu';

describe('useCartStore - Multi-Cocina y POS Tests', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().setTableNumber('3');
  });

  test('Debe clasificar y separar platillos de Cocina 1 (Mexicana) y Cocina 2 (Americana/Tacos)', () => {
    const store = useCartStore.getState();
    const chalupa = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-chalupa')!;
    const hamburguesa = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-burg-americana')!;
    const taco = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-taco')!;

    expect(chalupa.kitchenStation).toBe('mexican');
    expect(hamburguesa.kitchenStation).toBe('american_tacos');
    expect(taco.kitchenStation).toBe('american_tacos');

    // Agregar platillos combinados
    store.addQuantity(chalupa, 4); // 4 * $6 = $24
    store.addQuantity(hamburguesa, 1); // 1 * $60 = $60
    store.addQuantity(taco, 2, 'con salsa verde'); // 2 * $35 = $70

    const updatedState = useCartStore.getState();
    const items = Object.values(updatedState.cart);

    // Separar por cocina
    const cocina1Items = items.filter(it => it.product.kitchenStation === 'mexican');
    const cocina2Items = items.filter(it => it.product.kitchenStation === 'american_tacos');

    expect(cocina1Items).toHaveLength(1);
    expect(cocina1Items[0].quantity).toBe(4);

    expect(cocina2Items).toHaveLength(2);

    // Validar Total Unificado para Caja: 24 + 60 + 70 = 154
    expect(updatedState.getTotal()).toBe(154.0);
  });

  test('Debe actualizar el estado de cocina de un platillo a en preparación y listo', () => {
    const store = useCartStore.getState();
    const chalupa = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-chalupa')!;

    store.addQuantity(chalupa, 2);
    expect(useCartStore.getState().cart['gen-chalupa'].status).toBe('pending');

    // Cambiar a en preparación
    store.updateItemKitchenStatus('3', 'gen-chalupa', 'preparing');
    expect(useCartStore.getState().tables['3'].cart['gen-chalupa'].status).toBe('preparing');

    // Cambiar a listo
    store.updateItemKitchenStatus('3', 'gen-chalupa', 'ready');
    expect(useCartStore.getState().tables['3'].cart['gen-chalupa'].status).toBe('ready');
  });
});
