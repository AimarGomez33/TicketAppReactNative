// src/config/supabaseConfig.ts
import { SUPABASE_URL, SUPABASE_ANON_KEY, RESTAURANT_NAME } from '@env';

export const SUPABASE_CONFIG = {
  // URL base de tu proyecto en Supabase (desde archivo .env)
  url: SUPABASE_URL || '',
  // Tu publishable / anon key pública (desde archivo .env)
  anonKey: SUPABASE_ANON_KEY || '',
  // Identificador de la sucursal o terminal
  restaurantName: RESTAURANT_NAME || 'Antojitos Mexicanos Margarita',
};

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_CONFIG.url) &&
    Boolean(SUPABASE_CONFIG.anonKey) &&
    SUPABASE_CONFIG.url.startsWith('https://')
  );
};
