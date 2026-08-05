export default function StatusBadge({ status, size = 'sm' }) {
  const config = {
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Delivered' },
    'in-transit': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Transit' },
    delayed: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Delayed' },
    processing: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Processing' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
    open: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Open' },
    'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
    resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Resolved' },
    pending: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Pending' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
    issue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Issue' },
  };

  const c = config[status] || { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', label: status };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${c.bg} ${c.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
