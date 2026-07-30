import React, { useState, useEffect } from 'react';
import { History, Clock, Pill, Calendar, UserCheck, ShieldCheck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PatientPrescriptionHistoryProps {
  mrn: string;
  patientName?: string;
  onClose?: () => void;
}

export default function PatientPrescriptionHistory({ mrn, patientName, onClose }: PatientPrescriptionHistoryProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mrn) {
      fetchChronologicalHistory();
    }
  }, [mrn]);

  const fetchChronologicalHistory = async () => {
    setLoading(true);
    const cleanMrn = mrn.trim().toLowerCase();

    try {
      const collections = [
        { col: 'form_1_1_1_m', name: '1.1.1.m Outpatient Rx' },
        { col: 'form_1_1_1_t', name: '1.1.1.t Admitted Inpatient Rx' },
        { col: 'form_1_1_1_z_2', name: '1.1.1.z.2 Discharge Rx Summary' }
      ];

      const results: any[] = [];

      for (const item of collections) {
        try {
          const snap = await getDocs(query(collection(db, item.col), limit(100)));
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const docMrn = (data.patient_mrn || data.mrn || data.patient_id || '').trim().toLowerCase();
            if (docMrn === cleanMrn) {
              results.push({
                id: docSnap.id,
                source_schema: item.name,
                collection_name: item.col,
                ...data
              });
            }
          });
        } catch (colErr) {
          console.warn(`Error querying collection ${item.col}:`, colErr);
        }
      }

      // Sort strictly chronologically by date descending
      results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      setPrescriptions(results);
    } catch (err) {
      console.error('Error fetching patient prescription history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <History size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Chronological Prescription History
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Patient MRN: <span className="font-bold text-emerald-600 dark:text-emerald-400">{mrn}</span>
              {patientName && ` • ${patientName}`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchChronologicalHistory}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Refresh History"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
          Querying 1.1.1.m, 1.1.1.t, and 1.1.1.z.2 prescription records for MRN {mrn}...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <Pill className="mx-auto text-slate-300 dark:text-slate-700" size={28} />
          <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold">No prescription history recorded</p>
          <p className="text-slate-400 text-[11px]">No matching records found in 1.1.1.m, 1.1.1.t, or 1.1.1.z.2 collections.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {prescriptions.map((rx, idx) => (
            <div key={rx.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold text-[10px]">
                  {rx.source_schema || 'Prescription Submission'}
                </span>
                <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                  <Clock size={11} />
                  {rx.date ? new Date(rx.date).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Management / Treatment For:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {rx.management_or_treatment_for || rx.diagnosis || rx.diagnosed || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Facility / Ward:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {rx.ward_name || rx.hospital_id || 'Main Hospital'}
                  </span>
                </div>
              </div>

              {/* Medication Details Box */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center justify-between">
                  <span>Prescribed Medications</span>
                  {rx.is_chronic && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md">Chronic Treatment</span>
                  )}
                </div>

                {Array.isArray(rx.medications) && rx.medications.length > 0 ? (
                  <div className="space-y-1 pt-0.5">
                    {rx.medications.map((m: any, mIdx: number) => (
                      <div key={mIdx} className="flex flex-wrap items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800 p-2 rounded-lg gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{m.prescribed_drugs || m.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                          Dose: <strong>{m.dose === 'other specific' ? m.dose_other_specific : m.dose}</strong> |
                          Route: <strong>{m.route === 'other specific' ? m.route_other_specific : m.route}</strong> |
                          Freq: <strong>{m.frequency === 'other specific' ? m.frequency_other_specific : m.frequency}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between text-[11px] pt-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{rx.prescribed_drugs || rx.discharge_prescription || '—'}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      Dose: <strong>{rx.dose === 'other specific' ? rx.dose_other_specific : rx.dose || '—'}</strong> |
                      Route: <strong>{rx.route === 'other specific' ? rx.route_other_specific : rx.route || '—'}</strong> |
                      Freq: <strong>{rx.frequency === 'other specific' ? rx.frequency_other_specific : rx.frequency || '—'}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <span>Prescribed by: <strong className="text-slate-700 dark:text-slate-300">{rx.prescribed_by || 'Staff MD'}</strong></span>
                <span>Approved by: <strong className="text-slate-700 dark:text-slate-300">{rx.approved_by || 'Pharmacy Staff'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
