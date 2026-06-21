import api from './api';
import storage from '../utils/storage';

const authService = {
  login: async (email, password, fcmToken) => {
    const res = await api.post('/api/auth/admin-app/login', {
      email,
      password,
      fcmToken,
    });
    return res.data;
  },
  getMe: async () => { const r = await api.get('/api/auth/me'); return r?.data || r; },
  changePassword: async (cur, nw) => api.put('/api/auth/change-password', { currentPassword: cur, newPassword: nw }),
  getAllUsers: async (p = {}) => { const r = await api.get('/api/auth/users', { params: p }); return r?.data || r; },
  createUser: async (data) => { const r = await api.post('/api/auth/users', data); return r?.data || r; },
  updateUserRole: async (id, role) => { const r = await api.patch(`/api/auth/users/${id}/role`, { role }); return r?.data || r; },
  deactivateUser: async (id) => { const r = await api.patch(`/api/auth/users/${id}/deactivate`); return r?.data || r; },
  deleteUser: async (id) => api.delete(`/api/auth/users/${id}`),
  syncFcmToken: async (slug, fcmToken) => {
    const res = await apiClient.post('/api/auth/fcm-token', { slug, fcmToken });
    return res.data;
  },
  logout: async () => storage.clearAll(),
};
export default authService;
