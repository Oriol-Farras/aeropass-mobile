import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_USER_ID_KEY = 'aeropass:last_user_id';

export async function saveLastUserId(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(LAST_USER_ID_KEY, userId);
  } catch (error) {
    console.warn('[UserSession] Could not persist user id:', error);
  }
}

export async function getLastUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_USER_ID_KEY);
  } catch (error) {
    console.warn('[UserSession] Could not read persisted user id:', error);
    return null;
  }
}

export async function clearLastUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_USER_ID_KEY);
  } catch (error) {
    console.warn('[UserSession] Could not clear persisted user id:', error);
  }
}
