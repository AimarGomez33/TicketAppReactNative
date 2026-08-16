// src/components/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product, useCartStore } from '../store/useCartStore';
import { Plus, Minus } from 'lucide-react-native';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  const cartItem = useCartStore(state => state.cart[product.id]);

  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <View
      style={[
        styles.card,
        quantity > 0 ? styles.activeCard : styles.inactiveCard,
      ]}
    >
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>

        {quantity > 0 ? (
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => removeItem(product.id)}
              activeOpacity={0.7}
            >
              <Minus size={14} color="#5a3f49" />
            </TouchableOpacity>
            
            <Text style={styles.qtyText}>{quantity}</Text>
            
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => addItem(product)}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#5a3f49" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addItem(product)}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#b3006c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  inactiveCard: {
    backgroundColor: '#ffffff', // surface-container-lowest
    borderColor: '#ffe0ea',
  },
  activeCard: {
    backgroundColor: 'rgba(179, 0, 108, 0.04)', // 4% opacidad del rosa primario
    borderColor: '#b3006c', // Borde rosa primario
  },
  productName: {
    color: '#27171d', // on-surface
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    color: '#ab286c', // secondary color
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#ffd9e5', // primary-container
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
    backgroundColor: '#fff0f3', // surface-container-low
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 20,
    height: 32,
    paddingHorizontal: 2,
  },
  qtyBtn: {
    width: 28,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#27171d',
    fontWeight: 'bold',
    fontSize: 12,
    width: 20,
    textAlign: 'center',
  },
});
