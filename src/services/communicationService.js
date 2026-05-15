import api from './api';
const communicationService = {
  getTemplates:   async (p = {})    => { const r = await api.get('/api/communication/templates', { params: p }); return r?.data || r; },
  createTemplate: async (data)      => { const r = await api.post('/api/communication/templates', data); return r?.data || r; },
  updateTemplate: async (id, data)  => { const r = await api.put(`/api/communication/templates/${id}`, data); return r?.data || r; },
  deleteTemplate: async (id)        => api.delete(`/api/communication/templates/${id}`),
  sendBulk:       async (data)      => { const r = await api.post('/api/communication/send-bulk', data); return r?.data || r; },
  getLogs:        async (p = {})    => { const r = await api.get('/api/communication/logs', { params: p }); return r?.data || r; },
};
export default communicationService;
