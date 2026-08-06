import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, LogIn, KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await login(email.trim(), password);

    setSubmitting(false);

    if (result.success) {
      const userRole = result.user?.role;
      if (userRole === 'owner') {
        navigate('/owner/dashboard');
      } else if (userRole === 'delivery_partner') {
        navigate('/partner/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">OrderPilot</span>
            <span className="text-sm font-bold text-indigo-600">AI</span>
          </Link>

          <Link to="/track-order" className="text-sm text-slate-500 hover:text-slate-700">
            Track Order
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sign in to OrderPilot AI</h1>
            <p className="mt-2 text-sm text-slate-500">
              Access your business dashboard, customer portal, or delivery tasks.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. owner@orderpilot.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-400" /> Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Quick Demo Login Accounts
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fillDemoAccount('owner@orderpilot.ai', 'Password123')}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
              >
                Owner Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('partner@orderpilot.ai', 'Password123')}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
              >
                Partner Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('customer@orderpilot.ai', 'Password123')}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
              >
                Customer Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
