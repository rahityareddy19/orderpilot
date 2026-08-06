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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('orderpilot_token');
    localStorage.removeItem('orderpilot_user');
  };

  const registerPartner = async (partnerData) => {
    try {
      const res = await api.post('/auth/create-partner', partnerData);
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
      const res = await api.post('/complaints', complaintData);
      return { success: true, complaint: res.data.complaint };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit complaint. Please check your Order ID.';
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
