import api from './api';
const volunteersService = {
  getAll:        async (p = {})    => { const r = await api.get('/api/volunteers', { params: p }); return r?.data || r; },
  getById:       async (id)        => { const r = await api.get(`/api/volunteers/${id}`); return r?.data || r; },
  create:        async (data)      => { const r = await api.post('/api/volunteers', data); return r?.data || r; },
  update:        async (id, data)  => { const r = await api.put(`/api/volunteers/${id}`, data); return r?.data || r; },
  delete:        async (id)        => api.delete(`/api/volunteers/${id}`),
  getStats:      async (p = {})    => { const r = await api.get('/api/volunteers/stats/summary', { params: p }); return r?.data || r; },
  getReports:    async (p = {})    => { const r = await api.get('/api/volunteers/reports', { params: p }); return r?.data || r; },
  createReport:  async (data)      => { const r = await api.post('/api/volunteers/reports', data); return r?.data || r; },
  deleteReport:  async (id)        => api.delete(`/api/volunteers/reports/${id}`),
};
export default volunteersService;
