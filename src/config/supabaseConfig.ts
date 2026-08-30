// src/config/supabaseConfig.ts
// La configuración de conexión se captura en tiempo de ejecución. No se usan
// variables de compilación para que URL/keys de Supabase no queden embebidas
// dentro del bundle de la APK/IPA.
export interface SupabaseRuntimeConfiguration {
  url: string;
  anonKey: string;
}

export const SUPABASE_CONFIG = {
  url: '',
  anonKey: '',
  restaurantName: 'Ticket App POS',
  printerHost: '192.168.100.200',
  printerPort: 9100,
};

export const isValidSupabaseConfiguration = (url: string, anonKey: string): boolean =>
  Boolean(url.trim()) && Boolean(anonKey.trim()) && url.trim().startsWith('https://');

export const getSupabaseRuntimeConfiguration = (): SupabaseRuntimeConfiguration => ({
  url: SUPABASE_CONFIG.url,
  anonKey: SUPABASE_CONFIG.anonKey,
});

export const applySupabaseRuntimeConfiguration = ({
  url,
  anonKey,
}: SupabaseRuntimeConfiguration): boolean => {
  if (!isValidSupabaseConfiguration(url, anonKey)) return false;
  SUPABASE_CONFIG.url = url.trim();
  SUPABASE_CONFIG.anonKey = anonKey.trim();
  return true;
};

export const clearSupabaseRuntimeConfiguration = (): void => {
  SUPABASE_CONFIG.url = '';
  SUPABASE_CONFIG.anonKey = '';
};

export const isSupabaseConfigured = (): boolean => {
  return isValidSupabaseConfiguration(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
};
