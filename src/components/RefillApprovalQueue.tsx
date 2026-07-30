import React from 'react';
import { CheckCircle2, ClipboardList, User, Calendar, Pill, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RefillApprovalQueueProps {
  pendingRefills: any[];
  onRefresh: () => void;
}

export const RefillApprovalQueue: React.FC<RefillApprovalQueueProps> = ({ pendingRefills, onRefresh }) => {
  const handleApprove = async (refillId: string) => {
    try {
      const refillRef = doc(db, 'hospital_modules_submissions', refillId);
      await updateDoc(refillRef, {
        'data.approval_status': 'approved',
        'data.approved_at': new Date().toISOString(),
        'status': 'saved' // Ensure it's marked as saved/finalized
      });
      onRefresh();
    } catch (error) {
      console.error("Error approving refill:", error);
      alert("Failed to approve refill. Please check your connection.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-indigo-50 px-5 py-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">Doctor's Refill Approval Queue</h3>
        </div>
        <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {pendingRefills.length} PENDING
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {pendingRefills.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-300" />
            <p className="text-sm text-gray-500 font-sans italic">All chronic medication refills have been processed.</p>
          </div>
        ) : (
          pendingRefills.map((refill) => (
            <div key={refill.id} className="p-5 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Patient MRN: {refill.data.patient_mrn}</div>
                      <div className="text-[10px] text-gray-500 font-mono">Submitted: {new Date(refill.submitted_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-start gap-2">
                      <Pill size={14} className="text-indigo-500 mt-0.5" />
                      <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">Medications</div>
                        <div className="text-[11px] font-medium text-gray-800 line-clamp-2">{refill.data.refill_medications}</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-start gap-2">
                      <Calendar size={14} className="text-indigo-500 mt-0.5" />
                      <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">Refill Days</div>
                        <div className="text-[11px] font-medium text-gray-800">{refill.data.refill_duration} Days</div>
                      </div>
                    </div>
                  </div>

                  {refill.data.clinical_notes && (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2 flex items-start gap-2">
                      <AlertCircle size={14} className="text-amber-500 mt-0.5" />
                      <div>
                        <div className="text-[9px] font-bold text-amber-600 uppercase">Clinical Justification</div>
                        <div className="text-[11px] text-amber-900 italic">"{refill.data.clinical_notes}"</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button 
                    onClick={() => handleApprove(refill.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    Approve Refill
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-900 px-5 py-3 text-center">
        <p className="text-[10px] text-slate-400 font-sans italic">
          Approved refills are automatically transmitted to the Pharmacy module for dispensing.
        </p>
      </div>
    </div>
  );
};
