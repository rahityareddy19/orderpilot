import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
  Package,
  MessageSquareWarning,
} from 'lucide-react';
import { orders } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order = orders.find((o) => o.id === orderId);

  if (!order || !order.timeline) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <Link to="/track-order" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back to tracking
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900">Order not found</h2>
            <p className="text-sm text-slate-500 mt-1">We couldn't find order {orderId}</p>
            <Link to="/track-order" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">Try again</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getTimelineIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'issue':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-slate-300" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Link to="/track-order" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Track another order
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Order Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold text-slate-900">{order.id}</h1>
                  <StatusBadge status={order.status} size="md" />
                </div>
                <p className="text-sm text-slate-500">{order.items.join(', ')}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500">Estimated Delivery</p>
                <p className="font-medium text-slate-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-medium text-slate-900">{order.customer}</p>
              </div>
              <div>
                <p className="text-slate-500">Delivery Partner</p>
                <p className="font-medium text-slate-900">{order.partner || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Address
                </p>
                <p className="font-medium text-slate-900">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Customer Update */}
          {order.customerUpdate && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">Delivery Update</h3>
                  <p className="text-sm text-amber-800 leading-relaxed">{order.customerUpdate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Delivery Timeline
            </h2>
            <div className="space-y-0">
              {order.timeline.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {getTimelineIcon(step.status)}
                    {i < order.timeline.length - 1 && (
                      <div className={`w-px flex-1 my-1 ${
                        step.status === 'completed' ? 'bg-emerald-200' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                  <div className="pb-6 flex-1">
                    <p className={`text-sm font-medium ${
                      step.status === 'pending' ? 'text-slate-400' : 'text-slate-900'
                    }`}>
                      {step.event}
                    </p>
                    {step.time && (
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(step.time)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Issue CTA */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Having an issue?</h3>
              <p className="text-sm text-slate-500">Report a problem with this order and our team will look into it.</p>
            </div>
            <Button
              variant="secondary"
              icon={MessageSquareWarning}
              onClick={() => navigate('/report-issue', { state: { orderId: order.id } })}
            >
              Report an Issue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
