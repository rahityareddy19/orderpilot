import axios from 'axios';

// Default to relative '/api' for single-port serving, or use VITE_API_BASE_URL if explicitly set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('orderpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global errors (e.g. 401 unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isPublicRoute = window.location.pathname.startsWith('/track-order') || 
                            window.location.pathname === '/' || 
                            window.location.pathname === '/login' ||
                            window.location.pathname === '/register' ||
                            window.location.pathname === '/report-issue';
      if (!isPublicRoute) {
        localStorage.removeItem('orderpilot_token');
        localStorage.removeItem('orderpilot_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
