import { isValidSupabaseConfiguration } from '../src/config/supabaseConfig';

describe('Supabase runtime configuration', () => {
  it('requires an HTTPS project URL and anon key before reconnecting', () => {
    expect(isValidSupabaseConfiguration('https://project.supabase.co', 'anon-key')).toBe(true);
    expect(isValidSupabaseConfiguration('http://project.supabase.co', 'anon-key')).toBe(false);
    expect(isValidSupabaseConfiguration('https://project.supabase.co', '')).toBe(false);
  });
});
