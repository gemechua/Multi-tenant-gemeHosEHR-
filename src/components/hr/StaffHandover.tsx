import React, { useState } from 'react';
import { RefreshCw, UserCheck, AlertCircle, ClipboardList, PenTool, CheckCircle2, ShieldCheck, Activity, Package, Stethoscope, ArrowRight } from 'lucide-react';

interface StaffHandoverProps {
  handovers: any[];
  staff: any[];
  onAddHandover: (data: any) => void;
  loading: boolean;
}

export default function StaffHandover({ handovers, staff, onAddHandover, loading }: StaffHandoverProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    outgoingStaff: '',
    incomingStaff: '',
    criticalTasks: '',
    equipmentStatus: 'Functional',
    patientAlerts: '',
    confirmationPin: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.confirmationPin) {
      alert('Incoming staff must provide PIN for confirmation.');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const outgoing = staff.find(s => s.employeeId === formData.outgoingStaff);
      const incoming = staff.find(s => s.employeeId === formData.incomingStaff);

      onAddHandover({
        ...formData,
        handoverId: `HND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        outgoingName: outgoing ? outgoing.fullName : 'Unknown',
        incomingName: incoming ? incoming.fullName : 'Unknown',
        handoverTime: new Date().toISOString(),
        criticalTasks: formData.criticalTasks.split('\n').filter(t => t.trim() !== ''),
        status: 'Completed'
      });
      
      setFormData({
        outgoingStaff: '',
        incomingStaff: '',
        criticalTasks: '',
        equipmentStatus: 'Functional',
        patientAlerts: '',
        confirmationPin: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Handover Process Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <RefreshCw className="text-indigo-600 animate-spin-slow" size={24} />
              Shift Transition (Handover)
            </h3>
            <div className="px-3 py-1 bg-amber-100 border border-amber-200 rounded-full text-[10px] font-black text-amber-700 uppercase tracking-widest">
              Continuity Phase
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Critical documentation for patient safety and operational integrity. Ensure all pending tasks and equipment status are updated.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personnel Selection */}
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outgoing Staff (Passing Duty)</label>
                <select 
                  required
                  value={formData.outgoingStaff}
                  onChange={e => setFormData({...formData, outgoingStaff: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select Outgoing Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.employeeId}>{s.fullName} ({s.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incoming Staff (Receiving Duty)</label>
                <select 
                  required
                  value={formData.incomingStaff}
                  onChange={e => setFormData({...formData, incomingStaff: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select Incoming Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.employeeId}>{s.fullName} ({s.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipment Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Functional', 'Needs Repair', 'Missing'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({...formData, equipmentStatus: status})}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        formData.equipmentStatus === status 
                          ? 'bg-slate-900 text-white shadow-lg' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task & Alert Details */}
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <ClipboardList size={12} className="text-indigo-500" />
                  Critical Pending Tasks (One per line)
                </label>
                <textarea 
                  required
                  placeholder="e.g., Patient in Room 4 needs vitals check at 14:00..."
                  rows={3}
                  value={formData.criticalTasks}
                  onChange={e => setFormData({...formData, criticalTasks: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Activity size={12} />
                  Patient Alerts / High-Risk Monitoring
                </label>
                <textarea 
                  placeholder="Detailed clinical warnings..."
                  rows={3}
                  value={formData.patientAlerts}
                  onChange={e => setFormData({...formData, patientAlerts: e.target.value})}
                  className="w-full px-4 py-3 bg-rose-50/50 border border-rose-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex-1 w-full">
              <PenTool size={20} className="text-indigo-600" />
              <div className="flex-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Incoming Staff Digital PIN</p>
                <input 
                  type="password" 
                  placeholder="Enter PIN to confirm receipt"
                  value={formData.confirmationPin}
                  onChange={e => setFormData({...formData, confirmationPin: e.target.value})}
                  className="w-full bg-transparent border-none outline-none text-indigo-900 font-bold placeholder:text-indigo-200"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                isSubmitting ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20'
              }`}
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <CheckCircle2 size={18} />
                  Finalize & Sign Handover
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Registry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {handovers.map((h, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{h.handoverId}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(h.handoverTime).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outgoing</p>
                <p className="text-xs font-bold text-slate-900">{h.outgoingName}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300" />
              <div className="flex-1 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming</p>
                <p className="text-xs font-bold text-slate-900">{h.incomingName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase text-slate-700">Tasks Handed Over</span>
                </div>
                <ul className="space-y-1">
                  {h.criticalTasks?.map((task: string, idx: number) => (
                    <li key={idx} className="text-[10px] text-slate-600 font-medium flex items-center gap-2">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full" /> {task}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Package size={14} />
                  Equip: <span className={h.equipmentStatus === 'Functional' ? 'text-emerald-600' : 'text-rose-600'}>{h.equipmentStatus}</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <ShieldCheck size={14} />
                  Confirmed by PIN
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
