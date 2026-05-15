import api from './api';
const worksService = {
  getAll:   async (p = {})    => { const r = await api.get('/api/works', { params: p }); return r?.data || r; },
  getById:  async (id)        => { const r = await api.get(`/api/works/${id}`); return r?.data || r; },
  create:   async (data)      => { const r = await api.post('/api/works', data); return r?.data || r; },
  update:   async (id, data)  => { const r = await api.put(`/api/works/${id}`, data); return r?.data || r; },
  delete:   async (id)        => api.delete(`/api/works/${id}`),
  getStats: async (p = {})    => { const r = await api.get('/api/works/stats/summary', { params: p }); return r?.data || r; },
};
export default worksService;
