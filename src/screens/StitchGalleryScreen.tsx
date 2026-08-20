// src/screens/StitchGalleryScreen.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderingScreen } from './OrderingScreen';
import { PaymentScreen } from './PaymentScreen';
import { TablesScreen } from './TablesScreen';
import { KitchenScreen } from './KitchenScreen';
import { useCartStore } from '../store/useCartStore';
import { Table, UtensilsCrossed, CreditCard, Sparkles, Radio, ChefHat } from 'lucide-react-native';
import { CustomAlertModal } from '../components/CustomAlertModal';

type ScreenId = 'tables' | 'ordering' | 'kitchen' | 'payment';

const labels: Record<ScreenId, string> = {
  tables: 'Mesas',
  ordering: 'Menú',
  kitchen: 'Cocina',
  payment: 'Cobro',
};

export function StitchGalleryScreen() {
  const selectedScreen = useCartStore(state => state.activeTab);
  const setSelectedScreen = useCartStore(state => state.setActiveTab);
  const appMode = useCartStore(state => state.appMode);
  const setAppMode = useCartStore(state => state.setAppMode);
  const initRealtimeSync = useCartStore(state => state.initRealtimeSync);
  const isRealtimeConnected = useCartStore(state => state.isRealtimeConnected);

  useEffect(() => {
    initRealtimeSync();
  }, [initRealtimeSync]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header principal responsive */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.eyebrow} numberOfLines={1}>POS MARGARITA</Text>
              {isRealtimeConnected ? (
                <View style={styles.liveBadge}>
                  <Radio size={9} color="#059669" />
                  <Text style={styles.liveBadgeText}>EN VIVO</Text>
                </View>
              ) : (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineBadgeText}>LOCAL</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              Antojitos Mexicanos Margarita
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerModeBadge}
            onPress={() => setAppMode(appMode === 'general' ? 'detailed' : 'general')}
            activeOpacity={0.7}
          >
            <Sparkles size={11} color="#b3006c" />
            <Text style={styles.headerModeBadgeText} numberOfLines={1}>
              {appMode === 'general' ? 'General' : 'Detallado'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenedor del contenido de la pantalla */}
      <View style={styles.contentContainer}>
        {selectedScreen === 'tables' && <TablesScreen />}
        {selectedScreen === 'ordering' && <OrderingScreen />}
        {selectedScreen === 'kitchen' && <KitchenScreen />}
        {selectedScreen === 'payment' && <PaymentScreen />}
      </View>

      {/* Modal de Alertas Estilizado Global */}
      <CustomAlertModal />

      {/* Barra de navegación inferior premium con cápsula redondeada */}
      <View style={styles.bottomNav}>
        {(Object.keys(labels) as ScreenId[]).map(id => {
          const isSelected = id === selectedScreen;
          const color = isSelected ? '#b3006c' : '#8e6e79';
          const size = isSelected ? 19 : 18;

          const renderIcon = () => {
            switch (id) {
              case 'tables':
                return <Table size={size} color={color} strokeWidth={isSelected ? 2.4 : 1.8} />;
              case 'ordering':
                return <UtensilsCrossed size={size} color={color} strokeWidth={isSelected ? 2.4 : 1.8} />;
              case 'kitchen':
                return <ChefHat size={size} color={color} strokeWidth={isSelected ? 2.4 : 1.8} />;
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  liveBadgeText: {
    color: '#059669',
    fontSize: 8,
    fontWeight: '800',
  },
  offlineBadge: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  offlineBadgeText: {
    color: '#6b7280',
    fontSize: 8,
    fontWeight: '800',
  },
  headerModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  headerModeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b3006c',
  },
  eyebrow: {
    color: '#5a3f49',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#27171d',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
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
