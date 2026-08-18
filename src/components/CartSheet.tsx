// src/components/CartSheet.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { ChevronUp, Trash2, Printer, Receipt, Tag } from 'lucide-react-native';
import { printTicketTCP } from '../services/printerService';
import { QuantityModal } from './QuantityModal';
import { CartItem } from '../store/useCartStore';

export const CartSheet: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const cart = useCartStore(state => state.cart);
  const tableNumber = useCartStore(state => state.tableNumber);
  const clearCart = useCartStore(state => state.clearCart);
  const removeItem = useCartStore(state => state.removeItem);
  const addItem = useCartStore(state => state.addItem);
  const setQuantity = useCartStore(state => state.setQuantity);
  const updateItemNotes = useCartStore(state => state.updateItemNotes);
  const getTotal = useCartStore(state => state.getTotal);
  const getItemCount = useCartStore(state => state.getItemCount);
  const setActiveTab = useCartStore(state => state.setActiveTab);
  const appMode = useCartStore(state => state.appMode);
  const includePricesInTicket = useCartStore(state => state.includePricesInTicket);
  const setIncludePricesInTicket = useCartStore(state => state.setIncludePricesInTicket);
  const showCustomAlert = useCartStore(state => state.showCustomAlert);

  const items = Object.values(cart);
  const itemCount = getItemCount();

  // El total es la suma directa de los platillos consumidos
  const total = getTotal();

  const handlePrint = async () => {
    if (itemCount === 0) {
      showCustomAlert({
        type: 'info',
        title: 'Orden Vacía',
        message: 'Agrega al menos un platillo a la comanda antes de imprimir.',
      });
      return;
    }

    setIsPrinting(true);
    try {
      // Imprimir según la configuración de precios del ticket
      await printTicketTCP(tableNumber, items, total, {
        showPrices: includePricesInTicket,
      });

      showCustomAlert({
        type: 'printer',
        title: '¡Ticket Impreso con Éxito!',
        message: includePricesInTicket
          ? `El ticket de la Mesa ${tableNumber || 'S/N'} con desglose de precios ($${total.toFixed(2)}) se ha enviado a la impresora.`
          : `La comanda de cocina para la Mesa ${tableNumber || 'S/N'} (sin precios) se ha impreso correctamente.`,
        confirmText: 'Aceptar',
        onConfirm: () => {
          clearCart();
          setIsExpanded(false);
        },
      });
    } catch (error: any) {
      showCustomAlert({
        type: 'error',
        title: 'Error de Impresora',
        message:
          error.message ||
          'No se pudo conectar con la impresora térmica (192.168.100.200).',
        confirmText: 'Entendido',
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
              <Text style={styles.collapsedCountText}>Total ({itemCount} artículos)</Text>
              <Text style={styles.collapsedTotalText}>${total.toFixed(2)}</Text>
            </View>
            <ChevronUp size={20} color="#ab286c" style={styles.upArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.printBtn, isPrinting && styles.printBtnDisabled]}
            onPress={handlePrint}
            disabled={isPrinting}
            activeOpacity={0.8}
          >
            <Text style={styles.printBtnText}>IMPRIMIR</Text>
            <Printer size={16} color="#FFF" style={styles.printIcon} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal / Sheet Expandido completo */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="slide"
        onRequestClose={() => setIsExpanded(false)}
      >
        {/* Backdrop overlay */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsExpanded(false)}
        >
          <View style={styles.sheetWrapper}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.sheetContainer}
              onPress={(e) => e.stopPropagation()} // Evita cerrar al tocar contenido
            >
              {/* Manija de arrastre / Drag handle */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Detalles de Orden</Text>
                  <View style={styles.tableBadge}>
                    <Text style={styles.tableBadgeText}>
                      {tableNumber ? `MESA ${tableNumber.toUpperCase()}` : 'SIN MESA'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Lista de productos scrollable */}
              <ScrollView style={styles.itemList} contentContainerStyle={styles.itemListContent} nestedScrollEnabled>
                {items.map((item) => {
                  const { product, quantity, notes } = item;
                  return (
                    <View key={product.id} style={styles.itemRow}>
                      <TouchableOpacity
                        style={styles.itemInfo}
                        onPress={() => setEditingItem(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.itemName}>{product.name}</Text>
                        <Text style={styles.itemUnitText}>
                          ${product.price.toFixed(2)} c/u {notes ? `• 📝 ${notes}` : ''}
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

              {/* Resumen de totales y acciones finales */}
              <View style={styles.footerContainer}>
                {/* Selector / Indicador de Ticket con o sin Precios */}
                <View style={styles.ticketConfigRow}>
                  <View style={styles.ticketConfigInfo}>
                    <Tag size={14} color="#b3006c" />
                    <Text style={styles.ticketConfigLabel}>
                      Ticket: {includePricesInTicket ? 'Con Precios' : 'Sin Precios (Comanda)'}
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
                      {includePricesInTicket ? 'Precios: SÍ' : 'Precios: NO'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>

                {/* Acciones principales */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={clearCart}
                  >
                    <Trash2 size={18} color="#ba1a1a" />
                    <Text style={styles.clearBtnText}>Vaciar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.checkoutBtn, isPrinting && styles.printBtnDisabled]}
                    onPress={handleGoToPayment}
                    disabled={isPrinting}
                  >
                    <Receipt size={18} color="#FFF" style={styles.btnIconMargin} />
                    <Text style={styles.checkoutBtnText}>COBRAR CUENTA</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.kitchenPrintBtn, isPrinting && styles.printBtnDisabled]}
                  onPress={handlePrint}
                  disabled={isPrinting}
                >
                  <Printer size={18} color="#FFF" style={styles.btnIconMargin} />
                  <Text style={styles.kitchenPrintBtnText}>
                    {isPrinting
                      ? 'ENVIANDO A IMPRESORA...'
                      : includePricesInTicket
                      ? 'IMPRIMIR TICKET CON PRECIOS'
                      : 'IMPRIMIR COMANDA (SIN PRECIOS)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de edición rápida de cantidad desde el Carrito */}
      {editingItem && (
        <QuantityModal
          visible={!!editingItem}
          product={editingItem.product}
          currentQuantity={editingItem.quantity}
          currentNotes={editingItem.notes}
          onClose={() => setEditingItem(null)}
          onConfirm={(newQty, newNotes) => {
            setQuantity(editingItem.product, newQty, newNotes);
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
    bottom: 72, // Justo sobre la barra de navegación inferior
    left: 0,
    right: 0,
    backgroundColor: '#ffffff', // surface-container-lowest
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  collapsedCountText: {
    color: '#5a3f49',
    fontSize: 11,
    fontWeight: '600',
  },
  collapsedTotalText: {
    color: '#27171d',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  upArrow: {
    marginLeft: 16,
  },
  printBtn: {
    backgroundColor: '#b3006c', // primary magenta
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 6,
  },
  printBtnDisabled: {
    backgroundColor: '#8e6e79',
  },
  printIcon: {
    marginLeft: 2,
  },
  printBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(39, 27, 32, 0.4)', // backdrop-blur overlay
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
    maxHeight: '85%',
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
    marginBottom: 10,
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
    maxHeight: 280,
  },
  itemListContent: {
    padding: 16,
  },
  itemRow: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: '#27171d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemUnitText: {
    color: '#ab286c',
    fontSize: 11,
    marginTop: 2,
  },
  notesInput: {
    color: '#5a3f49',
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    padding: 2,
    marginTop: 6,
  },
  rightControls: {
    alignItems: 'flex-end',
    gap: 8,
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
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    color: '#5a3f49',
    fontSize: 13,
  },
  summaryValue: {
    color: '#27171d',
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
  },
  totalLabel: {
    color: '#27171d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#b3006c',
    fontSize: 22,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#ba1a1a',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: '#ab286c', // Secondary color
    borderRadius: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kitchenPrintBtn: {
    backgroundColor: '#b3006c', // Primary color
    borderRadius: 20,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  kitchenPrintBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnIconMargin: {
    marginRight: 6,
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
    marginBottom: 8,
  },
  ticketConfigInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketConfigLabel: {
    fontSize: 12,
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
});
