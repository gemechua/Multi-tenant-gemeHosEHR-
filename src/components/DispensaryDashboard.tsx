import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { FileText, Pill, CheckCircle2, Clock, AlertTriangle, QrCode, BarChart3, ChevronRight, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { PatientClinicalFolderViewer } from './PatientClinicalFolderViewer';

interface PrescriptionRequest {
  id: string;
  patient_mrn: string;
  patient_name: string;
  medication: string;
  dosage: string;
  status: 'pending' | 'dispensed';
  submitted_at: any;
  hospital_id?: string;
}

interface DispensaryProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const DispensaryDashboard: React.FC<DispensaryProps> = ({ activeHospital, addToast }) => {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PrescriptionRequest | null>(null);
  const [inventory, setInventory] = useState<{ name: string; stock: number }[]>([]);
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';


  const handleDispense = async (req: PrescriptionRequest) => {
    await updateDoc(doc(db, 'hospital_modules_submissions', req.id), { 'data.status': 'dispensed', updated_at: serverTimestamp() });
    alert(`Medication ${req.medication} dispensed to ${req.patient_name}`);
  };

  const generateLabel = (req: PrescriptionRequest) => {
    const doc = new jsPDF();
    doc.text(`Prescription Label: ${req.medication}`, 10, 10);
    doc.text(`Patient: ${req.patient_name}`, 10, 20);
    doc.text(`Dosage: ${req.dosage}`, 10, 30);
    doc.save(`label_${req.id}.pdf`);
  };

  const chartData = [
    { name: 'Adherence', value: 85 },
    { name: 'Non-Adherence', value: 15 },
  ];
  const COLORS = ['#10b981', '#ef4444'];

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
          submitted_at: doc.data().submitted_at 
        } as PrescriptionRequest))
        .filter(r => !isFakeOrFalseRow(r));
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="text-indigo-600" />
          Dispensary Dashboard
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={20}/> Patient Adherence</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={60}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle size={20}/> Stock Alerts</h3>
          {inventory.filter(i => i.stock < 20).map(i => (
            <div key={i.name} className="p-2 bg-amber-50 text-amber-700 rounded mb-2">Low Stock: {i.name} ({i.stock} remaining)</div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-bold flex items-center gap-2">
            <FileText size={18}/> Prescription Requests (1.1.1.a - 1.1.1.z.4)
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-4 text-center">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No pending requests found.</div>
            ) : (
              requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{req.medication} - MRN: {req.patient_mrn}</p>
                    <p className="text-xs text-gray-500">{req.dosage} | Submitted: {req.submitted_at?.toString() || 'Recently'}</p>
                  </div>
                  <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => generateLabel(req)} className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded transition-colors" title="Print QR Label"><QrCode size={16}/></button>
                    {req.status === 'pending' ? (
                      <button onClick={() => handleDispense(req)} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors" title="Dispense Medication"><CheckCircle2 size={16}/></button>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 size={14}/> DISPENSED</span>
                    )}
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedRequest ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5">
                <Pill size={16} className="text-indigo-600" /> Selected Prescription Detail
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong>Patient:</strong> {selectedRequest.patient_name}</p>
                <p><strong>MRN:</strong> {selectedRequest.patient_mrn}</p>
                <p><strong>Medication:</strong> {selectedRequest.medication}</p>
                <p><strong>Dosage:</strong> {selectedRequest.dosage}</p>
                <p><strong>Status:</strong> <span className={`font-semibold ${selectedRequest.status === 'dispensed' ? 'text-green-600' : 'text-amber-600'}`}>{selectedRequest.status.toUpperCase()}</span></p>
              </div>
            </div>
          ) : null}

          <PatientClinicalFolderViewer 
            patientMrn={selectedRequest?.patient_mrn || ''} 
            patientName={selectedRequest?.patient_name}
            sourceModule="Dispensary"
            autoLogText={selectedRequest ? `Dispensed ${selectedRequest.medication} (${selectedRequest.dosage}) to patient ${selectedRequest.patient_name}.` : ''}
            appendButtonLabel="Log Dispense Confirm"
          />
        </div>
      </div>
    </div>
  );
};
