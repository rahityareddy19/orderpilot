import { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Truck,
} from 'lucide-react';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Button from '../../components/Button';
import { partnerTasks } from '../../data/mockData';

export default function PartnerDashboard() {
  const [tasks, setTasks] = useState(partnerTasks);
  const [expanded, setExpanded] = useState(null);

  const totalTasks = tasks.length;
  const urgentTasks = tasks.filter((t) => t.priority === 'high').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  const updateStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const getNextStatus = (current) => {
    const flow = {
      pending: 'in-progress',
      'in-progress': 'completed',
    };
    return flow[current] || null;
  };

  const getButtonLabel = (current) => {
    const labels = {
      pending: 'Start Delivery',
      'in-progress': 'Mark Delivered',
    };
    return labels[current] || null;
  };

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
        title="My Deliveries"
        description="Your assigned tasks and delivery schedule"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Assigned Tasks"
            value={totalTasks}
            icon={Package}
            color="indigo"
            description="Active assignments"
          />
          <StatCard
            title="Urgent"
            value={urgentTasks}
            icon={AlertTriangle}
            color="red"
            description="High priority tasks"
          />
          <StatCard
            title="Completed"
            value={completedTasks}
            icon={CheckCircle2}
            color="emerald"
            description="Deliveries done"
          />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Delivery Tasks</h2>

          {tasks.map((task) => {
            const isExpanded = expanded === task.id;
            const nextStatus = getNextStatus(task.status);
            const buttonLabel = getButtonLabel(task.status);

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200"
              >
                {/* Task Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : task.id)}
                  className="w-full px-5 py-4 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      task.priority === 'high' ? 'bg-red-50' : 'bg-slate-100'
                    }`}>
                      <Truck className={`w-4.5 h-4.5 ${
                        task.priority === 'high' ? 'text-red-500' : 'text-slate-500'
                      }`} />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">
                          {task.orderId}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-sm text-slate-600">
                          {task.customer}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 flex items-center gap-1 mb-0.5">
                          <MapPin className="w-3.5 h-3.5" /> Address
                        </p>
                        <p className="text-slate-900">{task.address}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 flex items-center gap-1 mb-0.5">
                          <Clock className="w-3.5 h-3.5" /> Scheduled
                        </p>
                        <p className="text-slate-900">{formatTime(task.scheduledTime)}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-slate-500 mb-0.5">Items</p>
                        <p className="text-slate-900">{task.items.join(', ')}</p>
                      </div>
                      {task.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-slate-500 mb-0.5">Notes</p>
                          <p className="text-slate-700 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                            {task.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {nextStatus && buttonLabel && (
                      <div className="pt-2">
                        <Button
                          variant={task.status === 'in-progress' ? 'success' : 'primary'}
                          icon={task.status === 'in-progress' ? CheckCircle2 : Truck}
                          onClick={() => updateStatus(task.id, nextStatus)}
                        >
                          {buttonLabel}
                        </Button>
                      </div>
                    )}

                    {task.status === 'completed' && (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Delivered successfully</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
