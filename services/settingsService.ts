import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@onlyswap_settings';

export interface AppSettings {
  notificationsEnabled: boolean;
  bidNotifications: boolean;
  messageNotifications: boolean;
  isSellerMode: boolean;
}

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  bidNotifications: true,
  messageNotifications: true,
  isSellerMode: false,
};

/**
 * Load settings from AsyncStorage
 */
export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const settingsString = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      // Merge with defaults to handle missing keys
      return { ...defaultSettings, ...settings };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
};

/**
 * Save settings to AsyncStorage
 */
export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    const currentSettings = await loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

/**
 * Get a specific setting value
 */
export const getSetting = async <K extends keyof AppSettings>(
  key: K
): Promise<AppSettings[K]> => {
  const settings = await loadSettings();
  return settings[key];
};

/**
 * Update a specific setting
 */
export const updateSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> => {
  await saveSettings({ [key]: value });
};

