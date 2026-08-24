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
import { getProductsByMode } from '../data/mockupMenu';
import { Product, useCartStore } from '../store/useCartStore';

export const POSScreen: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('top');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const appMode = useCartStore(state => state.appMode);
  const menuProducts = useCartStore(state => state.menuProducts);

  // Filtrado reactivo instantáneo por categoría, modo de app y live search
  const filteredProducts = useMemo(() => {
    const products = (menuProducts && menuProducts.length > 0)
      ? menuProducts
      : getProductsByMode(appMode);

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
      if (selectedCategoryId === 'top') {
        if (appMode === 'general') {
          return [
            'gen-chalupa',
            'gen-quesadilla',
            'gen-tostada',
            'gen-pambazo-adob',
            'gen-guajolota',
            'gen-guajoloyet-adob',
            'gen-pozole-grande',
            'gen-taco',
            'gen-burg-especial',
            'gen-alitas-6',
            'gen-papas-boneless',
            'gen-refresco',
            'gen-agua-500',
          ].includes(product.id);
        } else {
          return [
            'gen-chalupa',
            'q-bistec',
            'q-tinga',
            'tost-pata',
            'gj-bistec',
            'gen-guajoloyet-adob',
            'gen-pozole-grande',
            'gen-pambazo-adob',
            'gen-burg-especial',
            'tac-arrachera',
            'gen-alitas-6',
            'gen-papas-boneless',
            'gen-refresco',
          ].includes(product.id);
        }
      }

      return product.category === selectedCategoryId;
    });
  }, [appMode, menuProducts, selectedCategoryId, searchQuery]);

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
                No se encontraron platillos coincidentes.
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
    paddingBottom: 100, // Espacio para no tapar productos con el CartSheet flotante
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
