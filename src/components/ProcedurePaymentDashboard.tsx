import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { CreditCard, CheckCircle2, Clock, DollarSign, ChevronRight, ShieldAlert } from 'lucide-react';
import { PatientClinicalFolderViewer } from './PatientClinicalFolderViewer';

interface ProcedureRequest {
  id: string;
  patient_mrn: string;
  patient_name: string;
  procedure_name: string;
  cost: number;
  status: 'pending' | 'payment_requested' | 'payment_completed';
  subsection_id: string;
  hospital_id?: string;
}

interface ProcedureProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ProcedurePaymentDashboard: React.FC<ProcedureProps> = ({ activeHospital, addToast }) => {
  const [requests, setRequests] = useState<ProcedureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProcedureRequest | null>(null);
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Payment Data Guard. This will purge ALL fake/mock billing, procedure, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      if (addToast) addToast('success', `Payment Integrity: Purged ${deleted} falsified records.`);
    } catch (err) {
      console.error(err);
      if (addToast) addToast('error', 'Cleanup failed.');
    }
  };

  useEffect(() => {
    // Target 1.1.1.a through 1.1.1.z.4
    const q = query(
      collection(db, 'hospital_modules_submissions'),
      where('subsection_id', '>=', '1.1.1.a'),
      where('subsection_id', '<=', '1.1.1.z.4'),
      where('hospital_id', '==', hospital_id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data().data, 
          subsection_id: doc.data().subsection_id 
        } as ProcedureRequest))
        .filter(r => !isFakeOrFalseRow(r));
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, [hospital_id]);

  const requestPayment = async (req: ProcedureRequest) => {
    await updateDoc(doc(db, 'hospital_modules_submissions', req.id), { 
      'data.status': 'payment_requested',
      'data.updated_at': serverTimestamp()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-emerald-600" />
          Procedure Payment Dashboard
        </h2>
        <button
          onClick={handleGlobalCleanup}
          className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
          title="Payment Data Integrity Purge"
        >
          <ShieldAlert size={14} />
          Guard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-bold flex items-center gap-2">
            <DollarSign size={18}/> Procedure Payment Requests (1.1.1.a - 1.1.1.z.4)
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-4 text-center">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs font-semibold">No pending requests found.</div>
            ) : (
              requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{req.procedure_name || 'Treatment/Procedure'} - MRN: {req.patient_mrn}</p>
                    <p className="text-xs text-gray-500">Cost: ETB {req.cost || 0} | Subsection: {req.subsection_id}</p>
                  </div>
                  <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    {req.status === 'pending' && (
                      <button onClick={() => requestPayment(req)} className="flex items-center gap-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-xs font-semibold transition-colors">
                        <CreditCard size={14}/> Request Payment
                      </button>
                    )}
                    {req.status === 'payment_requested' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        <Clock size={14}/> Payment Requested
                      </span>
                    )}
                    {req.status === 'payment_completed' && (
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
          {selectedRequest && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5">
                <DollarSign size={16} className="text-indigo-600" /> Procedure Payment Details
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong>Patient Name:</strong> {selectedRequest.patient_name || 'Unknown'}</p>
                <p><strong>Patient MRN:</strong> {selectedRequest.patient_mrn}</p>
                <p><strong>Procedure Name:</strong> {selectedRequest.procedure_name || 'N/A'}</p>
                <p><strong>Procedure Cost:</strong> ETB {selectedRequest.cost}</p>
                <p><strong>Status:</strong> <span className="font-bold">{selectedRequest.status?.toUpperCase() || 'PENDING'}</span></p>
              </div>
            </div>
          )}

          <PatientClinicalFolderViewer 
            patientMrn={selectedRequest?.patient_mrn || ''} 
            patientName={selectedRequest?.patient_name}
            sourceModule="Procedure Payment"
            autoLogText={selectedRequest ? `Procedure payment recorded for ${selectedRequest.procedure_name} costing ETB ${selectedRequest.cost}.` : ''}
            appendButtonLabel="Log Payment Event"
          />
        </div>
      </div>
    </div>
  );
};
