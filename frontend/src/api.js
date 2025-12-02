import axios from 'axios';

// Use relative path - nginx proxies /api to backend
const API_URL = import.meta.env.VITE_API_URL || '/api';
export const API_BASE_URL = API_URL;

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

// Función para lookup de usuario (escaneo de gafete)
api.lookupUser = async (employee_input) => {
  try {
    const { data } = await api.get(`/auth/lookup/${encodeURIComponent(employee_input)}`);
    return data;
  } catch (error) {
    const msg = error.response?.data?.error || error.response?.data?.message || 'Usuario no encontrado';
    const err = new Error(msg);
    err.status = error.response?.status;
    throw err;
  }
};

// Función para autenticar con employee_input y password
api.authenticate = async (employee_input, password) => {
  try {
    const { data } = await api.post('/auth/login', { employee_input, password });
    return data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Error de autenticación';
    throw new Error(msg);
  }
};

// aplicar token guardado al cargar
const saved = localStorage.getItem('token');
if (saved) setAuthToken(saved);

export default api;
