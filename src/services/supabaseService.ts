// src/services/supabaseService.ts
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isSupabaseConfigured } from '../config/supabaseConfig';
import { getOrderReferenceType } from '../domain/orders/orderReferences';
import {
  CartItem,
  TableStatus,
  KitchenStation,
  Product,
  Category,
  ProductModifierGroup,
  PaymentMethod,
} from '../store/useCartStore';

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let sessionInitialization: Promise<boolean> | null = null;

const describeSupabaseError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
    const parts = [candidate.code, candidate.message, candidate.details, candidate.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(' — ');
  }
  return error instanceof Error ? error.message : String(error);
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseClient;
};

export const ensureSupabaseSession = async (): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  if (sessionInitialization) return sessionInitialization;

  sessionInitialization = (async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError && data.session) return true;

    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('No se pudo crear sesión anónima de Supabase:', error.message);
      return false;
    }
    return true;
  })();
  return sessionInitialization;
};

export interface RemoteTableUpdate {
  tableNumber: string;
  status: TableStatus;
  lastUpdated?: string;
  waiterName?: string;
  activeOrderId?: string | null;
}

export interface RemoteOrderUpdate {
  orderId: string;
  tableNumber: string;
  status: string;
  total: number;
  paymentMethod?: string;
  items?: CartItem[];
}

export interface SupabaseTableStateRow {
  table_number: string;
  status: TableStatus;
  last_updated?: string;
  waiter_name?: string;
  active_order_id?: string | null;
}

export interface SupabaseOrderRow {
  id: string;
  table_number?: string;
  status?: string;
  total?: number;
  payment_method?: string;
}

export interface SupabaseOrderItemRow {
  id?: string;
  order_id?: string;
  table_number: string;
  product_id: string;
  menu_product_id?: string;
  product_name: string;
  category?: string;
  kitchen_station?: KitchenStation;
  price: number;
  modifier_total?: number;
  quantity: number;
  notes?: string;
  round_number?: number;
  status?: CartItem['status'];
}

export interface SupabaseMenuCategoryRow {
  id: string;
  name: string;
  icon_name?: string;
  sort_order?: number;
}

export interface SupabaseMenuProductRow {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  description?: string;
  kitchen_station?: KitchenStation;
  is_custom_price?: boolean;
  is_favorite?: boolean;
  favorite_order?: number;
  modifier_groups?: unknown;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const readNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const readBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const parseTableStatus = (value: unknown): TableStatus | undefined =>
  value === 'free' || value === 'busy' || value === 'bill_requested' || value === 'cleaning'
    ? value
    : undefined;

const parseKitchenStation = (value: unknown): KitchenStation | undefined =>
  value === 'station_a' || value === 'station_b' ? value : undefined;

const parseKitchenItemStatus = (value: unknown): CartItem['status'] | undefined =>
  value === 'pending' || value === 'sent_to_kitchen' || value === 'preparing' || value === 'ready'
    ? value
    : undefined;

const parseTableStateRow = (value: unknown): SupabaseTableStateRow | null => {
  if (!isRecord(value)) return null;
  const tableNumber = readString(value.table_number);
  const status = parseTableStatus(value.status);
  if (!tableNumber || !status) return null;

  return {
    table_number: tableNumber,
    status,
    last_updated: readString(value.last_updated),
    waiter_name: readString(value.waiter_name),
    active_order_id: readString(value.active_order_id) || (value.active_order_id === null ? null : undefined),
  };
};

const parseOrderRow = (value: unknown): SupabaseOrderRow | null => {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  if (!id) return null;
  return {
    id,
    table_number: readString(value.table_number),
    status: readString(value.status),
    total: readNumber(value.total),
    payment_method: readString(value.payment_method),
  };
};

const parseOrderItemRow = (value: unknown): SupabaseOrderItemRow | null => {
  if (!isRecord(value)) return null;
  const tableNumber = readString(value.table_number);
  const productId = readString(value.product_id);
  const productName = readString(value.product_name);
  const price = readNumber(value.price);
  const quantity = readNumber(value.quantity);
  if (!tableNumber || !productId || !productName || price === undefined || quantity === undefined) return null;

  return {
    id: readString(value.id),
    order_id: readString(value.order_id),
    table_number: tableNumber,
    product_id: productId,
    menu_product_id: readString(value.menu_product_id),
    product_name: productName,
    category: readString(value.category),
    kitchen_station: parseKitchenStation(value.kitchen_station),
    price,
    modifier_total: readNumber(value.modifier_total),
    quantity,
    notes: readString(value.notes),
    round_number: readNumber(value.round_number),
    status: parseKitchenItemStatus(value.status),
  };
};

const parseMenuCategoryRow = (value: unknown): SupabaseMenuCategoryRow | null => {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const name = readString(value.name);
  if (!id || !name) return null;
  return { id, name, icon_name: readString(value.icon_name), sort_order: readNumber(value.sort_order) };
};

const parseMenuProductRow = (value: unknown): SupabaseMenuProductRow | null => {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const name = readString(value.name);
  const price = readNumber(value.price);
  if (!id || !name || price === undefined) return null;
  return {
    id,
    name,
    price,
    category_id: readString(value.category_id),
    description: readString(value.description),
    kitchen_station: parseKitchenStation(value.kitchen_station),
    is_custom_price: readBoolean(value.is_custom_price),
    is_favorite: readBoolean(value.is_favorite),
    favorite_order: readNumber(value.favorite_order),
    modifier_groups: value.modifier_groups,
  };
};

/**
 * Carga el estado actual de todas las mesas desde Supabase
 */
export const fetchRemoteTables = async (): Promise<Record<string, { status: TableStatus; lastUpdated?: string }> | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('tables_state')
      .select('table_number, status, last_updated');

    if (error) {
      console.warn('Error fetching tables from Supabase:', error.message);
      return null;
    }

    const map: Record<string, { status: TableStatus; lastUpdated?: string }> = {};
    (data || []).forEach(row => {
      const parsedRow = parseTableStateRow(row);
      if (!parsedRow) return;
      map[parsedRow.table_number] = {
        status: parsedRow.status,
        lastUpdated: parsedRow.last_updated ? new Date(parsedRow.last_updated).toLocaleTimeString() : undefined,
      };
    });

    return map;
  } catch (err) {
    console.warn('Network error fetching tables:', err);
    return null;
  }
};

/**
 * Carga los ítems de la orden activa de una mesa
 */
export const fetchActiveOrderItems = async (tableNumber: string): Promise<{ items: CartItem[]; orderId?: string } | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // 1. Buscar la orden activa de la mesa
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, total')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.warn('Error fetching active order:', orderError.message);
      return null;
    }
    const activeOrder = parseOrderRow(orderData);
    if (!activeOrder) {
      return { items: [] };
    }

    // 2. Buscar los ítems de la orden
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', activeOrder.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.warn('Error fetching order items:', itemsError.message);
      return null;
    }
    if (!itemsData) {
      return { items: [], orderId: activeOrder.id };
    }

    const items: CartItem[] = itemsData.flatMap(row => {
      const parsedRow = parseOrderItemRow(row);
      return parsedRow ? [{
        product: {
          id: parsedRow.product_id,
          menuProductId: parsedRow.menu_product_id || parsedRow.product_id,
          name: parsedRow.product_name,
          price: parsedRow.price,
          modifierTotal: parsedRow.modifier_total || 0,
          category: parsedRow.category || 'general',
          kitchenStation: parsedRow.kitchen_station || 'station_a',
        },
        quantity: parsedRow.quantity,
        notes: parsedRow.notes || '',
        round: parsedRow.round_number || 1,
        status: parsedRow.status || 'pending',
        dbId: parsedRow.id,
      }] : [];
    });

    return { items, orderId: activeOrder.id };
  } catch (err) {
    console.warn('Error fetching order items:', err);
    return null;
  }
};

/**
 * Sincroniza la orden activa y sus ítems en Supabase
 */
export const syncActiveOrderToSupabase = async (
  tableNumber: string,
  items: CartItem[],
  total: number,
  waiterName = 'Mesero'
): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber) {
    throw new Error('Supabase no está configurado o la mesa no es válida.');
  }

  try {
    // 1. Buscar o crear la orden activa
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .maybeSingle();
    if (existingOrderError) throw existingOrderError;

    let orderId = parseOrderRow(existingOrder)?.id;
    const orderType = getOrderReferenceType(tableNumber);

    if (!orderId && items.length > 0) {
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          table_number: tableNumber,
          status: 'active',
          total,
          order_type: orderType,
        })
        .select('id')
        .single();

      const createdOrder = parseOrderRow(newOrder);
      if (createError || !createdOrder) throw createError || new Error('Supabase no devolvió una orden válida.');
      orderId = createdOrder.id;
    } else if (orderId) {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ total, order_type: orderType })
        .eq('id', orderId);
      if (updateOrderError) throw updateOrderError;
    }

    // 2. Sincronizar ítems si hay orden
    if (orderId && items.length > 0) {
      // Eliminar y reinsertar o upsert
      const rows = items.map(item => ({
        order_id: orderId,
        table_number: tableNumber,
        product_id: item.product.id,
        menu_product_id: item.product.menuProductId || item.product.id,
        product_name: item.product.name,
        category: item.product.category,
        kitchen_station: item.product.kitchenStation || 'station_a',
        price: item.product.price,
        modifier_total: item.product.modifierTotal || 0,
        quantity: item.quantity,
        notes: item.notes || '',
        round_number: item.round || 1,
        status: item.status || 'pending',
      }));

      // Limpiamos los ítems anteriores de la orden para evitar duplicados y volvemos a insertar
      const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (deleteError) throw deleteError;
      const { error: insertError } = await supabase.from('order_items').insert(rows);
      if (insertError) throw insertError;
    }

    // 3. Actualizar estado de la mesa
    const hasItems = items.length > 0;
    const tableStatus: TableStatus = hasItems ? 'busy' : 'free';
    
    const { error: tableError } = await supabase
      .from('tables_state')
      .upsert({
        table_number: tableNumber,
        status: tableStatus,
        last_updated: new Date().toISOString(),
        waiter_name: waiterName,
        active_order_id: orderId || null,
      });
    if (tableError) throw tableError;

    return orderId || null;
  } catch (err) {
    console.warn('Error syncing order to Supabase:', err);
    throw new Error(describeSupabaseError(err));
  }
};

/**
 * Enviar ronda a cocina: marca los ítems pendientes como 'sent_to_kitchen'
 */
export const markRoundSentInSupabase = async (
  tableNumber: string,
  _roundNumber?: number
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber) return false;

  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .maybeSingle();

    const activeOrder = parseOrderRow(order);
    if (!activeOrder) return false;

    await supabase
      .from('order_items')
      .update({ status: 'sent_to_kitchen' })
      .eq('order_id', activeOrder.id)
      .eq('status', 'pending');

    await supabase
      .from('tables_state')
      .update({
        status: 'busy',
        last_updated: new Date().toISOString(),
      })
      .eq('table_number', tableNumber);

    return true;
  } catch (err) {
    console.warn('Error marking round sent in Supabase:', err);
    return false;
  }
};

/**
 * El mesero solicita la cuenta -> Mesa cambia a 'bill_requested' en tiempo real
 */
export const requestBillInSupabase = async (tableNumber: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber) return false;

  try {
    const { error } = await supabase
      .from('tables_state')
      .update({
        status: 'bill_requested',
        last_updated: new Date().toISOString(),
      })
      .eq('table_number', tableNumber);

    return !error;
  } catch (err) {
    console.warn('Error requesting bill in Supabase:', err);
    return false;
  }
};

/** Actualiza estados operativos de mesa que no se deducen del carrito. */
export const updateTableStatusInSupabase = async (
  tableNumber: string,
  status: TableStatus,
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber) return false;

  try {
    const { error } = await supabase
      .from('tables_state')
      .upsert({
        table_number: tableNumber,
        status,
        last_updated: new Date().toISOString(),
      });
    return !error;
  } catch (err) {
    console.warn('Error updating table status in Supabase:', err);
    return false;
  }
};

/** Persiste el avance de cocina; el broadcast sólo sirve como acelerador UI. */
export const updateOrderItemStatusInSupabase = async (
  tableNumber: string,
  productId: string,
  status: 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready',
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber || !productId) return false;

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .maybeSingle();
    if (orderError || !order) return false;

    const { error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('order_id', order.id)
      .eq('product_id', productId);
    return !error;
  } catch (err) {
    console.warn('Error updating kitchen item in Supabase:', err);
    return false;
  }
};

/**
 * El cajero completa el cobro -> Cierra orden, libera mesa y pasa a 'cleaning'
 */
export const finalizePaymentInSupabase = async (
  tableNumber: string,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  change: number,
  total: number
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber) return false;

  try {
    // 1. Cerrar orden activa
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        change_given: change,
        total,
        closed_at: new Date().toISOString(),
      })
      .eq('table_number', tableNumber)
      .eq('status', 'active');

    // 2. Pasar mesa a cleaning
    await supabase
      .from('tables_state')
      .update({
        status: 'cleaning',
        last_updated: new Date().toISOString(),
        active_order_id: null,
      })
      .eq('table_number', tableNumber);

    return true;
  } catch (err) {
    console.warn('Error finalizing payment in Supabase:', err);
    return false;
  }
};

/**
 * Liberar / Vaciar mesa en Supabase
 */
export const clearTableInSupabase = async (tableNumber: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !tableNumber) return false;

  try {
    await supabase
      .from('orders')
      .update({ status: 'cancelled', closed_at: new Date().toISOString() })
      .eq('table_number', tableNumber)
      .eq('status', 'active');

    await supabase
      .from('tables_state')
      .update({
        status: 'free',
        last_updated: new Date().toISOString(),
        active_order_id: null,
      })
      .eq('table_number', tableNumber);

    return true;
  } catch (err) {
    console.warn('Error clearing table in Supabase:', err);
    return false;
  }
};

/**
 * Carga las categorías activas del menú desde Supabase
 */
export const fetchMenuCategoriesFromSupabase = async (): Promise<Category[] | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('id, name, icon_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching categories from Supabase:', error.message);
      return null;
    }

    return (data || []).flatMap(row => {
      const parsedRow = parseMenuCategoryRow(row);
      return parsedRow ? [{
        id: parsedRow.id,
        name: parsedRow.name,
        iconName: parsedRow.icon_name,
        sortOrder: parsedRow.sort_order,
      }] : [];
    });
  } catch (err) {
    console.warn('Network error fetching categories from Supabase:', err);
    return null;
  }
};

/**
 * Carga los platillos / productos activos del menú desde Supabase
 */
const normalizeModifierGroups = (value: unknown): ProductModifierGroup[] => {
  const parsed = typeof value === 'string'
    ? (() => {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      })()
    : value;

  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap(group => {
    if (!isRecord(group) || typeof group.id !== 'string' || typeof group.label !== 'string' || !Array.isArray(group.options)) {
      return [];
    }

    const options = group.options.flatMap(option => (
      isRecord(option) && typeof option.id === 'string' && typeof option.name === 'string'
        ? [{
            id: option.id,
            name: option.name,
            priceDelta: Number.isFinite(Number(option.priceDelta ?? option.price_delta))
              ? Number(option.priceDelta ?? option.price_delta)
              : 0,
          }]
        : []
    ));

    return options.length > 0
      ? [{
          id: group.id,
          label: group.label,
          minSelections: Math.max(0, Number(group.minSelections ?? group.min_selections) || 0),
          maxSelections: Math.max(1, Number(group.maxSelections ?? group.max_selections) || 1),
          options,
        }]
      : [];
  });
};

export const fetchMenuProductsFromSupabase = async (): Promise<Product[] | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('menu_products')
      .select('id, name, price, category_id, description, kitchen_station, is_custom_price, is_favorite, favorite_order, modifier_groups, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching products from Supabase:', error.message);
      return null;
    }

    return (data || []).flatMap(row => {
      const parsedRow = parseMenuProductRow(row);
      return parsedRow ? [{
        id: parsedRow.id,
        menuProductId: parsedRow.id,
        name: parsedRow.name,
        price: parsedRow.price,
        category: parsedRow.category_id || 'extras',
        description: parsedRow.description || '',
        kitchenStation: parsedRow.kitchen_station || 'station_a',
        isCustomPrice: Boolean(parsedRow.is_custom_price),
        isFavorite: Boolean(parsedRow.is_favorite),
        favoriteOrder: parsedRow.favorite_order || 0,
        modifierGroups: normalizeModifierGroups(parsedRow.modifier_groups),
      }] : [];
    });
  } catch (err) {
    console.warn('Network error fetching products from Supabase:', err);
    return null;
  }
};

export interface BroadcastTableStatePayload {
  tableNumber: string;
  status: TableStatus;
  cart: Record<string, CartItem>;
  currentRound: number;
  waiterName?: string;
  isBillRequested?: boolean;
}

export interface BroadcastKitchenStatusPayload {
  tableNumber: string;
  itemId: string;
  status: 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready';
}

const isCartItem = (value: unknown): value is CartItem => {
  if (!isRecord(value) || !isRecord(value.product)) return false;
  const product = value.product;
  return typeof product.id === 'string'
    && typeof product.name === 'string'
    && readNumber(product.price) !== undefined
    && typeof product.category === 'string'
    && readNumber(value.quantity) !== undefined;
};

const parseBroadcastTableStatePayload = (value: unknown): BroadcastTableStatePayload | null => {
  if (!isRecord(value)) return null;
  const tableNumber = readString(value.tableNumber);
  const status = parseTableStatus(value.status);
  const currentRound = readNumber(value.currentRound);
  if (!tableNumber || !status || currentRound === undefined || !isRecord(value.cart)) return null;

  const cart = Object.fromEntries(
    Object.entries(value.cart).flatMap(([id, item]) => isCartItem(item) ? [[id, item]] : []),
  );
  return {
    tableNumber,
    status,
    cart,
    currentRound,
    waiterName: readString(value.waiterName),
    isBillRequested: readBoolean(value.isBillRequested),
  };
};

const parseBroadcastKitchenStatusPayload = (value: unknown): BroadcastKitchenStatusPayload | null => {
  if (!isRecord(value)) return null;
  const tableNumber = readString(value.tableNumber);
  const itemId = readString(value.itemId);
  const status = parseKitchenItemStatus(value.status);
  return tableNumber && itemId && status ? { tableNumber, itemId, status } : null;
};

export const reinitializeSupabaseClient = () => {
  if (realtimeChannel && supabaseClient) {
    try {
      supabaseClient.removeChannel(realtimeChannel);
    } catch {
      // ignore
    }
    realtimeChannel = null;
  }
  supabaseClient = null;
  sessionInitialization = null;
};

export const broadcastTableState = async (payload: BroadcastTableStatePayload) => {
  if (realtimeChannel) {
    try {
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'TABLE_STATE_SYNC',
        payload,
      });
    } catch (err) {
      console.warn('Error broadcasting table state:', err);
    }
  }
};

export const broadcastKitchenItemStatus = async (
  tableNumber: string,
  itemId: string,
  status: 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready'
) => {
  if (realtimeChannel) {
    try {
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'KITCHEN_ITEM_STATUS',
        payload: { tableNumber, itemId, status },
      });
    } catch (err) {
      console.warn('Error broadcasting kitchen status:', err);
    }
  }
};

/**
 * Suscripción en Tiempo Real a eventos de mesas, órdenes, comandas y menú
 */
export const subscribeToRealtimeChanges = (
  onTableChange: (table: RemoteTableUpdate) => void,
  onOrderChange?: (order: RemoteOrderUpdate) => void,
  onMenuChange?: () => void,
  onTableCartSync?: (payload: BroadcastTableStatePayload) => void,
  onKitchenStatusSync?: (payload: BroadcastKitchenStatusPayload) => void,
  onOrderItemsChange?: (tableNumber: string) => void,
  onConnectionChange?: (connected: boolean) => void,
): (() => void) => {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  if (realtimeChannel) {
    try {
      supabase.removeChannel(realtimeChannel);
    } catch {
      // ignore
    }
  }

  realtimeChannel = supabase
    .channel('pos-realtime-channel', {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tables_state' },
      (payload) => {
        const row = parseTableStateRow(payload.new);
        if (row) {
          onTableChange({
            tableNumber: row.table_number,
            status: row.status,
            lastUpdated: row.last_updated ? new Date(row.last_updated).toLocaleTimeString() : undefined,
            waiterName: row.waiter_name,
            activeOrderId: row.active_order_id,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_items' },
      (payload) => {
        const row = parseOrderItemRow(payload.new);
        const oldRow = parseOrderItemRow(payload.old);
        const tableNumber = row?.table_number || oldRow?.table_number;
        if (tableNumber && onOrderItemsChange) onOrderItemsChange(tableNumber);
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        const row = parseOrderRow(payload.new);
        if (row && row.table_number && row.status && row.total !== undefined && onOrderChange) {
          onOrderChange({
            orderId: row.id,
            tableNumber: row.table_number,
            status: row.status,
            total: Number(row.total),
            paymentMethod: row.payment_method,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_products' },
      () => {
        if (onMenuChange) onMenuChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_categories' },
      () => {
        if (onMenuChange) onMenuChange();
      }
    )
    .on('broadcast', { event: 'TABLE_STATE_SYNC' }, ({ payload }) => {
      const tablePayload = parseBroadcastTableStatePayload(payload);
      if (onTableCartSync && tablePayload) {
        onTableCartSync(tablePayload);
      }
    })
    .on('broadcast', { event: 'KITCHEN_ITEM_STATUS' }, ({ payload }) => {
      const kitchenPayload = parseBroadcastKitchenStatusPayload(payload);
      if (onKitchenStatusSync && kitchenPayload) {
        onKitchenStatusSync(kitchenPayload);
      }
    })
    .subscribe((status) => {
      // "Conectado" significa que el canal Realtime confirmó SUBSCRIBED,
      // no sólo que una consulta HTTP de mesas respondió.
      if (onConnectionChange) onConnectionChange(status === 'SUBSCRIBED');
    });

  return () => {
    if (realtimeChannel && supabase) {
      try {
        supabase.removeChannel(realtimeChannel);
      } catch {
        // ignore
      }
      realtimeChannel = null;
    }
  };
};
