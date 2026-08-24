import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { Search, Printer, Wifi, Menu, Database, Utensils, Layers, CircleDollarSign } from 'lucide-react-native';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { CustomExtraModal } from './CustomExtraModal';

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
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [extraModalVisible, setExtraModalVisible] = useState(false);

  const tableNumber = useCartStore(state => state.tableNumber);
  const setActiveTab = useCartStore(state => state.setActiveTab);
  const appMode = useCartStore(state => state.appMode);
  const setAppMode = useCartStore(state => state.setAppMode);
  const isRealtimeConnected = useCartStore(state => state.isRealtimeConnected);

  return (
    <>
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
              {/* Botón de estado / configuración de Supabase */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setConfigModalVisible(true)}
                activeOpacity={0.7}
              >
                <Database
                  size={18}
                  color={isRealtimeConnected ? '#059669' : '#8e6e79'}
                />
              </TouchableOpacity>

              <Wifi size={18} color="#b3006c" />
              <Printer
                size={18}
                color={isPrinterConnected ? '#b3006c' : '#ba1a1a'}
              />
            </View>
          </View>
        </View>

        {/* Selector de Modo / Versión de la App */}
        <View style={styles.modeSelectorContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              appMode === 'general' && styles.modeButtonActive,
            ]}
            onPress={() => setAppMode('general')}
            activeOpacity={0.7}
          >
            <View style={styles.modeButtonContent}>
              <Utensils size={13} color={appMode === 'general' ? '#b3006c' : '#8e6e79'} />
              <Text
                style={[
                  styles.modeButtonText,
                  appMode === 'general' && styles.modeButtonTextActive,
                ]}
                numberOfLines={1}
              >
                Platillos Generales
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              appMode === 'detailed' && styles.modeButtonActive,
            ]}
            onPress={() => setAppMode('detailed')}
            activeOpacity={0.7}
          >
            <View style={styles.modeButtonContent}>
              <Layers size={13} color={appMode === 'detailed' ? '#b3006c' : '#8e6e79'} />
              <Text
                style={[
                  styles.modeButtonText,
                  appMode === 'detailed' && styles.modeButtonTextActive,
                ]}
                numberOfLines={1}
              >
                Menú Detallado
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Fila Inferior: Buscador en Tiempo Real + Botón de Cobro Extra */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#ab286c" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                appMode === 'general'
                  ? 'Buscar platillo general...'
                  : 'Buscar platillo específico...'
              }
              placeholderTextColor="#8e6e79"
              value={searchQuery}
              onChangeText={onSearchChange}
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity
            style={styles.quickExtraBtn}
            onPress={() => setExtraModalVisible(true)}
            activeOpacity={0.8}
          >
            <CircleDollarSign size={16} color="#FFF" />
            <Text style={styles.quickExtraBtnText}>+ Extra $</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Cobro Extra Personalizado */}
      <CustomExtraModal
        visible={extraModalVisible}
        onClose={() => setExtraModalVisible(false)}
      />

      {/* Modal de Configuración Supabase */}
      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff8f8',
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
  iconBtn: {
    padding: 2,
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffe8ee',
    borderRadius: 20,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe0ea',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e6e79',
  },
  modeButtonTextActive: {
    color: '#b3006c',
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
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
  quickExtraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b3006c',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 40,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  quickExtraBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
