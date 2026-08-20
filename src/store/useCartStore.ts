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
  RemoteTableUpdate,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../config/supabaseConfig';

export type KitchenStation = 'mexican' | 'american_tacos';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  kitchenStation?: KitchenStation;
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
  paymentMethod: 'cash' | 'card' | 'transfer';
  amountPaid: number;
  change: number;
  timestamp: string;
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
  tables: initialTables(),
  ordersHistory: [],
  activeTab: 'tables',
  appMode: 'general',
  includePricesInTicket: true,
  customAlert: null,
  isRealtimeConnected: false,

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
  },

  // Inicializar suscripción y carga en tiempo real desde Supabase
  initRealtimeSync: () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    // 1. Cargar estado inicial
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
}));
