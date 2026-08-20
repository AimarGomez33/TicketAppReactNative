// src/screens/KitchenScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  useCartStore,
  KitchenStation,
  ItemKitchenStatus,
  CartItem,
} from '../store/useCartStore';
import { printTicketTCP } from '../services/printerService';
import {
  ChefHat,
  Printer,
  CheckCircle2,
  Clock,
  Utensils,
  Layers,
} from 'lucide-react-native';

export const KitchenScreen: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<KitchenStation | 'all'>('all');
  const [isPrinting, setIsPrinting] = useState<string | null>(null);

  const tables = useCartStore(state => state.tables);
  const updateItemKitchenStatus = useCartStore(state => state.updateItemKitchenStatus);
  const showCustomAlert = useCartStore(state => state.showCustomAlert);
  const isRealtimeConnected = useCartStore(state => state.isRealtimeConnected);

  // Obtener todas las mesas ocupadas que tienen comandas activas
  const activeTablesWithItems = Object.keys(tables)
    .filter(tbl => {
      const order = tables[tbl];
      if (!order || (order.status !== 'busy' && order.status !== 'bill_requested')) {
        return false;
      }
      const items = Object.values(order.cart || {});
      if (items.length === 0) return false;

      // Filtrar según la estación de cocina seleccionada
      if (selectedStation === 'all') return true;
      return items.some(it => (it.product.kitchenStation || 'mexican') === selectedStation);
    })
    .map(tbl => {
      const order = tables[tbl];
      const allItems = Object.values(order.cart || {});
      const stationItems = selectedStation === 'all'
        ? allItems
        : allItems.filter(it => (it.product.kitchenStation || 'mexican') === selectedStation);

      return {
        tableNumber: tbl,
        status: order.status,
        currentRound: order.currentRound || 1,
        lastUpdated: order.lastUpdated || '',
        waiterName: order.waiterName || 'Mesero',
        items: stationItems,
      };
    });

  const handlePrintStationTicket = async (
    tableNumber: string,
    roundNumber: number,
    items: CartItem[]
  ) => {
    setIsPrinting(tableNumber);
    try {
      const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
      await printTicketTCP(tableNumber, items, total, {
        isKitchenComanda: true,
        station: selectedStation === 'all' ? undefined : selectedStation,
        currentRound: roundNumber,
      });

      showCustomAlert({
        title: 'Ticket de Cocina Enviado',
        message: `Comanda de la Mesa ${tableNumber.toUpperCase()} enviada a la impresora de cocina exitosamente.`,
        type: 'success',
      });
    } catch (err: any) {
      showCustomAlert({
        title: 'Aviso de Impresión',
        message: `No se pudo conectar a la impresora térmica (${err.message || 'Error de red'}). Verifica que esté encendida.`,
        type: 'printer',
      });
    } finally {
      setIsPrinting(null);
    }
  };

  const handleMarkAllReady = (tableNumber: string, items: CartItem[]) => {
    items.forEach(it => {
      updateItemKitchenStatus(tableNumber, it.product.id, 'ready');
    });
    showCustomAlert({
      title: '¡Comanda Lista!',
      message: `Todos los platillos de la Mesa ${tableNumber.toUpperCase()} han sido marcados como listos.`,
      type: 'success',
    });
  };

  const toggleItemStatus = (tableNumber: string, item: CartItem) => {
    const current = item.status || 'pending';
    let nextStatus: ItemKitchenStatus = 'preparing';
    if (current === 'pending' || current === 'sent_to_kitchen') {
      nextStatus = 'preparing';
    } else if (current === 'preparing') {
      nextStatus = 'ready';
    } else {
      nextStatus = 'preparing';
    }
    updateItemKitchenStatus(tableNumber, item.product.id, nextStatus);
  };

  const getStatusBadge = (status: ItemKitchenStatus | undefined) => {
    switch (status) {
      case 'ready':
        return { label: 'LISTO', color: '#059669', bg: '#d1fae5' };
      case 'preparing':
        return { label: 'EN PREPARACIÓN', color: '#d97706', bg: '#fef3c7' };
      default:
        return { label: 'PENDIENTE', color: '#dc2626', bg: '#fee2e2' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Selector de Estación de Cocina */}
      <View style={styles.stationBar}>
        <TouchableOpacity
          style={[
            styles.stationButton,
            selectedStation === 'all' && styles.stationButtonActive,
          ]}
          onPress={() => setSelectedStation('all')}
          activeOpacity={0.75}
        >
          <Utensils size={15} color={selectedStation === 'all' ? '#ffffff' : '#5a3f49'} />
          <Text
            style={[
              styles.stationButtonText,
              selectedStation === 'all' && styles.stationButtonTextActive,
            ]}
          >
            Todas ({activeTablesWithItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.stationButton,
            selectedStation === 'mexican' && styles.stationButtonActive,
          ]}
          onPress={() => setSelectedStation('mexican')}
          activeOpacity={0.75}
        >
          <Text style={styles.emojiIcon}>🇲🇽</Text>
          <Text
            style={[
              styles.stationButtonText,
              selectedStation === 'mexican' && styles.stationButtonTextActive,
            ]}
            numberOfLines={1}
          >
            Cocina 1: Antojitos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.stationButton,
            selectedStation === 'american_tacos' && styles.stationButtonActive,
          ]}
          onPress={() => setSelectedStation('american_tacos')}
          activeOpacity={0.75}
        >
          <Text style={styles.emojiIcon}>🍔🌮</Text>
          <Text
            style={[
              styles.stationButtonText,
              selectedStation === 'american_tacos' && styles.stationButtonTextActive,
            ]}
            numberOfLines={1}
          >
            Cocina 2: Tacos & Amer.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-barra informativa */}
      <View style={styles.infoBar}>
        <View style={styles.liveIndicator}>
          <View
            style={[
              styles.liveDot,
              isRealtimeConnected ? styles.liveDotConnected : styles.liveDotDisconnected,
            ]}
          />
          <Text style={styles.infoText}>
            {isRealtimeConnected ? 'KDS EN TIEMPO REAL CONECTADO' : 'MODO LOCAL'}
          </Text>
        </View>
        <Text style={styles.infoText}>
          {activeTablesWithItems.length} Comanda(s) activas
        </Text>
      </View>

      {/* Lista de Comandas de Cocina */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTablesWithItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <ChefHat size={48} color="#b3006c" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>¡Todo al día en Cocina!</Text>
            <Text style={styles.emptySubtitle}>
              No hay platillos pendientes por preparar en{' '}
              {selectedStation === 'mexican'
                ? 'Cocina 1 (Antojitos Mexicanos)'
                : selectedStation === 'american_tacos'
                ? 'Cocina 2 (Tacos y Americana)'
                : 'ninguna cocina'}
              .
            </Text>
          </View>
        ) : (
          activeTablesWithItems.map((tableOrder) => (
            <View key={tableOrder.tableNumber} style={styles.comandaCard}>
              {/* Encabezado de la Comanda */}
              <View style={styles.cardHeader}>
                <View style={styles.tableBadge}>
                  <Text style={styles.tableBadgeText}>
                    MESA {tableOrder.tableNumber.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.roundBadge}>
                  <Layers size={13} color="#b3006c" />
                  <Text style={styles.roundBadgeText}>
                    Ronda #{tableOrder.currentRound}
                  </Text>
                </View>

                <View style={styles.timeBadge}>
                  <Clock size={12} color="#5a3f49" />
                  <Text style={styles.timeText}>
                    {tableOrder.lastUpdated || 'Hace un momento'}
                  </Text>
                </View>
              </View>

              {/* Lista de Platillos para esta cocina */}
              <View style={styles.itemsContainer}>
                {tableOrder.items.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <TouchableOpacity
                      key={item.product.id}
                      style={[
                        styles.itemRow,
                        item.status === 'ready' && styles.itemRowReady,
                      ]}
                      onPress={() => toggleItemStatus(tableOrder.tableNumber, item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>{item.quantity}x</Text>
                      </View>

                      <View style={styles.itemDetails}>
                        <Text
                          style={[
                            styles.itemName,
                            item.status === 'ready' && styles.itemNameReady,
                          ]}
                        >
                          {item.product.name}
                        </Text>
                        {item.notes ? (
                          <Text style={styles.itemNotes}>
                            📝 {item.notes}
                          </Text>
                        ) : null}
                      </View>

                      <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusPillText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Acciones de Cocina: Imprimir Comanda y Despachar */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.printBtn}
                  onPress={() =>
                    handlePrintStationTicket(
                      tableOrder.tableNumber,
                      tableOrder.currentRound,
                      tableOrder.items
                    )
                  }
                  disabled={isPrinting === tableOrder.tableNumber}
                  activeOpacity={0.7}
                >
                  {isPrinting === tableOrder.tableNumber ? (
                    <ActivityIndicator size="small" color="#b3006c" />
                  ) : (
                    <>
                      <Printer size={15} color="#b3006c" />
                      <Text style={styles.printBtnText}>Imprimir Ticket</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.readyBtn}
                  onPress={() => handleMarkAllReady(tableOrder.tableNumber, tableOrder.items)}
                  activeOpacity={0.75}
                >
                  <CheckCircle2 size={15} color="#ffffff" />
                  <Text style={styles.readyBtnText}>Todo Listo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  stationBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    gap: 6,
  },
  stationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    gap: 4,
  },
  stationButtonActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  stationButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5a3f49',
  },
  stationButtonTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emojiIcon: {
    fontSize: 13,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#ffe8ee',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveDotConnected: {
    backgroundColor: '#059669',
  },
  liveDotDisconnected: {
    backgroundColor: '#9ca3af',
  },
  infoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8e6e79',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    marginTop: 30,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#27171d',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8e6e79',
    textAlign: 'center',
    lineHeight: 18,
  },
  comandaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff0f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  tableBadge: {
    backgroundColor: '#b3006c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  roundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roundBadgeText: {
    color: '#b3006c',
    fontSize: 11,
    fontWeight: '800',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#5a3f49',
    fontWeight: '600',
  },
  itemsContainer: {
    padding: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderColor: '#f0f0f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  itemRowReady: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    opacity: 0.85,
  },
  qtyBadge: {
    backgroundColor: '#ffd9e5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  qtyBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#b3006c',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27171d',
  },
  itemNameReady: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  itemNotes: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#b3006c',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b3006c',
  },
  readyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  readyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
