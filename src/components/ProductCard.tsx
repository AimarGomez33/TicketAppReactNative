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
        <View>
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

        {/* Accesos rápidos específicos para Chalupas en la misma tarjeta */}
        {isChalupa && (
          <View style={styles.quickChalupaRow}>
            <Text style={styles.quickChalupaLabel}>CANTIDAD RÁPIDA:</Text>
            <View style={styles.quickButtonsContainer}>
              {[10, 20, 30, 50].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickChalupaBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    addQuantity(product, amt);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickChalupaBtnText}>+{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
                  <Minus size={14} color="#5a3f49" />
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
                  <Plus size={14} color="#5a3f49" />
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
                <Plus size={16} color="#b3006c" />
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
    margin: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 120,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  productName: {
    flex: 1,
    color: '#27171d',
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 11,
    marginTop: 3,
    lineHeight: 14,
  },
  notesText: {
    color: '#b3006c',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
  },
  quickChalupaRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
  },
  quickChalupaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b3006c',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  quickChalupaBtn: {
    flex: 1,
    backgroundColor: '#ffd9e5',
    borderColor: '#b3006c',
    borderWidth: 0.8,
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChalupaBtnText: {
    color: '#b3006c',
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    color: '#ab286c',
    fontSize: 13,
    fontWeight: '700',
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  layersBtn: {
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: '#ffd9e5',
    width: 32,
    height: 32,
    borderRadius: 16,
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
    height: 32,
    paddingHorizontal: 2,
  },
  qtyBtn: {
    width: 26,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#27171d',
    fontWeight: 'bold',
    fontSize: 12,
    width: 22,
    textAlign: 'center',
  },
});
