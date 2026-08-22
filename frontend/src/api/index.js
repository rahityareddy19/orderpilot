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
  
  // Customer lookup by phone (used in Add Order form)
  if (url.includes('/auth/customer-lookup')) {
    const urlObj = new URL(url, 'http://localhost');
    const phone = urlObj.searchParams.get('phone') || '';
    // Import mockData customers if available, else use inline seed
    const mockCustomers = [
      { id: 1, name: 'Priya Customer', phone_number: '9876543210', address: '12, 100ft Road, Indiranagar, Bangalore' },
      { id: 6, name: 'Priya Sharma', phone_number: '9999900001', address: '77, JP Nagar 3rd Phase, Bangalore' },
    ];
    const match = mockCustomers.find(c => c.phone_number === phone);
    if (match) return Promise.resolve({ data: { customer: match } });
    return Promise.reject({ response: { status: 404, data: { error: 'No customer found with that phone number' } } });
  }

  // General Data routes
  if (url.includes('/orders/')) {
    const id = url.split('/orders/')[1];
    const found = orders.find(o => o.id === id || o.order_number === id);
    if (found) return Promise.resolve({ data: { order: found } });
    return Promise.reject({ response: { status: 404, data: { error: 'Order not found' } } });
  }
  if (url.includes('/orders')) {
    if (config.method === 'post') {
      const payload = JSON.parse(config.data || '{}');
      const newOrder = {
        ...payload,
        id: payload.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'processing',
        placedAt: new Date().toISOString(),
      };
      return Promise.resolve({ data: { order: newOrder } });
    }
    return Promise.resolve({ data: { orders } });
  }
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
