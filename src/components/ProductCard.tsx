// src/components/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product, useCartStore } from '../store/useCartStore';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  const cartItem = useCartStore(state => state.cart[product.id]);

  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <TouchableOpacity
      style={[styles.card, quantity > 0 && styles.activeCard]}
      onPress={() => addItem(product)}
      activeOpacity={0.7}
    >
      {quantity > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{quantity}</Text>
        </View>
      )}

      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>

        {quantity > 0 ? (
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.btnSmall}
              onPress={e => {
                e.stopPropagation();
                removeItem(product.id);
              }}
            >
              <Text style={styles.btnSmallText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSmall}
              onPress={e => {
                e.stopPropagation();
                addItem(product);
              }}
            >
              <Text style={styles.btnSmallText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plusIcon}>
            <Text style={styles.plusText}>+</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 14,
    backgroundColor: '#171F33',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3C4A42',
    justifyContent: 'space-between',
    minHeight: 110,
    position: 'relative',
  },
  activeCard: {
    borderColor: '#4EDEA3',
    backgroundColor: '#131B2E',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  productName: {
    color: '#DAE2FD',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    color: '#4EDEA3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  plusIcon: {
    backgroundColor: '#2D3449',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
  btnSmall: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSmallText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
