// src/config/supabaseConfig.ts
/**
 * Configuración de conexión para Supabase.
 * Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con las credenciales
 * de tu proyecto en https://app.supabase.com -> Project Settings -> API.
 */
export const SUPABASE_CONFIG = {
  // URL base de tu proyecto en Supabase
  url: 'https://saywxawfatcewxakwbyi.supabase.co',
  // Tu anon key pública
  anonKey: 'sb_publishable_oi5ejOEP4erfTlqZLNdmLQ_ml-LJnCs',
  // Identificador de la sucursal o terminal (opcional)
  restaurantName: 'Antojitos Mexicanos Margarita',
};


export const isSupabaseConfigured = (): boolean => {
  return (
    SUPABASE_CONFIG.url !== 'https://placeholder.supabase.co' &&
    SUPABASE_CONFIG.anonKey !== 'placeholder-anon-key' &&
    SUPABASE_CONFIG.url.startsWith('https://')
  );
};
