import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Activity, ShieldCheck, HeartPulse, Thermometer, User, ClipboardList, Send,
  Stethoscope, BedDouble, PlusCircle, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface TriageFormProps {
  patientData?: {
    id?: string;
    mrn: string;
    name: string;
    age: string;
    gender: string;
    workflowId?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TriageForm({ patientData, onSuccess, onCancel }: TriageFormProps) {
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [respRate, setRespRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [painScore, setPainScore] = useState('0');
  const [priority, setPriority] = useState('Green');
  const [complaint, setComplaint] = useState('');
  const [history, setHistory] = useState('');
  const [opdDest, setOpdDest] = useState('OPD Unit 1');
  const [targetPortal, setTargetPortal] = useState<'outpatient_doc' | 'inpatient_doc'>('outpatient_doc');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData) return;

    setLoading(true);
    try {
      // 1. Save data under the official 1.1.1.a Clinical Pre-Triage collection
      const preTriageDocRef = await addDoc(collection(db, 'form_1_1_1_a'), {
        hospital_id: 'HOSP_CENTRAL_01',
        patient_mrn: patientData.mrn,
        patient_name: patientData.name,
        date: new Date().toISOString(),
        bp,
        pulse,
        temp,
        respRate,
        spo2,
        painScore: Number(painScore),
        priority,
        complaint,
        history,
        allocatedOpd: opdDest,
        portalRouted: targetPortal,
        createdAt: serverTimestamp()
      });

      // 2. If it is passed with active workflow ID, update that workflow state directly
      if (patientData.workflowId) {
        const wfRef = doc(db, 'patient_workflows', patientData.workflowId);
        await updateDoc(wfRef, {
          stage: targetPortal,
          substage: targetPortal === 'outpatient_doc' 
            ? `Outpatient Doctor: Assigned to ${opdDest} via 1.1.1.a`
            : `Inpatient Doctor: Assigned via 1.1.1.a`,
          preTriageVitals: {
            bp,
            pulse,
            temp,
            priority,
            complaint
          },
          centralTriageDest: opdDest,
          clinicalDiagnosis: history ? `Pre-Triage: ${history}` : '',
          updatedAt: serverTimestamp()
        });
      }

      setSuccessMsg(`🎉 1.1.1.a Pre-Triage Screening successfully finalized & shared with ${targetPortal === 'outpatient_doc' ? 'Outpatient Physician' : 'Inpatient Doctor'}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2500);
    } catch (err) {
      console.error('Error saving 1.1.1.a triage document:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-3xs space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-mono tracking-wider">
            Clinical Schema 1.1.1.a
          </span>
          <h3 className="text-base font-black text-gray-900 tracking-tight mt-1 flex items-center gap-1.5">
            <ClipboardList className="text-indigo-600" size={18} />
            Specialized Pre-Triage Screening Intake
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Document patient vitals, clinical priorities, complaints, and route to specific clinical portals.
          </p>
        </div>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {successMsg ? (
        <div className="p-6 text-center space-y-3 bg-emerald-50/50 border border-emerald-150 rounded-xl">
          <ShieldCheck className="text-emerald-500 mx-auto animate-bounce" size={40} />
          <p className="text-xs text-emerald-950 font-bold font-mono">{successMsg}</p>
          <p className="text-[10px] text-emerald-600">Updating live clinical charts in real-time...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Card Data Passed */}
          {patientData && (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-wrap justify-between items-center text-xs gap-2">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                <span className="font-semibold text-gray-700">Patient:</span>
                <strong className="text-gray-950">{patientData.name}</strong>
              </div>
              <div className="flex items-center gap-4">
                <span>Age/Gender: <strong>{patientData.age} / {patientData.gender}</strong></span>
                <span className="bg-indigo-100/70 text-indigo-800 px-2 py-0.5 rounded font-mono text-[10px] font-bold">MRN: {patientData.mrn}</span>
              </div>
            </div>
          )}

          {/* Vitals Form Section */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">1. Patient Vital Signs Indicators</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  <Activity size={10} className="text-rose-500" /> Blood Pressure
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 120/80" 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg focus:outline-none"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  <HeartPulse size={10} className="text-rose-500" /> Pulse Rate
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 72 bpm" 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg focus:outline-none"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  <Thermometer size={10} className="text-amber-500" /> Temperature
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 36.5 °C" 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg focus:outline-none"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  <Activity size={10} className="text-blue-500" /> Resp. Rate
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 18 /min" 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg focus:outline-none"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  <Activity size={10} className="text-teal-500" /> SpO2 (%)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 98%" 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg focus:outline-none"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Core Clinical details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 block">Triage Priority Screening Category</label>
              <select 
                className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50 rounded-lg outline-none font-bold"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Green">💚 Green Level (Routine / Non-Urgent)</option>
                <option value="Yellow">💛 Yellow Level (Delayed / Urgent)</option>
                <option value="Red">❤️ Red Level (Immediate / Emergency / Trauma)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 block">Subjective Pain Score (0-10)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={painScore}
                  onChange={(e) => setPainScore(e.target.value)}
                />
                <span className="text-xs font-black font-mono text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded">
                  Score: {painScore}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 block">Chief Complaint *</label>
              <textarea 
                placeholder="List major subjective symptoms, duration, and patient reasons for clinic consult..."
                className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={2}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 block">History of Present Illness (HPI) Summary</label>
              <textarea 
                placeholder="Describe relevant past medical history, current chronic comorbidities, and active prescriptions..."
                className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={2}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
              />
            </div>
          </div>

          {/* Allocation Routing Targets */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-4">
            <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider font-mono">2. Clinical Destination Portal Allocation</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-indigo-950 block">Allocate Target OPD Consultation Unit</label>
                <select 
                  className="w-full p-2 border border-indigo-200 bg-white rounded-lg outline-none font-medium"
                  value={opdDest}
                  onChange={(e) => setOpdDest(e.target.value)}
                >
                  {Array.from({ length: 16 }, (_, i) => `OPD Unit ${i + 1}`).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-indigo-950 block">Target Clinical Portal Sharing Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetPortal('outpatient_doc')}
                    className={`flex-1 py-2 rounded-lg font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${targetPortal === 'outpatient_doc' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200'}`}
                  >
                    <Stethoscope size={12} />
                    <span>Outpatient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetPortal('inpatient_doc')}
                    className={`flex-1 py-2 rounded-lg font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${targetPortal === 'inpatient_doc' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200'}`}
                  >
                    <BedDouble size={12} />
                    <span>Inpatient</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={12} />
              ) : (
                <Send size={12} />
              )}
              <span>Finalize Form & Route to Portal</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
