import api from './api';
const BASE = '/api/programs';
const programsService = {
  getAll:       async (p = {})     => { const r = await api.get(BASE, { params: p }); return r?.data || r; },
  getById:      async (id)         => { const r = await api.get(`${BASE}/${id}`); return r?.data || r; },
  create:       async (data)       => { const r = await api.post(BASE, data); return r?.data || r; },
  update:       async (id, data)   => { const r = await api.put(`${BASE}/${id}`, data); return r?.data || r; },
  delete:       async (id)         => api.delete(`${BASE}/${id}`),
  toggleStatus: async (id, status) => { const r = await api.patch(`${BASE}/${id}/status`, { status }); return r?.data || r; },
};
export default programsService;
