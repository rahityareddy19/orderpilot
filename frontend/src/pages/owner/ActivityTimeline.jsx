import { useEffect, useState, useCallback } from 'react';
import { Shield, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../api';
import Header from '../../components/Header';

export default function ActivityTimeline() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs');
      setLogs(res.data?.activityLogs || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <Header
        title="Activity Audit Log"
        description="Immutable system audit trail of all manual and AI operations"
        actions={
          <button
            onClick={fetchLogs}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">System Activity Records</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between text-xs gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {log.action}
                    </span>
                    <span className="text-slate-500">• Performed by: <strong className="text-slate-700">{log.performedBy}</strong></span>
                  </div>
                  <pre className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 font-mono overflow-x-auto max-w-xl">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
                <span className="text-slate-400 font-mono shrink-0">{formatDate(log.timestamp)}</span>
              </div>
            ))}

            {logs.length === 0 && !loading && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No activity logs recorded.
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" /> Loading activity log...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
