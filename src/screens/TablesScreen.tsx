// src/screens/TablesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCartStore, TableStatus } from '../store/useCartStore';
import {
  Clock,
  Coffee,
  CheckCircle,
  ShoppingBag,
  CreditCard,
} from 'lucide-react-native';

const STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Disponible',
  busy: 'Consumo',
  unpaid: 'Por Cobrar',
  cleaning: 'Limpieza',
};

const STATUS_COLORS: Record<TableStatus, { bg: string; border: string; text: string; dot: string }> = {
  free: {
    bg: '#ffffff', // blanco
    border: '#ffe0ea', // rosa suave
    text: '#5a3f49', // rosa oscuro
    dot: '#10B981', // verde
  },
  busy: {
    bg: '#fff0f3', // rosa muy claro
    border: '#b3006c', // rosa primario
    text: '#b3006c',
    dot: '#EAB308', // amarillo
  },
  unpaid: {
    bg: '#ffd9e5', // rosa contenedor
    border: '#ba1a1a', // error/red
    text: '#ba1a1a',
    dot: '#ba1a1a',
  },
  cleaning: {
    bg: '#fff8f8', // fondo
    border: '#3B82F6', // azul
    text: '#3B82F6',
    dot: '#3B82F6',
  },
};

export function TablesScreen() {
  const tables = useCartStore(state => state.tables);
  const setTableNumber = useCartStore(state => state.setTableNumber);
  const setTableStatus = useCartStore(state => state.setTableStatus);
  const setActiveTab = useCartStore(state => state.setActiveTab);
  const clearCart = useCartStore(state => state.clearCart);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleSelectTable = (tableId: string) => {
    setSelectedTable(tableId === selectedTable ? null : tableId);
  };

  const handleGoToOrder = (tableId: string) => {
    setTableNumber(tableId);
    setActiveTab('ordering');
  };

  const handleGoToPayment = (tableId: string) => {
    const tableOrder = tables[tableId];
    const hasItems = tableOrder && Object.keys(tableOrder.cart).length > 0;

    if (!hasItems) {
      Alert.alert(
        'Mesa sin consumo',
        'No puedes cobrar una mesa que no tiene platillos registrados.'
      );
      return;
    }

    setTableNumber(tableId);
    setActiveTab('payment');
  };

  const handleClearTable = (tableId: string) => {
    Alert.alert(
      'Liberar Mesa',
      `¿Estás seguro de que deseas liberar la Mesa ${tableId}? Esto borrará su cuenta actual.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Liberar',
          style: 'destructive',
          onPress: () => {
            setTableNumber(tableId);
            clearCart();
            setTableNumber('');
            setSelectedTable(null);
          },
        },
      ]
    );
  };

  const handleToggleStatus = (tableId: string) => {
    const currentStatus = tables[tableId]?.status || 'free';
    let nextStatus: TableStatus = 'free';

    if (currentStatus === 'free') nextStatus = 'busy';
    else if (currentStatus === 'busy') nextStatus = 'unpaid';
    else if (currentStatus === 'unpaid') nextStatus = 'cleaning';
    else if (currentStatus === 'cleaning') nextStatus = 'free';

    setTableStatus(tableId, nextStatus);
  };

  const renderTableCard = ({ item: tableId }: { item: string }) => {
    const tableOrder = tables[tableId];
    const status = tableOrder?.status || 'free';
    const cartItems = tableOrder?.cart ? Object.values(tableOrder.cart) : [];
    const colors = STATUS_COLORS[status];
    const isSelected = selectedTable === tableId;

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const qtyCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <TouchableOpacity
        style={[
          styles.tableCard,
          { backgroundColor: colors.bg, borderColor: isSelected ? '#b3006c' : colors.border },
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handleSelectTable(tableId)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tableName}>Mesa {tableId}</Text>
          <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
        </View>

        <View style={styles.cardBody}>
          {status === 'free' && (
            <Text style={styles.freeText}>Libre</Text>
          )}
          {status === 'busy' && (
            <View>
              <Text style={styles.busyTotal}>${total.toFixed(2)}</Text>
              <Text style={styles.busyItems}>{qtyCount} art.</Text>
            </View>
          )}
          {status === 'unpaid' && (
            <View>
              <Text style={styles.unpaidTotal}>${total.toFixed(2)}</Text>
              <Text style={styles.unpaidText}>Cobrar</Text>
            </View>
          )}
          {status === 'cleaning' && (
            <View style={styles.cleaningRow}>
              <Clock size={12} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={styles.cleaningText}>Sucia</Text>
            </View>
          )}
        </View>

        {tableOrder?.lastUpdated && status !== 'free' && (
          <Text style={styles.lastUpdated}>{tableOrder.lastUpdated}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const getSelectedTableSummary = () => {
    if (!selectedTable) return null;
    const tableOrder = tables[selectedTable];
    const cartItems = tableOrder?.cart ? Object.values(tableOrder.cart) : [];
    const status = tableOrder?.status || 'free';
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return (
      <View style={styles.detailsPanel}>
        <View style={styles.detailsHeader}>
          <View>
            <Text style={styles.detailsTitle}>Mesa {selectedTable}</Text>
            <Text style={[styles.detailsSubtitle, { color: STATUS_COLORS[status].dot }]}>
              Estado: {STATUS_LABELS[status]}
            </Text>
          </View>
          {total > 0 && (
            <Text style={styles.detailsTotal}>Total: ${total.toFixed(2)}</Text>
          )}
        </View>

        {cartItems.length > 0 ? (
          <ScrollView style={styles.itemsSummaryList} nestedScrollEnabled>
            {cartItems.map(item => (
              <View key={item.product.id} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemName}>
                  {item.quantity}x {item.product.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyDetails}>
            <Coffee size={24} color="#5a3f49" />
            <Text style={styles.emptyDetailsText}>Sin platillos registrados</Text>
          </View>
        )}

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.orderBtn]}
            onPress={() => handleGoToOrder(selectedTable)}
          >
            <Coffee size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.orderBtnText}>TOMA COMANDA</Text>
          </TouchableOpacity>

          {status !== 'free' && cartItems.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.payBtn]}
              onPress={() => handleGoToPayment(selectedTable)}
            >
              <CreditCard size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.payBtnText}>COBRAR CUENTA</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.utilityActions}>
          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={() => handleToggleStatus(selectedTable)}
          >
            <Text style={styles.utilityBtnText}>Rotar Estado</Text>
          </TouchableOpacity>
          
          {status !== 'free' && (
            <TouchableOpacity
              style={[styles.utilityBtn, styles.deleteBtn]}
              onPress={() => handleClearTable(selectedTable)}
            >
              <Text style={styles.deleteBtnText}>Liberar Mesa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Indicadores de Leyenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Libre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} />
          <Text style={styles.legendText}>Consumo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Por Cobrar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Limpieza</Text>
        </View>
      </View>

      {/* Botón de Pedido Rápido (Para Llevar) */}
      <TouchableOpacity
        style={styles.quickOrderBtn}
        onPress={() => handleGoToOrder('Llevar')}
      >
        <ShoppingBag size={18} color="#b3006c" style={{ marginRight: 8 }} />
        <Text style={styles.quickOrderText}>Orden Rápida (Para Llevar)</Text>
      </TouchableOpacity>

      {/* Grid de Mesas */}
      <FlatList
        data={Object.keys(tables).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))}
        renderItem={renderTableCard}
        keyExtractor={item => item}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
      />

      {/* Panel Detallado */}
      {selectedTable && getSelectedTableSummary()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#ffe8ee',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#27171d',
    fontSize: 12,
    fontWeight: '600',
  },
  quickOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd9e5',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    margin: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  quickOrderText: {
    color: '#b3006c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridContent: {
    padding: 6,
    paddingBottom: 260, // Espacio para el panel de detalles
  },
  tableCard: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  selectedCard: {
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableName: {
    color: '#27171d',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    marginTop: 8,
    height: 40,
    justifyContent: 'center',
  },
  freeText: {
    color: '#5a3f49',
    fontSize: 12,
    fontWeight: '500',
  },
  busyTotal: {
    color: '#27171d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  busyItems: {
    color: '#5a3f49',
    fontSize: 11,
  },
  unpaidTotal: {
    color: '#ba1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unpaidText: {
    color: '#ba1a1a',
    fontSize: 11,
    fontWeight: '600',
  },
  cleaningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cleaningText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  lastUpdated: {
    color: '#8e6e79',
    fontSize: 9,
    textAlign: 'right',
    marginTop: 4,
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1.5,
    borderTopColor: '#ffe0ea',
    padding: 16,
    maxHeight: 260,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 8,
  },
  detailsTitle: {
    color: '#27171d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsTotal: {
    color: '#b3006c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemsSummaryList: {
    maxHeight: 90,
    marginVertical: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryItemName: {
    color: '#5a3f49',
    fontSize: 13,
  },
  summaryItemPrice: {
    color: '#27171d',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  emptyDetailsText: {
    color: '#8e6e79',
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  orderBtn: {
    backgroundColor: '#b3006c',
  },
  orderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  payBtn: {
    backgroundColor: '#ab286c',
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  utilityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  utilityBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  utilityBtnText: {
    color: '#5a3f49',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    color: '#ba1a1a',
    fontSize: 12,
    fontWeight: '600',
  },
});
