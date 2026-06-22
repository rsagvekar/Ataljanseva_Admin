import api from './api';

// CHANGED — these calls used to take a nagarsevakId param and the backend
// scoped by that. Notifications are per-user now: the backend derives "whose
// notifications" from the Bearer token api.js already attaches to every
// request (see its request interceptor) — same as every other authenticated
// call in this app, nothing extra to pass here.
const notificationsService = {
  // params: { is_read?, type?, page?, limit? }
  // Resolves to { notifications, total, unreadCount, page, limit }
  getAll: async (p = {}) => {
    const r = await api.get('/api/notifications', { params: p });
    return r?.data || r;
  },

  // Fetching detail also marks it read server-side.
  getById: async (id) => {
    const r = await api.get(`/api/notifications/${id}`);
    return r?.data || r;
  },

  // For sending TO someone (not your own feed) — pass an explicit
  // recipient: { userId } for one person or { userIds: [...] } for several.
  create: async (data) => {
    const r = await api.post('/api/notifications', data);
    return r?.data || r;
  },

  markRead: async (id) => {
    const r = await api.patch(`/api/notifications/${id}/read`);
    return r?.data || r;
  },

  markAllRead: async () => {
    const r = await api.patch('/api/notifications/read-all');
    return r?.data || r;
  },

  getUnreadCount: async () => {
    const r = await api.get('/api/notifications/unread-count');
    return r?.data || r;
  },

  delete: async (id) => api.delete(`/api/notifications/${id}`),
};

export default notificationsService;