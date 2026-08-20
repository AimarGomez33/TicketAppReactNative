// src/components/ProductCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product, useCartStore } from '../store/useCartStore';
import { Plus, Minus, Layers } from 'lucide-react-native';
import { QuantityModal } from './QuantityModal';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const addItem = useCartStore(state => state.addItem);
  const addQuantity = useCartStore(state => state.addQuantity);
  const setQuantity = useCartStore(state => state.setQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const cartItem = useCartStore(state => state.cart[product.id]);

  const quantity = cartItem ? cartItem.quantity : 0;
  const notes = cartItem?.notes;

  const isChalupa = product.id === 'ant-chalupa' || product.id === 'gen-chalupa';

  const handleModalConfirm = (newQty: number, newNotes: string) => {
    setQuantity(product, newQty, newNotes);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          quantity > 0 ? styles.activeCard : styles.inactiveCard,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.contentArea}>
          <View style={styles.titleRow}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            {quantity > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{quantity}</Text>
              </View>
            )}
          </View>

          {product.description ? (
            <Text style={styles.productDesc} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}

          {notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              📝 {notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>

          <View style={styles.actionControls}>
            {/* Botón selector detallado / modal */}
            <TouchableOpacity
              style={styles.layersBtn}
              onPress={(e) => {
                e.stopPropagation();
                setModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Layers size={14} color="#b3006c" />
            </TouchableOpacity>

            {quantity > 0 ? (
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    removeItem(product.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Minus size={13} color="#5a3f49" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.qtyText}>{quantity}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    addItem(product);
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={13} color="#5a3f49" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  addItem(product);
                }}
                activeOpacity={0.7}
              >
                <Plus size={15} color="#b3006c" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal de Cantidad Rápida y Personalizada */}
      <QuantityModal
        visible={modalVisible}
        product={product}
        currentQuantity={quantity}
        currentNotes={notes}
        onClose={() => setModalVisible(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 125,
    justifyContent: 'space-between',
  },
  inactiveCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
  },
  activeCard: {
    backgroundColor: 'rgba(179, 0, 108, 0.04)',
    borderColor: '#b3006c',
  },
  contentArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  productName: {
    flex: 1,
    color: '#27171d',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  badge: {
    backgroundColor: '#b3006c',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  productDesc: {
    color: '#8e6e79',
    fontSize: 10.5,
    marginTop: 3,
    lineHeight: 13,
  },
  notesText: {
    color: '#b3006c',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 4,
  },
  price: {
    color: '#ab286c',
    fontSize: 13,
    fontWeight: '800',
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  layersBtn: {
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: '#ffd9e5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 20,
    height: 30,
    paddingHorizontal: 2,
  },
  qtyBtn: {
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#27171d',
    fontWeight: 'bold',
    fontSize: 11,
    width: 18,
    textAlign: 'center',
  },
});
