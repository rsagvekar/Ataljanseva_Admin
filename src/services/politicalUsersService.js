import api from './api';
const politicalUsersService = {
  getAll:    async (p = {})    => { const r = await api.get('/api/political-users', { params: p }); return r?.data || r; },
  getBySlug: async (slug)      => { const r = await api.get(`/api/political-users/slug/${slug}`); return r?.data || r; },
  getById:   async (id)        => { const r = await api.get(`/api/political-users/${id}`); return r?.data || r; },
  create:    async (data)      => { const r = await api.post('/api/political-users', data); return r?.data || r; },
  update:    async (id, data)  => { const r = await api.put(`/api/political-users/${id}`, data); return r?.data || r; },
};
export default politicalUsersService;
