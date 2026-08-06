import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('orderpilot_token') || null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('orderpilot_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('orderpilot_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('orderpilot_token', newToken);
      localStorage.setItem('orderpilot_user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMsg };
    }
  };

  const register = async ({ name, email, password, role }) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token: newToken, user: userData } = res.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('orderpilot_token', newToken);
      localStorage.setItem('orderpilot_user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('orderpilot_token');
    localStorage.removeItem('orderpilot_user');
  };

  const registerPartner = async (partnerData) => {
    try {
      const res = await api.post('/auth/register', { ...partnerData, role: 'delivery_partner' });
      return { success: true, user: res.data.user };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create delivery partner account.';
      return { success: false, error: errorMsg };
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await api.get('/auth/partners');
      return res.data.partners || [];
    } catch (err) {
      console.error('Error fetching partners:', err);
      return [];
    }
  };

  const submitComplaint = async (complaintData) => {
    try {
      // Trigger full multi-agent AI workflow backend
      const res = await api.post('/ai/workflow', {
        orderId: complaintData.orderId,
        complaintText: complaintData.message,
        customerId: user?.id || null
      });

      return { success: true, result: res.data.result, complaint: { id: res.data.result.complaintId, aiSummary: res.data.result.summary } };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to process complaint. Please check your Order ID.';
      return { success: false, error: errorMsg };
    }
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(token && user);

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        registerPartner,
        fetchPartners,
        submitComplaint,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
