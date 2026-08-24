// src/store/useCartStore.ts
import { create } from 'zustand';
import {
  fetchRemoteTables,
  fetchActiveOrderItems,
  syncActiveOrderToSupabase,
  markRoundSentInSupabase,
  requestBillInSupabase,
  finalizePaymentInSupabase,
  clearTableInSupabase,
  subscribeToRealtimeChanges,
  fetchMenuCategoriesFromSupabase,
  fetchMenuProductsFromSupabase,
  RemoteTableUpdate,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../config/supabaseConfig';
import { printTicketTCP } from '../services/printerService';
import { MOCK_PRODUCTS_GENERAL, CATEGORIES_GENERAL } from '../data/mockupMenu';

export type KitchenStation = 'mexican' | 'american_tacos';

export interface Category {
  id: string;
  name: string;
  station?: 'mexican' | 'american_tacos' | 'all';
  iconName?: string;
  sortOrder?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  kitchenStation?: KitchenStation;
  isCustomPrice?: boolean;
  variants?: { id: string; name: string; price?: number }[];
}

export type ItemKitchenStatus = 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string; // Modificadores: "sin cebolla", "doble queso"
  round?: number; // Número de ronda (1, 2, 3...)
  status?: ItemKitchenStatus; // 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready'
  dbId?: string;
}

export type TableStatus = 'free' | 'busy' | 'bill_requested' | 'cleaning';

export interface TableOrder {
  status: TableStatus;
  cart: Record<string, CartItem>;
  currentRound?: number;
  lastUpdated?: string;
  waiterName?: string;
}

export interface OrderHistoryItem {
  id: string;
  tableNumber: string;
  items: CartItem[];
  total: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
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
  completePayment: (paymentMethod: 'cash' | 'card' | 'transfer', amountPaid: number, change: number) => Promise<void>;
  
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
    paymentMethod?: 'cash' | 'card' | 'transfer',
    amountPaid?: number,
    changeGiven?: number,
  ) => Promise<OrderHistoryItem | null>;
  loadQuickSaleOrderForEdit: (orderId: string) => void;
  cancelEditQuickSaleOrder: () => void;
  updateAndSaveQuickSaleOrder: (orderId: string, tableNumber?: string) => Promise<boolean>;
  reprintQuickSaleOrder: (orderId: string) => Promise<boolean>;
  finalizeQuickSale: (paymentMethod?: 'cash' | 'card' | 'transfer', amountPaid?: number, change?: number) => Promise<boolean>;

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
  t.Llevar = { status: 'free', cart: {}, currentRound: 1 };
  return t;
};

// Helper con debounce para evitar llamadas masivas simultáneas a Supabase
let syncTimeoutId: any = null;
const debouncedSync = (tableNumber: string, items: CartItem[], total: number, waiterName?: string) => {
  if (!isSupabaseConfigured() || !tableNumber) return;
  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId);
  }
  syncTimeoutId = setTimeout(() => {
    syncActiveOrderToSupabase(tableNumber, items, total, waiterName);
  }, 350);
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

  // Catálogo de Menú y Categorías
  menuProducts: MOCK_PRODUCTS_GENERAL,
  menuCategories: CATEGORIES_GENERAL,

  loadMenuFromRemote: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const [remoteCats, remoteProds] = await Promise.all([
        fetchMenuCategoriesFromSupabase(),
        fetchMenuProductsFromSupabase(),
      ]);

      if (remoteCats && remoteCats.length > 0) {
        set({ menuCategories: remoteCats });
      }
      if (remoteProds && remoteProds.length > 0) {
        set({ menuProducts: remoteProds });
      }
    } catch (err) {
      console.warn('Could not load remote menu, using cached/fallback:', err);
    }
  },

  addCustomExtraItem: (price: number, name = 'Extra Personalizado', notes = '', isQuickSale = false) => {
    const customProduct: Product = {
      id: `ext-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim() || 'Extra Personalizado',
      price: Math.max(0, price),
      category: 'extras',
      kitchenStation: 'mexican',
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
  initRealtimeSync: () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    // 0. Cargar menú remoto
    get().loadMenuFromRemote();

    // 1. Cargar estado inicial de mesas
    fetchRemoteTables().then((remoteTables) => {
      if (remoteTables) {
        set((state) => {
          const updated = { ...state.tables };
          Object.keys(remoteTables).forEach((tblNum) => {
            if (updated[tblNum]) {
              updated[tblNum] = {
                ...updated[tblNum],
                status: remoteTables[tblNum].status,
                lastUpdated: remoteTables[tblNum].lastUpdated || updated[tblNum].lastUpdated,
              };
            } else {
              updated[tblNum] = {
                status: remoteTables[tblNum].status,
                cart: {},
                currentRound: 1,
                lastUpdated: remoteTables[tblNum].lastUpdated,
              };
            }
          });
          return { tables: updated, isRealtimeConnected: true };
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
            lastUpdated: tableUpdate.lastUpdated || new Date().toLocaleTimeString(),
            waiterName: tableUpdate.waiterName || currentTableOrder.waiterName,
          };

          // Si una mesa se libera o limpia remotamente y es la mesa activa, limpiar comanda
          let updatedCart = state.cart;
          if (state.tableNumber === tbl && (tableUpdate.status === 'free' || tableUpdate.status === 'cleaning')) {
            if (tableUpdate.status === 'free') {
              updatedCart = {};
            }
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
      }
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
        const finalCart = Object.keys(localTableCart).length > 0 && Object.keys(cartRecord).length === 0
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
      updatedTables[tableNumber] = { status: 'free', cart: {}, currentRound: 1 };
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

  setTableStatus: (table, status) =>
    set((state) => {
      const updatedTables = { ...state.tables };
      if (updatedTables[table]) {
        updatedTables[table] = {
          ...updatedTables[table],
          status,
        };
      }
      return { tables: updatedTables };
    }),

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

  updateItemKitchenStatus: (tableNumber, productId, status) =>
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
    }),

  clearCart: () => {
    const state = get();
    const activeTable = state.tableNumber;
    if (activeTable && isSupabaseConfigured()) {
      clearTableInSupabase(activeTable);
    }

    set((prev) => {
      const updatedTables = { ...prev.tables };
      if (activeTable) {
        updatedTables[activeTable] = {
          status: 'free',
          cart: {},
          currentRound: 1,
          lastUpdated: new Date().toLocaleTimeString(),
        };
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

    // Actualizar todos los ítems del carrito local como 'sent_to_kitchen'
    const updatedCart: Record<string, CartItem> = {};
    Object.values(state.cart).forEach((item) => {
      updatedCart[item.product.id] = {
        ...item,
        status: 'sent_to_kitchen',
        round: item.round || currentRound,
      };
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

    if (isSupabaseConfigured()) {
      await markRoundSentInSupabase(tableToUse, currentRound);
    }

    return true;
  },

  // Flujo 2: Mesero solicita cuenta a Caja -> Pasa a 'bill_requested' en tiempo real
  requestBillForTable: async (tbl) => {
    const state = get();
    const tableToUse = tbl || state.tableNumber;
    if (!tableToUse) return false;

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
      await requestBillInSupabase(tableToUse);
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

    const total = state.getTotal();
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
      await finalizePaymentInSupabase(activeTable, paymentMethod, amountPaid, change, total);
    }

    set((prev) => {
      const updatedTables = { ...prev.tables };
      updatedTables[activeTable] = {
        status: 'cleaning',
        cart: {},
        currentRound: 1,
        lastUpdated: new Date().toLocaleTimeString(),
      };

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
    tableNumber = 'Llevar',
    paymentMethod: 'cash' | 'card' | 'transfer' = 'cash',
    amountPaid?: number,
    changeGiven?: number,
  ) => {
    const state = get();
    const items = Object.values(state.quickSaleCart);
    if (items.length === 0) return null;

    const total = state.getQuickSaleTotal();
    const cleanTable = tableNumber.trim() || 'Llevar';
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
