// src/screens/PaymentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCartStore } from '../store/useCartStore';
import {
  CreditCard,
  Banknote,
  Send,
  Printer,
  ChevronLeft,
  XCircle,
  Tag,
} from 'lucide-react-native';
import { printTicketTCP } from '../services/printerService';
import { QuickSaleView } from '../components/QuickSaleView';
import { UtensilsCrossed, Zap } from 'lucide-react-native';

type PaymentMethod = 'cash' | 'card' | 'transfer';
type CashierViewMode = 'table' | 'quick';

export function PaymentScreen() {
  const tableNumber = useCartStore(state => state.tableNumber);
  const setTableNumber = useCartStore(state => state.setTableNumber);
  const tables = useCartStore(state => state.tables);
  const cart = useCartStore(state => state.cart);

  // Zustand actions
  const getTotal = useCartStore(state => state.getTotal);
  const completePayment = useCartStore(state => state.completePayment);
  const setActiveTab = useCartStore(state => state.setActiveTab);
  const includePricesInTicket = useCartStore(state => state.includePricesInTicket);
  const setIncludePricesInTicket = useCartStore(state => state.setIncludePricesInTicket);
  const showCustomAlert = useCartStore(state => state.showCustomAlert);

  // Local state - Nunca forzar modo automáticamente para no atrapar al cajero
  const [cashierMode, setCashierMode] = useState<CashierViewMode>('quick');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedCashStr, setReceivedCashStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = getTotal();
  const items = Object.values(cart);

  // Lista de mesas con comanda activa o cuenta solicitada
  const activeTablesList = Object.keys(tables)
    .filter((tbl) => {
      const tOrder = tables[tbl];
      const hasCartItems = tOrder && tOrder.cart && Object.keys(tOrder.cart).length > 0;
      return hasCartItems || tOrder?.status === 'bill_requested' || tOrder?.status === 'busy';
    })
    .map((tbl) => {
      const tOrder = tables[tbl];
      const tItems = tOrder?.cart ? Object.values(tOrder.cart) : [];
      const tTotal = tItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
      return {
        tableNumber: tbl,
        status: tOrder?.status || 'free',
        itemCount: tItems.reduce((acc, it) => acc + it.quantity, 0),
        total: tTotal,
      };
    });

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setReceivedCashStr(total.toFixed(2));
    } else {
      setReceivedCashStr('');
    }
  }, [paymentMethod, total]);

  // Si está en modo Venta Rápida / Mostrador
  if (cashierMode === 'quick') {
    return (
      <View style={styles.outerContainer}>
        {/* Selector de Modo Superior */}
        <View style={styles.modeSegmentBar}>
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => setCashierMode('table')}
            activeOpacity={0.75}
          >
            <UtensilsCrossed size={14} color="#5a3f49" />
            <Text style={styles.segmentBtnText}>
              Cobro de Mesas {activeTablesList.length > 0 ? `(${activeTablesList.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, styles.segmentBtnActive]}
            onPress={() => setCashierMode('quick')}
            activeOpacity={0.75}
          >
            <Zap size={14} color="#FFF" />
            <Text style={[styles.segmentBtnText, styles.segmentBtnTextActive]}>
              Venta Rápida / Mostrador
            </Text>
          </TouchableOpacity>
        </View>

        <QuickSaleView />
      </View>
    );
  }

  // Si no hay mesa activa con productos seleccionada pero hay mesas activas disponibles
  if (!tableNumber || items.length === 0) {
    return (
      <View style={styles.outerContainer}>
        {/* Selector de Modo Superior */}
        <View style={styles.modeSegmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, styles.segmentBtnActive]}
            onPress={() => setCashierMode('table')}
            activeOpacity={0.75}
          >
            <UtensilsCrossed size={14} color="#FFF" />
            <Text style={[styles.segmentBtnText, styles.segmentBtnTextActive]}>
              Cobro de Mesas {activeTablesList.length > 0 ? `(${activeTablesList.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => setCashierMode('quick')}
            activeOpacity={0.75}
          >
            <Zap size={14} color="#5a3f49" />
            <Text style={styles.segmentBtnText}>
              Venta Rápida / Mostrador
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.emptyScrollContent}>
          <Text style={styles.sectionHeaderTitle}>MESAS CON CONSUMO PENDIENTE DE COBRO</Text>
          
          {activeTablesList.length > 0 ? (
            <View style={styles.activeTablesGrid}>
              {activeTablesList.map((t) => {
                const isBillReq = t.status === 'bill_requested';
                return (
                  <TouchableOpacity
                    key={t.tableNumber}
                    style={[
                      styles.tableCardSelectable,
                      isBillReq && styles.tableCardBillRequested,
                    ]}
                    onPress={() => {
                      setTableNumber(t.tableNumber);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tableCardHeader}>
                      <Text style={styles.tableCardNumber}>MESA {t.tableNumber.toUpperCase()}</Text>
                      {isBillReq ? (
                        <View style={styles.billReqBadge}>
                          <Text style={styles.billReqBadgeText}>PIDIÓ CUENTA</Text>
                        </View>
                      ) : (
                        <View style={styles.busyBadge}>
                          <Text style={styles.busyBadgeText}>OCUPADA</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.tableCardTotal}>${t.total.toFixed(2)}</Text>
                    <Text style={styles.tableCardSubtext}>{t.itemCount} platillos en comanda</Text>

                    <View style={styles.chargeActionBtn}>
                      <Text style={styles.chargeActionBtnText}>COBRAR ESTA MESA →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <XCircle size={48} color="#b3006c" />
              <Text style={styles.emptyTitle}>No hay mesas pendientes de cobro</Text>
              <Text style={styles.emptyText}>
                Todas las mesas están libres o ya fueron cobradas. Puedes atender pedidos directos en Mostrador.
              </Text>
            </View>
          )}

          <View style={styles.emptyButtonsRow}>
            <TouchableOpacity
              style={styles.quickSaleSwitchBtn}
              onPress={() => setCashierMode('quick')}
              activeOpacity={0.8}
            >
              <Zap size={16} color="#FFF" />
              <Text style={styles.quickSaleSwitchBtnText}>IR A VENTA RÁPIDA / MOSTRADOR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setActiveTab('tables')}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>MAPA DE MESAS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      // Imprimir ticket con desglose y total
      await printTicketTCP(tableNumber, items, total, {
        showPrices: true,
        isKitchenComanda: false,
        paymentMethod,
      });

      await completePayment(paymentMethod, total, 0);

      showCustomAlert({
        type: 'printer',
        title: '¡Cobro Exitoso!',
        message: `La cuenta de la Mesa ${tableNumber} se ha cerrado, el ticket se ha impreso y la mesa ha pasado a limpieza.`,
        confirmText: 'Volver a Mesas',
        onConfirm: () => {
          setActiveTab('tables');
        },
      });
    } catch (error: any) {
      showCustomAlert({
        type: 'error',
        title: 'Aviso de Impresora',
        message: `No se pudo conectar con la impresora (${error.message || '192.168.100.200'}). ¿Deseas cerrar la cuenta en el sistema sin ticket físico?`,
        confirmText: 'Cerrar sin Imprimir',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          await completePayment(paymentMethod, total, 0);
          setActiveTab('tables');
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backHeaderBtn}
          onPress={() => setActiveTab('tables')}
        >
          <ChevronLeft size={20} color="#b3006c" />
          <Text style={styles.backHeaderBtnText}>Mesas</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cobro - Mesa {tableNumber}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Resumen de Cuenta con Precios Unitarios */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de Consumo</Text>
          <View style={styles.itemsList}>
            {items.map(({ product, quantity, notes, round }) => (
              <View key={product.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {quantity}x {product.name}
                  </Text>
                  <Text style={styles.itemUnitPriceText}>
                    ${product.price.toFixed(2)} c/u {notes ? `• Nota: ${notes}` : ''} {round ? `• R#${round}` : ''}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${(product.price * quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL A COBRAR</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>

          {/* Opción de Precios en Ticket */}
          <View style={styles.ticketConfigRow}>
            <View style={styles.ticketConfigInfo}>
              <Tag size={14} color="#b3006c" />
              <Text style={styles.ticketConfigLabel}>
                Ticket Cliente: {includePricesInTicket ? 'Con Precios Unitarios' : 'Sin Precios'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.ticketConfigToggle,
                includePricesInTicket && styles.ticketConfigToggleActive,
              ]}
              onPress={() => setIncludePricesInTicket(!includePricesInTicket)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ticketConfigToggleText,
                  includePricesInTicket && styles.ticketConfigToggleTextActive,
                ]}
              >
                {includePricesInTicket ? 'SÍ' : 'NO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Métodos de Pago */}
        <Text style={styles.sectionTitle}>Método de Pago</Text>
        <View style={styles.methodsContainer}>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              paymentMethod === 'cash' && styles.activeMethodBtn,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Banknote
              size={20}
              color={paymentMethod === 'cash' ? '#ffffff' : '#ab286c'}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === 'cash' && styles.activeMethodText,
              ]}
            >
              Efectivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodBtn,
              paymentMethod === 'card' && styles.activeMethodBtn,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <CreditCard
              size={20}
              color={paymentMethod === 'card' ? '#ffffff' : '#ab286c'}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === 'card' && styles.activeMethodText,
              ]}
            >
              Tarjeta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodBtn,
              paymentMethod === 'transfer' && styles.activeMethodBtn,
            ]}
            onPress={() => setPaymentMethod('transfer')}
          >
            <Send
              size={20}
              color={paymentMethod === 'transfer' ? '#ffffff' : '#ab286c'}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === 'transfer' && styles.activeMethodText,
              ]}
            >
              Transf.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón Directo de Cobro e Impresión */}
        <TouchableOpacity
          style={[
            styles.processBtn,
            isProcessing && styles.processBtnDisabled,
          ]}
          onPress={handleProcessPayment}
          disabled={isProcessing}
        >
          <Printer size={18} color="#FFF" style={styles.processBtnIcon} />
          <Text style={styles.processBtnText}>
            {isProcessing ? 'CERRANDO E IMPRIMIENDO TICKET...' : `COBRAR E IMPRIMIR ($${total.toFixed(2)})`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    backgroundColor: '#ffe8ee',
  },
  backHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backHeaderBtnText: {
    color: '#b3006c',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  headerTitle: {
    color: '#27171d',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 24,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  modeSegmentBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  segmentBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5a3f49',
  },
  segmentBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff8f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#27171d',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: '#5a3f49',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButtonsRow: {
    width: '100%',
    gap: 10,
    marginTop: 24,
  },
  quickSaleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b3006c',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  quickSaleSwitchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#b3006c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#27171d',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemsList: {
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    color: '#27171d',
    fontSize: 13,
    fontWeight: '700',
  },
  itemUnitPriceText: {
    color: '#8e6e79',
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: '#27171d',
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
  },
  totalLabel: {
    color: '#27171d',
    fontSize: 14,
    fontWeight: '800',
  },
  totalAmount: {
    color: '#b3006c',
    fontSize: 24,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#5a3f49',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  methodsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    gap: 6,
  },
  activeMethodBtn: {
    backgroundColor: '#b3006c',
    borderColor: 'transparent',
  },
  methodText: {
    color: '#ab286c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeMethodText: {
    color: '#ffffff',
  },
  cashSection: {
    backgroundColor: '#fff0f3',
    borderRadius: 12,
    borderColor: '#ffe0ea',
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  cashSummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  cashSumBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  cashSumLabel: {
    color: '#5a3f49',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  cashSumValue: {
    color: '#27171d',
    fontSize: 18,
    fontWeight: '800',
  },
  quickCashContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quickCashBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  quickCashText: {
    color: '#ab286c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exactCashBtn: {
    backgroundColor: '#ffd9e5',
    borderColor: 'transparent',
  },
  exactCashText: {
    color: '#b3006c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  keypad: {
    gap: 6,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 6,
  },
  keyBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: '#27171d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearKeyBtn: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: '#ffe0ea',
  },
  clearKeyText: {
    color: '#ba1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderColor: '#ffe0ea',
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardInfoText: {
    color: '#27171d',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardInfoSubText: {
    color: '#5a3f49',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  processBtn: {
    backgroundColor: '#b3006c',
    borderRadius: 20,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processBtnIcon: {
    marginRight: 8,
  },
  processBtnDisabled: {
    backgroundColor: '#8e6e79',
    opacity: 0.6,
  },
  processBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  itemInfo: {
    flex: 1,
  },
  cashSumValueSufficient: {
    color: '#10B981',
  },
  cashSumValueInsufficient: {
    color: '#8e6e79',
  },
  ticketConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  ticketConfigInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketConfigLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#27171d',
  },
  ticketConfigToggle: {
    backgroundColor: '#ffffff',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ticketConfigToggleActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  ticketConfigToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5a3f49',
  },
  ticketConfigToggleTextActive: {
    color: '#ffffff',
  },
  emptyScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5a3f49',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  activeTablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  tableCardSelectable: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffd9e5',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  tableCardBillRequested: {
    borderColor: '#b3006c',
    backgroundColor: '#fff5f8',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableCardNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#27171d',
  },
  billReqBadge: {
    backgroundColor: '#b3006c',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  billReqBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  busyBadge: {
    backgroundColor: '#ffd9e5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  busyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b3006c',
  },
  tableCardTotal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#b3006c',
    marginBottom: 2,
  },
  tableCardSubtext: {
    fontSize: 11,
    color: '#8e6e79',
    marginBottom: 10,
  },
  chargeActionBtn: {
    backgroundColor: '#b3006c',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chargeActionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
