// src/components/CustomAlertModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { CheckCircle2, AlertCircle, Printer, Info } from 'lucide-react-native';

export const CustomAlertModal: React.FC = () => {
  const customAlert = useCartStore(state => state.customAlert);
  const hideCustomAlert = useCartStore(state => state.hideCustomAlert);

  if (!customAlert) return null;

  const {
    title,
    message,
    type = 'printer',
    confirmText = 'Aceptar',
    cancelText,
    onConfirm,
    onCancel,
  } = customAlert;

  const handleConfirm = () => {
    hideCustomAlert();
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    hideCustomAlert();
    if (onCancel) {
      onCancel();
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'printer':
        return (
          <View style={[styles.iconCircle, styles.iconPrinterCircle]}>
            <Printer size={32} color="#b3006c" />
          </View>
        );
      case 'success':
        return (
          <View style={[styles.iconCircle, styles.iconSuccessCircle]}>
            <CheckCircle2 size={32} color="#10B981" />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, styles.iconErrorCircle]}>
            <AlertCircle size={32} color="#ba1a1a" />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, styles.iconInfoCircle]}>
            <Info size={32} color="#ab286c" />
          </View>
        );
    }
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Encabezado con Icono Estilizado */}
          <View style={styles.iconWrapper}>{renderIcon()}</View>

          {/* Título y Mensaje */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Botones de Acción */}
          <View style={styles.buttonContainer}>
            {cancelText ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                type === 'error' && styles.confirmErrorButton,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
    backgroundColor: 'rgba(39, 27, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPrinterCircle: {
    backgroundColor: '#ffd9e5',
    borderColor: '#ffe0ea',
    borderWidth: 2,
  },
  iconSuccessCircle: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
    borderWidth: 2,
  },
  iconErrorCircle: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 2,
  },
  iconInfoCircle: {
    backgroundColor: '#ffe8ee',
    borderColor: '#ffe0ea',
    borderWidth: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#27171d',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5a3f49',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2bdc9',
    backgroundColor: '#fff8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#5a3f49',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 20,
    paddingVertical: 13,
    backgroundColor: '#b3006c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmErrorButton: {
    backgroundColor: '#ba1a1a',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
