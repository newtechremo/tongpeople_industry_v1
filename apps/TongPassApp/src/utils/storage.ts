import AsyncStorage from '@react-native-async-storage/async-storage';

export const setStorageData = async (
  key: string,
  value: any,
): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Storage setItem error:', e);
  }
};

export const getStorageData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Storage getItem error:', e);
    return null;
  }
};

export const removeStorageData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Storage removeItem error:', e);
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Storage clear error:', e);
  }
};
