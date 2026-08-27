// src/screens/TablesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCartStore, TableStatus } from '../store/useCartStore';
import {
  Clock,
  Coffee,
  ShoppingBag,
  CreditCard,
  BellRing,
  Database,
  Settings,
} from 'lucide-react-native';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

const STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Disponible',
  busy: 'Consumo',
  bill_requested: 'Pide Cuenta',
  cleaning: 'Limpieza',
};

const getCardStatusStyle = (status: TableStatus) => {
  switch (status) {
    case 'free':
      return styles.cardStatus_free;
    case 'busy':
      return styles.cardStatus_busy;
    case 'bill_requested':
      return styles.cardStatus_bill_requested;
    case 'cleaning':
      return styles.cardStatus_cleaning;
  }
};

const getDotStatusStyle = (status: TableStatus) => {
  switch (status) {
    case 'free':
      return styles.dotStatus_free;
    case 'busy':
      return styles.dotStatus_busy;
    case 'bill_requested':
      return styles.dotStatus_bill_requested;
    case 'cleaning':
      return styles.dotStatus_cleaning;
  }
};

const getSubtitleStatusStyle = (status: TableStatus) => {
  switch (status) {
    case 'free':
      return styles.detailsSubtitle_free;
    case 'busy':
      return styles.detailsSubtitle_busy;
    case 'bill_requested':
      return styles.detailsSubtitle_bill_requested;
    case 'cleaning':
      return styles.detailsSubtitle_cleaning;
  }
};

export function TablesScreen() {
  const tables = useCartStore(state => state.tables);
  const setTableNumber = useCartStore(state => state.setTableNumber);
  const setTableStatus = useCartStore(state => state.setTableStatus);
  const setActiveTab = useCartStore(state => state.setActiveTab);
  const clearCart = useCartStore(state => state.clearCart);
  const showCustomAlert = useCartStore(state => state.showCustomAlert);
  const isRealtimeConnected = useCartStore(state => state.isRealtimeConnected);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);

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
      showCustomAlert({
        type: 'info',
        title: 'Mesa Sin Consumo',
        message: 'No puedes cobrar una mesa que aún no tiene platillos registrados.',
        confirmText: 'Entendido',
      });
      return;
    }

    setTableNumber(tableId);
    setActiveTab('payment');
  };

  const handleClearTable = (tableId: string) => {
    showCustomAlert({
      type: 'error',
      title: `¿Liberar Mesa ${tableId}?`,
      message: `Esto borrará la comanda activa de la Mesa ${tableId} y la marcará como disponible.`,
      confirmText: 'Sí, Liberar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        setTableNumber(tableId);
        clearCart();
        setTableNumber('');
        setSelectedTable(null);
      },
    });
  };

  const handleToggleStatus = (tableId: string) => {
    const currentStatus = tables[tableId]?.status || 'free';
    let nextStatus: TableStatus = 'free';

    if (currentStatus === 'free') nextStatus = 'busy';
    else if (currentStatus === 'busy') nextStatus = 'bill_requested';
    else if (currentStatus === 'bill_requested') nextStatus = 'cleaning';
    else if (currentStatus === 'cleaning') nextStatus = 'free';

    setTableStatus(tableId, nextStatus);
  };

  const renderTableCard = ({ item: tableId }: { item: string }) => {
    const tableOrder = tables[tableId];
    const status = tableOrder?.status || 'free';
    const cartItems = tableOrder?.cart ? Object.values(tableOrder.cart) : [];
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
          getCardStatusStyle(status),
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handleSelectTable(tableId)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tableName}>Mesa {tableId}</Text>
          <View style={[styles.statusDot, getDotStatusStyle(status)]} />
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
          {status === 'bill_requested' && (
            <View style={styles.billReqBox}>
              <View style={styles.billReqHeader}>
                <BellRing size={12} color="#ea580c" />
                <Text style={styles.billReqText}>Pide Cuenta</Text>
              </View>
              <Text style={styles.billReqTotal}>${total.toFixed(2)}</Text>
            </View>
          )}
          {status === 'cleaning' && (
            <View style={styles.cleaningRow}>
              <Clock size={12} color="#3B82F6" style={styles.cleaningIcon} />
              <Text style={styles.cleaningText}>Limpieza</Text>
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
    const status = tableOrder?.status || 'free';
    const cartItems = tableOrder?.cart ? Object.values(tableOrder.cart) : [];
    const isBillRequested = status === 'bill_requested';

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return (
      <View style={styles.detailsPanel}>
        <View style={styles.detailsHeader}>
          <View>
            <View style={styles.detailsTitleRow}>
              <Text style={styles.detailsTitle}>Mesa {selectedTable}</Text>
              {isBillRequested && (
                <View style={styles.billReqBadge}>
                  <BellRing size={12} color="#FFF" />
                  <Text style={styles.billReqBadgeText}>SOLICITA CUENTA</Text>
                </View>
              )}
            </View>
            <Text style={[styles.detailsSubtitle, getSubtitleStatusStyle(status)]}>
              Estado: {STATUS_LABELS[status]}
            </Text>
          </View>
          {total > 0 && (
            <Text style={styles.detailsTotal}>Total: ${total.toFixed(2)}</Text>
          )}
        </View>

        {cartItems.length > 0 ? (
          <ScrollView style={styles.itemsSummaryList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {cartItems.map(item => (
              <View key={item.product.id} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemName}>
                  {item.quantity}x {item.product.name} {item.notes ? `(${item.notes})` : ''}
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
            <Coffee size={16} color="#FFF" style={styles.actionBtnIcon} />
            <Text style={styles.orderBtnText}>TOMA COMANDA</Text>
          </TouchableOpacity>

          {status !== 'free' && cartItems.length > 0 && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isBillRequested ? styles.payBtnHighlight : styles.payBtn,
              ]}
              onPress={() => handleGoToPayment(selectedTable)}
            >
              <CreditCard size={16} color="#FFF" style={styles.actionBtnIcon} />
              <Text style={styles.payBtnText}>
                {isBillRequested ? 'COBRAR CUENTA (URGENTE)' : 'COBRAR CUENTA'}
              </Text>
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
      {/* Top Header con Acceso Directo a Supabase */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appHeaderTitle}>Mesas y Comandas</Text>
          <Text style={styles.appHeaderSubtitle}>TicketApp POS</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.supabaseStatusBtn,
            isRealtimeConnected ? styles.supabaseStatusBtnConnected : styles.supabaseStatusBtnOffline,
          ]}
          onPress={() => setConfigModalVisible(true)}
          activeOpacity={0.7}
        >
          <Database size={15} color={isRealtimeConnected ? '#059669' : '#ba1a1a'} />
          <Text style={[styles.supabaseStatusText, isRealtimeConnected ? styles.supabaseTextConnected : styles.supabaseTextOffline]}>
            {isRealtimeConnected ? 'Supabase En Vivo' : 'Configurar Supabase'}
          </Text>
          <Settings size={14} color={isRealtimeConnected ? '#059669' : '#ba1a1a'} />
        </TouchableOpacity>
      </View>

      {/* Banner si está desconectado */}
      {!isRealtimeConnected && (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={() => setConfigModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.offlineBannerText}>
            ⚡ Modo Local (Offline) • Toca aquí para introducir credenciales de Supabase
          </Text>
        </TouchableOpacity>
      )}

      {/* Indicadores de Leyenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotStatus_free]} />
          <Text style={styles.legendText}>Libre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotStatus_busy]} />
          <Text style={styles.legendText}>Consumo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotStatus_bill_requested]} />
          <Text style={styles.legendText}>Pide Cuenta</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotStatus_cleaning]} />
          <Text style={styles.legendText}>Limpieza</Text>
        </View>
      </View>

      {/* Botón de Pedido Rápido (Para Llevar) */}
      <TouchableOpacity
        style={styles.quickOrderBtn}
        onPress={() => handleGoToOrder('Llevar')}
      >
        <ShoppingBag size={18} color="#b3006c" style={styles.quickOrderIcon} />
        <Text style={styles.quickOrderText}>Orden Rápida (Para Llevar)</Text>
      </TouchableOpacity>

      {/* Grid de Mesas */}
      <FlatList
        data={Object.keys(tables).sort((a, b) => {
          if (a === 'Llevar') return 1;
          if (b === 'Llevar') return -1;
          return parseInt(a, 10) - parseInt(b, 10);
        })}
        renderItem={renderTableCard}
        keyExtractor={item => item}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
      />

      {/* Panel Detallado */}
      {selectedTable && getSelectedTableSummary()}

      {/* Modal de Configuración Supabase */}
      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27171d',
  },
  appHeaderSubtitle: {
    fontSize: 12,
    color: '#8e6e79',
  },
  supabaseStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  supabaseStatusBtnConnected: {
    backgroundColor: '#dcfce7',
  },
  supabaseStatusBtnOffline: {
    backgroundColor: '#fee2e2',
  },
  supabaseStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  supabaseTextConnected: {
    color: '#059669',
  },
  supabaseTextOffline: {
    color: '#ba1a1a',
  },
  offlineBanner: {
    backgroundColor: '#991b1b',
    padding: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginRight: 5,
  },
  legendText: {
    color: '#27171d',
    fontSize: 11,
    fontWeight: '600',
  },
  quickOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd9e5',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickOrderText: {
    color: '#b3006c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  gridContent: {
    padding: 6,
    paddingBottom: 260,
  },
  tableCard: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  selectedCard: {
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  billRequestedCardPulse: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableName: {
    color: '#27171d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    marginTop: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
  freeText: {
    color: '#5a3f49',
    fontSize: 12,
    fontWeight: '500',
  },
  busyTotal: {
    color: '#27171d',
    fontSize: 15,
    fontWeight: 'bold',
  },
  busyItems: {
    color: '#5a3f49',
    fontSize: 11,
  },
  billReqBox: {
    gap: 1,
  },
  billReqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  billReqText: {
    color: '#ea580c',
    fontSize: 10,
    fontWeight: '800',
  },
  billReqTotal: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '900',
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
    marginTop: 2,
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
  detailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsTitle: {
    color: '#27171d',
    fontSize: 17,
    fontWeight: 'bold',
  },
  billReqBadge: {
    backgroundColor: '#ea580c',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  billReqBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  detailsSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsTotal: {
    color: '#b3006c',
    fontSize: 17,
    fontWeight: 'bold',
  },
  itemsSummaryList: {
    maxHeight: 90,
    marginVertical: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryItemName: {
    color: '#5a3f49',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  summaryItemPrice: {
    color: '#27171d',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  emptyDetailsText: {
    color: '#8e6e79',
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  payBtn: {
    backgroundColor: '#ab286c',
  },
  payBtnHighlight: {
    backgroundColor: '#ea580c',
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  utilityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  utilityBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  utilityBtnText: {
    color: '#5a3f49',
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    color: '#ba1a1a',
    fontSize: 11,
    fontWeight: '600',
  },
  cardStatus_free: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
  },
  cardStatus_busy: {
    backgroundColor: '#fff0f3',
    borderColor: '#b3006c',
  },
  cardStatus_bill_requested: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
  },
  cardStatus_cleaning: {
    backgroundColor: '#fff8f8',
    borderColor: '#3B82F6',
  },
  dotStatus_free: {
    backgroundColor: '#10B981',
  },
  dotStatus_busy: {
    backgroundColor: '#EAB308',
  },
  dotStatus_bill_requested: {
    backgroundColor: '#ea580c',
  },
  dotStatus_cleaning: {
    backgroundColor: '#3B82F6',
  },
  detailsSubtitle_free: {
    color: '#10B981',
  },
  detailsSubtitle_busy: {
    color: '#EAB308',
  },
  detailsSubtitle_bill_requested: {
    color: '#ea580c',
  },
  detailsSubtitle_cleaning: {
    color: '#3B82F6',
  },
  cleaningIcon: {
    marginRight: 4,
  },
  actionBtnIcon: {
    marginRight: 5,
  },
  quickOrderIcon: {
    marginRight: 6,
  },
});
