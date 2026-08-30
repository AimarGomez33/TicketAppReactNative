import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSupabaseRuntimeConfiguration } from '../src/config/supabaseConfig';
import {
  getCurrentSupabaseRuntimeConfiguration,
  loadSupabaseRuntimeConfiguration,
  saveSupabaseRuntimeConfiguration,
} from '../src/services/runtimeSupabaseConfigService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const validConfiguration = {
  url: 'https://project.supabase.co',
  anonKey: 'public-anon-key',
};

describe('runtimeSupabaseConfigService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearSupabaseRuntimeConfiguration();
  });

  it('persists only a valid public client configuration and applies it to runtime', async () => {
    storage.setItem.mockResolvedValue(undefined);

    await expect(saveSupabaseRuntimeConfiguration(validConfiguration)).resolves.toBe(true);

    expect(storage.setItem).toHaveBeenCalledWith(
      '@ticket_app_pos/supabase_runtime_config/v1',
      JSON.stringify(validConfiguration),
    );
    expect(getCurrentSupabaseRuntimeConfiguration()).toEqual(validConfiguration);
  });

  it('loads a valid persisted configuration during initialization', async () => {
    storage.getItem.mockResolvedValue(JSON.stringify(validConfiguration));

    await expect(loadSupabaseRuntimeConfiguration()).resolves.toBe(true);

    expect(getCurrentSupabaseRuntimeConfiguration()).toEqual(validConfiguration);
  });

  it('discards malformed or invalid persisted values and leaves the app unconfigured', async () => {
    storage.getItem.mockResolvedValue('{not-json');
    storage.removeItem.mockResolvedValue(undefined);

    await expect(loadSupabaseRuntimeConfiguration()).resolves.toBe(false);

    expect(storage.removeItem).toHaveBeenCalledWith('@ticket_app_pos/supabase_runtime_config/v1');
    expect(getCurrentSupabaseRuntimeConfiguration()).toEqual({ url: '', anonKey: '' });
  });
});
