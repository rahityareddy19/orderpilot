import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bot, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = orderId.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter an order ID (e.g. ORD-1024)');
      return;
    }
    setError('');
    navigate(`/track-order/${trimmed}`);
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
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Track your order</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your order ID to check real-time delivery status.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="orderId"
              label="Order ID"
              placeholder="e.g. ORD-1024"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setError('');
              }}
              error={error}
            />
            <Button type="submit" className="w-full" icon={Search}>
              Track Order
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Demo order ID suggestion: <span className="font-mono text-slate-600">ORD-1024</span>
          </p>
        </div>
      </div>
    </div>
  );
}
