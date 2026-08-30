// src/services/supabaseService.ts
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isSupabaseConfigured } from '../config/supabaseConfig';
import {
  CartItem,
  TableStatus,
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
    data?.forEach((row: any) => {
      map[row.table_number] = {
        status: row.status as TableStatus,
        lastUpdated: row.last_updated ? new Date(row.last_updated).toLocaleTimeString() : undefined,
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
    if (!orderData) {
      return { items: [] };
    }

    // 2. Buscar los ítems de la orden
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.warn('Error fetching order items:', itemsError.message);
      return null;
    }
    if (!itemsData) {
      return { items: [], orderId: orderData.id };
    }

    const items: CartItem[] = itemsData.map((row: any) => ({
      product: {
        id: row.product_id,
        menuProductId: row.menu_product_id || row.product_id,
        name: row.product_name,
        price: Number(row.price),
        modifierTotal: Number(row.modifier_total || 0),
        category: row.category || 'general',
        kitchenStation: row.kitchen_station || 'station_a',
      },
      quantity: row.quantity,
      notes: row.notes || '',
      round: row.round_number || 1,
      status: row.status || 'pending',
      dbId: row.id,
    }));

    return { items, orderId: orderData.id };
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

    let orderId = existingOrder?.id;
    const orderType = tableNumber.startsWith('L-') ? 'takeaway' : 'table';

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

      if (createError) throw createError;
      orderId = newOrder.id;
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

    return orderId;
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

    if (!order) return false;

    await supabase
      .from('order_items')
      .update({ status: 'sent_to_kitchen' })
      .eq('order_id', order.id)
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

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      iconName: row.icon_name,
      sortOrder: row.sort_order,
    }));
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

  return parsed.flatMap((group: any) => {
    if (!group || typeof group.id !== 'string' || typeof group.label !== 'string' || !Array.isArray(group.options)) {
      return [];
    }

    const options = group.options.flatMap((option: any) => (
      option && typeof option.id === 'string' && typeof option.name === 'string'
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

    return (data || []).map((row: any) => ({
      id: row.id,
      menuProductId: row.id,
      name: row.name,
      price: Number(row.price),
      category: row.category_id || 'extras',
      description: row.description || '',
      kitchenStation: row.kitchen_station as any,
      isCustomPrice: Boolean(row.is_custom_price),
      isFavorite: Boolean(row.is_favorite),
      favoriteOrder: Number(row.favorite_order || 0),
      modifierGroups: normalizeModifierGroups(row.modifier_groups),
    }));
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
        const row = payload.new as any;
        if (row && row.table_number) {
          onTableChange({
            tableNumber: row.table_number,
            status: row.status as TableStatus,
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
        const row = payload.new as any;
        const oldRow = payload.old as any;
        const tableNumber = row?.table_number || oldRow?.table_number;
        if (tableNumber && onOrderItemsChange) onOrderItemsChange(tableNumber);
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        const row = payload.new as any;
        if (row && row.id && onOrderChange) {
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
      if (onTableCartSync && payload) {
        onTableCartSync(payload as BroadcastTableStatePayload);
      }
    })
    .on('broadcast', { event: 'KITCHEN_ITEM_STATUS' }, ({ payload }) => {
      if (onKitchenStatusSync && payload) {
        onKitchenStatusSync(payload as BroadcastKitchenStatusPayload);
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
