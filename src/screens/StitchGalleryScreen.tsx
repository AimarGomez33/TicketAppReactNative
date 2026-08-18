// src/screens/StitchGalleryScreen.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderingScreen } from './OrderingScreen';
import { PaymentScreen } from './PaymentScreen';
import { TablesScreen } from './TablesScreen';
import { useCartStore } from '../store/useCartStore';
import { Table, UtensilsCrossed, CreditCard, Sparkles } from 'lucide-react-native';
import { CustomAlertModal } from '../components/CustomAlertModal';

type ScreenId = 'tables' | 'ordering' | 'payment';

const labels: Record<ScreenId, string> = {
  tables: 'Mesas',
  ordering: 'Menú',
  payment: 'Cobro',
};

export function StitchGalleryScreen() {
  const selectedScreen = useCartStore(state => state.activeTab);
  const setSelectedScreen = useCartStore(state => state.setActiveTab);
  const appMode = useCartStore(state => state.appMode);
  const setAppMode = useCartStore(state => state.setAppMode);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header principal */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View>
            <Text style={styles.eyebrow}>SISTEMA DE PUNTO DE VENTA (POS)</Text>
            <Text style={styles.title}>Antojitos Mexicanos Margarita</Text>
          </View>
          <TouchableOpacity
            style={styles.headerModeBadge}
            onPress={() => setAppMode(appMode === 'general' ? 'detailed' : 'general')}
            activeOpacity={0.7}
          >
            <Sparkles size={12} color="#b3006c" />
            <Text style={styles.headerModeBadgeText}>
              {appMode === 'general' ? 'Modo General' : 'Modo Detallado'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenedor del contenido de la pantalla */}
      <View style={styles.contentContainer}>
        {selectedScreen === 'tables' && <TablesScreen />}
        {selectedScreen === 'ordering' && <OrderingScreen />}
        {selectedScreen === 'payment' && <PaymentScreen />}
      </View>

      {/* Modal de Alertas Estilizado Global */}
      <CustomAlertModal />

      {/* Barra de navegación inferior premium con cápsula redondeada */}
      <View style={styles.bottomNav}>
        {(Object.keys(labels) as ScreenId[]).map(id => {
          const isSelected = id === selectedScreen;
          const color = isSelected ? '#b3006c' : '#8e6e79';
          const size = isSelected ? 20 : 19;

          const renderIcon = () => {
            switch (id) {
              case 'tables':
                return <Table size={size} color={color} strokeWidth={isSelected ? 2.4 : 1.8} />;
              case 'ordering':
                return <UtensilsCrossed size={size} color={color} strokeWidth={isSelected ? 2.4 : 1.8} />;
              case 'payment':
                return <CreditCard size={size} color={color} strokeWidth={isSelected ? 2.4 : 1.8} />;
            }
          };

          return (
            <TouchableOpacity
              key={id}
              style={[styles.navItem, isSelected && styles.activeNavItem]}
              onPress={() => setSelectedScreen(id)}
              activeOpacity={0.75}
            >
              <View style={[styles.tabContent, isSelected && styles.activeTabContent]}>
                {renderIcon()}
                <Text style={[styles.navText, isSelected && styles.activeNavText]}>
                  {labels[id]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  header: {
    backgroundColor: '#ffe8ee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  headerModeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b3006c',
    letterSpacing: 0.2,
  },
  eyebrow: {
    color: '#5a3f49',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: '#27171d',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 4,
    shadowColor: '#27171d',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  activeNavItem: {
    flex: 1.25,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  activeTabContent: {
    flexDirection: 'row',
    backgroundColor: '#ffd9e5',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e6e79',
  },
  activeNavText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b3006c',
    letterSpacing: 0.2,
  },
});
