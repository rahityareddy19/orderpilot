import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, ArrowLeft, CheckCircle2, Send, Loader2, AlertCircle } from 'lucide-react';
import { issueTypes } from '../data/mockData';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ReportIssue() {
  const location = useLocation();
  const { submitComplaint } = useApp();

  const [formData, setFormData] = useState({
    orderId: location.state?.orderId || '',
    issueType: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.orderId.trim()) newErrors.orderId = 'Order ID is required';
    if (!formData.message.trim()) newErrors.message = 'Please describe your issue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitError('');
    setSubmitting(true);

    const result = await submitComplaint({
      orderId: formData.orderId.trim().toUpperCase(),
      message: formData.message.trim(),
      issueType: formData.issueType || undefined
    });

    setSubmitting(false);

    if (result.success) {
      setSubmittedComplaint(result.complaint);
    } else {
      setSubmitError(result.error || 'Failed to submit complaint. Please check the Order ID.');
    }
  };

  if (submittedComplaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900">OrderPilot</span>
              <span className="text-sm font-bold text-indigo-600">AI</span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Issue Reported & Analyzed by AI</h1>
            <p className="text-sm text-slate-600 mb-2">
              Your complaint has been processed by OrderPilot AI.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Complaint ID: <span className="font-mono font-medium text-slate-900">{submittedComplaint.id}</span>
            </p>

            {submittedComplaint.aiSummary && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-left">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> AI Resolution Update
                </p>
                <p className="text-sm text-slate-700">{submittedComplaint.aiSummary}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Link to={`/track-order/${formData.orderId.toUpperCase()}`}>
                <Button variant="primary" size="sm">
                  View Order Timeline
                </Button>
              </Link>
              <Link to="/">
                <Button variant="secondary" size="sm">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <Link
            to={formData.orderId ? `/track-order/${formData.orderId}` : '/track-order'}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tell us what went wrong and our AI pilot will analyze it right away.
            </p>
          </div>

          {submitError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <Input
              id="orderId"
              label="Order ID *"
              placeholder="e.g. ORD-1024"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              error={errors.orderId}
            />

            <div>
              <label
                htmlFor="issueType"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Issue Type (Optional)
              </label>
              <select
                id="issueType"
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Let AI analyze and categorize</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Describe the issue *
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder="Please provide details about the problem (e.g. package was delayed or wrong item arrived)..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-slate-900 placeholder-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${
                  errors.message ? 'border-red-300' : 'border-slate-300'
                }`}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" icon={Send} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing with AI...
                </>
              ) : (
                'Submit Complaint'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
