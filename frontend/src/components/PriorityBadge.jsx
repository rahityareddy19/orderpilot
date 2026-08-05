export default function PriorityBadge({ priority }) {
  const config = {
    high: { bg: 'bg-red-50', text: 'text-red-700', label: 'High' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Medium' },
    normal: { bg: 'bg-slate-50', text: 'text-slate-600', label: 'Normal' },
    low: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Low' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
  };

  const c = config[priority] || config.normal;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
