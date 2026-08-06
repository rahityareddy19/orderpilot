import { useEffect, useState } from 'react';
import { Bot, MessageSquareWarning, RefreshCw, CheckCircle2, UserPlus, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api';
import { useApp } from '../../context/AppContext';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function OwnerComplaints() {
  const { registerPartner } = useApp();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  // Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', password: '' });
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [partnerSuccess, setPartnerSuccess] = useState('');

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

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await api.patch(`/complaints/${id}/approve`);
      if (res.data?.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, approved: true, status: 'resolved' } : c))
        );
      }
    } catch (err) {
      console.error('Error approving complaint:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRegisterPartner = async (e) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.email || !partnerForm.password) {
      setPartnerError('All fields are required.');
      return;
    }

    setPartnerError('');
    setPartnerSuccess('');
    setPartnerSubmitting(true);

    const result = await registerPartner(partnerForm);
    setPartnerSubmitting(false);

    if (result.success) {
      setPartnerSuccess(`Delivery partner ${result.user.name} created successfully!`);
      setPartnerForm({ name: '', email: '', password: '' });
      setTimeout(() => {
        setShowPartnerModal(false);
        setPartnerSuccess('');
      }, 1800);
    } else {
      setPartnerError(result.error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <Header
        title="Complaints & AI Pilot"
        description="Customer complaints with Gemini AI action plans and approvals"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchComplaints}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setShowPartnerModal(true)}>
              Add Partner Account
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {complaints.map((complaint) => {
          const needsApproval = complaint.requiresApproval && !complaint.approved;
          return (
            <div
              key={complaint.id}
              className={`bg-white rounded-xl border transition-all duration-200 ${
                needsApproval ? 'border-amber-300 ring-1 ring-amber-200 shadow-sm' : 'border-slate-200 hover:shadow-md'
              }`}
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
                        {complaint.orderId || complaint.order_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(complaint.createdAt || complaint.created_at)}
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
                    Customer Issue — {complaint.issueType || complaint.issue_type}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "{complaint.message}"
                  </p>
                </div>

                {/* AI Analysis */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                        Gemini AI Analysis
                      </span>
                    </div>
                    {complaint.approved ? (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Approved by Owner
                      </span>
                    ) : needsApproval ? (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Pending Approval
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-700">{complaint.aiSummary || complaint.ai_summary}</p>
                  
                  <div className="pt-3 border-t border-slate-200 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Recommended Action Plan</p>
                      <p className="text-sm text-slate-600 font-medium">{complaint.aiSuggestion || complaint.ai_suggestion}</p>
                    </div>

                    {needsApproval && (
                      <Button
                        size="sm"
                        variant="success"
                        icon={CheckCircle2}
                        disabled={approvingId === complaint.id}
                        onClick={() => handleApprove(complaint.id)}
                      >
                        {approvingId === complaint.id ? 'Approving...' : 'Approve Action'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {complaints.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <MessageSquareWarning className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900">No complaints</p>
            <p className="text-sm text-slate-500">All clear — no customer complaints filed right now.</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading complaints...</p>
          </div>
        )}
      </div>

      {/* Add Partner Account Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create Delivery Partner Account</h2>
              <button onClick={() => setShowPartnerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {partnerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{partnerError}</span>
              </div>
            )}

            {partnerSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{partnerSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterPartner} className="space-y-4">
              <Input
                label="Partner Name *"
                placeholder="e.g. Suresh Kumar"
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                required
              />

              <Input
                label="Partner Email Address *"
                type="email"
                placeholder="e.g. suresh@orderpilot.ai"
                value={partnerForm.email}
                onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                required
              />

              <Input
                label="Assign Password *"
                type="password"
                placeholder="At least 6 characters"
                value={partnerForm.password}
                onChange={(e) => setPartnerForm({ ...partnerForm, password: e.target.value })}
                required
              />

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowPartnerModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={partnerSubmitting}>
                  {partnerSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />} Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
