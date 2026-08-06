import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageSquareWarning,
  LogOut,
  Truck,
  Bot,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { user, role, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ownerLinks = [
    { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/owner/orders', label: 'Orders', icon: Package },
    { to: '/owner/complaints', label: 'Complaints', icon: MessageSquareWarning },
  ];

  const partnerLinks = [
    { to: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const links = role === 'owner' ? ownerLinks : partnerLinks;

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-200">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-900">OrderPilot</span>
          <span className="text-sm font-bold text-indigo-600"> AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="w-4.5 h-4.5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info and Logout */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-2">
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            {role === 'owner' ? (
              <Package className="w-4 h-4 text-indigo-600" />
            ) : (
              <Truck className="w-4 h-4 text-indigo-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.name || (role === 'owner' ? 'Business Owner' : 'Delivery Partner')}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email || (role === 'owner' ? 'Owner Account' : 'Partner Account')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
