// src/screens/PaymentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCartStore } from '../store/useCartStore';
import {
  CreditCard,
  Banknote,
  Send,
  Printer,
  ChevronLeft,
  XCircle,
} from 'lucide-react-native';
import { printTicketTCP } from '../services/printerService';

type PaymentMethod = 'cash' | 'card' | 'transfer';

export function PaymentScreen() {
  const tableNumber = useCartStore(state => state.tableNumber);
  const cart = useCartStore(state => state.cart);
  
  // Zustand actions
  const getTotal = useCartStore(state => state.getTotal);
  const completePayment = useCartStore(state => state.completePayment);
  const setActiveTab = useCartStore(state => state.setActiveTab);

  // Local state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedCashStr, setReceivedCashStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // En el nuevo flujo de cobro, calculamos IVA 16% sobre el consumo base
  const subtotal = getTotal();
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const items = Object.values(cart);

  // Si cambiamos el método de pago a tarjeta o transferencia, autocompletamos con el total exacto
  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setReceivedCashStr(total.toFixed(2));
    } else {
      setReceivedCashStr('');
    }
  }, [paymentMethod, total]);

  if (!tableNumber || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <XCircle size={48} color="#ba1a1a" />
        <Text style={styles.emptyTitle}>Sin Mesa Seleccionada</Text>
        <Text style={styles.emptyText}>
          No hay una cuenta activa para cobrar. Selecciona una mesa ocupada desde la vista de mesas.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveTab('tables')}
        >
          <Text style={styles.backButtonText}>IR A MESAS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const receivedCash = parseFloat(receivedCashStr) || 0;
  const change = Math.max(0, receivedCash - total);
  const isAmountSufficient = receivedCash >= total;

  const handleKeyPress = (val: string) => {
    if (paymentMethod !== 'cash') return;

    if (val === 'C') {
      setReceivedCashStr('');
    } else if (val === '.') {
      if (!receivedCashStr.includes('.')) {
        setReceivedCashStr(prev => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      const parts = receivedCashStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setReceivedCashStr(prev => prev + val);
    }
  };

  const handleQuickCash = (amount: number) => {
    if (paymentMethod !== 'cash') return;
    setReceivedCashStr(amount.toString());
  };

  const handleExactCash = () => {
    if (paymentMethod !== 'cash') return;
    setReceivedCashStr(total.toFixed(2));
  };

  const handleProcessPayment = async () => {
    if (paymentMethod === 'cash' && !isAmountSufficient) {
      Alert.alert(
        'Monto insuficiente',
        `El dinero recibido ($${receivedCash.toFixed(2)}) es menor que el total ($${total.toFixed(2)}).`
      );
      return;
    }

    setIsProcessing(true);
    try {
      await printTicketTCP(tableNumber, items, total);
      completePayment(paymentMethod, receivedCash, change);
      Alert.alert('Pago Exitoso', 'La cuenta ha sido cerrada y el ticket impreso.');
      setActiveTab('tables');
    } catch (error: any) {
      Alert.alert(
        'Pago procesado con error de impresión',
        `La cuenta se cerrará localmente, pero no se pudo imprimir el ticket: ${error.message || 'Error de impresora'}.`,
        [
          {
            text: 'Cerrar Cuenta sin Imprimir',
            onPress: () => {
              completePayment(paymentMethod, receivedCash, change);
              setActiveTab('tables');
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón Volver */}
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
        {/* Resumen de la Orden */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de Cuenta</Text>
          <View style={styles.itemsList}>
            {items.map(({ product, quantity, notes }) => (
              <View key={product.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>
                    {quantity}x {product.name}
                  </Text>
                  {notes ? (
                    <Text style={styles.itemNotes}>* {notes}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>
                  ${(product.price * quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>IVA (16%)</Text>
            <Text style={styles.subtotalValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL A COBRAR</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
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

        {/* Detalle del Cobro */}
        {paymentMethod === 'cash' ? (
          <View style={styles.cashSection}>
            <View style={styles.cashSummaryRow}>
              <View style={styles.cashSumBox}>
                <Text style={styles.cashSumLabel}>Efectivo Recibido</Text>
                <Text style={styles.cashSumValue}>
                  ${receivedCash > 0 ? receivedCash.toFixed(2) : '0.00'}
                </Text>
              </View>
              <View style={styles.cashSumBox}>
                <Text style={styles.cashSumLabel}>Cambio</Text>
                <Text
                  style={[
                    styles.cashSumValue,
                    { color: isAmountSufficient ? '#10B981' : '#8e6e79' },
                  ]}
                >
                  ${change.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Atajos de Efectivo */}
            <View style={styles.quickCashContainer}>
              {[50, 100, 200, 500].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickCashBtn}
                  onPress={() => handleQuickCash(amt)}
                >
                  <Text style={styles.quickCashText}>${amt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickCashBtn, styles.exactCashBtn]}
                onPress={handleExactCash}
              >
                <Text style={styles.exactCashText}>Exacto</Text>
              </TouchableOpacity>
            </View>

            {/* Teclado Numérico */}
            <View style={styles.keypad}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map(k => (
                  <TouchableOpacity
                    key={k}
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress(k)}
                  >
                    <Text style={styles.keyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['4', '5', '6'].map(k => (
                  <TouchableOpacity
                    key={k}
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress(k)}
                  >
                    <Text style={styles.keyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['7', '8', '9'].map(k => (
                  <TouchableOpacity
                    key={k}
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress(k)}
                  >
                    <Text style={styles.keyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => handleKeyPress('.')}
                >
                  <Text style={styles.keyText}>.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => handleKeyPress('0')}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.keyBtn, styles.clearKeyBtn]}
                  onPress={() => handleKeyPress('C')}
                >
                  <Text style={styles.clearKeyText}>C</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cardInfoContainer}>
            <Text style={styles.cardInfoText}>
              Pago por {paymentMethod === 'card' ? 'Terminal de Tarjeta' : 'Transferencia Electrónica'}.
            </Text>
            <Text style={styles.cardInfoSubText}>
              Verifica que el monto de ${total.toFixed(2)} haya sido aprobado antes de finalizar.
            </Text>
          </View>
        )}

        {/* Botón de Procesar Pago */}
        <TouchableOpacity
          style={[
            styles.processBtn,
            (!isAmountSufficient && paymentMethod === 'cash') && styles.processBtnDisabled,
            isProcessing && styles.processBtnDisabled,
          ]}
          onPress={handleProcessPayment}
          disabled={(!isAmountSufficient && paymentMethod === 'cash') || isProcessing}
        >
          <Printer size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.processBtnText}>
            {isProcessing ? 'PROCESANDO...' : 'CERRAR Y ENVIAR TICKET'}
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
  backButton: {
    backgroundColor: '#b3006c',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 24,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
    color: '#5a3f49',
    fontSize: 13,
  },
  itemNotes: {
    color: '#EAB308',
    fontSize: 11,
    marginLeft: 8,
    marginTop: 2,
  },
  itemPrice: {
    color: '#27171d',
    fontSize: 13,
    fontWeight: '500',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  subtotalLabel: {
    color: '#5a3f49',
    fontSize: 12,
  },
  subtotalValue: {
    color: '#27171d',
    fontSize: 12,
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
  processBtnDisabled: {
    backgroundColor: '#8e6e79',
    opacity: 0.6,
  },
  processBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
