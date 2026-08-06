import { Link } from 'react-router-dom';
import {
  Bot,
  Package,
  Search,
  Shield,
  Zap,
  MessageSquareWarning,
  Truck,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import Button from '../components/Button';

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Workflows',
    description: 'Automatically categorize complaints, suggest resolutions, and prioritize urgent orders.',
  },
  {
    icon: Package,
    title: 'Order Management',
    description: 'Track every order from placement to delivery with real-time status updates.',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaint Resolution',
    description: 'AI summarizes issues and suggests next steps so you can resolve complaints faster.',
  },
  {
    icon: Truck,
    title: 'Delivery Partner Tasks',
    description: 'Assign, track, and manage delivery tasks with priority-based scheduling.',
  },
  {
    icon: Search,
    title: 'Order Tracking',
    description: 'Let customers track their orders in real-time with detailed delivery timelines.',
  },
  {
    icon: Shield,
    title: 'Reliable & Secure',
    description: 'Built for small businesses that need dependable delivery operations management.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">OrderPilot</span>
            <span className="text-sm font-bold text-indigo-600">AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/track-order">
              <Button variant="ghost" size="sm" icon={Search}>
                Track Order
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-assisted delivery management
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Manage deliveries
            <br />
            <span className="text-indigo-600">smarter, not harder</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            OrderPilot AI helps small delivery businesses manage orders, resolve customer complaints, 
            and coordinate delivery partners — all with intelligent automation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/track-order">
              <Button size="lg" variant="secondary" icon={Search}>
                Track an Order
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" icon={ArrowRight}>
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary" icon={ArrowRight}>
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-slate-900">
              Everything you need to run deliveries
            </h2>
            <p className="mt-2 text-slate-600">
              Built for small businesses that handle orders, complaints, and delivery logistics daily.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Ready to streamline your delivery operations?
          </h2>
          <p className="text-slate-600 mb-8">
            Try the demo dashboard to see how OrderPilot AI can transform your workflow.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" icon={ChevronRight}>
                Login to Demo
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-slate-700">OrderPilot AI</span>
          </div>
          <p>© 2026 OrderPilot AI. Demo application.</p>
        </div>
      </footer>
    </div>
  );
}
