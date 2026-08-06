import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageSquareWarning,
  LogOut,
  Truck,
  Bot,
  ListTodo,
  Sparkles,
  History,
  User,
  Settings,
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
    { to: '/owner/complaints', label: 'Complaints & AI', icon: MessageSquareWarning },
    { to: '/owner/tasks', label: 'Tasks', icon: ListTodo },
    { to: '/owner/insights', label: 'AI Insights', icon: Sparkles },
    { to: '/owner/activity', label: 'Audit Log', icon: History },
  ];

  const customerLinks = [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customer/orders', label: 'My Orders', icon: Package },
    { to: '/customer/complaints', label: 'My Complaints', icon: MessageSquareWarning },
  ];

  const partnerLinks = [
    { to: '/partner/dashboard', label: 'My Tasks', icon: LayoutDashboard },
  ];

  let links = customerLinks;
  if (role === 'owner') links = ownerLinks;
  if (role === 'delivery_partner') links = partnerLinks;

  const roleLabel = {
    owner: 'Business Owner',
    delivery_partner: 'Delivery Partner',
    customer: 'Customer'
  }[role] || 'User';

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-200">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-900">OrderPilot</span>
          <span className="text-sm font-bold text-indigo-600"> AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

      {/* User Info & Logout */}
      <div className="px-3 py-3 border-t border-slate-200 space-y-1 bg-slate-50/50">
        <div className="px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            {role === 'owner' ? (
              <Package className="w-4 h-4 text-indigo-600" />
            ) : role === 'delivery_partner' ? (
              <Truck className="w-4 h-4 text-indigo-600" />
            ) : (
              <User className="w-4 h-4 text-indigo-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.name || roleLabel}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || roleLabel}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
