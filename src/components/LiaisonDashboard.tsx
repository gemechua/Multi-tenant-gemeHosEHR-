import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { Users, CreditCard, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, ShieldAlert } from 'lucide-react';
import { PatientClinicalFolderViewer } from './PatientClinicalFolderViewer';

interface Referral {
  id: string;
  patientMrn: string;
  patientName: string;
  type: 'in' | 'out';
  department: string;
  status: 'pending' | 'payment_requested' | 'payment_completed';
  createdAt: any;
  hospital_id?: string;
}

interface LiaisonProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const LiaisonDashboard: React.FC<LiaisonProps> = ({ activeHospital, addToast }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Liaison Data Guard. This will purge ALL fake/mock referrals, transfers, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      if (addToast) addToast('success', `Liaison Integrity: Purged ${deleted} falsified records.`);
    } catch (err) {
      console.error(err);
      if (addToast) addToast('error', 'Cleanup failed.');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'referrals'), where('hospital_id', '==', hospital_id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Referral))
        .filter(r => !isFakeOrFalseRow(r));
      setReferrals(data);
      if (data.length > 0 && !selectedReferral) {
        setSelectedReferral(data[0]);
      }
    });
    return unsubscribe;
  }, [hospital_id]);

  const requestPayment = async (id: string) => {
    await updateDoc(doc(db, 'referrals', id), { status: 'payment_requested' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-indigo-600" />
          Liaison Dashboard
        </h2>
        <button
          onClick={handleGlobalCleanup}
          className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
          title="Liaison Data Integrity Purge"
        >
          <ShieldAlert size={14} />
          Guard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-bold">Referral Requests</div>
          <div className="divide-y">
            {referrals.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs font-semibold">No referrals found in the queue.</div>
            ) : (
              referrals.map(ref => (
                <div 
                  key={ref.id} 
                  onClick={() => setSelectedReferral(ref)}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${selectedReferral?.id === ref.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{ref.patientName} (MRN: {ref.patientMrn})</p>
                    <p className="text-xs text-gray-500">Type: {(ref.type || '').toUpperCase()} | Dept: {ref.department}</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {ref.status === 'pending' && (
                      <button onClick={() => requestPayment(ref.id)} className="flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-xs font-semibold transition-colors">
                        <CreditCard size={14}/> Request Payment
                      </button>
                    )}
                    {ref.status === 'payment_requested' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        <RefreshCw size={14}/> Pending Payment
                      </span>
                    )}
                    {ref.status === 'payment_completed' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        <CheckCircle2 size={14}/> Payment Completed
                      </span>
                    )}
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedReferral && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5">
                <Users size={16} className="text-indigo-600" /> Referral Information
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong>Patient Name:</strong> {selectedReferral.patientName}</p>
                <p><strong>Patient MRN:</strong> {selectedReferral.patientMrn}</p>
                <p><strong>Referral Direction:</strong> <span className="font-bold text-indigo-700">{selectedReferral.type === 'in' ? 'INBOUND' : 'OUTBOUND'}</span></p>
                <p><strong>Target Department:</strong> {selectedReferral.department}</p>
                <p><strong>Status:</strong> <span className="font-bold">{(selectedReferral.status || '').toUpperCase()}</span></p>
              </div>
            </div>
          )}

          <PatientClinicalFolderViewer 
            patientMrn={selectedReferral?.patientMrn || ''} 
            patientName={selectedReferral?.patientName}
            sourceModule="Liaison"
            autoLogText={selectedReferral ? `Referral processed: ${selectedReferral.type === 'in' ? 'Inbound' : 'Outbound'} referral to ${selectedReferral.department} department.` : ''}
            appendButtonLabel="Log Referral Event"
          />
        </div>
      </div>
    </div>
  );
};
