// src/components/SupabaseConfigModal.tsx
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
import { Database, X, Check, Globe, KeyRound, Radio } from 'lucide-react-native';
import { SUPABASE_CONFIG } from '../config/supabaseConfig';
import { useCartStore } from '../store/useCartStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<Props> = ({ visible, onClose }) => {
  const isRealtimeConnected = useCartStore(state => state.isRealtimeConnected);
  const showCustomAlert = useCartStore(state => state.showCustomAlert);
  const initRealtimeSync = useCartStore(state => state.initRealtimeSync);

  const [url, setUrl] = useState(SUPABASE_CONFIG.url);
  const [anonKey, setAnonKey] = useState(SUPABASE_CONFIG.anonKey);

  const handleSave = () => {
    SUPABASE_CONFIG.url = url.trim();
    SUPABASE_CONFIG.anonKey = anonKey.trim();

    initRealtimeSync();

    showCustomAlert({
      type: 'success',
      title: 'Configuración Guardada',
      message: 'Las credenciales de Supabase han sido actualizadas. Reconectando...',
      confirmText: 'Aceptar',
      onConfirm: onClose,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Database size={20} color="#b3006c" />
              <Text style={styles.title}>Configuración Supabase</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#5a3f49" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Estado de Sincronización:</Text>
              <View style={[styles.statusBadge, isRealtimeConnected ? styles.statusBadgeConnected : styles.statusBadgeOffline]}>
                {isRealtimeConnected && <Radio size={11} color="#059669" />}
                <Text style={[styles.statusBadgeText, isRealtimeConnected ? styles.statusTextConnected : styles.statusTextOffline]}>
                  {isRealtimeConnected ? 'Conectado en Tiempo Real' : 'Modo Local (Offline)'}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>PROJECT URL (Supabase)</Text>
            <View style={styles.inputContainer}>
              <Globe size={16} color="#8e6e79" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://xyzcompany.supabase.co"
                placeholderTextColor="#8e6e79"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>ANON KEY (Pública)</Text>
            <View style={styles.inputContainer}>
              <KeyRound size={16} color="#8e6e79" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={anonKey}
                onChangeText={setAnonKey}
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                placeholderTextColor="#8e6e79"
                autoCapitalize="none"
                secureTextEntry
              />
            </View>

            <Text style={styles.instructionsText}>
              Tip: Ejecuta el script `supabase_schema.sql` en el SQL Editor de tu proyecto en Supabase para crear las tablas automáticamente.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check size={16} color="#FFF" style={styles.saveBtnIcon} />
              <Text style={styles.saveBtnText}>Guardar</Text>
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
    backgroundColor: 'rgba(39, 27, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 12,
    marginBottom: 14,
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
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#ffe8ee',
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff8f8',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a3f49',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeConnected: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeOffline: {
    backgroundColor: '#f3f4f6',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextConnected: {
    color: '#059669',
  },
  statusTextOffline: {
    color: '#6b7280',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5a3f49',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 42,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#27171d',
  },
  instructionsText: {
    fontSize: 11,
    color: '#8e6e79',
    lineHeight: 16,
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2bdc9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#5a3f49',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: '#b3006c',
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnIcon: {
    marginRight: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
