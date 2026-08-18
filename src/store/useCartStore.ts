// src/store/useCartStore.ts
import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string; // Modificadores como "sin cebolla", "doble queso"
}

export type TableStatus = 'free' | 'busy' | 'unpaid' | 'cleaning';

export interface TableOrder {
  status: TableStatus;
  cart: Record<string, CartItem>;
  lastUpdated?: string;
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
  cart: Record<string, CartItem>; // Carrito de la mesa activa (para compatibilidad O(1))
  tables: Record<string, TableOrder>; // Estado de todas las mesas del restaurante
  ordersHistory: OrderHistoryItem[]; // Historial de pagos
  
  activeTab: 'tables' | 'ordering' | 'payment'; // Pantalla/Tab activa global
  
  // Modo de versión de la app
  appMode: AppVersionMode; // 'general' = versión simplificada, 'detailed' = versión detallada
  includePricesInTicket: boolean; // Controla si se imprimen los precios en el ticket
  customAlert: CustomAlertData | null; // Estado del alert estilizado global

  // Acciones
  setAppMode: (mode: AppVersionMode) => void;
  setIncludePricesInTicket: (include: boolean) => void;
  showCustomAlert: (alert: CustomAlertData) => void;
  hideCustomAlert: () => void;

  setActiveTab: (tab: 'tables' | 'ordering' | 'payment') => void;
  setTableNumber: (table: string) => void;
  setTableStatus: (table: string, status: TableStatus) => void;
  addItem: (product: Product, notes?: string) => void;
  addQuantity: (product: Product, quantityToAdd: number, notes?: string) => void;
  setQuantity: (product: Product, quantity: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  completePayment: (paymentMethod: 'cash' | 'card' | 'transfer', amountPaid: number, change: number) => void;
  initializeTables: () => void;
}

// Inicialización de 12 mesas estándar
const initialTables = (): Record<string, TableOrder> => {
  const t: Record<string, TableOrder> = {};
  for (let i = 1; i <= 12; i++) {
    t[i.toString()] = { status: 'free', cart: {} };
  }
  return t;
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

  setAppMode: (appMode) => {
    // Al cambiar de modo:
    // - 'general': ticket intacto con precios (includePricesInTicket = true)
    // - 'detailed': elimina precios de tickets salvo requerimiento (includePricesInTicket = false)
    set({
      appMode,
      includePricesInTicket: appMode === 'general',
    });
  },

  setIncludePricesInTicket: (includePricesInTicket) => set({ includePricesInTicket }),

  showCustomAlert: (customAlert) => set({ customAlert }),

  hideCustomAlert: () => set({ customAlert: null }),

  setActiveTab: (activeTab) => set({ activeTab }),

  // Inicializar mesas si es necesario
  initializeTables: () => {
    if (Object.keys(get().tables).length === 0) {
      set({ tables: initialTables() });
    }
  },

  // Seleccionar o cambiar mesa activa
  setTableNumber: (tableNumber) =>
    set((state) => {
      // 1. Guardar el carrito activo actual en la mesa anterior (si existía)
      const prevTable = state.tableNumber;
      const updatedTables = { ...state.tables };

      if (prevTable) {
        const prevCartCount = Object.keys(state.cart).length;
        // Si hay items, se marca como busy, si no, se queda en free (o mantiene su estado)
        const prevStatus = updatedTables[prevTable]?.status || 'free';
        const newStatus = prevCartCount > 0 ? 'busy' : (prevStatus === 'busy' ? 'free' : prevStatus);
        
        updatedTables[prevTable] = {
          status: newStatus,
          cart: state.cart,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }

      // 2. Cargar el carrito de la nueva mesa
      const nextTableOrder = updatedTables[tableNumber];
      const nextCart = nextTableOrder ? nextTableOrder.cart : {};
      
      // Si la nueva mesa no existe en el mapa (ej. orden manual para llevar), la creamos
      if (tableNumber && !updatedTables[tableNumber]) {
        updatedTables[tableNumber] = { status: 'free', cart: {} };
      }

      return {
        tableNumber,
        cart: nextCart,
        tables: updatedTables,
      };
    }),

  // Cambiar el estado de una mesa manualmente
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

  // Agregar +1 unidad de un producto a la mesa activa
  addItem: (product, notes) =>
    get().addQuantity(product, 1, notes),

  // Agregar N unidades de un producto a la mesa activa
  addQuantity: (product, quantityToAdd, notes) =>
    set((state) => {
      if (quantityToAdd <= 0) return state;
      const existing = state.cart[product.id];
      const currentQty = existing ? existing.quantity : 0;
      const mergedNotes = notes !== undefined ? notes : (existing?.notes || '');

      const updatedCart = {
        ...state.cart,
        [product.id]: { product, quantity: currentQty + quantityToAdd, notes: mergedNotes },
      };

      // Sincronizar en el mapa de mesas también
      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        updatedTables[state.tableNumber] = {
          status: 'busy',
          cart: updatedCart,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  // Establecer cantidad exacta de un producto
  setQuantity: (product, quantity, notes) =>
    set((state) => {
      const existing = state.cart[product.id];
      const mergedNotes = notes !== undefined ? notes : (existing?.notes || '');
      const updatedCart = { ...state.cart };

      if (quantity > 0) {
        updatedCart[product.id] = { product, quantity, notes: mergedNotes };
      } else {
        delete updatedCart[product.id];
      }

      // Sincronizar en el mapa de mesas también
      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        const hasItems = Object.keys(updatedCart).length > 0;
        updatedTables[state.tableNumber] = {
          status: hasItems ? 'busy' : 'free',
          cart: updatedCart,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  // Restar -1 unidad de un producto de la mesa activa
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

      // Sincronizar en el mapa de mesas también
      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        const hasItems = Object.keys(updatedCart).length > 0;
        updatedTables[state.tableNumber] = {
          status: hasItems ? 'busy' : 'free',
          cart: updatedCart,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }

      return {
        cart: updatedCart,
        tables: updatedTables,
      };
    }),

  // Actualizar las notas/modificadores de un producto
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

  // Limpiar la mesa activa actual
  clearCart: () =>
    set((state) => {
      const updatedTables = { ...state.tables };
      if (state.tableNumber) {
        updatedTables[state.tableNumber] = {
          status: 'free',
          cart: {},
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }
      return {
        cart: {},
        tables: updatedTables,
      };
    }),

  // Calcular el total monetario del carrito activo
  getTotal: () => {
    const cart = get().cart;
    return Object.values(cart).reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  // Obtener la cantidad de ítems totales del carrito activo
  getItemCount: () => {
    const cart = get().cart;
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  },

  // Registrar un pago, archivar la orden y liberar la mesa
  completePayment: (paymentMethod, amountPaid, change) => {
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

    set((prev) => {
      const updatedTables = { ...prev.tables };
      updatedTables[activeTable] = {
        status: 'cleaning', // Cambia a limpieza antes de quedar libre
        cart: {},
        lastUpdated: new Date().toLocaleTimeString(),
      };

      return {
        cart: {},
        tables: updatedTables,
        ordersHistory: [...prev.ordersHistory, newOrder],
        tableNumber: '', // Deseleccionar la mesa
      };
    });
  },
}));
