import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Activity, Thermometer, Heart, Wind } from 'lucide-react';

interface VitalsModalProps {
  patientMrn: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VitalsModal({ patientMrn, patientName, isOpen, onClose }: VitalsModalProps) {
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && patientMrn) {
      fetchLatestVitals();
    }
  }, [isOpen, patientMrn]);

  const fetchLatestVitals = async () => {
    setLoading(true);
    try {
      // Query the form_1_1_1_b collection for the most recent vitals for this MRN
      const vitalsRef = collection(db, 'form_1_1_1_b');
      const q = query(
        vitalsRef,
        where('patient_mrn', '==', patientMrn),
        orderBy('createdAt', 'desc'), // Assuming createdAt is stored as serverTimestamp
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setVitals(snapshot.docs[0].data());
      } else {
        // Fallback to older fields or different ordering if createdAt is not available
        const qAlt = query(
          vitalsRef,
          where('patient_mrn', '==', patientMrn),
          limit(5) // Get a few to manually sort if needed
        );
        const snapshotAlt = await getDocs(qAlt);
        if (!snapshotAlt.empty) {
          const sorted = snapshotAlt.docs.map(doc => doc.data()).sort((a, b) => {
             const dateA = new Date(a.createdAt || a.date || 0).getTime();
             const dateB = new Date(b.createdAt || b.date || 0).getTime();
             return dateB - dateA;
          });
          setVitals(sorted[0]);
        } else {
          setVitals(null);
        }
      }
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setVitals(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="space-y-0.5">
            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
              Clinical Vitals
            </span>
            <h4 className="font-black text-slate-900 text-sm">
              Latest Vitals: {patientName}
            </h4>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Fetching latest records...</p>
            </div>
          ) : vitals ? (
            <div className="grid grid-cols-2 gap-4">
              {/* BP */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center">
                <Activity size={20} className="text-rose-500 mb-2" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Blood Pressure</span>
                <span className="text-lg font-black text-slate-900">{vitals.bp || vitals.vitals_bp || 'N/A'}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">mmHg</span>
              </div>

              {/* Heart Rate */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center">
                <Heart size={20} className="text-rose-500 mb-2 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Heart Rate</span>
                <span className="text-lg font-black text-slate-900">{vitals.pulse || vitals.vitals_pulse || 'N/A'}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">BPM</span>
              </div>

              {/* Temperature */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center">
                <Thermometer size={20} className="text-orange-500 mb-2" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temperature</span>
                <span className="text-lg font-black text-slate-900">{vitals.temp || vitals.vitals_temp || 'N/A'}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">°C</span>
              </div>

              {/* RR */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center">
                <Wind size={20} className="text-indigo-500 mb-2" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Respiration</span>
                <span className="text-lg font-black text-slate-900">{vitals.rr || vitals.vitals_rr || 'N/A'}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">BPM</span>
              </div>

              <div className="col-span-2 mt-2 pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                  Recorded on: {vitals.createdAt?.toDate ? vitals.createdAt.toDate().toLocaleString() : vitals.date || 'Unknown date'}
                </p>
                <p className="text-[9px] text-slate-300 mt-1 uppercase tracking-tight font-black">
                  Clinical Integration Hub • Verified Entry
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="p-3 bg-amber-50 rounded-full text-amber-500 mb-3 border border-amber-100">
                <Activity size={24} />
              </div>
              <h5 className="text-xs font-bold text-slate-900">No Vitals Found</h5>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                We couldn't find any vital sign records for this patient (MRN: {patientMrn}) in the clinical module.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-200 transition-all cursor-pointer"
          >
            Close Vitals View
          </button>
        </div>
      </div>
    </div>
  );
}
