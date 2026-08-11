// src/components/CartSheet.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { ChevronUp, ChevronDown, Trash2, Printer } from 'lucide-react-native';
import { printTicketTCP } from '../services/printerService';

export const CartSheet: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const cart = useCartStore(state => state.cart);
  const tableNumber = useCartStore(state => state.tableNumber);
  const clearCart = useCartStore(state => state.clearCart);
  const removeItem = useCartStore(state => state.removeItem);
  const addItem = useCartStore(state => state.addItem);
  const getTotal = useCartStore(state => state.getTotal);
  const getItemCount = useCartStore(state => state.getItemCount);

  const items = Object.values(cart);
  const itemCount = getItemCount();
  const total = getTotal();

  const handlePrint = async () => {
    if (itemCount === 0) {
      Alert.alert('Orden vacía', 'Agrega al menos un platillo a la comanda.');
      return;
    }

    setIsPrinting(true);
    try {
      await printTicketTCP(tableNumber, items, total);
      Alert.alert('¡Éxito!', 'Ticket enviado a la impresora.');
      clearCart();
      setIsExpanded(false);
    } catch (error: any) {
      Alert.alert(
        'Error de Impresión',
        error.message ||
          'No se pudo conectar con la impresora (192.168.100.200).',
      );
    } finally {
      setIsPrinting(false);
    }
  };

  if (itemCount === 0) return null;

  return (
    <View style={styles.container}>
      {/* Detalle Desplegable del Ticket */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedHeader}>
            <Text style={styles.expandedTitle}>
              Resumen {tableNumber ? `(Mesa ${tableNumber})` : ''}
            </Text>
            <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.itemList} nestedScrollEnabled>
            {items.map(({ product, quantity }) => (
              <View key={product.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.itemSubtotal}>
                    ${(product.price * quantity).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => removeItem(product.id)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => addItem(product)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Barra Inferior Persistente */}
      <View style={styles.bar}>
        <TouchableOpacity
          style={styles.infoArea}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{itemCount}</Text>
          </View>
          <View>
            <Text style={styles.totalText}>Total: ${total.toFixed(2)}</Text>
            <Text style={styles.subText}>
              {isExpanded ? 'Toca para colapsar' : 'Toca para ver detalle'}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronDown size={20} color="#94A3B8" />
          ) : (
            <ChevronUp size={20} color="#94A3B8" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.printBtn, isPrinting && styles.printBtnDisabled]}
          onPress={handlePrint}
          disabled={isPrinting}
          activeOpacity={0.8}
        >
          <Printer size={18} color="#FFF" style={styles.printIcon} />
          <Text style={styles.printBtnText}>
            {isPrinting ? 'ENVIANDO...' : 'IMPRIMIR'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#131B2E',
    borderTopWidth: 1,
    borderTopColor: '#3C4A42',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  expandedContent: {
    maxHeight: 250,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4A42',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expandedTitle: {
    color: '#DAE2FD',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  itemList: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4A42',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#DAE2FD',
    fontSize: 14,
    fontWeight: '500',
  },
  itemSubtotal: {
    color: '#4EDEA3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    backgroundColor: '#2D3449',
    borderRadius: 6,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qtyText: {
    color: '#DAE2FD',
    fontWeight: 'bold',
    fontSize: 14,
    minWidth: 20,
    textAlign: 'center',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badgeCount: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subText: {
    color: '#64748B',
    fontSize: 11,
  },
  printBtn: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  printBtnDisabled: {
    backgroundColor: '#64748B',
  },
  printIcon: {
    marginRight: 6,
  },
  printBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
