// src/services/supabaseService.ts
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isSupabaseConfigured } from '../config/supabaseConfig';
import { CartItem, TableStatus } from '../store/useCartStore';

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

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

    if (orderError || !orderData) {
      return { items: [] };
    }

    // 2. Buscar los ítems de la orden
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id)
      .order('created_at', { ascending: true });

    if (itemsError || !itemsData) {
      return { items: [], orderId: orderData.id };
    }

    const items: CartItem[] = itemsData.map((row: any) => ({
      product: {
        id: row.product_id,
        name: row.product_name,
        price: Number(row.price),
        category: row.category || 'general',
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
  if (!supabase || !tableNumber) return null;

  try {
    // 1. Buscar o crear la orden activa
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .maybeSingle();

    let orderId = existingOrder?.id;

    if (!orderId && items.length > 0) {
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          table_number: tableNumber,
          status: 'active',
          total,
        })
        .select('id')
        .single();

      if (createError) throw createError;
      orderId = newOrder.id;
    } else if (orderId) {
      await supabase
        .from('orders')
        .update({ total })
        .eq('id', orderId);
    }

    // 2. Sincronizar ítems si hay orden
    if (orderId && items.length > 0) {
      // Eliminar y reinsertar o upsert
      const rows = items.map(item => ({
        id: item.dbId || undefined,
        order_id: orderId,
        table_number: tableNumber,
        product_id: item.product.id,
        product_name: item.product.name,
        category: item.product.category,
        price: item.product.price,
        quantity: item.quantity,
        notes: item.notes || '',
        round_number: item.round || 1,
        status: item.status || 'pending',
      }));

      // Limpiamos los ítems anteriores de la orden para evitar duplicados y volvemos a insertar
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('order_items').insert(rows);
    }

    // 3. Actualizar estado de la mesa
    const hasItems = items.length > 0;
    const tableStatus: TableStatus = hasItems ? 'busy' : 'free';
    
    await supabase
      .from('tables_state')
      .upsert({
        table_number: tableNumber,
        status: tableStatus,
        last_updated: new Date().toISOString(),
        waiter_name: waiterName,
        active_order_id: orderId || null,
      });

    return orderId;
  } catch (err) {
    console.warn('Error syncing order to Supabase:', err);
    return null;
  }
};

/**
 * Enviar ronda a cocina: marca los ítems pendientes como 'sent_to_kitchen'
 */
export const markRoundSentInSupabase = async (
  tableNumber: string,
  roundNumber: number
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

/**
 * El cajero completa el cobro -> Cierra orden, libera mesa y pasa a 'cleaning'
 */
export const finalizePaymentInSupabase = async (
  tableNumber: string,
  paymentMethod: 'cash' | 'card' | 'transfer',
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
 * Suscripción en Tiempo Real a eventos de mesas y órdenes
 */
export const subscribeToRealtimeChanges = (
  onTableChange: (table: RemoteTableUpdate) => void,
  onOrderChange?: (order: RemoteOrderUpdate) => void
): (() => void) => {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabase
    .channel('pos-realtime-channel')
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
    .subscribe();

  return () => {
    if (realtimeChannel && supabase) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
};
