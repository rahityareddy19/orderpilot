import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, role, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Redirect to correct dashboard based on role
    const fallbackPath =
      role === 'owner'
        ? '/owner/dashboard'
        : role === 'delivery_partner'
        ? '/partner/dashboard'
        : '/customer/dashboard';

    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
