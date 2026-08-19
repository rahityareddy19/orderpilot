import { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  MessageSquareWarning,
  Bot,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  MailWarning,
  TrendingDown,
  Reply,
  Tag,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Button from '../../components/Button';

const actionIcons = {
  'auto-reply': Reply,
  escalation: AlertTriangle,
  resolution: RotateCcw,
  insight: Lightbulb,
  categorization: Tag,
};

const severityColors = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-amber-600 bg-amber-50',
  medium: 'text-slate-600 bg-slate-100',
};

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    delayedOrders: 0,
    openComplaints: 0,
    aiActions: 0,
  });
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [aiActivity, setAiActivity] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, urgentRes, activityRes, ordersRes, approvalsRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: {} })),
        api.get('/dashboard/urgent-issues').catch(() => ({ data: {} })),
        api.get('/dashboard/ai-activity').catch(() => ({ data: {} })),
        api.get('/orders').catch(() => ({ data: {} })),
        api.get('/dashboard/approvals').catch(() => ({ data: {} })),
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (urgentRes.data?.urgentIssues) setUrgentIssues(urgentRes.data.urgentIssues);
      if (activityRes.data?.aiActivity) setAiActivity(activityRes.data.aiActivity);
      if (ordersRes.data?.orders) setRecentOrders(ordersRes.data.orders.slice(0, 5));
      if (approvalsRes.data?.approvalRequests) setApprovals(approvalsRes.data.approvalRequests);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (complaintId) => {
    setApprovingId(complaintId);
    try {
      await api.patch(`/complaints/${complaintId}/approve`);
      setApprovals((prev) => prev.filter((item) => item.id !== complaintId));
      fetchDashboardData();
    } catch (err) {
      console.error('Error approving complaint:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return ts;
    }
  };

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your delivery operations and AI pilot"
        actions={
          <button
            onClick={fetchDashboardData}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={Package}
            color="indigo"
            trend={5.2}
            description="Total placed orders"
          />
          <StatCard
            title="Delayed Orders"
            value={stats.delayedOrders}
            icon={Clock}
            color="amber"
            trend={-3.1}
            description="Currently delayed"
          />
          <StatCard
            title="Open Complaints"
            value={stats.openComplaints}
            icon={MessageSquareWarning}
            color="red"
            description="Awaiting resolution"
          />
          <StatCard
            title="AI Actions"
            value={stats.aiActions}
            icon={Bot}
            color="blue"
            trend={12.4}
            description="Automated actions"
          />
        </div>

        {/* AI Action Approvals Required Panel */}
        {approvals.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-300 animate-pulse" />
                <h2 className="text-sm font-bold tracking-wide uppercase text-indigo-200">
                  AI Action Approvals Required ({approvals.length})
                </h2>
              </div>
              <span className="text-xs bg-indigo-700 text-indigo-100 px-2.5 py-1 rounded-full font-medium">
                Human in the Loop
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {approvals.map((req) => (
                <div key={req.id} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
                      <span>Order #{req.orderId || req.order_id} • {req.customer}</span>
                      <PriorityBadge priority={req.urgency} />
                    </div>
                    <p className="text-xs font-semibold text-white mb-2">Issue: {req.issueType || req.issue_type}</p>
                    <p className="text-xs text-indigo-100 mb-3 bg-black/20 p-2 rounded">
                      <strong className="text-indigo-200">AI Plan:</strong> {req.aiSuggestion || req.ai_suggestion}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="success"
                    icon={CheckCircle2}
                    disabled={approvingId === req.id}
                    onClick={() => handleApprove(req.id)}
                    className="w-full text-xs py-1.5"
                  >
                    {approvingId === req.id ? 'Approving...' : 'Approve Action Plan'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Issues + AI Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Urgent Issues */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Urgent Issues & Notifications
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {urgentIssues.length} items
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {urgentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      severityColors[issue.severity] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {issue.type === 'delivery' && <Package className="w-3.5 h-3.5" />}
                    {issue.type === 'complaint' && <MailWarning className="w-3.5 h-3.5" />}
                    {issue.type === 'performance' && <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{issue.title}</p>
                    <PriorityBadge priority={issue.severity} />
                  </div>
                </div>
              ))}

              {urgentIssues.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No urgent issues at this time.
                </div>
              )}
            </div>
          </div>

          {/* AI Activity Timeline */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                Recent AI Activity
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {aiActivity.map((action) => {
                const ActionIcon = actionIcons[action.type] || Bot;
                return (
                  <div
                    key={action.id}
                    className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <ActionIcon className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{action.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatTime(action.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {aiActivity.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No AI activity recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            <Link
              to="/owner/orders"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const customerName = typeof order?.customer === 'string'
                    ? order.customer
                    : (order?.customer?.name || order?.customerObj?.name || 'Customer');

                  return (
                    <tr
                      key={order?.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {order?.id}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{customerName}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order?.status} />
                      </td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={order?.priority} />
                      </td>
                      <td className="px-5 py-3 text-right text-slate-900 font-medium">
                        ₹{(order?.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
