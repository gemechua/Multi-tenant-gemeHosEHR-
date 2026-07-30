import React, { useState, useEffect } from 'react';
import { Activity, Pill, FileText, FlaskConical, ArrowLeft, Download } from 'lucide-react';
import { subscribeToPatientData, Patient } from '../lib/patientData';
import { DocumentData } from 'firebase/firestore';

interface PatientDashboardProps {
  patientMrn: string;
  onClose: () => void;
}

export default function PatientDashboard({ patientMrn, onClose }: PatientDashboardProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<DocumentData[]>([]);
  const [encounters, setEncounters] = useState<DocumentData[]>([]);
  const [labResults, setLabResults] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPatientData(
        patientMrn,
        (p) => { setPatient(p); setLoading(false); },
        setMedications,
        setEncounters,
        setLabResults
    );

    return unsubscribe;
  }, [patientMrn]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found.</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 h-full overflow-y-auto">
        {/* Header with buttons */}
        <div className="flex justify-between items-center mb-6 print:hidden">
            <button onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900">
                <ArrowLeft size={16} /> Back to List
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-900">
                <Download size={16} /> Download Health Summary
            </button>
        </div>
        
        {/* Print-only header */}
        <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-xl font-bold">Health Facility Record</h1>
          <p className="text-sm">Patient Health Summary - Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Demographics */}
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h2 className="text-2xl font-black text-gray-950 mb-1">{patient.full_name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                <div><span className="font-bold text-gray-400">MRN:</span> {patient.mrn}</div>
                <div><span className="font-bold text-gray-400">DOB:</span> {patient.date_of_birth}</div>
                <div><span className="font-bold text-gray-400">Gender:</span> {patient.gender}</div>
                <div><span className="font-bold text-gray-400">Phone:</span> {patient.phone}</div>
            </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medications */}
            <div className="p-4 border border-gray-100 rounded-xl">
                <h3 className="flex items-center gap-2 font-bold mb-4 text-indigo-900"><Pill size={18} /> Active Medications</h3>
                {medications.length === 0 ? <p className="text-xs text-gray-400">No active medications.</p> :
                 medications.map(m => <div key={m.id} className="text-xs p-2 bg-indigo-50/50 mb-2 rounded">{m.items}</div>)}
            </div>
            
            {/* Clinical History */}
            <div className="p-4 border border-gray-100 rounded-xl">
                <h3 className="flex items-center gap-2 font-bold mb-4 text-indigo-900"><FileText size={18} /> Clinical History</h3>
                {encounters.length === 0 ? <p className="text-xs text-gray-400">No encounters found.</p> :
                 encounters.map(e => <div key={e.id} className="text-xs p-2 border-b border-gray-50 mb-2">{e.encounter_type} - {e.created_at}</div>)}
            </div>

            {/* Labs */}
            <div className="p-4 border border-gray-100 rounded-xl md:col-span-2">
                <h3 className="flex items-center gap-2 font-bold mb-4 text-indigo-900"><FlaskConical size={18} /> Lab Results</h3>
                {labResults.length === 0 ? <p className="text-xs text-gray-400">No lab results found.</p> :
                 <table className="w-full text-xs">
                     <thead><tr className="text-gray-400 border-b"><th className="text-left pb-2">Test</th><th className="text-left pb-2">Result</th></tr></thead>
                     <tbody>{labResults.map(r => <tr key={r.id}><td className="py-2">{r.test_type}</td><td className="py-2">{r.status}</td></tr>)}</tbody>
                 </table>}
            </div>
        </div>
        {/* Footer with signature section */}
        <div className="hidden print:block mt-12 border-t border-gray-300 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>Reported by: ________________</p>
            <p>Department: ________________</p>
            <p>Month: ________________</p>
            <p>Year: ________________</p>
            <p>Phone number: ________________</p>
            <p>Sign: ________________</p>
          </div>
        </div>
    </div>
  );
}
