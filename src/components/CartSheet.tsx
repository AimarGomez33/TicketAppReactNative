// src/components/CartSheet.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { getOrderDisplayLabel, isTakeawayReference, useCartStore } from '../store/useCartStore';
import {
  ChevronUp,
  Trash2,
  Receipt,
  Tag,
  Send,
  CheckCircle2,
  Clock,
  BellRing,
  Printer,
} from 'lucide-react-native';
import { printTicketTCP } from '../services/printerService';
import { QuantityModal } from './QuantityModal';
import { DigitalBillModal } from './DigitalBillModal';
import { CartItem } from '../store/useCartStore';

export const CartSheet: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [showDigitalBill, setShowDigitalBill] = useState(false);

  const cart = useCartStore(state => state.cart);
  const tableNumber = useCartStore(state => state.tableNumber);
  const clearCart = useCartStore(state => state.clearCart);
  const removeItem = useCartStore(state => state.removeItem);
  const addItem = useCartStore(state => state.addItem);
  const setQuantity = useCartStore(state => state.setQuantity);
  const getTotal = useCartStore(state => state.getTotal);
  const getItemCount = useCartStore(state => state.getItemCount);
  const getPendingItemsCount = useCartStore(state => state.getPendingItemsCount);
  const getCurrentTableRound = useCartStore(state => state.getCurrentTableRound);
  const sendRoundToKitchen = useCartStore(state => state.sendRoundToKitchen);
  const requestBillForTable = useCartStore(state => state.requestBillForTable);
  const setActiveTab = useCartStore(state => state.setActiveTab);
  const appMode = useCartStore(state => state.appMode);
  const includePricesInTicket = useCartStore(state => state.includePricesInTicket);
  const setIncludePricesInTicket = useCartStore(state => state.setIncludePricesInTicket);
  const showCustomAlert = useCartStore(state => state.showCustomAlert);

  const items = Object.values(cart);
  const itemCount = getItemCount();
  const pendingCount = getPendingItemsCount();
  const currentRound = getCurrentTableRound();
  const total = getTotal();

  // Enviar comanda a cocina e imprimir (Instantáneo + Background Printer)
  const handleSendToKitchen = async () => {
    if (itemCount === 0) {
      showCustomAlert({
        type: 'info',
        title: 'Orden Vacía',
        message: 'Agrega al menos un platillo a la comanda antes de enviar a cocina.',
      });
      return;
    }

    // 1. Actualización de estado local instantánea (0ms)
    const roundToPrint = currentRound;
    const itemsSnapshot = [...items];
    const totalSnapshot = total;
    const tableSnapshot = tableNumber;

    const wasSent = await sendRoundToKitchen(tableSnapshot);
    if (!wasSent) return;

    setIsExpanded(false);

    showCustomAlert({
      type: 'success',
      title: `¡Comanda Enviada (Ronda #${roundToPrint})!`,
      message: `Los platillos de ${tableSnapshot ? getOrderDisplayLabel(tableSnapshot) : 'S/N'} se han enviado a cocina.`,
    });

    // 2. Impresión en segundo plano sin congelar la app
    printTicketTCP(tableSnapshot, itemsSnapshot, totalSnapshot, {
      isKitchenComanda: true,
      showPrices: false,
      currentRound: roundToPrint,
    }).catch((err) => {
      console.warn('Aviso de impresora comanda:', err);
    });
  };

  // Mesero solicita la cuenta para que el cajero la cobre (Instantáneo)
  const handleRequestBill = () => {
    if (itemCount === 0) {
      showCustomAlert({
        type: 'info',
        title: 'Pedido Sin Consumo',
        message: 'No puedes solicitar cuenta de un pedido vacío.',
      });
      return;
    }

    const tableSnapshot = tableNumber;
    requestBillForTable(tableSnapshot);
    setIsExpanded(false);

    showCustomAlert({
      type: 'success',
      title: '¡Cuenta Solicitada!',
      message: `Se notificó a Caja en tiempo real para el cobro de ${tableSnapshot ? getOrderDisplayLabel(tableSnapshot) : 'S/N'}.`,
    });
  };

  // Imprimir ticket de cuenta físico directamente para el cliente
  const handlePrintCustomerBill = async () => {
    if (itemCount === 0) return;
    setIsPrinting(true);
    try {
      await printTicketTCP(tableNumber || 'S/N', items, total, {
        showPrices: true,
        isKitchenComanda: false,
      });
      showCustomAlert({
        type: 'printer',
        title: '¡Ticket de Cuenta Impreso!',
        message: `Se imprimió el ticket de consumo con el total ($${total.toFixed(2)}) para entregar al cliente.`,
        confirmText: 'Aceptar',
      });
    } catch (error: any) {
      showCustomAlert({
        type: 'error',
        title: 'Aviso de Impresora',
        message: `No se pudo imprimir el ticket (${error.message || '192.168.100.200'}).`,
        confirmText: 'Aceptar',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleGoToPayment = () => {
    setIsExpanded(false);
    setActiveTab('payment');
  };

  if (itemCount === 0) return null;

  return (
    <>
      {/* Barra Inferior Colapsada */}
      {!isExpanded && (
        <View style={styles.collapsedBar}>
          <TouchableOpacity
            style={styles.infoArea}
            onPress={() => setIsExpanded(true)}
            activeOpacity={0.8}
          >
            <View>
              <View style={styles.collapsedBadgeRow}>
                <Text style={styles.collapsedCountText}>Total ({itemCount} arts.)</Text>
                {pendingCount > 0 && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingCount} por enviar</Text>
                  </View>
                )}
              </View>
              <Text style={styles.collapsedTotalText}>${total.toFixed(2)}</Text>
            </View>
            <ChevronUp size={20} color="#ab286c" style={styles.upArrow} />
          </TouchableOpacity>

          {/* Botón rápido según modo */}
          {appMode === 'detailed' || isTakeawayReference(tableNumber) ? (
            <TouchableOpacity
              style={[styles.actionBtnHeader, pendingCount > 0 ? styles.kitchenBtnActive : styles.kitchenBtnInactive]}
              onPress={handleSendToKitchen}
              disabled={isPrinting}
              activeOpacity={0.8}
            >
              <Send size={15} color="#FFF" />
              <Text style={styles.actionBtnHeaderText}>
                {pendingCount > 0 ? `COCINA (${pendingCount})` : 'A COCINA'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.payBtnHeader}
              onPress={handleGoToPayment}
              activeOpacity={0.8}
            >
              <Receipt size={15} color="#FFF" />
              <Text style={styles.actionBtnHeaderText}>COBRAR</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sheet Expandido Completo */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="slide"
        onRequestClose={() => setIsExpanded(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsExpanded(false)}
        >
          <View style={styles.sheetWrapper}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.sheetContainer}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Encabezado */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>
                      {isTakeawayReference(tableNumber) ? 'Pedido Para Llevar' : 'Comanda de Mesa'}
                    </Text>
                    <Text style={styles.sheetSubtitle}>Ronda Actual: #{currentRound}</Text>
                  </View>
                  <View style={styles.tableBadge}>
                    <Text style={styles.tableBadgeText}>
                      {tableNumber ? getOrderDisplayLabel(tableNumber) : 'SIN MESA'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Lista de Productos Scrollable */}
              <ScrollView style={styles.itemList} contentContainerStyle={styles.itemListContent} nestedScrollEnabled>
                {items.map((item) => {
                  const { product, quantity, notes, status, round } = item;
                  const isPending = status === 'pending';

                  return (
                    <View key={product.id} style={[styles.itemRow, isPending && styles.itemRowPending]}>
                      <TouchableOpacity
                        style={styles.itemInfo}
                        onPress={() => setEditingItem(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.itemTitleRow}>
                          <Text style={styles.itemName}>{product.name}</Text>
                          <View style={[styles.statusTag, isPending ? styles.statusTagPending : styles.statusTagSent]}>
                            {isPending ? (
                              <Clock size={10} color="#b3006c" />
                            ) : (
                              <CheckCircle2 size={10} color="#10B981" />
                            )}
                            <Text style={[styles.statusTagText, isPending ? styles.statusTagTextPending : styles.statusTagTextSent]}>
                              {isPending ? 'Por Enviar' : `En Cocina (R#${round || 1})`}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.itemUnitText}>
                          ${product.price.toFixed(2)} c/u {notes ? `• Nota: ${notes}` : ''}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.rightControls}>
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => removeItem(product.id)}
                          >
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setEditingItem(item)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.qtyText}>{quantity}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => addItem(product)}
                          >
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.itemSubtotalText}>
                          ${(product.price * quantity).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Pie de Acciones */}
              <View style={styles.footerContainer}>
                {/* Selector de Impresión de Precios */}
                <View style={styles.ticketConfigRow}>
                  <View style={styles.ticketConfigInfo}>
                    <Tag size={14} color="#b3006c" />
                    <Text style={styles.ticketConfigLabel}>
                      Impresión: {includePricesInTicket ? 'Ticket Cliente ($)' : 'Comanda Cocina (Sin $)'}
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
                      {includePricesInTicket ? 'Con Precios' : 'Sin Precios'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Total */}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL ACUMULADO</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>

                {/* Botón Principal: Enviar a Cocina */}
                <TouchableOpacity
                  style={[styles.kitchenSendBtn, isPrinting && styles.disabledBtn]}
                  onPress={handleSendToKitchen}
                  disabled={isPrinting}
                  activeOpacity={0.8}
                >
                  <Send size={18} color="#FFF" style={styles.btnIconMargin} />
                  <Text style={styles.kitchenSendBtnText}>
                    {isPrinting
                      ? 'ENVIANDO A COCINA...'
                      : pendingCount > 0
                      ? `ENVIAR A COCINA (${pendingCount} NUEVOS) • RONDA #${currentRound}`
                      : `RE-IMPRIMIR COMANDA COCINA • RONDA #${currentRound}`}
                  </Text>
                </TouchableOpacity>

                {/* Botón Imprimir Ticket de Cuenta para el Cliente */}
                <TouchableOpacity
                  style={styles.digitalBillBtn}
                  onPress={handlePrintCustomerBill}
                  disabled={isPrinting}
                  activeOpacity={0.8}
                >
                  <Printer size={16} color="#b3006c" style={styles.btnIconMargin} />
                  <Text style={styles.digitalBillBtnText}>IMPRIMIR TICKET DE CUENTA (${total.toFixed(2)})</Text>
                </TouchableOpacity>

                {/* Fila de Acciones Secundarias */}
                <View style={styles.secondaryActionsRow}>
                  {/* Botón Vaciar */}
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={clearCart}
                  >
                    <Trash2 size={16} color="#ba1a1a" />
                    <Text style={styles.clearBtnText}>Vaciar</Text>
                  </TouchableOpacity>

                  {/* Botón Solicitar Cuenta (Mesero) */}
                  <TouchableOpacity
                    style={styles.requestBillBtn}
                    onPress={handleRequestBill}
                  >
                    <BellRing size={16} color="#FFF" style={styles.btnIconMargin} />
                    <Text style={styles.requestBillBtnText}>PEDIR CUENTA</Text>
                  </TouchableOpacity>

                  {/* Botón Cobro Directo (Caja) */}
                  <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={handleGoToPayment}
                  >
                    <Receipt size={16} color="#FFF" style={styles.btnIconMargin} />
                    <Text style={styles.checkoutBtnText}>COBRAR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Pre-Cuenta Digital */}
      <DigitalBillModal
        visible={showDigitalBill}
        tableNumber={tableNumber}
        items={items}
        total={total}
        onClose={() => setShowDigitalBill(false)}
        onRequestBill={handleRequestBill}
      />

      {/* Modal de edición de cantidad */}
      {editingItem && (
        <QuantityModal
          visible={!!editingItem}
          product={editingItem.product}
          currentQuantity={editingItem.quantity}
          currentNotes={editingItem.notes}
          onClose={() => setEditingItem(null)}
          onConfirm={(newQty, newNotes, customPrice, customName, selectedModifierOptionIds) => {
            const configuredProduct = customName && customName !== editingItem.product.name
              ? {
                  ...editingItem.product,
                  id: selectedModifierOptionIds?.length
                    ? `${editingItem.product.id.split('--')[0]}--${selectedModifierOptionIds.slice().sort().join('--')}`
                    : editingItem.product.id,
                  menuProductId: editingItem.product.menuProductId || editingItem.product.id.split('--')[0],
                  name: customName,
                  price: customPrice !== undefined ? customPrice : editingItem.product.price,
                  selectedModifierOptionIds,
                  modifierTotal: (customPrice !== undefined ? customPrice : editingItem.product.price)
                    - (editingItem.product.price - (editingItem.product.modifierTotal || 0)),
                }
              : editingItem.product;
            setQuantity(configuredProduct, newQty, newNotes);
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  collapsedBar: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collapsedCountText: {
    color: '#5a3f49',
    fontSize: 11,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#ffd9e5',
    borderColor: '#b3006c',
    borderWidth: 0.8,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pendingBadgeText: {
    color: '#b3006c',
    fontSize: 9,
    fontWeight: '800',
  },
  collapsedTotalText: {
    color: '#27171d',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 1,
  },
  upArrow: {
    marginLeft: 12,
  },
  actionBtnHeader: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
  },
  kitchenBtnActive: {
    backgroundColor: '#b3006c',
  },
  kitchenBtnInactive: {
    backgroundColor: '#ab286c',
  },
  payBtnHeader: {
    backgroundColor: '#b3006c',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    gap: 6,
  },
  actionBtnHeaderText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(39, 27, 32, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#ffe0ea',
    borderRadius: 2,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  sheetTitle: {
    color: '#27171d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sheetSubtitle: {
    color: '#8e6e79',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  tableBadge: {
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tableBadgeText: {
    color: '#27171d',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemList: {
    backgroundColor: '#fff8f8',
    maxHeight: 270,
  },
  itemListContent: {
    padding: 14,
  },
  itemRow: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRowPending: {
    borderColor: '#b3006c',
    backgroundColor: 'rgba(179, 0, 108, 0.03)',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  itemName: {
    color: '#27171d',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusTagPending: {
    backgroundColor: '#ffd9e5',
  },
  statusTagSent: {
    backgroundColor: '#d1fae5',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTagTextPending: {
    color: '#b3006c',
  },
  statusTagTextSent: {
    color: '#059669',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemUnitText: {
    color: '#8e6e79',
    fontSize: 11,
    marginTop: 2,
  },
  rightControls: {
    alignItems: 'flex-end',
    gap: 6,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 16,
    height: 28,
  },
  qtyBtn: {
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    color: '#5a3f49',
    fontWeight: 'bold',
    fontSize: 14,
  },
  qtyText: {
    color: '#27171d',
    fontWeight: 'bold',
    fontSize: 11,
    width: 18,
    textAlign: 'center',
  },
  itemSubtotalText: {
    color: '#27171d',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  totalRow: {
    marginVertical: 8,
  },
  totalLabel: {
    color: '#27171d',
    fontSize: 15,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#b3006c',
    fontSize: 22,
    fontWeight: '900',
  },
  kitchenSendBtn: {
    backgroundColor: '#b3006c',
    borderRadius: 20,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  kitchenSendBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  digitalBillBtn: {
    backgroundColor: '#fff0f5',
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    borderRadius: 20,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  digitalBillBtnText: {
    color: '#b3006c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    justifyContent: 'center',
    height: 40,
  },
  clearBtnText: {
    color: '#ba1a1a',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  requestBillBtn: {
    flex: 1.1,
    backgroundColor: '#ea580c', // Naranja para solicitud de cuenta
    borderRadius: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBillBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: '#ab286c',
    borderRadius: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#8e6e79',
    opacity: 0.6,
  },
  btnIconMargin: {
    marginRight: 5,
  },
  ticketConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
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
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ticketConfigToggleActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  ticketConfigToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5a3f49',
  },
  ticketConfigToggleTextActive: {
    color: '#ffffff',
  },
});
