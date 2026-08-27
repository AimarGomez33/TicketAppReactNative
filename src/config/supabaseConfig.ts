// src/config/supabaseConfig.ts
// La configuración de conexión se captura en tiempo de ejecución. No se usan
// variables de compilación para que URL/keys de Supabase no queden embebidas
// dentro del bundle de la APK/IPA.
export const SUPABASE_CONFIG = {
  url: '',
  anonKey: '',
  restaurantName: 'Ticket App POS',
  printerHost: '192.168.100.200',
  printerPort: 9100,
};

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_CONFIG.url) &&
    Boolean(SUPABASE_CONFIG.anonKey) &&
    SUPABASE_CONFIG.url.startsWith('https://')
  );
};
