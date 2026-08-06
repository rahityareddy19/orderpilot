import axios from 'axios';
import {
  orders,
  complaints,
  dashboardStats,
  urgentIssues,
  aiActions,
  partnerTasks,
} from '../data/mockData';

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

// Helper to provide resilient offline/Netlify standalone static mock data
const getMockResponse = (config) => {
  const url = config.url || '';
  
  // Dashboard routes
  if (url.includes('/dashboard/stats')) return Promise.resolve({ data: { stats: dashboardStats } });
  if (url.includes('/dashboard/urgent-issues')) return Promise.resolve({ data: { urgentIssues } });
  if (url.includes('/dashboard/ai-activity')) return Promise.resolve({ data: { aiActivity: aiActions } });
  if (url.includes('/dashboard/approvals')) return Promise.resolve({ data: { approvalRequests: complaints.filter(c => c.requiresApproval && c.status === 'open') } });
  
  // Partner dashboard routes
  if (url.includes('/tasks') && config.method === 'patch') return Promise.resolve({ data: { task: { id: url.split('/')[2], status: 'updated' } } });
  if (url.endsWith('/tasks') || url.includes('/tasks/my-tasks') || url.includes('/dashboard/partner-tasks')) return Promise.resolve({ data: { tasks: partnerTasks } });
  
  // General Data routes
  if (url.includes('/orders/')) {
    const id = url.split('/orders/')[1];
    const found = orders.find(o => o.id === id || o.order_number === id);
    if (found) return Promise.resolve({ data: { order: found } });
    return Promise.reject({ response: { status: 404, data: { error: 'Order not found' } } });
  }
  if (url.includes('/orders')) return Promise.resolve({ data: { orders } });
  if (url.includes('/complaints')) return Promise.resolve({ data: { complaints } });
  if (url.includes('/activity-logs')) return Promise.resolve({ data: { logs: aiActions } });

  // Default fallback for endpoints we don't explicitly mock to prevent crashes
  return null;
};

// Interceptor to handle global errors and Netlify static fallbacks
api.interceptors.response.use(
  (response) => {
    // When deploying the frontend on Netlify WITHOUT a backend, the Netlify rewrite rule (_redirects) 
    // will intercept /api calls and return index.html (200 OK) instead of JSON. 
    // We catch the HTML payload and inject our intelligent mock engine.
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      const mockRes = getMockResponse(response.config);
      if (mockRes) return mockRes;
      return Promise.reject(new Error("Netlify Static HTML returned instead of API JSON"));
    }
    return response;
  },
  (error) => {
    // If the backend is fully unreachable (Network Error or 404), fall back to mock data
    if (!error.response || error.response.status === 404) {
      const mockRes = getMockResponse(error.config);
      if (mockRes) return mockRes;
    }

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
