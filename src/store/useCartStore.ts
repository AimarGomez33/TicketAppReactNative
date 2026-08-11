// src/store/useCartStore.ts
import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  tableNumber: string;
  cart: Record<string, CartItem>; // Guardado por ID para búsquedas instantáneas O(1)
  setTableNumber: (table: string) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  tableNumber: '',
  cart: {},

  // Asignar el número de mesa u orden
  setTableNumber: (tableNumber) => set({ tableNumber }),

  // Agregar +1 unidad de un producto al carrito
  addItem: (product) =>
    set((state) => {
      const existing = state.cart[product.id];
      const currentQty = existing ? existing.quantity : 0;

      return {
        cart: {
          ...state.cart,
          [product.id]: { product, quantity: currentQty + 1 },
        },
      };
    }),

  // Restar -1 unidad (si llega a 0, elimina el ítem del carrito)
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

      return { cart: updatedCart };
    }),

  // Limpiar toda la cuenta actual
  clearCart: () => set({ cart: {}, tableNumber: '' }),

  // Obtener la suma total en pesos ($)
  getTotal: () => {
    const cart = get().cart;
    return Object.values(cart).reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  // Obtener el conteo total de ítems acumulados
  getItemCount: () => {
    const cart = get().cart;
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  },
}));




