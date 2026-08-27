// src/screens/POSScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
} from 'react-native';
import { HeaderBar } from '../components/HeaderBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductCard } from '../components/ProductCard';
import { CartSheet } from '../components/CartSheet';
import { Product, useCartStore } from '../store/useCartStore';

export const POSScreen: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const menuProducts = useCartStore(state => state.menuProducts);

  // Filtrado reactivo instantáneo por categoría, modo de app y live search
  const filteredProducts = useMemo(() => {
    const products = menuProducts;

    return products.filter((product: Product) => {
      // Si hay texto de búsqueda, busca en nombre y descripción
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        return (
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query))
        );
      }

      // Filtro por categoría seleccionada
      return !selectedCategoryId || product.category === selectedCategoryId;
    });
  }, [menuProducts, selectedCategoryId, searchQuery]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff8f8" />

      {/* Header Fijo */}
      <HeaderBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isPrinterConnected={true}
      />

      {/* Chips de Categorías Fijos (Solo se ven si no hay búsqueda activa) */}
      {searchQuery.trim().length === 0 && (
        <CategoryTabs
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      )}

      {/* Grilla de Productos */}
      <View style={styles.gridContainer}>
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay platillos disponibles. Verifica la conexión y el catálogo en Supabase.
              </Text>
            </View>
          }
        />
      </View>

      {/* Ticket / Carrito Flotante Persistente */}
      <CartSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  listPadding: {
    paddingBottom: 160, // Espacio amplio para que nunca se tape la última fila con el CartSheet flotante
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#5a3f49',
    fontSize: 14,
    textAlign: 'center',
  },
});
