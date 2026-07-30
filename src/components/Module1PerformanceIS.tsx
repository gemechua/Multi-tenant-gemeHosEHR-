
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  BarChart3, TrendingUp, Users, Wallet, 
  Activity, Shield, HeartPulse, Target,
  Zap, ArrowUpRight, ArrowDownRight, Layers, ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Cell, PieChart, Pie
} from 'recharts';

interface Module1Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function Module1PerformanceIS({ activeHospital, addToast }: Module1Props) {
  const [loading, setLoading] = useState(false);
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Performance Data Guard. This will purge ALL fake/mock performance, strategic, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Performance Integrity: Purged ${deleted} falsified records.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Cleanup failed.');
    }
  };

  // Mock data for executive overview
  const performanceTrend = [
    { name: 'Jan', performance: 65, target: 80 },
    { name: 'Feb', performance: 72, target: 80 },
    { name: 'Mar', performance: 68, target: 80 },
    { name: 'Apr', performance: 85, target: 85 },
    { name: 'May', performance: 91, target: 85 },
    { name: 'Jun', performance: 88, target: 85 },
  ];

  const unitData = [
    { name: 'Emergency', score: 94, color: '#f43f5e' },
    { name: 'OPD', score: 88, color: '#6366f1' },
    { name: 'Pharmacy', score: 91, color: '#10b981' },
    { name: 'Laboratory', score: 76, color: '#f59e0b' },
    { name: 'Finance', score: 82, color: '#8b5cf6' },
    { name: 'HR', score: 95, color: '#ec4899' }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
              <BarChart3 className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Executive Performance Hub</h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Global KPI monitoring & strategic alignment</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={handleGlobalCleanup}
               className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
               title="Performance Data Integrity Purge"
             >
               <ShieldAlert size={14} />
               Guard
             </button>
             <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase border border-emerald-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Performance: 92.4%
             </div>
             <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-all">
                Export Executive Summary
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
         <div className="max-w-7xl mx-auto space-y-6">
            {/* Global KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Patient Volume', val: '1,248', trend: '+5.4%', icon: Users, color: 'blue' },
                 { label: 'Avg. Wait Time', val: '18m', trend: '-12.0%', icon: Clock, color: 'emerald' },
                 { label: 'Revenue MTD', val: '$412k', trend: '+8.2%', icon: Wallet, color: 'indigo' },
                 { label: 'Asset Uptime', val: '98.4%', trend: 'Stable', icon: Shield, color: 'rose' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                       <span className="text-2xl font-black text-slate-900">{stat.val}</span>
                    </div>
                    <div className={`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                       <stat.icon size={20} />
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Global Trend Chart */}
               <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h4 className="font-bold text-slate-900">Institutional Performance Trend</h4>
                        <p className="text-xs text-slate-500 font-medium">Monthly efficiency vs strategic targets</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Actual</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-slate-200 rounded-full" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Target</span>
                        </div>
                     </div>
                  </div>
                  <div className="h-72 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceTrend}>
                           <defs>
                              <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                           />
                           <Area type="monotone" dataKey="performance" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorPerf)" />
                           <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Strategic Alignment Score */}
               <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <Target size={120} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col">
                     <h4 className="text-lg font-bold mb-1">Strategic Alignment</h4>
                     <p className="text-slate-400 text-xs mb-8">Correlation with 2026 AOP Goals</p>
                     
                     <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative w-40 h-40">
                           <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                 className="text-slate-800"
                                 strokeDasharray="100, 100"
                                 d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                 fill="none"
                                 stroke="currentColor"
                                 strokeWidth="3"
                              />
                              <path
                                 className="text-indigo-500"
                                 strokeDasharray="88, 100"
                                 d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                 fill="none"
                                 stroke="currentColor"
                                 strokeWidth="3"
                                 strokeLinecap="round"
                              />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black">88%</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Aligned</span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-8 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                           <span>AOP Integration</span>
                           <span className="text-emerald-400 font-black">Optimal</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                           Performance is currently 8% ahead of the 2026 strategic roadmap baseline.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Unit Performance Heatmap */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h4 className="font-bold text-slate-900">Unit Performance Heatmap</h4>
                     <p className="text-xs text-slate-500 font-medium">Cross-departmental efficiency comparison</p>
                  </div>
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors">
                     Full Unit Report
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unitData.map((unit, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                       <div className="flex items-center justify-between mb-4">
                          <h6 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{unit.name}</h6>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black`} style={{ backgroundColor: `${unit.color}15`, color: unit.color }}>
                             {unit.score}
                          </div>
                       </div>
                       <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                          <div className="h-full transition-all duration-1000" style={{ width: `${unit.score}%`, backgroundColor: unit.color }} />
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Utilization Rate</span>
                          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                             <ArrowUpRight size={10} />
                             +4.2%
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex items-center gap-6 group hover:scale-[1.01] transition-transform cursor-pointer">
                  <div className="p-4 bg-white/20 rounded-2xl">
                     <Zap size={32} />
                  </div>
                  <div>
                     <h5 className="font-bold mb-1">Efficiency Alert</h5>
                     <p className="text-indigo-100 text-xs leading-relaxed">
                        Laboratory throughput has decreased by 12% today. Recommend shifting surplus nursing staff to assist in registration.
                     </p>
                  </div>
               </div>

               <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200 flex items-center gap-6 group hover:scale-[1.01] transition-transform cursor-pointer">
                  <div className="p-4 bg-white/20 rounded-2xl">
                     <TrendingUp size={32} />
                  </div>
                  <div>
                     <h5 className="font-bold mb-1">Revenue Peak</h5>
                     <p className="text-emerald-100 text-xs leading-relaxed">
                        OPD Billing has reached an all-time daily high of $14,200. Resource utilization is at optimal levels.
                     </p>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex items-center gap-6 group hover:scale-[1.01] transition-transform cursor-pointer">
                  <div className="p-4 bg-white/20 rounded-2xl">
                     <Layers size={32} />
                  </div>
                  <div>
                     <h5 className="font-bold mb-1">Stock Optimization</h5>
                     <p className="text-slate-400 text-xs leading-relaxed">
                        Inventory patterns suggest reducing Amoxicillin orders by 20% for the next cycle to prevent expiry waste.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

const Clock = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
