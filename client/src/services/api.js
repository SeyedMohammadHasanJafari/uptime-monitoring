import axios from 'axios';

let rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').trim();
rawUrl = rawUrl.replace(/\/+$/, '');
if (!rawUrl.endsWith('/api/v1')) {
  rawUrl = `${rawUrl}/api/v1`;
}

const API_BASE_URL = rawUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulseguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid
      localStorage.removeItem('pulseguard_token');
      localStorage.removeItem('pulseguard_user');
    }
    return Promise.reject(error);
  }
);

export default api;
