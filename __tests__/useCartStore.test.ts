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
    store.addQuantity(hamburguesa, 1); // 1 * $80 = $80
    store.addQuantity(taco, 2, 'con salsa verde'); // 2 * $35 = $70

    const updatedState = useCartStore.getState();
    const items = Object.values(updatedState.cart);

    // Separar por cocina
    const cocina1Items = items.filter(it => it.product.kitchenStation === 'mexican');
    const cocina2Items = items.filter(it => it.product.kitchenStation === 'american_tacos');

    expect(cocina1Items).toHaveLength(1);
    expect(cocina1Items[0].quantity).toBe(4);

    expect(cocina2Items).toHaveLength(2);

    // Validar Total Unificado para Caja: 24 + 80 + 70 = 174
    expect(updatedState.getTotal()).toBe(174.0);
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

  test('Debe generar ticket de mostrador, permitir reimprimirlo y editarlo sin duplicar pedidos', async () => {
    const store = useCartStore.getState();
    store.clearQuickSale();

    const pozole = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-pozole-grande')!; // $120
    const refresco = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-refresco')!; // $28
    const taco = MOCK_PRODUCTS_GENERAL.find(p => p.id === 'gen-taco')!; // $35

    // 1. Agregar platillos a la comanda manual (1 pozole + 2 refrescos = $176)
    store.addQuickSaleItem(pozole, 1);
    store.addQuickSaleItem(refresco, 2);

    expect(useCartStore.getState().getQuickSaleItemCount()).toBe(3);
    expect(useCartStore.getState().getQuickSaleTotal()).toBe(176.0);

    // 2. Generar ticket de cuenta para mesa o para llevar
    const newOrder = await useCartStore.getState().createQuickSaleOrder('Llevar');
    expect(newOrder).not.toBeNull();
    expect(newOrder!.tableNumber).toBe('Llevar');
    expect(newOrder!.total).toBe(176.0);
    expect(newOrder!.items).toHaveLength(2);

    // Verificar que la comanda actual se limpió y el historial tiene 1 pedido
    expect(Object.keys(useCartStore.getState().quickSaleCart)).toHaveLength(0);
    expect(useCartStore.getState().ordersHistory).toHaveLength(1);

    // 3. Reimprimir pedido del historial (no debe crear un pedido nuevo)
    const reprintSuccess = await useCartStore.getState().reprintQuickSaleOrder(newOrder!.id);
    expect(reprintSuccess).toBe(true);
    expect(useCartStore.getState().ordersHistory).toHaveLength(1); // Sigue siendo 1 pedido

    // 4. Cargar pedido para edición
    useCartStore.getState().loadQuickSaleOrderForEdit(newOrder!.id);
    expect(useCartStore.getState().editingQuickSaleOrderId).toBe(newOrder!.id);
    expect(useCartStore.getState().getQuickSaleTotal()).toBe(176.0);

    // 5. Modificar el pedido: agregar 1 taco ($35) -> Total = 176 + 35 = $211
    useCartStore.getState().addQuickSaleItem(taco, 1);
    expect(useCartStore.getState().getQuickSaleTotal()).toBe(211.0);

    // 6. Guardar cambios en el pedido existente (cambiando destino a Mesa 4) y reimprimir
    const updateSuccess = await useCartStore.getState().updateAndSaveQuickSaleOrder(newOrder!.id, '4');
    expect(updateSuccess).toBe(true);

    // 7. Verificar que el pedido original fue actualizado y NO se duplicó en el historial
    const stateFinal = useCartStore.getState();
    expect(stateFinal.editingQuickSaleOrderId).toBeNull();
    expect(Object.keys(stateFinal.quickSaleCart)).toHaveLength(0);
    expect(stateFinal.ordersHistory).toHaveLength(1); // Sigue habiendo solo 1 pedido
    expect(stateFinal.ordersHistory[0].id).toBe(newOrder!.id);
    expect(stateFinal.ordersHistory[0].tableNumber).toBe('4');
    expect(stateFinal.ordersHistory[0].total).toBe(211.0);
    expect(stateFinal.ordersHistory[0].items).toHaveLength(3);
    expect(stateFinal.ordersHistory[0].lastModified).toBeDefined();
  });

  test('Debe incluir los nuevos pambazos con queso con su precio calculado (Base + $15)', () => {
    const store = useCartStore.getState();
    const pambazoNatQueso = store.menuProducts.find(p => p.id === 'gen-pambazo-nat-queso')!;
    const pambazoAdobQueso = store.menuProducts.find(p => p.id === 'gen-pambazo-adob-queso')!;

    expect(pambazoNatQueso).toBeDefined();
    expect(pambazoNatQueso.price).toBe(53.0); // $38 + $15

    expect(pambazoAdobQueso).toBeDefined();
    expect(pambazoAdobQueso.price).toBe(58.0); // $43 + $15

    // Agregar ambos
    store.addQuantity(pambazoNatQueso, 1);
    store.addQuantity(pambazoAdobQueso, 1);

    expect(useCartStore.getState().getTotal()).toBe(111.0); // 53 + 58
  });

  test('Debe permitir agregar Extra Personalizado con precio abierto y descripción', () => {
    const store = useCartStore.getState();
    store.clearCart();

    // Agregar extra con precio personalizado de $25.50
    store.addCustomExtraItem(25.50, 'Porción Doble de Guacamole', 'bien frío', false);

    const items = Object.values(useCartStore.getState().cart);
    expect(items).toHaveLength(1);
    expect(items[0].product.name).toBe('Porción Doble de Guacamole');
    expect(items[0].product.price).toBe(25.50);
    expect(items[0].notes).toBe('bien frío');
    expect(useCartStore.getState().getTotal()).toBe(25.50);
  });
});
