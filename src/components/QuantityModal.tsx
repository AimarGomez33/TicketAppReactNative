// src/components/QuantityModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Product } from '../store/useCartStore';
import { X, Plus, Minus, Check } from 'lucide-react-native';

interface Props {
  visible: boolean;
  product: Product | null;
  currentQuantity: number;
  currentNotes?: string;
  onClose: () => void;
  onConfirm: (quantity: number, notes: string) => void;
}

const PRESET_ADD_AMOUNTS = [5, 10, 20, 30, 40, 50];

export const QuantityModal: React.FC<Props> = ({
  visible,
  product,
  currentQuantity,
  currentNotes = '',
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setQuantity(currentQuantity > 0 ? currentQuantity : 1);
      setNotes(currentNotes || '');
    }
  }, [visible, currentQuantity, currentNotes]);

  if (!product) return null;

  const handleQuickAdd = (amount: number) => {
    setQuantity(prev => prev + amount);
  };

  const handleSetExact = (amount: number) => {
    setQuantity(amount);
  };

  const handleConfirm = () => {
    onConfirm(Math.max(0, quantity), notes.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>
                ${product.price.toFixed(2)} c/u • Subtotal: ${(product.price * quantity).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#5a3f49" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Selector de Cantidad Central */}
            <View style={styles.counterSection}>
              <Text style={styles.sectionLabel}>CANTIDAD TOTAL</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
                  activeOpacity={0.7}
                >
                  <Minus size={22} color="#b3006c" />
                </TouchableOpacity>

                <TextInput
                  style={styles.qtyInput}
                  value={quantity.toString()}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    const parsed = parseInt(val, 10);
                    setQuantity(isNaN(parsed) ? 0 : parsed);
                  }}
                  selectTextOnFocus
                />

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setQuantity(prev => prev + 1)}
                  activeOpacity={0.7}
                >
                  <Plus size={22} color="#b3006c" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Accesos Rápidos de Cantidad (+10, +20, +30, etc.) */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionLabel}>SUMAR RÁPIDO (+)</Text>
              <View style={styles.presetsGrid}>
                {PRESET_ADD_AMOUNTS.map(amt => (
                  <TouchableOpacity
                    key={`add-${amt}`}
                    style={styles.presetAddBtn}
                    onPress={() => handleQuickAdd(amt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.presetAddText}>+{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cantidades fijas directas (10, 20, 30, 40, 50) */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionLabel}>CANTIDAD EXACTA</Text>
              <View style={styles.presetsGrid}>
                {PRESET_ADD_AMOUNTS.map(amt => (
                  <TouchableOpacity
                    key={`exact-${amt}`}
                    style={[
                      styles.presetExactBtn,
                      quantity === amt && styles.presetExactBtnActive,
                    ]}
                    onPress={() => handleSetExact(amt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetExactText,
                        quantity === amt && styles.presetExactTextActive,
                      ]}
                    >
                      {amt} pzas
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notas opcionales */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionLabel}>NOTAS / DETALLES DE COCINA</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Ej: salsa verde aparte, bien doradas, con poco queso..."
                placeholderTextColor="#8e6e79"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Check size={18} color="#FFF" style={styles.confirmIcon} />
              <Text style={styles.confirmBtnText}>
                {currentQuantity > 0 ? 'Actualizar' : 'Agregar'} ({quantity})
              </Text>
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
    backgroundColor: 'rgba(39, 27, 32, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27171d',
  },
  productPrice: {
    fontSize: 13,
    color: '#ab286c',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#ffe8ee',
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5a3f49',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffd9e5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  qtyInput: {
    fontSize: 28,
    fontWeight: '900',
    color: '#b3006c',
    minWidth: 90,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff0f3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe0ea',
  },
  presetsSection: {
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  presetAddBtn: {
    flexBasis: '30%',
    backgroundColor: '#fff0f3',
    borderColor: '#b3006c',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetAddText: {
    color: '#b3006c',
    fontSize: 15,
    fontWeight: 'bold',
  },
  presetExactBtn: {
    flexBasis: '30%',
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetExactBtnActive: {
    backgroundColor: '#b3006c',
    borderColor: 'transparent',
  },
  presetExactText: {
    color: '#5a3f49',
    fontSize: 13,
    fontWeight: '600',
  },
  presetExactTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#fff8f8',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#27171d',
    minHeight: 50,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2bdc9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#5a3f49',
    fontSize: 13,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#b3006c',
    borderRadius: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    marginRight: 6,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
