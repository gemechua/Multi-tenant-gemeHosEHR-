import React from 'react';
import { Eye, Clock, CheckCircle2, XCircle, ShoppingCart } from 'lucide-react';

interface PatientQueueProps {
  prescriptions: any[];
  onViewVitals: (patientId: string, patientName: string) => void;
  onQuickAction: (rx: any) => void;
}

export default function PatientQueue({ prescriptions, onViewVitals, onQuickAction }: PatientQueueProps) {
  // Sort by date created, latest first
  const sortedPrescriptions = [...prescriptions].sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-black text-slate-900 text-lg">Prescription Patient Queue</h4>
          <p className="text-xs text-slate-500 font-medium">Real-time status of medication fulfillment and clinical validation.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-wider">Live Processing</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
              <th className="pb-2 px-4">Patient / ID</th>
              <th className="pb-2 px-4">Medication Details</th>
              <th className="pb-2 px-4">Status</th>
              <th className="pb-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPrescriptions.length > 0 ? (
              sortedPrescriptions.map((q, i) => (
                <tr key={q.id || i} className="group hover:bg-slate-50 transition-colors border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                  <td className="py-4 px-4 bg-white border-y border-l border-slate-100 rounded-l-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {q.patientName || q.patient || 'Unknown Patient'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter mt-0.5">
                        {q.patientId || 'NO-ID'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 bg-white border-y border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">
                        {q.medicationName || q.medicine || 'Not Specified'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tight">
                          {q.dosage || 'Standard'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {q.routeOfAdmin || 'Oral'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 bg-white border-y border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {q.status === 'Dispensed' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={10} /> Dispensed
                        </span>
                      ) : q.status === 'Returned' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                          <XCircle size={10} /> Returned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 bg-white border-y border-r border-slate-100 rounded-r-xl text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewVitals(q.patientId || q.patient, q.patientName || q.patient || 'Unknown')}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-indigo-100 cursor-pointer"
                        title="View Clinical Vitals"
                      >
                        <Eye size={14} />
                        <span className="text-[10px] font-black uppercase">Vitals</span>
                      </button>
                      <button
                        onClick={() => onQuickAction(q)}
                        className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer transition-all active:scale-95"
                      >
                        Actions
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                      <ShoppingCart size={32} className="text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No active prescriptions in queue</p>
                    <p className="text-[10px] uppercase font-black tracking-widest mt-1">Dispensary Hub Ready</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
