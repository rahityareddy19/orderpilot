import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, UserPlus, Mail, KeyRound, User, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await register(formData);
    setSubmitting(false);

    if (result.success) {
      const redirectMap = {
        owner: '/owner/dashboard',
        delivery_partner: '/partner/dashboard',
        customer: '/customer/dashboard'
      };
      navigate(redirectMap[result.user.role] || '/customer/dashboard');
    } else {
      setError(result.error || 'Registration failed.');
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
          <div className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm text-slate-500">
              Join OrderPilot AI delivery management platform.
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
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Full Name *
              </label>
              <Input
                id="name"
                placeholder="e.g. Ananya Roy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> Email Address *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. customer@orderpilot.ai"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-400" /> Password *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Role *</label>
              <select
                value={formData.role}
                disabled
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none focus:ring-0"
              >
                <option value="customer">Customer</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
