import api from './api';
const grievancesService = {
  getAll:        async (p = {})      => { const r = await api.get('/api/grievances', { params: p }); return r?.data || r; },
  getById:       async (id)          => { const r = await api.get(`/api/grievances/${id}`); return r?.data || r; },
  submit:        async (data)        => { const r = await api.post('/api/grievances', data); return r?.data || r; },
  update:        async (id, data)    => { const r = await api.put(`/api/grievances/${id}`, data); return r?.data || r; },
  updateStatus:  async (id, status)  => { const r = await api.patch(`/api/grievances/${id}/status`, { status }); return r?.data || r; },
  delete:        async (id)          => api.delete(`/api/grievances/${id}`),
  trackByTicket: async (tid)         => { const r = await api.get(`/api/grievances/track/ticket/${encodeURIComponent(tid)}`); return r?.data || r; },
  trackByMobile: async (mob)         => { const r = await api.get(`/api/grievances/track/mobile/${encodeURIComponent(mob)}`); return r?.data || r; },
  getStats:      async (p = {})      => { const r = await api.get('/api/grievances/stats/summary', { params: p }); return r?.data || r; },
};
export default grievancesService;
