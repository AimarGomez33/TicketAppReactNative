import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applySupabaseRuntimeConfiguration,
  clearSupabaseRuntimeConfiguration,
  getSupabaseRuntimeConfiguration,
  isValidSupabaseConfiguration,
  SupabaseRuntimeConfiguration,
} from '../config/supabaseConfig';

const STORAGE_KEY = '@ticket_app_pos/supabase_runtime_config/v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseStoredConfiguration = (value: string | null): SupabaseRuntimeConfiguration | null => {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;

    const { url, anonKey } = parsed;
    if (typeof url !== 'string' || typeof anonKey !== 'string') return null;

    const configuration = { url, anonKey };
    return isValidSupabaseConfiguration(url, anonKey) ? configuration : null;
  } catch {
    return null;
  }
};

/** Carga una configuración pública validada antes de iniciar Supabase. */
export const loadSupabaseRuntimeConfiguration = async (): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const configuration = parseStoredConfiguration(stored);
    if (!configuration) {
      if (stored) await AsyncStorage.removeItem(STORAGE_KEY);
      clearSupabaseRuntimeConfiguration();
      return false;
    }
    return applySupabaseRuntimeConfiguration(configuration);
  } catch (error) {
    console.warn('No se pudo cargar la configuración local de Supabase:', error);
    clearSupabaseRuntimeConfiguration();
    return false;
  }
};

/** Persiste sólo la URL y anon key de cliente después de validarlas. */
export const saveSupabaseRuntimeConfiguration = async (
  configuration: SupabaseRuntimeConfiguration,
): Promise<boolean> => {
  if (!isValidSupabaseConfiguration(configuration.url, configuration.anonKey)) return false;

  const normalized = {
    url: configuration.url.trim(),
    anonKey: configuration.anonKey.trim(),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return applySupabaseRuntimeConfiguration(normalized);
  } catch (error) {
    console.warn('No se pudo guardar la configuración local de Supabase:', error);
    return false;
  }
};

export const clearStoredSupabaseRuntimeConfiguration = async (): Promise<void> => {
  clearSupabaseRuntimeConfiguration();
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const getCurrentSupabaseRuntimeConfiguration = getSupabaseRuntimeConfiguration;
