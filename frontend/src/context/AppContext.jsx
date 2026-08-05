import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('orderpilot_role') || null;
  });

  const [complaints, setComplaints] = useState(() => {
    const stored = localStorage.getItem('orderpilot_submitted_complaints');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('orderpilot_role', role);
    } else {
      localStorage.removeItem('orderpilot_role');
    }
  }, [role]);

  useEffect(() => {
    localStorage.setItem('orderpilot_submitted_complaints', JSON.stringify(complaints));
  }, [complaints]);

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('orderpilot_role');
  };

  const submitComplaint = (complaint) => {
    const newComplaint = {
      ...complaint,
      id: `CMP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    return newComplaint;
  };

  return (
    <AppContext.Provider
      value={{
        role,
        selectRole,
        logout,
        complaints,
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
