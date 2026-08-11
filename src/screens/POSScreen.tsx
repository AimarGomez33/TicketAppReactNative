// src/screens/POSScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { HeaderBar } from '../components/HeaderBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductCard } from '../components/ProductCard';
import { CartSheet } from '../components/CartSheet';
import { MOCK_PRODUCTS } from '../data/mockupMenu';
import { Product } from '../store/useCartStore';

export const POSScreen: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('top');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtrado reactivo instantáneo por categoría y live search
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product: Product) => {
      // Si hay texto de búsqueda, ignora la categoría y busca globalmente
      if (searchQuery.trim().length > 0) {
        return product.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
      }

      // Filtro por categoría seleccionada
      if (selectedCategoryId === 'top') {
        // En "Top Selling" mostramos los platillos más populares (o primeros de la lista)
        return ['1', '3', '5', '7', '11', '14'].includes(product.id);
      }

      return product.category === selectedCategoryId;
    });
  }, [selectedCategoryId, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

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
                No se encontraron platillos coincidentes.
              </Text>
            </View>
          }
        />
      </View>

      {/* Ticket / Carrito Flotante Persistente */}
      <CartSheet />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  listPadding: {
    paddingBottom: 100, // Espacio para no tapar productos con el CartSheet flotante
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});
