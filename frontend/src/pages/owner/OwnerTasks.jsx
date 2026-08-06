import { useEffect, useState } from 'react';
import { ListTodo, CheckCircle2, RefreshCw, Loader2, User } from 'lucide-react';
import api from '../../api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Button from '../../components/Button';

export default function OwnerTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data?.tasks || []);
    } catch (err) {
      console.error('Error fetching owner tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  return (
    <div>
      <Header
        title="Task Management"
        description="Monitor operational delivery tasks assigned to partner agents"
        actions={
          <button
            onClick={fetchTasks}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Task ID & Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description & Guidance
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assigned Partner
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{t.id}</span>
                      <span className="text-xs text-slate-400">Order #{t.orderId || t.order_id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 max-w-[280px]">
                      {t.description || t.notes}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" /> {t.partnerName || 'Assigned Agent'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={t.status === 'completed' ? 'ghost' : 'success'}
                        icon={CheckCircle2}
                        onClick={() => handleToggleTask(t.id, t.status)}
                      >
                        {t.status === 'completed' ? 'Re-open' : 'Complete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tasks.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-500 text-sm">
              <ListTodo className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No active tasks found.
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" /> Loading tasks...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
