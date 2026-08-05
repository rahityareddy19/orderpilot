import { useNavigate, Link } from 'react-router-dom';
import { Bot, Package, Truck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

export default function Login() {
  const { selectRole } = useApp();
  const navigate = useNavigate();

  const handleSelect = (role) => {
    selectRole(role);
    navigate(role === 'owner' ? '/owner/dashboard' : '/partner/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">OrderPilot</span>
            <span className="text-sm font-bold text-indigo-600">AI</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-slate-900">Welcome to OrderPilot AI</h1>
            <p className="mt-2 text-sm text-slate-500">
              Select your role to access the demo dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Owner */}
            <button
              onClick={() => handleSelect('owner')}
              className="group bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Package className="w-5.5 h-5.5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Business Owner</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                View orders, manage complaints, and monitor AI-assisted actions.
              </p>
              <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Partner */}
            <button
              onClick={() => handleSelect('partner')}
              className="group bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Truck className="w-5.5 h-5.5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Delivery Partner</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                View assigned deliveries, manage tasks, and update delivery status.
              </p>
              <span className="text-xs font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            This is a demo. No real authentication required.
          </p>
        </div>
      </div>
    </div>
  );
}
