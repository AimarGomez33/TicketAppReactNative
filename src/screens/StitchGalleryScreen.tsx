// src/screens/StitchGalleryScreen.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderingScreen } from './OrderingScreen';
import { PaymentScreen } from './PaymentScreen';
import { TablesScreen } from './TablesScreen';
import { useCartStore } from '../store/useCartStore';
import { Table, UtensilsCrossed, CreditCard } from 'lucide-react-native';

type ScreenId = 'tables' | 'ordering' | 'payment';

const labels: Record<ScreenId, string> = {
  tables: 'Mesas',
  ordering: 'Menú',
  payment: 'Cobro',
};

export function StitchGalleryScreen() {
  const selectedScreen = useCartStore(state => state.activeTab);
  const setSelectedScreen = useCartStore(state => state.setActiveTab);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header principal */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SISTEMA DE PUNTO DE VENTA (POS)</Text>
          <Text style={styles.title}>Antojitos Margarita</Text>
        </View>
      </View>

      {/* Contenedor del contenido de la pantalla */}
      <View style={styles.contentContainer}>
        {selectedScreen === 'tables' && <TablesScreen />}
        {selectedScreen === 'ordering' && <OrderingScreen />}
        {selectedScreen === 'payment' && <PaymentScreen />}
      </View>

      {/* Barra de navegación inferior premium (M3 style) */}
      <View style={styles.bottomNav}>
        {(Object.keys(labels) as ScreenId[]).map(id => {
          const isSelected = id === selectedScreen;

          const renderIcon = () => {
            const color = isSelected ? '#ffffff' : '#ab286c';
            const size = 20;
            switch (id) {
              case 'tables':
                return <Table size={size} color={color} />;
              case 'ordering':
                return <UtensilsCrossed size={size} color={color} />;
              case 'payment':
                return <CreditCard size={size} color={color} />;
            }
          };

          return (
            <TouchableOpacity
              key={id}
              style={styles.navItem}
              onPress={() => setSelectedScreen(id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isSelected && styles.activeIconContainer]}>
                {renderIcon()}
              </View>
              <Text style={[styles.navText, isSelected && styles.activeNavText]}>
                {labels[id]}
              </Text>
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
    height: 75,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2bdc9',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#b3006c', // Color primario rosa del diseño HTML
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ab286c',
  },
  activeNavText: {
    color: '#b3006c',
    fontWeight: '700',
  },
});
