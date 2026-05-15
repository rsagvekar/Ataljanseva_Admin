import api from './api';
const sosService = {
  getAll:   async (p = {}) => { const r = await api.get('/api/sos', { params: p }); return r?.data || r; },
  getById:  async (id)     => { const r = await api.get(`/api/sos/${id}`); return r?.data || r; },
  create:   async (data)   => { const r = await api.post('/api/sos', data); return r?.data || r; },
  resolve:  async (id)     => { const r = await api.patch(`/api/sos/${id}/resolve`); return r?.data || r; },
  delete:   async (id)     => api.delete(`/api/sos/${id}`),
  getStats: async (p = {}) => { const r = await api.get('/api/sos/stats/summary', { params: p }); return r?.data || r; },
};
export default sosService;
