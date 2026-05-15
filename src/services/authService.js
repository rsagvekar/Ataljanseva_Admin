import api from './api';
import storage from '../utils/storage';

const authService = {
  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const token = res?.data?.token || res?.token;
    const user  = res?.data?.user  || res?.user;
    if (token) await storage.setToken(token);
    if (user) {
      await storage.setUser(user);
      if (user.nagarsevak_id) await storage.setNagarsevakId(user.nagarsevak_id);
    }
    return { token, user };
  },
  getMe:          async ()         => { const r = await api.get('/api/auth/me'); return r?.data || r; },
  changePassword: async (cur, nw)  => api.put('/api/auth/change-password', { currentPassword: cur, newPassword: nw }),
  getAllUsers:     async (p = {})   => { const r = await api.get('/api/auth/users', { params: p }); return r?.data || r; },
  createUser:     async (data)     => { const r = await api.post('/api/auth/users', data); return r?.data || r; },
  updateUserRole: async (id, role) => { const r = await api.patch(`/api/auth/users/${id}/role`, { role }); return r?.data || r; },
  deactivateUser: async (id)       => { const r = await api.patch(`/api/auth/users/${id}/deactivate`); return r?.data || r; },
  deleteUser:     async (id)       => api.delete(`/api/auth/users/${id}`),
  logout:         async ()         => storage.clearAll(),
};
export default authService;
