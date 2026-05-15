import { Linking } from 'react-native';
import api from './api';

const birthdayService = {
  getAllTemplates:  async (type)      => { const r = await api.get('/api/birthday/templates', { params: type ? { type } : {} }); return r?.data || r; },
  createTemplate:  async (data)      => { const r = await api.post('/api/birthday/templates', data); return r?.data || r; },
  updateTemplate:  async (id, data)  => { const r = await api.put(`/api/birthday/templates/${id}`, data); return r?.data || r; },
  deleteTemplate:  async (id)        => api.delete(`/api/birthday/templates/${id}`),
  buildMessage: (template, voter) =>
    template.replace(/{name}/g, voter.name || '').replace(/{ward}/g, voter.ward || ''),
  openWhatsApp: (voter, message) => {
    const mobile = voter.mobile?.replace(/\D/g, '');
    if (!mobile) return;
    Linking.openURL(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`);
  },
};
export default birthdayService;
