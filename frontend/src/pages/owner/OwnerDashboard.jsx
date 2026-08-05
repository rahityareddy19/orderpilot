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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  dashboardStats,
  urgentIssues,
  aiActions,
  orders,
} from '../../data/mockData';

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
  const recentOrders = orders.slice(0, 5);
  const formatTime = (ts) =>
    new Date(ts).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your delivery operations"
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={dashboardStats.totalOrders}
            icon={Package}
            color="indigo"
            trend={5.2}
            description="This month"
          />
          <StatCard
            title="Delayed Orders"
            value={dashboardStats.delayedOrders}
            icon={Clock}
            color="amber"
            trend={-3.1}
            description="Currently delayed"
          />
          <StatCard
            title="Open Complaints"
            value={dashboardStats.openComplaints}
            icon={MessageSquareWarning}
            color="red"
            description="Awaiting resolution"
          />
          <StatCard
            title="AI Actions"
            value={dashboardStats.aiActions}
            icon={Bot}
            color="blue"
            trend={12.4}
            description="This week"
          />
        </div>

        {/* Urgent Issues + AI Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Urgent Issues */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Urgent Issues
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
                      severityColors[issue.severity]
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
              {aiActions.slice(0, 5).map((action) => {
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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {order.id}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{order.customer}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-900 font-medium">
                      ₹{order.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
