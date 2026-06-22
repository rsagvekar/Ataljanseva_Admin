/**
 * AuthContext — REST API only (no Firebase)
 * JWT token is stored via storage util and attached to every API request
 * by authService / your HTTP client interceptor.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import authService from '../services/authService';
import storage from '../utils/storage';
import messaging from '@react-native-firebase/messaging';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // REST API user (has role, nagarsevak_id)
  const [nagarsevakId, setNagarsevakId] = useState("ashokshelke");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ── Restore persisted session on cold start ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedNagarsevakId, storedToken] = await Promise.all([
          storage.getUser(),
          storage.getNagarsevakId(),
          storage.getToken(),
        ]);

        if (storedUser && storedToken) {
          setUser(storedUser);
          if (storedNagarsevakId) setNagarsevakId(storedNagarsevakId);

          // Optionally re-validate the token with the server
          try {
            const fresh = await authService.getMe();
            await storage.setUser(fresh);
            setUser(fresh);
            if (fresh.nagarsevak_id) {
              await storage.setNagarsevakId(fresh.nagarsevak_id);
              setNagarsevakId(fresh.nagarsevak_id);
            }
          } catch {
            // Token may be expired — clear session
            await _clearSession();
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Internal helper ────────────────────────────────────────────────────────
  const _clearSession = async () => {
    await storage.clearAll();
    setUser(null);
    setNagarsevakId(null);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      let fcmToken = null;
      try {
        fcmToken = await messaging().getToken();
      } catch (err) {
        console.warn('Could not get FCM token:', err.message);
      }

      const res = await authService.login(email, password, fcmToken);
      const apiUser = res?.user;
      const token = res?.token;
      console.log('API login response:', res);
      if (!apiUser) throw new Error('Login failed: no user returned from API.');

      if (token) await storage.setToken(token);
      await storage.setUser(apiUser);

      if (apiUser.slug) {
        await storage.setNagarsevakId(apiUser.slug);
        setNagarsevakId(apiUser.slug);
      }
      console.log('login successful, user:', apiUser.slug);

      setUser(apiUser);
      return apiUser;
    } catch (err) {
      console.log('login error:', err);
      const msg = _friendlyError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Tell the server to invalidate the token if the endpoint exists
      await authService.logout?.();
    } catch {
      // Best-effort; always clear locally
    }
    await _clearSession();
  }, []);

  // ── Reset password ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    try {
      await authService.resetPassword(email);
    } catch (err) {
      const msg = _friendlyError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Select nagarsevak portal ───────────────────────────────────────────────
  const selectNagarsevak = useCallback(async (id) => {
    await storage.setNagarsevakId(id);
    setNagarsevakId(id);
    if (user) {
      const updated = { ...user, nagarsevak_id: id };
      await storage.setUser(updated);
      setUser(updated);
    }
  }, [user]);

  // ── Refresh user from API ──────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authService.getMe();
      await storage.setUser(fresh);
      if (fresh.nagarsevak_id) {
        await storage.setNagarsevakId(fresh.nagarsevak_id);
        setNagarsevakId(fresh.nagarsevak_id);
      }
      setUser(fresh);
      return fresh;
    } catch (e) {
      console.warn('refreshUser failed:', e.message);
    }
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────
  // Derived authentication state from the stored `user`
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        nagarsevakId,
        loading,
        authError,
        isAuthenticated,
        login,
        logout,
        resetPassword,
        selectNagarsevak,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function _friendlyError(err) {
  // Map common HTTP status codes / API error shapes to readable messages
  const status = err?.response?.status ?? err?.status;
  const serverMsg = err?.response?.data?.message ?? err?.response?.data?.error;

  if (serverMsg) return serverMsg;

  const byStatus = {
    400: 'Invalid request. Please check your details.',
    401: 'Invalid email or password.',
    403: 'You do not have permission to do that.',
    404: 'No account found with this email.',
    422: 'Invalid email or password.',
    429: 'Too many attempts. Try again later.',
    500: 'Server error. Please try again later.',
    503: 'Service unavailable. Check your connection.',
  };

  return byStatus[status] ?? err?.message ?? 'Something went wrong.';
}