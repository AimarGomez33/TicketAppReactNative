// src/store/useCartStore.ts
import { create } from 'zustand';
import {
  fetchRemoteTables,
  fetchActiveOrderItems,
  syncActiveOrderToSupabase,
  requestBillInSupabase,
  finalizePaymentInSupabase,
  clearTableInSupabase,
  updateTableStatusInSupabase,
  updateOrderItemStatusInSupabase,
  subscribeToRealtimeChanges,
  broadcastTableState,
  broadcastKitchenItemStatus,
  fetchMenuCategoriesFromSupabase,
  fetchMenuProductsFromSupabase,
  RemoteTableUpdate,
  ensureSupabaseSession,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../config/supabaseConfig';
import { printTicketTCP } from '../services/printerService';
import { runInBackground } from '../services/asyncWorkerPool';

export type KitchenStation = 'station_a' | 'station_b';

export interface Category {
  id: string;
  name: string;
  station?: KitchenStation | 'all';
  iconName?: string;
  sortOrder?: number;
}

export interface ProductModifierOption {
  id: string;
  name: string;
  priceDelta?: number;
}

export interface ProductModifierGroup {
  id: string;
  label: string;
  minSelections?: number;
  maxSelections?: number;
  options: ProductModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  kitchenStation?: KitchenStation;
  isCustomPrice?: boolean;
  isFavorite?: boolean;
  favoriteOrder?: number;
  /** ID del producto de menú en Supabase, distinto del ID de una línea configurada. */
  menuProductId?: string;
  /** Importe adicional total de los modificadores elegidos. */
  modifierTotal?: number;
  variants?: { id: string; name: string; price?: number }[];
  /** Configuración comercial que llega de menu_products.modifier_groups. */
  modifierGroups?: ProductModifierGroup[];
  /** Opciones elegidas para una línea ya configurada del carrito. */
  selectedModifierOptionIds?: string[];
}

export type ItemKitchenStatus = 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  round?: number; // Número de ronda (1, 2, 3...)
  status?: ItemKitchenStatus; // 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready'
  dbId?: string;
}

export type TableStatus = 'free' | 'busy' | 'bill_requested' | 'cleaning';
export type ActiveOrderType = 'table' | 'takeaway';
export type PaymentMethod = 'cash';

export const isTakeawayReference = (reference: string): boolean =>
  reference === 'Llevar' || reference.startsWith('L-');

export const getOrderDisplayLabel = (reference: string): string =>
  isTakeawayReference(reference) ? `PARA LLEVAR ${reference}` : `MESA ${reference}`;

export interface TableOrder {
  status: TableStatus;
  cart: Record<string, CartItem>;
  orderType?: ActiveOrderType;
  currentRound?: number;
  lastUpdated?: string;
  waiterName?: string;
  isBillRequested?: boolean;
}

export interface OrderHistoryItem {
  id: string;
  tableNumber: string;
  items: CartItem[];
  total: number;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  change?: number;
  timestamp: string;
  orderType?: 'table' | 'quick_sale';
  lastModified?: string;
}

export type AppVersionMode = 'general' | 'detailed';

export interface CustomAlertData {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'printer';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CartState {
  tableNumber: string; // Mesa activa seleccionada
  cart: Record<string, CartItem>; // Carrito de la mesa activa
  tables: Record<string, TableOrder>; // Estado de todas las mesas
  ordersHistory: OrderHistoryItem[]; // Historial local de pagos
  
  activeTab: 'tables' | 'ordering' | 'kitchen' | 'payment'; // Pantalla/Tab activa global
  
  appMode: AppVersionMode; // 'general' = versión simplificada, 'detailed' = versión detallada
  includePricesInTicket: boolean; // Controla si se imprimen los precios en el ticket
  customAlert: CustomAlertData | null; // Alert estilizado global
  isRealtimeConnected: boolean;

  // Acciones de UI / Modos
  setAppMode: (mode: AppVersionMode) => void;
  setIncludePricesInTicket: (include: boolean) => void;
  showCustomAlert: (alert: CustomAlertData) => void;
  hideCustomAlert: () => void;
  setActiveTab: (tab: 'tables' | 'ordering' | 'kitchen' | 'payment') => void;
  setRealtimeConnected: (connected: boolean) => void;

  // Acciones de Comanda Local y Sincronizada
  setTableNumber: (table: string) => void;
  createTakeawayOrder: () => string;
  setTableStatus: (table: string, status: TableStatus) => void;
  addItem: (product: Product, notes?: string) => void;
  addQuantity: (product: Product, quantityToAdd: number, notes?: string) => void;
  setQuantity: (product: Product, quantity: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  updateItemKitchenStatus: (tableNumber: string, productId: string, status: ItemKitchenStatus) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getPendingItemsCount: () => number;
  getCurrentTableRound: () => number;

  // Flujo Mesero -> Cocina / Rondas
  sendRoundToKitchen: (tableNumber?: string) => Promise<boolean>;
  requestBillForTable: (tableNumber?: string) => Promise<boolean>;

  // Flujo Operador -> Cobro
  completePayment: (paymentMethod: PaymentMethod, amountPaid: number, change: number) => Promise<void>;
  
  // Flujo Secundario: Venta Rápida / Comanda Manual en Caja
  quickSaleCart: Record<string, CartItem>;
  editingQuickSaleOrderId: string | null;
  addQuickSaleItem: (product: Product, quantityToAdd?: number, notes?: string) => void;
  setQuickSaleQuantity: (product: Product, quantity: number, notes?: string) => void;
  removeQuickSaleItem: (productId: string) => void;
  clearQuickSale: () => void;
  getQuickSaleTotal: () => number;
  getQuickSaleItemCount: () => number;
  createQuickSaleOrder: (
    tableNumber?: string,
    paymentMethod?: PaymentMethod,
    amountPaid?: number,
    changeGiven?: number,
  ) => Promise<OrderHistoryItem | null>;
  loadQuickSaleOrderForEdit: (orderId: string) => void;
  cancelEditQuickSaleOrder: () => void;
  updateAndSaveQuickSaleOrder: (orderId: string, tableNumber?: string) => Promise<boolean>;
  reprintQuickSaleOrder: (orderId: string) => Promise<boolean>;
  finalizeQuickSale: (paymentMethod?: PaymentMethod, amountPaid?: number, change?: number) => Promise<boolean>;

  // Catálogo de Menú y Extras Personalizados
  menuProducts: Product[];
  menuCategories: Category[];
  loadMenuFromRemote: () => Promise<void>;
  addCustomExtraItem: (price: number, name?: string, notes?: string, isQuickSale?: boolean) => void;

  // Inicialización y Sincronización Supabase
  initializeTables: () => void;
  initRealtimeSync: () => void;
  loadTableCartFromRemote: (tableNumber: string) => Promise<void>;
}

// Inicialización de 12 mesas estándar + orden rápida
const initialTables = (): Record<string, TableOrder> => {
  const t: Record<string, TableOrder> = {};
  for (let i = 1; i <= 12; i++) {
    t[i.toString()] = { status: 'free', cart: {}, currentRound: 1 };
  }
  return t;
};

const createTakeawayReference = () =>
  `L-${Date.now().toString(36).slice(-5).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

// Cada mesa tiene su propio debounce. Un cambio en Mesa 2 nunca debe cancelar
// la sincronización pendiente de Mesa 1.
const syncTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
let menuLoadSequence = 0;
const debouncedSync = (
  tableNumber: string,
  items: CartItem[],
  total: number,
  waiterName?: string,
  status: TableStatus = 'busy',
  round: number = 1
) => {
  if (!tableNumber) return;

  // Broadcast realtime (<30ms) a todas las demás terminales/celulares conectados
  const cartRecord: Record<string, CartItem> = {};
  items.forEach((it) => {
    cartRecord[it.product.id] = it;
  });
  broadcastTableState({
    tableNumber,
    status,
    cart: cartRecord,
    currentRound: round,
    waiterName,
  });

  if (!isSupabaseConfigured()) return;
  const previousTimeout = syncTimeouts.get(tableNumber);
  if (previousTimeout) clearTimeout(previousTimeout);
  const timeout = setTimeout(() => {
    syncTimeouts.delete(tableNumber);
    runInBackground(() => syncActiveOrderToSupabase(tableNumber, items, total, waiterName), 'debouncedSync:Supabase');
  }, 350);
  syncTimeouts.set(tableNumber, timeout);
};

const cancelPendingSync = (tableNumber: string) => {
  const timeout = syncTimeouts.get(tableNumber);
  if (timeout) clearTimeout(timeout);
  syncTimeouts.delete(tableNumber);
};

export const useCartStore = create<CartState>((set, get) => ({
  tableNumber: '',
  cart: {},
  quickSaleCart: {},
  editingQuickSaleOrderId: null,
  tables: initialTables(),
  ordersHistory: [],
  activeTab: 'tables',
  appMode: 'general',
  includePricesInTicket: true,
  customAlert: null,
  isRealtimeConnected: false,

  // El catálogo comercial sólo vive en Supabase. Nunca se usa el menú incluido
  // en el código como respaldo, pues produciría precios distintos por terminal.
  menuProducts: [],
  menuCategories: [],

  loadMenuFromRemote: async () => {
    if (!isSupabaseConfigured()) return;
    const requestSequence = ++menuLoadSequence;
    try {
      const [remoteCats, remoteProds] = await Promise.all([
        fetchMenuCategoriesFromSupabase(),
        fetchMenuProductsFromSupabase(),
      ]);

      if (!remoteCats || !remoteProds) {
        throw new Error('No fue posible leer el catálogo remoto');
      }
      // Ignora una respuesta vieja si un cambio posterior del catálogo ya
      // disparó una carga más reciente.
      if (requestSequence !== menuLoadSequence) return;

      // Además de refrescar las tarjetas de menú, se actualizan los productos
      // ya agregados a mesas/mostrador. Así un cambio de precio hecho en
      // Supabase se refleja inmediatamente en totales y tickets abiertos.
      const productById = new Map(remoteProds.map(product => [product.id, product]));
      const refreshCart = (cart: Record<string, CartItem>) =>
        Object.fromEntries(
          Object.entries(cart).map(([id, item]) => [
            id,
            (() => {
              const menuProductId = item.product.menuProductId || item.product.id;
              const remoteProduct = productById.get(menuProductId);
              if (!remoteProduct) return item;

              const modifierTotal = item.product.modifierTotal || 0;
              return {
                ...item,
                product: {
                  ...item.product,
                  ...remoteProduct,
                  id: item.product.id,
                  name: item.product.name,
                  price: remoteProduct.price + modifierTotal,
                  menuProductId,
                  modifierTotal,
                },
              };
            })(),
          ]),
        );

      set(state => {
        const tables = Object.fromEntries(
          Object.entries(state.tables).map(([tableNumber, table]) => [
            tableNumber,
            { ...table, cart: refreshCart(table.cart) },
          ]),
        );
        const cart = refreshCart(state.cart);
        const quickSaleCart = refreshCart(state.quickSaleCart);

        return {
          menuCategories: remoteCats,
          menuProducts: remoteProds,
          tables,
          cart,
          quickSaleCart,
        };
      });
    } catch (err) {
      console.warn('Could not load remote menu:', err);
    }
  },

  addCustomExtraItem: (price: number, name = 'Extra Personalizado', notes = '', isQuickSale = false) => {
    const customProduct: Product = {
      id: `ext-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim() || 'Extra Personalizado',
      price: Math.max(0, price),
      category: 'extras',
      kitchenStation: 'station_a',
      isCustomPrice: true,
    };

    if (isQuickSale) {
      get().addQuickSaleItem(customProduct, 1, notes);
    } else {
      get().addQuantity(customProduct, 1, notes);
    }
  },

  setAppMode: (appMode) => {
    set({
      appMode,
      includePricesInTicket: appMode === 'general',
    });
  },

  setIncludePricesInTicket: (includePricesInTicket) => set({ includePricesInTicket }),
  showCustomAlert: (customAlert) => set({ customAlert }),
  hideCustomAlert: () => set({ customAlert: null }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setRealtimeConnected: (isRealtimeConnected) => set({ isRealtimeConnected }),

  initializeTables: () => {
    if (Object.keys(get().tables).length === 0) {
      set({ tables: initialTables() });
    }
    get().loadMenuFromRemote();
  },

  // Inicializar suscripción y carga en tiempo real desde Supabase
  initRealtimeSync: async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    if (!(await ensureSupabaseSession())) {
      get().setRealtimeConnected(false);
      return;
    }

    // 0. Cargar menú remoto
    get().loadMenuFromRemote();

    // 1. Cargar estado inicial de mesas
    fetchRemoteTables().then(async (remoteTables) => {
      if (remoteTables) {
        // El estado de mesa sólo indica que existe consumo. La comanda se
        // carga explícitamente para cada mesa activa, aun si esta terminal
        // nunca la abrió; así no aparecen mesas ocupadas con 0 artículos.
        const remoteCarts = await Promise.all(
          Object.entries(remoteTables).map(async ([tableNumber, table]) => {
            if (table.status !== 'busy' && table.status !== 'bill_requested') {
              return [tableNumber, {} as Record<string, CartItem>] as const;
            }
            const order = await fetchActiveOrderItems(tableNumber);
            return [
              tableNumber,
              Object.fromEntries((order?.items || []).map(item => [item.product.id, item])),
            ] as const;
          }),
        );
        const cartsByTable = Object.fromEntries(remoteCarts);
        set((state) => {
          const updated = { ...state.tables };
          Object.keys(remoteTables).forEach((tblNum) => {
            if (updated[tblNum]) {
              updated[tblNum] = {
                ...updated[tblNum],
                status: remoteTables[tblNum].status,
                cart: cartsByTable[tblNum] || {},
                orderType: isTakeawayReference(tblNum) ? 'takeaway' : 'table',
                lastUpdated: remoteTables[tblNum].lastUpdated || updated[tblNum].lastUpdated,
              };
            } else {
              updated[tblNum] = {
                status: remoteTables[tblNum].status,
                cart: cartsByTable[tblNum] || {},
                orderType: isTakeawayReference(tblNum) ? 'takeaway' : 'table',
                currentRound: 1,
                lastUpdated: remoteTables[tblNum].lastUpdated,
              };
            }
          });
          return { tables: updated };
        });
      }
    });

    // 2. Suscribirse a cambios en tiempo real
    subscribeToRealtimeChanges(
      (tableUpdate: RemoteTableUpdate) => {
        set((state) => {
          const updatedTables = { ...state.tables };
          const tbl = tableUpdate.tableNumber;
          const currentTableOrder = updatedTables[tbl] || { status: 'free', cart: {}, currentRound: 1 };

          updatedTables[tbl] = {
            ...currentTableOrder,
            status: tableUpdate.status,
            orderType: currentTableOrder.orderType || (isTakeawayReference(tbl) ? 'takeaway' : 'table'),
            // Una mesa liberada/cobrada no puede conservar la comanda de otra
            // terminal en memoria; la BD ya confirmó que no hay orden activa.
            cart: (tableUpdate.status === 'free' || tableUpdate.status === 'cleaning')
              ? {}
              : currentTableOrder.cart,
            lastUpdated: tableUpdate.lastUpdated || new Date().toLocaleTimeString(),
            waiterName: tableUpdate.waiterName || currentTableOrder.waiterName,
          };

          // Si una mesa se libera o limpia remotamente y es la mesa activa, limpiar comanda
          let updatedCart = state.cart;
          if (state.tableNumber === tbl && (tableUpdate.status === 'free' || tableUpdate.status === 'cleaning')) {
            updatedCart = {};
          }

          return {
            tables: updatedTables,
            cart: updatedCart,
            isRealtimeConnected: true,
          };
        });
      },
      (orderUpdate) => {
        set((state) => {
          const tbl = orderUpdate.tableNumber;
          if (!tbl) return state;

          const updatedTables = { ...state.tables };

          // Si la orden fue cobrada o cancelada en otra terminal / caja
          if (orderUpdate.status === 'paid' || orderUpdate.status === 'cancelled') {
            if (updatedTables[tbl]) {
              updatedTables[tbl] = {
                ...updatedTables[tbl],
                status: 'free',
                cart: {},
                currentRound: 1,
                lastUpdated: new Date().toLocaleTimeString(),
              };
            }

            // Si es la mesa actualmente abierta, vaciar el carrito
            const isCurrentTable = state.tableNumber === tbl;
            return {
              tables: updatedTables,
              cart: isCurrentTable ? {} : state.cart,
            };
          }

          return { tables: updatedTables };
        });
      },
      () => {
        get().loadMenuFromRemote();
      },
      (cartSyncPayload) => {
        set((state) => {
          const tbl = cartSyncPayload.tableNumber;
          const updatedTables = { ...state.tables };
          updatedTables[tbl] = {
            status: cartSyncPayload.status,
            cart: cartSyncPayload.cart || {},
            currentRound: cartSyncPayload.currentRound || 1,
            orderType: isTakeawayReference(tbl) ? 'takeaway' : 'table',
            waiterName: cartSyncPayload.waiterName,
            lastUpdated: new Date().toLocaleTimeString(),
            isBillRequested: cartSyncPayload.isBillRequested,
          };
          const isCurrentTable = state.tableNumber === tbl;
          return {
            tables: updatedTables,
            cart: isCurrentTable ? (cartSyncPayload.cart || {}) : state.cart,
          };
        });
      },
      (kitchenPayload) => {
        set((state) => {
          const tbl = kitchenPayload.tableNumber;
          const updatedTables = { ...state.tables };
          if (updatedTables[tbl] && updatedTables[tbl].cart && updatedTables[tbl].cart[kitchenPayload.itemId]) {
            updatedTables[tbl] = {
              ...updatedTables[tbl],
              cart: {
                ...updatedTables[tbl].cart,
                [kitchenPayload.itemId]: {
                  ...updatedTables[tbl].cart[kitchenPayload.itemId],
                  status: kitchenPayload.status,
                },
              },
            };
          }
          let updatedCart = state.cart;
          if (state.tableNumber === tbl && updatedCart[kitchenPayload.itemId]) {
            updatedCart = {
              ...updatedCart,
              [kitchenPayload.itemId]: {
                ...updatedCart[kitchenPayload.itemId],
                status: kitchenPayload.status,
              },
            };
          }
          return { tables: updatedTables, cart: updatedCart };
        });
      },
      (tableNumber) => {
        // Las modificaciones de order_items también deben viajar por la BD;
        // el broadcast sólo acelera la interfaz, no es fuente de verdad.
        get().loadTableCartFromRemote(tableNumber);
      },
      (connected) => get().setRealtimeConnected(connected),
    );
  },

  // Cargar comanda remota de una mesa específica
  loadTableCartFromRemote: async (tableNumber: string) => {
    if (!tableNumber || !isSupabaseConfigured()) return;
    const res = await fetchActiveOrderItems(tableNumber);
    if (res && res.items) {
      const cartRecord: Record<string, CartItem> = {};
      let maxRound = 1;

      res.items.forEach((it) => {
        cartRecord[it.product.id] = it;
        if (it.round && it.round > maxRound) {
          maxRound = it.round;
        }
      });

      set((state) => {
        const updatedTables = { ...state.tables };
        const localTableCart = state.tableNumber === tableNumber ? state.cart : (updatedTables[tableNumber]?.cart || {});
        
        // Si el usuario ya está agregando ítems localmente y el servidor devolvió vacío, preservar los locales
        const remoteStateConfirmsEmpty = ['free', 'cleaning'].includes(updatedTables[tableNumber]?.status || '');
        // Se conserva una edición local sólo mientras la mesa siga ocupada y
        // Supabase todavía no haya recibido el debounce. Si la mesa ya fue
        // liberada/cobrada remotamente, el servidor siempre gana.
        const finalCart = remoteStateConfirmsEmpty
          ? {}
          : Object.keys(localTableCart).length > 0 && Object.keys(cartRecord).length === 0
            ? localTableCart
            : (Object.keys(cartRecord).length > 0 ? cartRecord : localTableCart);

        if (updatedTables[tableNumber]) {
          updatedTables[tableNumber] = {
            ...updatedTables[tableNumber],
            cart: finalCart,
            currentRound: maxRound,
          };
        }
        return {
          tables: updatedTables,
          cart: state.tableNumber === tableNumber ? finalCart : state.cart,
        };
      });
    }
  },

  // Cambiar mesa activa
  setTableNumber: (tableNumber) => {
    const state = get();
    const prevTable = state.tableNumber;
    const updatedTables = { ...state.tables };

    // Guardar estado de mesa anterior si existía
    if (prevTable) {
      const prevCart = state.cart;
      const hasItems = Object.keys(prevCart).length > 0;
      const prevStatus = updatedTables[prevTable]?.status || 'free';
      const newStatus = hasItems ? (prevStatus === 'bill_requested' ? 'bill_requested' : 'busy') : (prevStatus === 'busy' ? 'free' : prevStatus);

      updatedTables[prevTable] = {
        ...(updatedTables[prevTable] || { status: 'free', currentRound: 1 }),
        status: newStatus,
        cart: prevCart,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    // Cargar carrito de la nueva mesa
    const nextTableOrder = updatedTables[tableNumber] || { status: 'free', cart: {}, currentRound: 1 };
    if (tableNumber && !updatedTables[tableNumber]) {
      updatedTables[tableNumber] = {
        status: 'free',
        cart: {},
        currentRound: 1,
        orderType: isTakeawayReference(tableNumber) ? 'takeaway' : 'table',
      };
    }

    set({
      tableNumber,
      cart: nextTableOrder.cart || {},
      tables: updatedTables,
    });

    // Intentar sincronizar desde Supabase si está disponible
    if (tableNumber && isSupabaseConfigured()) {
      get().loadTableCartFromRemote(tableNumber);
    }
  },

  createTakeawayOrder: () => {
    const takeawayReference = createTakeawayReference();
    set((state) => ({
      tables: {
        ...state.tables,
        [takeawayReference]: {
          status: 'free',
          cart: {},
          currentRound: 1,
          orderType: 'takeaway',
          lastUpdated: new Date().toLocaleTimeString(),
        },
      },
    }));
    get().setTableNumber(takeawayReference);
    return takeawayReference;
  },

  setTableStatus: (table, status) => {
    const tableOrder = get().tables[table];
    broadcastTableState({
      tableNumber: table,
      status,
      cart: tableOrder?.cart || {},
      currentRound: tableOrder?.currentRound || 1,
      waiterName: tableOrder?.waiterName,
      isBillRequested: status === 'bill_requested',
    });
    if (isSupabaseConfigured()) {
      runInBackground(() => updateTableStatusInSupabase(table, status), 'setTableStatus:Supabase');
    }
    set((state) => {
      const updatedTables = { ...state.tables };
      if (updatedTables[table]) {
        updatedTables[table] = {
          ...updatedTables[table],
          status,
        };
      }
      return { tables: updatedTables };
    });
  },

  // Agregar 1 unidad
  addItem: (product, notes) => get().addQuantity(product, 1, notes),

  // Agregar N unidades (nuevos platillos entran como 'pending' con la ronda activa)
  addQuantity: (product, quantityToAdd, notes) =>
    set((state) => {
      if (quantityToAdd <= 0) return state;
      const existing = state.cart[product.id];
      const currentQty = existing ? existing.quantity : 0;
      const mergedNotes = notes !== undefined ? notes : (existing?.notes || '');
      const activeRound = state.tables[state.tableNumber]?.currentRound || 1;

      // Si el ítem ya existía y estaba enviado, los extras se marcan como pendiente
      const updatedCart: Record<string, CartItem> = {
        ...state.cart,
        [product.id]: {
          product,
          quantity: currentQty + quantityToAdd,
          notes: mergedNotes,
          round: activeRound,
          status: 'pending', // Marca como pendiente para la comanda de cocina
        },
      };

      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        const prevStatus = updatedTables[state.tableNumber]?.status;
        updatedTables[state.tableNumber] = {
          ...(updatedTables[state.tableNumber] || { currentRound: 1 }),
          status: prevStatus === 'bill_requested' ? 'bill_requested' : 'busy',
          cart: updatedCart,
          lastUpdated: new Date().toLocaleTimeString(),
        };

        // Sincronizar en segundo plano con Supabase con debounce
        if (isSupabaseConfigured()) {
          const total = Object.values(updatedCart).reduce((s, it) => s + it.product.price * it.quantity, 0);
          debouncedSync(state.tableNumber, Object.values(updatedCart), total);
        }
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  // Establecer cantidad exacta
  setQuantity: (product, quantity, notes) =>
    set((state) => {
      const existing = state.cart[product.id];
      const mergedNotes = notes !== undefined ? notes : (existing?.notes || '');
      const updatedCart = { ...state.cart };
      const activeRound = state.tables[state.tableNumber]?.currentRound || 1;

      if (quantity > 0) {
        updatedCart[product.id] = {
          product,
          quantity,
          notes: mergedNotes,
          round: existing?.round || activeRound,
          status: existing?.status || 'pending',
        };
      } else {
        delete updatedCart[product.id];
      }

      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        const hasItems = Object.keys(updatedCart).length > 0;
        updatedTables[state.tableNumber] = {
          ...(updatedTables[state.tableNumber] || { currentRound: 1 }),
          status: hasItems ? 'busy' : 'free',
          cart: updatedCart,
          lastUpdated: new Date().toLocaleTimeString(),
        };

        if (isSupabaseConfigured()) {
          const total = Object.values(updatedCart).reduce((s, it) => s + it.product.price * it.quantity, 0);
          debouncedSync(state.tableNumber, Object.values(updatedCart), total);
        }
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  removeItem: (productId) =>
    set((state) => {
      const existing = state.cart[productId];
      if (!existing) return state;

      const updatedCart = { ...state.cart };
      if (existing.quantity > 1) {
        updatedCart[productId] = {
          ...existing,
          quantity: existing.quantity - 1,
        };
      } else {
        delete updatedCart[productId];
      }

      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        const hasItems = Object.keys(updatedCart).length > 0;
        updatedTables[state.tableNumber] = {
          ...(updatedTables[state.tableNumber] || { currentRound: 1 }),
          status: hasItems ? 'busy' : 'free',
          cart: updatedCart,
          lastUpdated: new Date().toLocaleTimeString(),
        };

        if (isSupabaseConfigured()) {
          const total = Object.values(updatedCart).reduce((s, it) => s + it.product.price * it.quantity, 0);
          debouncedSync(state.tableNumber, Object.values(updatedCart), total);
        }
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  updateItemNotes: (productId, notes) =>
    set((state) => {
      const existing = state.cart[productId];
      if (!existing) return state;

      const updatedCart = {
        ...state.cart,
        [productId]: { ...existing, notes },
      };

      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        updatedTables[state.tableNumber] = {
          ...updatedTables[state.tableNumber],
          cart: updatedCart,
        };
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  updateItemKitchenStatus: (tableNumber, productId, status) => {
    broadcastKitchenItemStatus(tableNumber, productId, status);
    if (isSupabaseConfigured()) {
      runInBackground(
        () => updateOrderItemStatusInSupabase(tableNumber, productId, status),
        'updateItemKitchenStatus:Supabase',
      );
    }
    set((state) => {
      const updatedTables = { ...state.tables };
      const tableOrder = updatedTables[tableNumber];
      if (!tableOrder || !tableOrder.cart[productId]) return state;

      const updatedCart = {
        ...tableOrder.cart,
        [productId]: {
          ...tableOrder.cart[productId],
          status,
        },
      };

      updatedTables[tableNumber] = {
        ...tableOrder,
        cart: updatedCart,
      };

      return {
        tables: updatedTables,
        cart: state.tableNumber === tableNumber ? updatedCart : state.cart,
      };
    });
  },

  clearCart: () => {
    const state = get();
    const activeTable = state.tableNumber;
    if (activeTable) {
      broadcastTableState({
        tableNumber: activeTable,
        status: 'free',
        cart: {},
        currentRound: 1,
      });
      if (isSupabaseConfigured()) {
        clearTableInSupabase(activeTable);
      }
    }

    set((prev) => {
      const updatedTables = { ...prev.tables };
      if (activeTable) {
        if (isTakeawayReference(activeTable)) {
          delete updatedTables[activeTable];
        } else {
          updatedTables[activeTable] = {
            status: 'free',
            cart: {},
            currentRound: 1,
            lastUpdated: new Date().toLocaleTimeString(),
          };
        }
      }
      return {
        cart: {},
        tables: updatedTables,
      };
    });
  },

  getTotal: () => {
    const cart = get().cart;
    return Object.values(cart).reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    const cart = get().cart;
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  },

  getPendingItemsCount: () => {
    const cart = get().cart;
    return Object.values(cart).filter((it) => it.status === 'pending').reduce((sum, item) => sum + item.quantity, 0);
  },

  getCurrentTableRound: () => {
    const state = get();
    return state.tables[state.tableNumber]?.currentRound || 1;
  },

  // Flujo 1: Enviar ronda a cocina -> Marca los pendientes como 'sent_to_kitchen' e incrementa la ronda
  sendRoundToKitchen: async (tbl) => {
    const state = get();
    const tableToUse = tbl || state.tableNumber;
    if (!tableToUse) return false;

    const currentTableOrder = state.tables[tableToUse];
    const currentRound = currentTableOrder?.currentRound || 1;
    const nextRound = currentRound + 1;

    const sourceCart = state.tables[tableToUse]?.cart || state.cart;
    // Sólo la ronda pendiente pasa a cocina; artículos ya listos o en
    // preparación no se regresan accidentalmente a "enviados".
    const updatedCart: Record<string, CartItem> = {};
    Object.values(sourceCart).forEach((item) => {
      updatedCart[item.product.id] = {
        ...item,
        status: item.status === 'pending' ? 'sent_to_kitchen' : item.status,
        round: item.round || currentRound,
      };
    });

    const itemsToSync = Object.values(updatedCart);
    const totalToSync = itemsToSync.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    // Enviar a cocina es un punto de confirmación: persiste de inmediato y
    // espera a Supabase antes de continuar. Así no depende del debounce ni de
    // que el broadcast temporal alcance a las demás terminales.
    if (isSupabaseConfigured()) {
      cancelPendingSync(tableToUse);
      try {
        const orderId = await syncActiveOrderToSupabase(
          tableToUse,
          itemsToSync,
          totalToSync,
          currentTableOrder?.waiterName,
        );
        if (!orderId) {
          throw new Error('Supabase no devolvió el identificador de la orden.');
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        get().showCustomAlert({
          type: 'error',
          title: 'Comanda no sincronizada',
          message: `Supabase rechazó la comanda: ${detail}`,
        });
        return false;
      }
    }

    broadcastTableState({
      tableNumber: tableToUse,
      status: 'busy',
      cart: updatedCart,
      currentRound: nextRound,
      waiterName: currentTableOrder?.waiterName,
    });

    set((prev) => {
      const updatedTables = { ...prev.tables };
      updatedTables[tableToUse] = {
        ...(updatedTables[tableToUse] || { status: 'busy' }),
        status: 'busy',
        cart: updatedCart,
        currentRound: nextRound,
        lastUpdated: new Date().toLocaleTimeString(),
      };

      return {
        cart: prev.tableNumber === tableToUse ? updatedCart : prev.cart,
        tables: updatedTables,
      };
    });

    return true;
  },

  // Flujo 2: Mesero solicita cuenta a Caja -> Pasa a 'bill_requested' en tiempo real
  requestBillForTable: async (tbl) => {
    const state = get();
    const tableToUse = tbl || state.tableNumber;
    if (!tableToUse) return false;

    broadcastTableState({
      tableNumber: tableToUse,
      status: 'bill_requested',
      cart: state.tables[tableToUse]?.cart || {},
      currentRound: state.tables[tableToUse]?.currentRound || 1,
      waiterName: state.tables[tableToUse]?.waiterName,
      isBillRequested: true,
    });

    set((prev) => {
      const updatedTables = { ...prev.tables };
      if (updatedTables[tableToUse]) {
        updatedTables[tableToUse] = {
          ...updatedTables[tableToUse],
          status: 'bill_requested',
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }
      return { tables: updatedTables };
    });

    if (isSupabaseConfigured()) {
      runInBackground(() => requestBillInSupabase(tableToUse), 'requestBillForTable:Supabase');
    }

    return true;
  },

  // Flujo 3: Cajero / Operador completa el pago
  completePayment: async (paymentMethod, amountPaid, change) => {
    const state = get();
    const activeTable = state.tableNumber;
    if (!activeTable) return;

    const activeCart = Object.values(state.cart);
    if (activeCart.length === 0) return;

    const total = get().getTotal();

    broadcastTableState({
      tableNumber: activeTable,
      status: 'cleaning',
      cart: {},
      currentRound: 1,
    });

    const newOrder: OrderHistoryItem = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      tableNumber: activeTable,
      items: activeCart,
      total,
      paymentMethod,
      amountPaid,
      change,
      timestamp: new Date().toLocaleString(),
    };

    if (isSupabaseConfigured()) {
      runInBackground(
        () => finalizePaymentInSupabase(activeTable, paymentMethod, amountPaid, change, total),
        'completePayment:Supabase'
      );
    }

    set((prev) => {
      const updatedTables = { ...prev.tables };
      if (isTakeawayReference(activeTable)) {
        delete updatedTables[activeTable];
      } else {
        updatedTables[activeTable] = {
          status: 'cleaning',
          cart: {},
          currentRound: 1,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }

      return {
        cart: {},
        tables: updatedTables,
        ordersHistory: [...prev.ordersHistory, newOrder],
        tableNumber: '',
      };
    });
  },

  // --- FLUJO SECUNDARIO: Venta Rápida / Comanda Manual en Caja ---
  addQuickSaleItem: (product, quantityToAdd = 1, notes = '') => {
    set((state) => {
      const existing = state.quickSaleCart[product.id];
      const newQty = existing ? existing.quantity + quantityToAdd : quantityToAdd;
      if (newQty <= 0) {
        const nextCart = { ...state.quickSaleCart };
        delete nextCart[product.id];
        return { quickSaleCart: nextCart };
      }
      return {
        quickSaleCart: {
          ...state.quickSaleCart,
          [product.id]: {
            product,
            quantity: newQty,
            notes: notes || existing?.notes || '',
            status: 'ready',
            round: 1,
          },
        },
      };
    });
  },

  setQuickSaleQuantity: (product, quantity, notes = '') => {
    set((state) => {
      if (quantity <= 0) {
        const nextCart = { ...state.quickSaleCart };
        delete nextCart[product.id];
        return { quickSaleCart: nextCart };
      }
      return {
        quickSaleCart: {
          ...state.quickSaleCart,
          [product.id]: {
            product,
            quantity,
            notes,
            status: 'ready',
            round: 1,
          },
        },
      };
    });
  },

  removeQuickSaleItem: (productId) => {
    set((state) => {
      const nextCart = { ...state.quickSaleCart };
      delete nextCart[productId];
      return { quickSaleCart: nextCart };
    });
  },

  clearQuickSale: () => {
    set({ quickSaleCart: {} });
  },

  getQuickSaleTotal: () => {
    const items = Object.values(get().quickSaleCart);
    return items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  },

  getQuickSaleItemCount: () => {
    const items = Object.values(get().quickSaleCart);
    return items.reduce((sum, it) => sum + it.quantity, 0);
  },

  createQuickSaleOrder: async (
    tableNumber = 'MOSTRADOR',
    paymentMethod: PaymentMethod = 'cash',
    amountPaid?: number,
    changeGiven?: number,
  ) => {
    const state = get();
    const items = Object.values(state.quickSaleCart);
    if (items.length === 0) return null;

    const total = state.getQuickSaleTotal();
    const cleanTable = tableNumber.trim() || 'MOSTRADOR';
    const orderId = `ORD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const paid = amountPaid !== undefined ? amountPaid : total;
    const change = changeGiven !== undefined ? changeGiven : Math.max(0, paid - total);

    const newOrder: OrderHistoryItem = {
      id: orderId,
      tableNumber: cleanTable,
      items: [...items],
      total,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderType: 'quick_sale',
    };

    if (isSupabaseConfigured()) {
      await finalizePaymentInSupabase(cleanTable, paymentMethod, total, change, paid);
    }

    set((prev) => ({
      quickSaleCart: {},
      editingQuickSaleOrderId: null,
      ordersHistory: [newOrder, ...prev.ordersHistory],
    }));

    return newOrder;
  },

  loadQuickSaleOrderForEdit: (orderId: string) => {
    const state = get();
    const order = state.ordersHistory.find((o) => o.id === orderId);
    if (!order) return;

    const cartMap: Record<string, CartItem> = {};
    order.items.forEach((item) => {
      cartMap[item.product.id] = { ...item };
    });

    set({
      quickSaleCart: cartMap,
      editingQuickSaleOrderId: orderId,
    });
  },

  cancelEditQuickSaleOrder: () => {
    set({
      quickSaleCart: {},
      editingQuickSaleOrderId: null,
    });
  },

  updateAndSaveQuickSaleOrder: async (orderId: string, tableNumber?: string) => {
    const state = get();
    const items = Object.values(state.quickSaleCart);
    if (items.length === 0) return false;

    const total = state.getQuickSaleTotal();

    set((prev) => ({
      quickSaleCart: {},
      editingQuickSaleOrderId: null,
      ordersHistory: prev.ordersHistory.map((o) =>
        o.id === orderId
          ? {
              ...o,
              tableNumber: tableNumber !== undefined && tableNumber.trim().length > 0 ? tableNumber.trim() : o.tableNumber,
              items: [...items],
              total,
              lastModified: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : o
      ),
    }));

    return true;
  },

  reprintQuickSaleOrder: async (orderId: string) => {
    const state = get();
    const order = state.ordersHistory.find((o) => o.id === orderId);
    if (!order) return false;

    await printTicketTCP(order.tableNumber, order.items, order.total, {
      showPrices: true,
      isReprint: true,
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      amountPaid: order.amountPaid,
      change: order.change,
    });

    return true;
  },

  finalizeQuickSale: async (paymentMethod = 'cash', amountPaid = 0, change = 0) => {
    const state = get();
    const items = Object.values(state.quickSaleCart);
    if (items.length === 0) return false;

    const total = state.getQuickSaleTotal();
    const newOrder: OrderHistoryItem = {
      id: `MOSTR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      tableNumber: 'MOSTRADOR',
      items: [...items],
      total,
      paymentMethod,
      amountPaid: amountPaid || total,
      change: change || 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderType: 'quick_sale',
    };

    if (isSupabaseConfigured()) {
      await finalizePaymentInSupabase('MOSTRADOR', paymentMethod || 'cash', amountPaid || total, change || 0, total);
    }

    set((prev) => ({
      quickSaleCart: {},
      editingQuickSaleOrderId: null,
      ordersHistory: [newOrder, ...prev.ordersHistory],
    }));

    return true;
  },
}));
