import api from './api';
const surveysService = {
  getAll:       async (p = {})      => { const r = await api.get('/api/surveys', { params: p }); return r?.data || r; },
  getActive:    async (p = {})      => { const r = await api.get('/api/surveys/public', { params: { ...p, active: true } }); return r?.data || r; },
  getById:      async (id)          => { const r = await api.get(`/api/surveys/${id}`); return r?.data || r; },
  create:       async (data)        => { const r = await api.post('/api/surveys', data); return r?.data || r; },
  update:       async (id, data)    => { const r = await api.put(`/api/surveys/${id}`, data); return r?.data || r; },
  toggleActive: async (id)          => { const r = await api.patch(`/api/surveys/${id}/toggle-active`); return r?.data || r; },
  vote:         async (id, optIdx)  => { const r = await api.post(`/api/surveys/${id}/vote`, { optionIndex: optIdx }); return r?.data || r; },
  delete:       async (id)          => api.delete(`/api/surveys/${id}`),
};
export default surveysService;
