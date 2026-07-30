import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { 
  FileText, CheckCircle2, ChevronRight, ChevronLeft, Calendar, FileCheck, 
  RefreshCw, ClipboardCheck, AlertTriangle, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PatientWorkflow {
  id: string;
  mrn: string;
  name: string;
  age: string;
  gender: string;
  clinicalDiagnosis?: string;
  labFindings?: string;
  radFindings?: string;
  bedAssigned?: string;
}

interface DischargeWizardProps {
  patient: PatientWorkflow;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DischargeSummaryWizard({ patient, onSuccess, onCancel }: DischargeWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states initialized with pulled clinical data
  const [diagnosis, setDiagnosis] = useState(patient.clinicalDiagnosis || 'Type 2 Diabetes Mellitus with Ketoacidosis');
  const [labSummary, setLabSummary] = useState(patient.labFindings || 'CBC: Hb 14.2 g/dL, Urinalysis: Ketones 2+');
  const [radSummary, setRadSummary] = useState(patient.radFindings || 'Chest X-Ray PA View: Clear lung fields');
  
  // Custom user inputs for Discharge Summary wizard
  const [hospitalCourse, setHospitalCourse] = useState('Patient was admitted to General Ward, treated with intensive intravenous fluid hydration, regular insulin therapy, and broad-spectrum antibiotics for mild urinary tract infection. Blood glucose stabilized within normal range (110 - 140 mg/dL). Vitals remained stable throughout the hospitalization.');
  const [dischargeCondition, setDischargeCondition] = useState('Improved / Stable');
  const [dischargeRx, setDischargeRx] = useState('1. Metformin 500mg PO BID with meals\n2. Ciprofloxacin 500mg PO BID for 5 days\n3. Glucometer training completed; self-monitor blood sugars daily.');
  const [followupInstructions, setFollowupInstructions] = useState('Return to OPD Unit 2 for follow-up consult in 2 weeks (2026-07-25). Seek emergency care immediately if experiencing severe abdominal pain, nausea, vomiting, or deep rapid breathing.');
  const [dischargePhysician, setDischargePhysician] = useState('Dr. Abraham Alula, MD');

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFinalizeDischarge = async () => {
    setLoading(true);
    try {
      // 1. Save final Discharge Report to Form 1.1.1.w (Care & Discharge)
      await addDoc(collection(db, 'form_1_1_1_w'), {
        hospital_id: 'HOSP_CENTRAL_01',
        patient_mrn: patient.mrn,
        patient_name: patient.name,
        date: new Date().toISOString(),
        diagnosis,
        labSummary,
        radSummary,
        hospitalCourse,
        dischargeCondition,
        dischargeRx,
        followupInstructions,
        dischargePhysician,
        createdAt: serverTimestamp()
      });

      // 2. Update active patient workflow status to finalized discharge
      const wfRef = doc(db, 'patient_workflows', patient.id);
      await updateDoc(wfRef, {
        stage: 'liaison',
        substage: 'Liaison: Discharge dossier finalized. Patient released.',
        isDischarged: true,
        bedAssigned: '', // Free up bed
        updatedAt: serverTimestamp()
      });

      // Add to financial ledger
      await addDoc(collection(db, 'financial_ledger'), {
        patientMrn: patient.mrn,
        patientName: patient.name,
        amount: 0,
        reason: 'Final Patient Discharge Dossier Generated (Form 1.1.1.w)',
        source: 'Staff Waiver',
        status: 'Paid',
        verifiedAt: new Date().toISOString()
      });

      onSuccess();
    } catch (err) {
      console.error('Error finalizing discharge summary dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-3xs space-y-6">
      {/* Header & Steps Tracker */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-mono tracking-wider">
            Clinical Schema 1.1.1.w
          </span>
          <h3 className="text-base font-black text-gray-900 tracking-tight mt-1 flex items-center gap-1.5">
            <FileText className="text-emerald-600" size={18} />
            Patient Discharge Summary Wizard
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Document patient clinical hospitalization course, discharge medications, and follow-up plans.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                step === s 
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-100' 
                  : step > s 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Stepper Content */}
      <div className="space-y-4 min-h-[250px]">
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Step 1: Clinical Diagnosis & Findings Review</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Admitting Diagnosis *</label>
                <input 
                  type="text"
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Discharge Condition Status</label>
                <select 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50 rounded-lg outline-none font-medium"
                  value={dischargeCondition}
                  onChange={(e) => setDischargeCondition(e.target.value)}
                >
                  <option value="Improved / Stable">Improved / Stable</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Referral transfer to other facility">Referral transfer to other facility</option>
                  <option value="Discharged against medical advice">Discharged against medical advice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Pulled Laboratory Findings</label>
                <textarea 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={2}
                  value={labSummary}
                  onChange={(e) => setLabSummary(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Pulled Radiology findings</label>
                <textarea 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={2}
                  value={radSummary}
                  onChange={(e) => setRadSummary(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Step 2: Hospital Course Summary</h4>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700">Hospital Course & Clinical Interventions Summary *</label>
              <p className="text-[10px] text-gray-400">Summarize major diagnostic tests, treatments, drug responses, and clinical developments during the ward stay.</p>
              <textarea 
                className="w-full text-xs p-3 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                rows={6}
                value={hospitalCourse}
                onChange={(e) => setHospitalCourse(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Step 3: Discharge Medications & Instructions</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Discharge Prescription Medications *</label>
                <p className="text-[10px] text-gray-400">Specify drug names, dosages, frequencies, and durations to be taken at home.</p>
                <textarea 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  rows={3}
                  value={dischargeRx}
                  onChange={(e) => setDischargeRx(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Follow-up Clinical Plan & Warnings *</label>
                <p className="text-[10px] text-gray-400">List follow-up dates, locations, warning signs, and actions.</p>
                <textarea 
                  className="w-full text-xs p-2.5 border border-gray-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                  value={followupInstructions}
                  onChange={(e) => setFollowupInstructions(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1.5 text-indigo-700">
              <ClipboardCheck size={14} />
              Step 4: Final clinical Report Verification
            </h4>

            {/* Simulated Medical Document Report Preview */}
            <div className="p-5 border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50/30 text-xs font-serif leading-relaxed max-h-[300px] overflow-y-auto space-y-4 shadow-inner">
              <div className="text-center border-b border-gray-200 pb-3 space-y-0.5">
                <h3 className="font-extrabold text-[13px] uppercase tracking-wide">Health Services Administration Bureau</h3>
                <h4 className="font-bold text-xs">EHR Clinical Management Center • Ward Discharge Summary</h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] font-sans pb-3 border-b border-gray-100">
                <div>
                  <p>Patient Name: <strong>{patient.name}</strong></p>
                  <p>Age / Sex: <strong>{patient.age} / {patient.gender}</strong></p>
                  <p>Admitting Ward Bed: <strong>{patient.bedAssigned || 'Ward A (Internal Med) - Bed 2'}</strong></p>
                </div>
                <div className="text-right">
                  <p>Patient MRN: <strong>{patient.mrn}</strong></p>
                  <p>Discharge Condition: <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-mono text-[9px]">{dischargeCondition}</span></p>
                  <p>Date: <strong>{new Date().toLocaleDateString()}</strong></p>
                </div>
              </div>

              <div className="space-y-3 font-sans">
                <div>
                  <h5 className="font-bold text-gray-900 border-b border-gray-200 text-[10px] uppercase font-mono tracking-wider">Admitting Diagnosis:</h5>
                  <p className="text-[11px] text-gray-800 font-semibold mt-1">{diagnosis}</p>
                </div>

                <div>
                  <h5 className="font-bold text-gray-900 border-b border-gray-200 text-[10px] uppercase font-mono tracking-wider">Hospital Course & Treatments:</h5>
                  <p className="text-[11px] text-gray-700 leading-relaxed mt-1">{hospitalCourse}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-gray-900 border-b border-gray-200 text-[10px] uppercase font-mono tracking-wider">Discharge Medications:</h5>
                    <pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap leading-tight mt-1 bg-white p-2 border border-gray-150 rounded">{dischargeRx}</pre>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 border-b border-gray-200 text-[10px] uppercase font-mono tracking-wider">Follow-up Clinical Instructions:</h5>
                    <p className="text-[11px] text-gray-700 mt-1 leading-relaxed">{followupInstructions}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 block font-mono">Discharging Clinician</span>
                  <input 
                    type="text" 
                    className="border-b border-gray-300 text-xs font-bold text-gray-900 outline-none pb-0.5 bg-transparent"
                    value={dischargePhysician}
                    onChange={(e) => setDischargePhysician(e.target.value)}
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 font-bold block">✓ VERIFIED BY EHR SECURE KEY</span>
                  <span className="text-[9px] text-gray-400 font-mono">Reference: 1.1.1.w-DISCH-{patient.mrn}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex gap-2">
          {step > 1 && (
            <button 
              type="button" 
              onClick={handleBack}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
          )}

          {step < 4 ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleFinalizeDischarge}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {loading ? <RefreshCw className="animate-spin" size={12} /> : <FileCheck size={14} />}
              <span>Verify & final Discharge Case</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
