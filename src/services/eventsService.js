import api from './api';
const eventsService = {
  getAll:   async (p = {})    => { const r = await api.get('/api/events', { params: p }); return r?.data || r; },
  getById:  async (id)        => { const r = await api.get(`/api/events/${id}`); return r?.data || r; },
  create:   async (data)      => { const r = await api.post('/api/events', data); return r?.data || r; },
  update:   async (id, data)  => { const r = await api.put(`/api/events/${id}`, data); return r?.data || r; },
  delete:   async (id)        => api.delete(`/api/events/${id}`),
  getStats: async (p = {})    => { const r = await api.get('/api/events/stats/summary', { params: p }); return r?.data || r; },
};
export default eventsService;
