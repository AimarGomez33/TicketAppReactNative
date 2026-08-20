// src/config/supabaseConfig.ts
let ENV_SUPABASE_URL = '';
let ENV_SUPABASE_ANON_KEY = '';
let ENV_RESTAURANT_NAME = 'Antojitos Mexicanos Margarita';

try {
  // Carga desde .env vía react-native-dotenv
  const env = require('@env');
  ENV_SUPABASE_URL = env.SUPABASE_URL || '';
  ENV_SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
  ENV_RESTAURANT_NAME = env.RESTAURANT_NAME || ENV_RESTAURANT_NAME;
} catch (e) {
  // Fallback si no está cargado el módulo @env en el runtime
  console.error("Error cargando variables de entorno:", e);
}

export const SUPABASE_CONFIG = {
  // URL base de tu proyecto en Supabase (desde archivo .env)
  url: ENV_SUPABASE_URL ,
  // Tu publishable / anon key publica (desde archivo .env)
  anonKey: ENV_SUPABASE_ANON_KEY,
  // Identificador de la sucursal o terminal
  restaurantName: ENV_RESTAURANT_NAME,
};

export const isSupabaseConfigured = (): boolean => {
  return (
    SUPABASE_CONFIG.url !== 'https://placeholder.supabase.co' &&
    SUPABASE_CONFIG.anonKey !== 'placeholder-anon-key' &&
    SUPABASE_CONFIG.url.startsWith('https://')
  );
};
