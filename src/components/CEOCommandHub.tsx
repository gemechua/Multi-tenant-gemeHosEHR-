import React from 'react';
import { LayoutDashboard, TrendingUp, AlertTriangle, Users, Target, FileText, Briefcase } from 'lucide-react';

export default function CEOCommandHub() {
  return (
    <div className="space-y-8 p-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">CEO Command Hub</h2>
        <p className="text-slate-500 mt-1">Strategic oversight, operational governance, and planning tools.</p>
      </header>

      {/* KPI Monitor */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-slate-900">Weekly Executive KPI Monitor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Benchmark</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { cat: 'Clinical', met: 'Avg Length of Stay', ben: '< 4.2 Days', stat: '0 Days', trend: '↔️ Baseline' },
                { cat: 'Financial', met: 'EBIDA Margin', ben: '> 12%', stat: '0%', trend: '↔️ Baseline' },
                { cat: 'Operations', met: 'Bed Occupancy', ben: '85-90%', stat: '0%', trend: '↔️ Baseline' },
                { cat: 'Quality', met: 'Readmission Rate', ben: '< 15%', stat: '0%', trend: '↔️ Baseline' },
                { cat: 'Patient', met: 'Satisfaction (HCAHPS)', ben: '4.5/5.0', stat: '0/5.0', trend: '↔️ Baseline' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.cat}</td>
                  <td className="px-4 py-3 text-slate-600">{row.met}</td>
                  <td className="px-4 py-3 text-slate-600">{row.ben}</td>
                  <td className="px-4 py-3 text-slate-900 font-bold">{row.stat}</td>
                  <td className="px-4 py-3">{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid sections for remaining components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Daily Operations Huddle */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LayoutDashboard className="text-indigo-600" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Daily Operations Huddle</h3>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Capacity Management:</strong> Bed Census: [Value] | ED Boarding: [Value]</p>
            <p><strong>Safety:</strong> Incidents (24h): [Value] | Infection Alerts: [Value]</p>
            <p><strong>Strategic Impediments:</strong> Need resolution for [List] in 48h.</p>
          </div>
        </section>

        {/* RCA Form */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-rose-600" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Root Cause Analysis</h3>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Incident:</strong> [Concise summary]</p>
            <p><strong>The "5 Whys":</strong> [Investigation flow to Root Cause]</p>
            <p><strong>Action:</strong> [Corrective Plan & Ownership]</p>
          </div>
        </section>

        {/* Talent Retention */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-emerald-600" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Talent Retention Tracker</h3>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Nursing:</strong> 0% Turnover | Overtime: $0/mo | <strong>Action:</strong> Monitoring</p>
            <p><strong>Pharmacy:</strong> 0% Turnover | Overtime: $0/mo | <strong>Action:</strong> Monitoring</p>
          </div>
        </section>

        {/* Strategic Charter */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-violet-600" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Strategic Project Charter</h3>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Sponsor/Lead:</strong> [Name] | <strong>Pillar:</strong> [Goal]</p>
            <p><strong>Budget/Metrics:</strong> [Total Budget] | [Success Metrics]</p>
            <p><strong>Risks:</strong> [List top 3 obstacles]</p>
          </div>
        </section>
      </div>
    </div>
  );
}
