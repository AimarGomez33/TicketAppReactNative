// src/components/CustomExtraModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { X, DollarSign, Check, PlusCircle, ShoppingBag, UtensilsCrossed } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDestination?: 'table' | 'quick';
}

const PRESET_AMOUNTS = [10, 15, 20, 25, 30, 50, 100];

export const CustomExtraModal: React.FC<Props> = ({
  visible,
  onClose,
  defaultDestination,
}) => {
  const tableNumber = useCartStore((state) => state.tableNumber);
  const addCustomExtraItem = useCartStore((state) => state.addCustomExtraItem);
  const showCustomAlert = useCartStore((state) => state.showCustomAlert);

  const [priceStr, setPriceStr] = useState<string>('');
  const [concept, setConcept] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [destination, setDestination] = useState<'table' | 'quick'>(
    defaultDestination || (tableNumber ? 'table' : 'quick')
  );

  const handleAdd = () => {
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      showCustomAlert({
        title: 'Monto Inválido',
        message: 'Por favor ingresa un precio válido mayor a $0.',
        type: 'info',
      });
      return;
    }

    const finalConcept = concept.trim() || 'Extra Personalizado';
    const isQuick = destination === 'quick' || !tableNumber;

    addCustomExtraItem(price, finalConcept, notes.trim(), isQuick);

    showCustomAlert({
      title: 'Extra Agregado',
      message: `Se agregó "${finalConcept}" por $${price.toFixed(2)} a ${isQuick ? 'Venta Rápida' : `Mesa ${tableNumber}`}.`,
      type: 'success',
    });

    // Reset and close
    setPriceStr('');
    setConcept('');
    setNotes('');
    onClose();
  };

  const handlePreset = (amount: number) => {
    setPriceStr(amount.toString());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <PlusCircle size={20} color="#b3006c" />
              <Text style={styles.title}>Cobro Extra Personalizado</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#5a3f49" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Destino del Extra */}
            <View style={styles.section}>
              <Text style={styles.label}>AGREGAR A:</Text>
              <View style={styles.destRow}>
                <TouchableOpacity
                  style={[styles.destBtn, destination === 'quick' && styles.destBtnActive]}
                  onPress={() => setDestination('quick')}
                  activeOpacity={0.8}
                >
                  <ShoppingBag size={14} color={destination === 'quick' ? '#FFF' : '#5a3f49'} />
                  <Text style={[styles.destBtnText, destination === 'quick' && styles.destBtnTextActive]}>
                    Mostrador / Rápida
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.destBtn,
                    destination === 'table' && styles.destBtnActive,
                    !tableNumber && styles.destBtnDisabled,
                  ]}
                  onPress={() => {
                    if (tableNumber) setDestination('table');
                  }}
                  activeOpacity={0.8}
                >
                  <UtensilsCrossed size={14} color={destination === 'table' ? '#FFF' : '#5a3f49'} />
                  <Text style={[styles.destBtnText, destination === 'table' && styles.destBtnTextActive]}>
                    {tableNumber ? `Mesa ${tableNumber}` : 'Sin Mesa Abierta'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Input de Precio */}
            <View style={styles.section}>
              <Text style={styles.label}>MONTO A COBRAR ($)</Text>
              <View style={styles.priceInputWrapper}>
                <DollarSign size={24} color="#b3006c" />
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#8e6e79"
                  keyboardType="numeric"
                  value={priceStr}
                  onChangeText={setPriceStr}
                  autoFocus
                />
              </View>

              {/* Presets Rápidos */}
              <View style={styles.presetGrid}>
                {PRESET_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={`amt-${amt}`}
                    style={[styles.presetChip, priceStr === amt.toString() && styles.presetChipActive]}
                    onPress={() => handlePreset(amt)}
                  >
                    <Text style={[styles.presetChipText, priceStr === amt.toString() && styles.presetChipTextActive]}>
                      ${amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Concepto / Nombre */}
            <View style={styles.section}>
              <Text style={styles.label}>CONCEPTO / NOMBRE DEL EXTRA</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Envío, Guacamole extra, Porción doble..."
                placeholderTextColor="#8e6e79"
                value={concept}
                onChangeText={setConcept}
              />
            </View>

            {/* Notas opcionales */}
            <View style={styles.section}>
              <Text style={styles.label}>NOTAS / DETALLES (OPCIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Especificaciones o comentarios"
                placeholderTextColor="#8e6e79"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Botones */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Check size={16} color="#FFF" />
              <Text style={styles.confirmBtnText}>AGREGAR EXTRA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(39, 23, 29, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 12,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27171d',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#ffe8ee',
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5a3f49',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  destRow: {
    flexDirection: 'row',
    gap: 10,
  },
  destBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2bdc9',
    backgroundColor: '#fff8f8',
  },
  destBtnActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  destBtnDisabled: {
    opacity: 0.45,
  },
  destBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a3f49',
  },
  destBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderWidth: 2,
    borderColor: '#b3006c',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#b3006c',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ffd9e5',
  },
  presetChipActive: {
    backgroundColor: '#b3006c',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b3006c',
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#fff8f8',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#27171d',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2bdc9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5a3f49',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#b3006c',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
