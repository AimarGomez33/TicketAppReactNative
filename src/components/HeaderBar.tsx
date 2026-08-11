// src/components/HeaderBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { Search, Printer, Wifi } from 'lucide-react-native';

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

  return (
    <View style={styles.container}>
      {/* Fila Superior: Selector de Mesa e Indicadores de Red */}
      <View style={styles.topRow}>
        <View style={styles.tableInputContainer}>
          <Text style={styles.tableLabel}>Mesa / Orden:</Text>
          <TextInput
            style={styles.tableInput}
            placeholder="Ej. 12 o Llevar"
            placeholderTextColor="#64748B"
            value={tableNumber}
            onChangeText={setTableNumber}
          />
        </View>

        <View style={styles.statusIcons}>
          <Wifi size={20} color="#22C55E" />
          <Printer
            size={20}
            color={isPrinterConnected ? '#22C55E' : '#EF4444'}
          />
        </View>
      </View>

      {/* Fila Inferior: Buscador en Tiempo Real (Live Search) */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar platillo o bebida..."
          placeholderTextColor="#94A3B8"
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
    backgroundColor: '#0B1326',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4A42',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171F33',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
  },
  tableLabel: {
    color: '#BBCABF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  tableInput: {
    color: '#DAE2FD',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 90,
    padding: 0,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171F33',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#DAE2FD',
    fontSize: 14,
    padding: 0,
  },
});
