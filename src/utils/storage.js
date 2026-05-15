/**
 * Secure storage using react-native-keychain (token) +
 * AsyncStorage (user object, nagarsevak_id).
 *
 * react-native-keychain stores arbitrary strings under a service key.
 * It uses Android Keystore / iOS Keychain — no extra permissions needed.
 */
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICES = {
  TOKEN: 'nagarsevak_auth_token',
};

const KEYS = {
  USER:         '@nagarsevak/user',
  NAGARSEVAK_ID:'@nagarsevak/nagarsevak_id',
};

const storage = {
  // ── JWT token (Keychain) ───────────────────────────────────────────────────
  async setToken(token) {
    try {
      await Keychain.setGenericPassword('token', token, {
        service: SERVICES.TOKEN,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (e) {
      console.warn('setToken error:', e);
      // AsyncStorage fallback
      await AsyncStorage.setItem(SERVICES.TOKEN, token);
    }
  },

  async getToken() {
    try {
      const creds = await Keychain.getGenericPassword({ service: SERVICES.TOKEN });
      if (creds) return creds.password;
      // Fallback
      return await AsyncStorage.getItem(SERVICES.TOKEN);
    } catch (e) {
      try { return await AsyncStorage.getItem(SERVICES.TOKEN); } catch { return null; }
    }
  },

  async removeToken() {
    try {
      await Keychain.resetGenericPassword({ service: SERVICES.TOKEN });
    } catch {}
    try { await AsyncStorage.removeItem(SERVICES.TOKEN); } catch {}
  },

  // ── User object (AsyncStorage — not sensitive beyond the token) ────────────
  async setUser(user) {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('setUser error:', e);
    }
  },

  async getUser() {
    try {
      const raw = await AsyncStorage.getItem(KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async removeUser() {
    try { await AsyncStorage.removeItem(KEYS.USER); } catch {}
  },

  // ── Nagarsevak ID ──────────────────────────────────────────────────────────
  async setNagarsevakId(id) {
    try { await AsyncStorage.setItem(KEYS.NAGARSEVAK_ID, id); } catch {}
  },

  async getNagarsevakId() {
    try { return await AsyncStorage.getItem(KEYS.NAGARSEVAK_ID); } catch { return null; }
  },

  // ── Clear everything ───────────────────────────────────────────────────────
  async clearAll() {
    await this.removeToken();
    await this.removeUser();
    try { await AsyncStorage.removeItem(KEYS.NAGARSEVAK_ID); } catch {}
  },
};

export default storage;
