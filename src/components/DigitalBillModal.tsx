// src/components/DigitalBillModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CartItem } from '../store/useCartStore';
import { SUPABASE_CONFIG } from '../config/supabaseConfig';
import { Smartphone, BellRing, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  tableNumber: string;
  items: CartItem[];
  total: number;
  onClose: () => void;
  onRequestBill: () => void;
}

export const DigitalBillModal: React.FC<Props> = ({
  visible,
  tableNumber,
  items,
  total,
  onClose,
  onRequestBill,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Superior */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Smartphone size={18} color="#b3006c" />
              <Text style={styles.headerTitle}>Pre-Cuenta Digital en Mesa</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#5a3f49" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subHint}>
            Muestra esta pantalla al comensal para confirmar su consumo sin gastar papel.
          </Text>

          {/* Ticket Digital Simulado */}
          <View style={styles.ticketPaper}>
            <View style={styles.ticketHeader}>
              <Text style={styles.restaurantName}>{(SUPABASE_CONFIG.restaurantName || 'TICKET APP POS').toUpperCase()}</Text>
              <Text style={styles.tableBadge}>MESA {tableNumber.toUpperCase()}</Text>
              <Text style={styles.ticketDate}>{new Date().toLocaleTimeString()}</Text>
            </View>

            <View style={styles.divider} />

            {/* Desglose de Artículos */}
            <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const subtotal = (item.product.price * item.quantity).toFixed(2);
                return (
                  <View key={item.product.id} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemQty}>{item.quantity}x</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>${subtotal}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.divider} />




            {/* Total Destacado */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.requestBillBtn}
              onPress={() => {
                onClose();
                onRequestBill();
              }}
              activeOpacity={0.8}
            >
              <BellRing size={16} color="#ffffff" />
              <Text style={styles.requestBillBtnText}>SOLICITAR COBRO A CAJA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b3006c',
  },
  closeBtn: {
    padding: 4,
  },
  subHint: {
    fontSize: 11.5,
    color: '#8e6e79',
    marginBottom: 12,
  },
  ticketPaper: {
    backgroundColor: '#fffbfa',
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  ticketHeader: {
    alignItems: 'center',
    gap: 3,
  },
  restaurantName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#b3006c',
    letterSpacing: 0.5,
  },
  tableBadge: {
    fontSize: 16,
    fontWeight: '900',
    color: '#27171d',
    marginTop: 2,
  },
  ticketDate: {
    fontSize: 10.5,
    color: '#8e6e79',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffe0ea',
    marginVertical: 10,
  },
  itemsScroll: {
    maxHeight: 220,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b3006c',
    width: 24,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#27171d',
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#27171d',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#27171d',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#b3006c',
  },
  actionsRow: {
    gap: 8,
  },
  requestBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b3006c',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  requestBillBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
