import axios from 'axios';
import storage from '../utils/storage';

const api = axios.create({
  baseURL: 'https://nagarsevak-api.vercel.app',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Full URL log
    const fullUrl = `${config.baseURL}${config.url}`;
    const params = config.params ? '?' + new URLSearchParams(config.params).toString() : '';
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}${params}`);

    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
