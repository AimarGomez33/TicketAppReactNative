// src/components/HeaderBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { Search, Printer, Wifi, Menu } from 'lucide-react-native';

interface Props {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  isPrinterConnected?: boolean;
}

export const HeaderBar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  isPrinterConnected = true,
}) => {
  const tableNumber = useCartStore(state => state.tableNumber);
  const setTableNumber = useCartStore(state => state.setTableNumber);
  const setActiveTab = useCartStore(state => state.setActiveTab);

  return (
    <View style={styles.container}>
      {/* Fila Superior: Título, Selector de Mesa e Indicadores */}
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setActiveTab('tables')}
          >
            <Menu size={22} color="#5a3f49" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Orden</Text>
        </View>

        <View style={styles.rightSection}>
          {/* Badge de Mesa */}
          <TouchableOpacity 
            style={styles.tableBadge}
            onPress={() => setActiveTab('tables')}
          >
            <Text style={styles.tableBadgeText}>
              {tableNumber ? `MESA ${tableNumber.toUpperCase()}` : 'SIN MESA'}
            </Text>
          </TouchableOpacity>

          <View style={styles.statusIcons}>
            <Wifi size={18} color="#b3006c" />
            <Printer
              size={18}
              color={isPrinterConnected ? '#b3006c' : '#ba1a1a'}
            />
          </View>
        </View>
      </View>

      {/* Fila Inferior: Buscador en Tiempo Real */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#ab286c" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar platillo o bebida..."
          placeholderTextColor="#5a3f49"
          value={searchQuery}
          onChangeText={onSearchChange}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff8f8', // surface/background general
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#ffe8ee',
  },
  headerTitle: {
    color: '#27171d',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tableBadgeText: {
    color: '#27171d',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#27171d',
    fontSize: 13,
    padding: 0,
    fontWeight: '500',
  },
});
