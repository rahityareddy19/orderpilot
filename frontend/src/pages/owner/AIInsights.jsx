import { useEffect, useState } from 'react';
import { Sparkles, Bot, Zap, ShieldAlert, TrendingUp, CheckCircle2, RefreshCw, Loader2, Cpu } from 'lucide-react';
import api from '../../api';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';

export default function AIInsights() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs');
      setDecisions(res.data?.aiDecisions || []);
    } catch (err) {
      console.error('Error loading AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, []);

  return (
    <div>
      <Header
        title="AI Insights & Agent Analytics"
        description="Deep visibility into autonomous agent reasoning, risk predictions, and operational bottlenecks"
        actions={
          <button
            onClick={fetchAIInsights}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh AI Stream
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Agent Decisions Executed"
            value={decisions.length}
            icon={Cpu}
            color="indigo"
            trend={14.2}
            description="Total autonomous agent steps"
          />
          <StatCard
            title="Mean Confidence Score"
            value="96.4%"
            icon={Sparkles}
            color="blue"
            description="Agent reasoning accuracy"
          />
          <StatCard
            title="Operational Risk Index"
            value="Low Risk"
            icon={ShieldAlert}
            color="emerald"
            description="Predicted delivery bottlenecks"
          />
        </div>

        {/* Risk Predictions & Operational Bottlenecks */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Predictive Delivery Bottlenecks
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-white/10 p-3.5 rounded-lg border border-white/10">
                <p className="font-semibold text-white mb-1">Indiranagar Regional Transit SLA Window</p>
                <p className="text-slate-300">AI predicts 18% chance of evening peak traffic delay for orders routed through East Bangalore corridor.</p>
              </div>
              <div className="bg-white/10 p-3.5 rounded-lg border border-white/10">
                <p className="font-semibold text-white mb-1">Delivery Partner Workload Re-balancing</p>
                <p className="text-slate-300">Agent recommended assigning 2 additional backup agents for high priority delivery re-attempts.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Urgency Distribution & SLA Target</h2>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Critical Urgency Escalations</span>
                  <span className="text-red-600">22%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>High Priority Re-routes</span>
                  <span className="text-amber-600">45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Standard / Low Priority Resolution</span>
                  <span className="text-emerald-600">33%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '33%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Decision Logs Stream */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-indigo-600" /> Autonomous Agent Reasoning Logs
            </h2>
            <span className="text-xs text-slate-400 font-mono">{decisions.length} recorded steps</span>
          </div>

          <div className="divide-y divide-slate-100">
            {decisions.map((d) => (
              <div key={d.id} className="p-4 hover:bg-slate-50 transition-colors text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {d.agentName}
                    </span>
                    <span className="text-slate-500">Complaint #{d.complaintId}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Confidence: {(parseFloat(d.confidence || 0.95) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-slate-800 font-medium">{d.reasoning}</p>
                <p className="text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                  Action Taken: {d.actionTaken}
                </p>
              </div>
            ))}

            {decisions.length === 0 && !loading && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No AI decision logs recorded yet.
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" /> Loading AI decision stream...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
