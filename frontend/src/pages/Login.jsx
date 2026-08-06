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

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSubmitting(true);

    const result = await login(demoEmail, demoPassword);

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full justify-center" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Customer Links */}
          <div className="mt-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 font-medium">New to OrderPilot?</span>
            <div className="flex items-center gap-2">
              <Link to="/register" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors">
                Create Account
              </Link>
              <Link to="/track-order" className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium transition-colors">
                Track Order
              </Link>
            </div>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-slate-400 mb-3">
              Don't want to register? Use a demo account:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('owner@orderpilot.ai', 'Password123')}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                Owner Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('partner@orderpilot.ai', 'Password123')}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                Partner Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('customer@orderpilot.ai', 'Password123')}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
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
