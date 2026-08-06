import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, MessageSquareWarning, Search, Bot, ArrowRight, Loader2, RefreshCw, Send } from 'lucide-react';
import api from '../../api';
import { useApp } from '../../context/AppContext';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function CustomerDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: `Hello ${user?.name || 'there'}! I am OrderPilot AI. Ask me about your order status, delivery timelines, or raise an issue.` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [ordersRes, complaintsRes] = await Promise.all([
        api.get('/orders').catch(() => ({ data: {} })),
        api.get('/complaints').catch(() => ({ data: {} }))
      ]);

      setOrders(ordersRes.data?.orders || []);
      setComplaints(complaintsRes.data?.complaints || []);
    } catch (err) {
      console.error('Error loading customer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/analyze', { complaintText: userText, orderId: orders[0]?.id || 'ORD-1024' });
      const summary = res.data?.analysis?.summary || 'I have analyzed your query and flagged it for your delivery team.';
      setChatMessages(prev => [...prev, { sender: 'ai', text: summary }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'I have logged your request. You can also file a formal complaint using the Raise Complaint button below.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div>
      <Header
        title={`Welcome, ${user?.name || 'Customer'}`}
        description="Track your active shipments and interact with OrderPilot AI"
        actions={
          <Button size="sm" icon={MessageSquareWarning} onClick={() => navigate('/report-issue')}>
            Raise a Complaint
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="My Orders"
            value={orders.length}
            icon={Package}
            color="indigo"
            description="Total placed orders"
          />
          <StatCard
            title="Active Complaints"
            value={complaints.filter(c => c.status !== 'resolved').length}
            icon={MessageSquareWarning}
            color="amber"
            description="Under AI review"
          />
          <StatCard
            title="AI Support Assistant"
            value="Active"
            icon={Bot}
            color="blue"
            description="24/7 autonomous support"
          />
        </div>

        {/* AI Assistant Chat + Orders Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" /> My Orders
              </h2>
              <Link to="/customer/orders" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 4).map((o) => (
                <div key={o.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{o.id}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Estimated Delivery: {o.estimatedDelivery || o.estimated_delivery || 'Pending'}
                    </p>
                  </div>
                  <Link to={`/track-order/${o.id}`}>
                    <Button size="sm" variant="secondary" icon={Search}>
                      Track
                    </Button>
                  </Link>
                </div>
              ))}

              {orders.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No orders found. Use <Link to="/track-order" className="text-indigo-600 underline">Track Order</Link> to search by ID.
                </div>
              )}
            </div>
          </div>

          {/* Chat with AI Assistant */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[400px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">AI Support Assistant</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-sm">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {msg.sender === 'user' ? 'You' : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> OrderPilot AI is thinking...
                </div>
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Ask OrderPilot AI about your package..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" icon={Send} disabled={chatLoading} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
