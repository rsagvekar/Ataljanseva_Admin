import api from './api';
const scheduleService = {
  getAll:         async (p = {})         => { const r = await api.get('/api/schedule', { params: p }); return r?.data || r; },
  getById:        async (id)             => { const r = await api.get(`/api/schedule/${id}`); return r?.data || r; },
  create:         async (data)           => { const r = await api.post('/api/schedule', data); return r?.data || r; },
  update:         async (id, data)       => { const r = await api.put(`/api/schedule/${id}`, data); return r?.data || r; },
  markAttendance: async (id, attended)   => { const r = await api.patch(`/api/schedule/${id}/attend`, { attended }); return r?.data || r; },
  delete:         async (id)             => api.delete(`/api/schedule/${id}`),
  getStats:       async (p = {})         => { const r = await api.get('/api/schedule/stats/summary', { params: p }); return r?.data || r; },
};
export default scheduleService;
