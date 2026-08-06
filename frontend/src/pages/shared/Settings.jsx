import Header from '../../components/Header';
import { Sliders, Bell, Bot, Shield, Save } from 'lucide-react';
import Button from '../../components/Button';

export default function Settings() {
  return (
    <div>
      <Header
        title="Settings & Autonomous Agent Controls"
        description="Configure AI automation thresholds, SLA escalations, and notification rules"
      />

      <div className="p-6 max-w-3xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bot className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">AI Agent Automation Thresholds</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Auto-Dispatch High Urgency Tasks</p>
                <p className="text-xs text-slate-500">Allow AI agents to create and assign tasks to delivery partners without manual approval.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="font-semibold text-slate-900">Human-in-the-Loop Approval Requirement</p>
                <p className="text-xs text-slate-500">Require owner approval for critical issue financial compensations or refunds.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="font-semibold text-slate-900">Periodic Overdue Escalation Monitoring</p>
                <p className="text-xs text-slate-500">Run MonitoringAgent background service every 5 minutes to audit SLA windows.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <Button size="sm" icon={Save}>
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
