import api from './api';
const dashboardService = {
  getSummary: async (params = {}) => { const r = await api.get('/api/dashboard', { params }); return r?.data || r; },
};
export default dashboardService;
