// src/config/supabaseConfig.ts
import { SUPABASE_URL, SUPABASE_ANON_KEY, RESTAURANT_NAME, PRINTER_HOST, PRINTER_PORT } from '@env';

export const SUPABASE_CONFIG = {
  // URL base de tu proyecto en Supabase (desde archivo .env privado)
  url: SUPABASE_URL || '',
  // Tu publishable / anon key pública (desde archivo .env privado)
  anonKey: SUPABASE_ANON_KEY || '',
  // Nombre del restaurante o negocio (configurable en .env)
  restaurantName: RESTAURANT_NAME || 'Ticket App POS',
  // Configuración de Impresora Térmica de Red
  printerHost: PRINTER_HOST || '192.168.100.200',
  printerPort: PRINTER_PORT ? parseInt(PRINTER_PORT, 10) : 9100,
};

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_CONFIG.url) &&
    Boolean(SUPABASE_CONFIG.anonKey) &&
    SUPABASE_CONFIG.url.startsWith('https://')
  );
};
