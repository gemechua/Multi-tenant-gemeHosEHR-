import React, { useState } from 'react';
import { TrendingUp, Calendar, AlertTriangle, CheckCircle, FileText, Download, Filter, BarChart2, Clock, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ShiftComplianceReportProps {
  reports: any[];
  onAddReport: (data: any) => void;
  loading: boolean;
}

export default function ShiftComplianceReport({ reports, onAddReport, loading }: ShiftComplianceReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Sample analytics for the chart
  const analyticsData = [
    { name: 'Mon', planned: 48, actual: 44, variance: -4 },
    { name: 'Tue', planned: 48, actual: 50, variance: 2 },
    { name: 'Wed', planned: 48, actual: 48, variance: 0 },
    { name: 'Thu', planned: 48, actual: 42, variance: -6 },
    { name: 'Fri', planned: 48, actual: 52, variance: 4 },
    { name: 'Sat', planned: 24, actual: 20, variance: -4 },
    { name: 'Sun', planned: 24, actual: 24, variance: 0 },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onAddReport({
        reportId: `REP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        dateRange: 'Weekly (July 12 - July 19, 2026)',
        plannedHours: 288,
        actualHours: 280,
        variance: -8,
        lateOccurrences: 4,
        missedShifts: 1,
        managerNotes: 'Variance due to late clock-ins in the nursing department on Thursday.',
        timestamp: new Date().toISOString()
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-600" />
                Workforce Variance Analytics
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Planned vs. Actual Hours (Current Week)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded text-[9px] font-black text-indigo-600 uppercase">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> Planned
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> Actual
              </div>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="planned" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="actual" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <TrendingUp size={24} className="text-emerald-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance Score</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black text-white tracking-tighter">97.2%</span>
              <p className="text-xs text-slate-400 font-medium mt-1">Total workforce efficiency rating</p>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <Download size={14} />
                  Run Compliance Report
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missed Shifts</p>
                <p className="text-lg font-black text-slate-900">04 <span className="text-xs text-slate-400 font-medium">this month</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-xs flex items-center gap-2 uppercase tracking-widest">
            <FileText size={16} className="text-indigo-600" />
            Compliance & Variance Archives
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Planned / Actual</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Variance</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exceptions</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-[10px] font-black text-indigo-500 font-mono">{report.reportId}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{report.dateRange}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-indigo-600">{report.plannedHours}h</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-600">{report.actualHours}h</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black ${report.variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {report.variance > 0 ? `+${report.variance}` : report.variance}h
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                          <Clock size={10} className="text-amber-500" /> Late: {report.lateOccurrences}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                          <Users size={10} className="text-rose-500" /> Missed: {report.missedShifts}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">"{report.managerNotes}"</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">No compliance reports generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
