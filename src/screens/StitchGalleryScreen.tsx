import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderingScreen } from './OrderingScreen';
import { PaymentScreen } from './PaymentScreen';
import { TablesScreen } from './TablesScreen';

type ScreenId = 'ordering' | 'tables' | 'payment';

const labels: Record<ScreenId, string> = {
  ordering: 'Comandas',
  tables: 'Mesas',
  payment: 'Pago',
};

interface Props {
  onOpenPos: () => void;
}

export function StitchGalleryScreen({ onOpenPos }: Props) {
  const [selectedScreen, setSelectedScreen] = useState<ScreenId>('ordering');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HIGH-EFFICIENCY RESTAURANT POS</Text>
          <Text style={styles.title}>Diseños de Stitch</Text>
        </View>
        <TouchableOpacity style={styles.openButton} onPress={onOpenPos}>
          <Text style={styles.openButtonText}>ABRIR POS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(Object.keys(labels) as ScreenId[]).map(id => {
          const isSelected = id === selectedScreen;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.tab, isSelected && styles.activeTab]}
              onPress={() => setSelectedScreen(id)}
            >
              <Text
                style={[styles.tabText, isSelected && styles.activeTabText]}
              >
                {labels[id]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedScreen === 'ordering' && <OrderingScreen />}
      {selectedScreen === 'tables' && <TablesScreen />}
      {selectedScreen === 'payment' && <PaymentScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1326' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyebrow: {
    color: '#4EDEA3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: { color: '#DAE2FD', fontSize: 24, fontWeight: '700', marginTop: 3 },
  openButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  openButtonText: { color: '#003824', fontSize: 11, fontWeight: '800' },
  tabs: {
    borderBottomColor: '#3C4A42',
    borderBottomWidth: 1,
    borderTopColor: '#3C4A42',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  tab: {
    backgroundColor: '#171F33',
    borderColor: '#3C4A42',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  activeTab: { backgroundColor: '#10B981', borderColor: '#4EDEA3' },
  tabText: {
    color: '#BBCABF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeTabText: { color: '#003824' },
});
