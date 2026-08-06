import { useEffect, useState } from 'react';
import { MessageSquareWarning, Bot, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import api from '../../api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';

export default function CustomerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data?.complaints || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div>
      <Header
        title="My Complaints"
        description="Track resolution status and AI action plans for your raised issues"
        actions={
          <button
            onClick={fetchComplaints}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {complaints.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{c.id}</span>
                <span className="text-xs text-slate-400">• Order #{c.orderId || c.order_id}</span>
                <span className="text-xs font-medium text-slate-600">Category: {c.issueType || c.category || c.issue_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={c.urgency} />
                <StatusBadge status={c.status} />
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium">"{c.message || c.complaint_text}"</p>

            {c.aiSummary && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> AI Resolution Update
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{c.aiSummary || c.ai_summary}</p>
              </div>
            )}
          </div>
        ))}

        {complaints.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-500 text-sm">
            <MessageSquareWarning className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No complaints raised yet.
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" /> Loading complaints...
          </div>
        )}
      </div>
    </div>
  );
}
