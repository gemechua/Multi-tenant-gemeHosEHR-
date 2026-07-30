import React from 'react';
import { Shield, Users, AlertCircle, Clock, Activity, ArrowRight, CheckCircle } from 'lucide-react';

interface SecurityCommandHubProps {
  activeShifts: any[];
  pendingIncidents: any[];
  patrolStatus: number;
  criticalAlerts: any[];
  handovers: any[];
  onAcknowledgeHandover: (id: string) => void;
}

export default function SecurityCommandHub({ 
  activeShifts, 
  pendingIncidents, 
  patrolStatus, 
  criticalAlerts,
  handovers,
  onAcknowledgeHandover
}: SecurityCommandHubProps) {
  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Shifts', val: activeShifts.length, icon: Users, color: 'indigo' },
          { label: 'Pending Incidents', val: pendingIncidents.length, icon: AlertCircle, color: 'rose' },
          { label: 'Patrol Progress', val: `${patrolStatus}%`, icon: Activity, color: 'amber' },
          { label: 'Pending Handovers', val: handovers.length, icon: Clock, color: 'slate' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg w-fit mb-3`}>
              <stat.icon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <span className="text-2xl font-black text-slate-900">{stat.val}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-tight">
                <Users size={16} className="text-indigo-600" />
                Live Assignments & Zone Status
              </h4>
            </div>
            <div className="divide-y divide-slate-50">
              {activeShifts.length > 0 ? (
                activeShifts.map((shift, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600 text-xs">
                        {shift.guardName?.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900">{shift.guardName}</h5>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{shift.zone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{shift.shiftBlock}</span>
                        <span className="text-[10px] text-emerald-600 font-black uppercase">Active Duty</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-400 text-xs font-medium uppercase">No personnel on-duty.</div>
              )}
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-tight">
                <Shield size={16} className="text-rose-500" />
                Critical Security Intelligence
              </h4>
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
            </div>
            <div className="space-y-4">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((alert, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-start gap-4">
                    <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-white leading-tight">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">{alert.time} • {alert.location}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">All Systems Clear • Perimeter Secure</div>
              )}
            </div>
          </div>
        </div>

        {/* Handover Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/30 flex items-center justify-between">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-tight">
              <Clock size={16} className="text-indigo-600" />
              Shift Change Handover
            </h4>
          </div>
          <div className="flex-1 p-6 space-y-6">
            {handovers.length > 0 ? (
              handovers.map((handover) => (
                <div key={handover.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incoming Guard Action</p>
                      <h5 className="text-xs font-black text-slate-900">Acknowledge: {handover.guardName}</h5>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Outgoing Notes</p>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed italic">"{handover.handoverNotes}"</p>
                  </div>

                  <button 
                    onClick={() => onAcknowledgeHandover(handover.id)}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} />
                    Acknowledge & Start Shift
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <CheckCircle size={40} className="text-slate-300 mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Pending Handovers</p>
                <p className="text-[9px] text-slate-400 font-medium mt-1">Transitions complete or scheduled later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
