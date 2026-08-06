import { Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
        <Bot className="w-8 h-8 text-indigo-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The page or route you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button icon={ArrowLeft}>
          Back to OrderPilot AI Home
        </Button>
      </Link>
    </div>
  );
}
