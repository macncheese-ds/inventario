import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_URL });

// helpers to simplify usage
export const apiPost = (path, data, cfg = {}) => api.post(path, data, cfg);
export const apiPut = (path, data, cfg = {}) => api.put(path, data, cfg);
export const apiDelete = (path, cfg = {}) => api.delete(path, cfg);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

// aplicar token guardado al cargar
const saved = localStorage.getItem('token');
if (saved) setAuthToken(saved);

export default api;
