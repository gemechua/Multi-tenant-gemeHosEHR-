import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, FlaskConical, Bell, Upload, CheckCircle2, RefreshCw, ChevronRight, ShieldAlert } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PatientClinicalFolderViewer } from './PatientClinicalFolderViewer';

// Types
interface LabRequest {
  id: string;
  patientMrn: string;
  patientName?: string;
  testName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'critical';
  sampleId?: string;
  results?: string;
  createdAt: any;
  hospital_id?: string;
}

interface LabProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const LaboratoryDashboard: React.FC<LabProps> = ({ activeHospital, addToast }) => {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  useEffect(() => {
    const q = query(collection(db, 'lab_requests'), where('hospital_id', '==', hospital_id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as LabRequest))
        .filter(item => !isFakeOrFalseRow(item));
      
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [hospital_id]);

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Laboratory Data Guard. This will purge ALL fake/mock lab, clinical, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      if (addToast) addToast('success', `Laboratory Integrity: Purged ${deleted} falsified records.`);
    } catch (err) {
      console.error(err);
      if (addToast) addToast('error', 'Cleanup failed.');
    }
  };

  const handleUpdateStatus = async (id: string, status: LabRequest['status']) => {
    await updateDoc(doc(db, 'lab_requests', id), { status, updatedAt: serverTimestamp() });
  };

  const handleAddResult = async (id: string, results: string) => {
    await updateDoc(doc(db, 'lab_requests', id), { results, status: 'completed' });
  };

  const downloadPDF = (req: LabRequest) => {
    const doc = new jsPDF();
    doc.text(`Lab Report - ${req.testName}`, 10, 10);
    doc.text(`Patient MRN: ${req.patientMrn}`, 10, 20);
    doc.text(`Results: ${req.results || 'Pending'}`, 10, 30);
    doc.save(`lab_report_${req.id}.pdf`);
  };

  // Mock charts
  const data = [
    { name: 'Mon', tests: 40 },
    { name: 'Tue', tests: 30 },
    { name: 'Wed', tests: 50 },
    { name: 'Thu', tests: 27 },
    { name: 'Fri', tests: 60 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Laboratory Dashboard</h2>
        <button
          onClick={handleGlobalCleanup}
          className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
          title="Laboratory Data Integrity Purge"
        >
          <ShieldAlert size={14} />
          Guard
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Test Volume Trends (Last 90 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tests" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Urgent Notifications</h3>
          <div className="space-y-2">
            {requests.filter(r => r.status === 'critical').map(r => (
              <div key={r.id} className="p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
                <Bell size={16}/> Critical Result: {r.testName} (MRN: {r.patientMrn})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-bold flex items-center gap-2">
            <FlaskConical size={18}/> Lab Request Queue
          </div>
          <div className="divide-y">
            {requests.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs font-semibold">No lab requests in the queue.</div>
            ) : (
              requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{req.testName} - MRN: {req.patientMrn}</p>
                    <p className="text-xs text-gray-500">Status: <span className="font-bold">{(req.status || 'pending').toUpperCase()}</span></p>
                  </div>
                  <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    {req.status === 'pending' && (
                      <button onClick={() => handleUpdateStatus(req.id, 'in_progress')} className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded" title="Start Investigation">
                        <RefreshCw size={16}/>
                      </button>
                    )}
                    {req.status === 'in_progress' && (
                      <button onClick={() => handleAddResult(req.id, 'Sample Results')} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded" title="Submit Results">
                        <CheckCircle2 size={16}/>
                      </button>
                    )}
                    {req.status === 'completed' && (
                      <button onClick={() => downloadPDF(req)} className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded" title="Download Report">
                        <Upload size={16}/>
                      </button>
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
                <FlaskConical size={16} className="text-indigo-600" /> Selected Lab Request
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong>Patient MRN:</strong> {selectedRequest.patientMrn}</p>
                <p><strong>Test Name:</strong> {selectedRequest.testName}</p>
                <p><strong>Results:</strong> {selectedRequest.results || 'Pending'}</p>
                <p><strong>Status:</strong> <span className="font-bold">{(selectedRequest.status || 'pending').toUpperCase()}</span></p>
              </div>
            </div>
          )}

          <PatientClinicalFolderViewer 
            patientMrn={selectedRequest?.patientMrn || ''} 
            patientName={selectedRequest?.patientName}
            sourceModule="Laboratory"
            autoLogText={selectedRequest ? `Completed laboratory investigation for ${selectedRequest.testName} with status: ${selectedRequest.status}.` : ''}
            appendButtonLabel="Log Investigation Event"
          />
        </div>
      </div>
    </div>
  );
};
