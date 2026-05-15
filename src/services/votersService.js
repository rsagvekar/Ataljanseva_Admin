import api from './api';
const votersService = {
  getAll:             async (p = {}) => { const r = await api.get('/api/voters', { params: p }); return r?.data || r; },
  getById:            async (id)     => { const r = await api.get(`/api/voters/${id}`); return r?.data || r; },
  create:             async (data)   => { const r = await api.post('/api/voters', data); return r?.data || r; },
  update:             async (id, d)  => { const r = await api.put(`/api/voters/${id}`, d); return r?.data || r; },
  delete:             async (id)     => api.delete(`/api/voters/${id}`),
  checkVoterId:       async (vid)    => { const r = await api.get(`/api/voters/check-voter-id/${encodeURIComponent(vid)}`); return r?.data || r; },
  bulkImport:         async (data)   => { const r = await api.post('/api/voters/bulk-import', data); return r?.data || r; },
  todayBirthdays:     async (p = {}) => { const r = await api.get('/api/voters/birthdays/today', { params: p }); return r?.data || r; },
  todayAnniversaries: async (p = {}) => { const r = await api.get('/api/voters/anniversaries/today', { params: p }); return r?.data || r; },
  upcomingBirthdays:  async (p = {}) => { const r = await api.get('/api/voters/birthdays/upcoming', { params: p }); return r?.data || r; },
  getStats:           async (p = {}) => { const r = await api.get('/api/voters/stats/summary', { params: p }); return r?.data || r; },
};
export default votersService;
