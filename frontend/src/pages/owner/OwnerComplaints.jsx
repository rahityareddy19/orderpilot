import { Bot, MessageSquareWarning } from 'lucide-react';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { complaints } from '../../data/mockData';

export default function OwnerComplaints() {
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <Header
        title="Complaints"
        description="Customer complaints with AI analysis"
      />

      <div className="p-6 space-y-4">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquareWarning className="w-4.5 h-4.5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {complaint.id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-sm text-slate-600">
                      {complaint.customer}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {complaint.orderId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={complaint.urgency} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Customer Message */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Customer Issue — {complaint.issueType}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  "{complaint.message}"
                </p>
              </div>

              {/* AI Analysis */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                    AI Analysis
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-3">{complaint.aiSummary}</p>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-1">Suggested Action</p>
                  <p className="text-sm text-slate-600">{complaint.aiSuggestion}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {complaints.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <MessageSquareWarning className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900">No complaints</p>
            <p className="text-sm text-slate-500">All clear — no open complaints right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
