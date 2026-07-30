import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Bed, User, ShieldCheck, RefreshCw, Layers, ArrowLeftRight, Check, X, CheckCircle, FlameKindling
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InpatientPatient {
  id: string;
  name: string;
  mrn: string;
  age: string;
  gender: string;
  bedAssigned?: string;
  clinicalDiagnosis?: string;
}

interface BedInfo {
  id: string;
  name: string;
  ward: 'Ward A (Internal Med)' | 'Ward B (ICU Block)' | 'Ward C (Pediatrics)';
  status: 'available' | 'occupied' | 'cleaning';
  occupant?: InpatientPatient;
}

export default function BedManagement() {
  const [patientsWaiting, setPatientsWaiting] = useState<InpatientPatient[]>([]);
  const [beds, setBeds] = useState<BedInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<BedInfo | null>(null);
  const [selectedAdmittingPatientId, setSelectedAdmittingPatientId] = useState<string>('');
  const [targetBedId, setTargetBedId] = useState<string>('');
  const [transferMode, setTransferMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Default initial bed structure
  const initialBeds: Omit<BedInfo, 'occupant'>[] = [
    { id: 'wa-1', name: 'Bed 1', ward: 'Ward A (Internal Med)', status: 'available' },
    { id: 'wa-2', name: 'Bed 2', ward: 'Ward A (Internal Med)', status: 'available' },
    { id: 'wa-3', name: 'Bed 3', ward: 'Ward A (Internal Med)', status: 'available' },
    { id: 'wa-4', name: 'Bed 4', ward: 'Ward A (Internal Med)', status: 'available' },
    { id: 'wa-5', name: 'Bed 5', ward: 'Ward A (Internal Med)', status: 'available' },
    { id: 'wa-6', name: 'Bed 6', ward: 'Ward A (Internal Med)', status: 'available' },
    
    { id: 'wb-1', name: 'Bed 1', ward: 'Ward B (ICU Block)', status: 'available' },
    { id: 'wb-2', name: 'Bed 2', ward: 'Ward B (ICU Block)', status: 'available' },
    { id: 'wb-3', name: 'Bed 3', ward: 'Ward B (ICU Block)', status: 'available' },
    { id: 'wb-4', name: 'Bed 4', ward: 'Ward B (ICU Block)', status: 'available' },
    
    { id: 'wc-1', name: 'Bed 1', ward: 'Ward C (Pediatrics)', status: 'available' },
    { id: 'wc-2', name: 'Bed 2', ward: 'Ward C (Pediatrics)', status: 'available' },
    { id: 'wc-3', name: 'Bed 3', ward: 'Ward C (Pediatrics)', status: 'available' },
    { id: 'wc-4', name: 'Bed 4', ward: 'Ward C (Pediatrics)', status: 'available' },
  ];

  useEffect(() => {
    // 1. Listen to active inpatient workflows to populate beds and waiting queue
    const unsub = onSnapshot(collection(db, 'patient_workflows'), (snapshot) => {
      const activeInpatients: InpatientPatient[] = [];
      const waitingAdmission: InpatientPatient[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const p: InpatientPatient = {
          id: docSnap.id,
          name: data.name || 'Unknown Patient',
          mrn: data.mrn,
          age: data.age || '',
          gender: data.gender || '',
          bedAssigned: data.bedAssigned || '',
          clinicalDiagnosis: data.clinicalDiagnosis || '',
        };

        if (data.stage === 'inpatient_doc' || (data.stage === 'liaison' && data.bedAssigned)) {
          activeInpatients.push(p);
        } else if (data.stage === 'liaison' && !data.bedAssigned && data.paymentStatus === 'paid') {
          waitingAdmission.push(p);
        }
      });

      setPatientsWaiting(waitingAdmission);

      // 2. Map occupied patients onto the initial Bed Layout
      const updatedBeds = initialBeds.map((bedDef) => {
        // Find if any active patient has been assigned to this bed
        // To be safe, look for bed match with standard formatted names
        const formattedBedString = `${bedDef.ward} - ${bedDef.name}`;
        const occupantMatch = activeInpatients.find(
          (act) => act.bedAssigned === formattedBedString || act.bedAssigned?.includes(bedDef.name) && act.bedAssigned?.includes(bedDef.ward.split(' ')[1])
        );

        if (occupantMatch) {
          return {
            ...bedDef,
            status: 'occupied' as const,
            occupant: occupantMatch,
          };
        }

        // Just check random seeding for other beds to look full in visual UI
        return {
          ...bedDef,
          status: (bedDef.id === 'wa-4' ? 'cleaning' : 'available') as any,
        };
      });

      setBeds(updatedBeds);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to patient workflows for beds:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAssignBed = async (bed: BedInfo, patientId: string) => {
    if (!patientId) return;
    const targetPatient = patientsWaiting.find(p => p.id === patientId);
    if (!targetPatient) return;

    try {
      const formattedBedString = `${bed.ward} - ${bed.name}`;
      const wfRef = doc(db, 'patient_workflows', patientId);
      
      await updateDoc(wfRef, {
        stage: 'inpatient_doc',
        substage: `Inpatient Ward: Admitted & Assigned to ${formattedBedString}`,
        bedAssigned: formattedBedString,
        updatedAt: serverTimestamp()
      });

      triggerNotify(`🛏️ Admitted & Assigned: ${targetPatient.name} placed in ${bed.name} of ${bed.ward}.`);
      setSelectedBed(null);
      setSelectedAdmittingPatientId('');
    } catch (err) {
      console.error('Error assigning bed:', err);
      triggerNotify('❌ Failed to assign bed space.');
    }
  };

  const handleTransferPatient = async (sourceBed: BedInfo, destBedId: string) => {
    if (!destBedId || !sourceBed.occupant) return;
    const destBed = beds.find(b => b.id === destBedId);
    if (!destBed || destBed.status !== 'available') return;

    try {
      const patient = sourceBed.occupant;
      const formattedBedString = `${destBed.ward} - ${destBed.name}`;
      const wfRef = doc(db, 'patient_workflows', patient.id);

      await updateDoc(wfRef, {
        bedAssigned: formattedBedString,
        substage: `Inpatient Ward: Transferred to ${formattedBedString}`,
        updatedAt: serverTimestamp()
      });

      triggerNotify(`🔄 Transferred: ${patient.name} moved successfully from ${sourceBed.name} to ${destBed.name}.`);
      setSelectedBed(null);
      setTargetBedId('');
      setTransferMode(false);
    } catch (err) {
      console.error('Error transferring patient:', err);
      triggerNotify('❌ Failed to complete patient transfer.');
    }
  };

  const handleReleaseBed = async (bed: BedInfo) => {
    if (!bed.occupant) return;
    try {
      const patient = bed.occupant;
      const wfRef = doc(db, 'patient_workflows', patient.id);

      await updateDoc(wfRef, {
        stage: 'liaison',
        substage: 'Liaison: Discharged from Ward Bed space. Formulating summary.',
        bedAssigned: '',
        updatedAt: serverTimestamp()
      });

      triggerNotify(`🧹 Released: ${bed.name} cleared. Patient ${patient.name} prepared for discharge summary.`);
      setSelectedBed(null);
    } catch (err) {
      console.error('Error releasing bed:', err);
    }
  };

  const toggleCleaning = (bed: BedInfo) => {
    const updated = beds.map(b => {
      if (b.id === bed.id) {
        return {
          ...b,
          status: b.status === 'cleaning' ? 'available' as const : 'cleaning' as const
        };
      }
      return b;
    });
    setBeds(updated);
    triggerNotify(`🧼 ${bed.name} status updated successfully.`);
    setSelectedBed(null);
  };

  // Group beds by Wards
  const wards = [
    { title: 'Ward A (Internal Med)', style: 'border-blue-100 bg-blue-50/20 text-blue-900', key: 'Ward A (Internal Med)' },
    { title: 'Ward B (ICU Block)', style: 'border-purple-100 bg-purple-50/20 text-purple-900', key: 'Ward B (ICU Block)' },
    { title: 'Ward C (Pediatrics)', style: 'border-emerald-100 bg-emerald-50/20 text-emerald-900', key: 'Ward C (Pediatrics)' },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Alerts */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle size={16} className="text-emerald-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Grid Wards Tracker */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 border border-gray-150 rounded-2xl">
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                <Bed className="text-emerald-600" size={18} />
                Interactive Bed Allocation Board
              </h3>
              <p className="text-[11px] text-gray-500">Real-time occupancy tracking across active clinical care wings.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-600 block"></span> Admitted</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span> Cleaning</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="animate-spin text-indigo-500 mx-auto" size={24} />
              <p className="text-xs text-gray-400 mt-2 font-medium">Synchronizing ward assets...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {wards.map((wd) => {
                const wardBeds = beds.filter(b => b.ward === wd.key);
                const occupiedCount = wardBeds.filter(b => b.status === 'occupied').length;
                const cleaningCount = wardBeds.filter(b => b.status === 'cleaning').length;
                const availableCount = wardBeds.length - occupiedCount - cleaningCount;

                return (
                  <div key={wd.key} className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-gray-900 tracking-tight font-mono uppercase">{wd.title}</h4>
                        <span className="text-[10px] text-gray-400 font-bold block">Capacity: {wardBeds.length} Clinical Beds</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150">{availableCount} Free</span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">{occupiedCount} Admitted</span>
                        {cleaningCount > 0 && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-150">{cleaningCount} Maint</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {wardBeds.map((bed) => (
                        <button
                          key={bed.id}
                          onClick={() => setSelectedBed(bed)}
                          className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all relative hover:scale-[1.02] cursor-pointer ${
                            bed.status === 'occupied' 
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' 
                              : bed.status === 'cleaning' 
                              ? 'bg-amber-50/40 border-amber-200 text-amber-900' 
                              : 'bg-slate-50/30 border-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-black font-mono">{bed.name}</span>
                            <Bed size={14} className={
                              bed.status === 'occupied' ? 'text-indigo-600' : bed.status === 'cleaning' ? 'text-amber-500' : 'text-slate-400'
                            } />
                          </div>

                          <div className="mt-2 text-left w-full overflow-hidden">
                            {bed.status === 'occupied' && bed.occupant ? (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black block truncate text-gray-900">{bed.occupant.name}</span>
                                <span className="text-[8px] font-mono font-bold block text-indigo-600/80 truncate">MRN: {bed.occupant.mrn}</span>
                              </div>
                            ) : bed.status === 'cleaning' ? (
                              <span className="text-[9px] font-bold text-amber-600 block uppercase tracking-wider font-mono">Cleaning</span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider font-mono">Available</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Controls Panel */}
        <div className="space-y-6">
          {/* Patients Awaiting Bed Placement */}
          <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <User size={12} className="text-indigo-600" />
              Admission Queue ({patientsWaiting.length})
            </h4>
            <p className="text-[10px] text-gray-500">Admissions approved & paid. Ready for immediate bed placement.</p>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {patientsWaiting.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-gray-400 font-medium border border-dashed rounded-xl">
                  No pending admissions.
                </div>
              ) : (
                patientsWaiting.map((pat) => (
                  <div key={pat.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-start text-[11px]">
                      <strong className="text-gray-900 font-bold block">{pat.name}</strong>
                      <span className="text-[9px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 rounded font-bold">MRN: {pat.mrn}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 truncate">Diagnosis: {pat.clinicalDiagnosis || 'Non-specified'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detailed Bed Management Panel */}
          {selectedBed && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest">{selectedBed.ward}</span>
                  <h4 className="text-sm font-black text-white">{selectedBed.name} Detailed Console</h4>
                </div>
                <button onClick={() => { setSelectedBed(null); setTransferMode(false); }} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
              </div>

              {transferMode ? (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase block font-mono">Transfer Occupant</span>
                  <p className="text-[10px] text-slate-300">Move patient <strong>{selectedBed.occupant?.name}</strong> to an available bed:</p>
                  <select 
                    className="w-full p-2 border border-slate-700 bg-slate-850 text-xs rounded text-white"
                    value={targetBedId}
                    onChange={(e) => setTargetBedId(e.target.value)}
                  >
                    <option value="">-- Choose Target Bed --</option>
                    {beds.filter(b => b.status === 'available').map(b => (
                      <option key={b.id} value={b.id}>{b.ward} - {b.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTransferMode(false)} 
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleTransferPatient(selectedBed, targetBedId)}
                      disabled={!targetBedId}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-xs font-bold rounded cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowLeftRight size={12} />
                      <span>Confirm Move</span>
                    </button>
                  </div>
                </div>
              ) : selectedBed.status === 'occupied' && selectedBed.occupant ? (
                <div className="space-y-4 pt-1">
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-indigo-400 font-mono uppercase block">Active Occupant Detail</span>
                    <strong className="text-xs text-white block">{selectedBed.occupant.name}</strong>
                    <div className="text-[10px] text-slate-300 flex justify-between">
                      <span>MRN: {selectedBed.occupant.mrn}</span>
                      <span>Age/Sex: {selectedBed.occupant.age}/{selectedBed.occupant.gender}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Diagnosis: {selectedBed.occupant.clinicalDiagnosis || 'Non-specified'}</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => setTransferMode(true)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeftRight size={13} />
                      <span>Initiate Patient Transfer</span>
                    </button>
                    <button
                      onClick={() => handleReleaseBed(selectedBed)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X size={13} className="text-rose-500" />
                      <span>Release & Clean Bed</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {selectedBed.status === 'cleaning' ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-900/30 border border-amber-800 text-amber-300 rounded-xl text-[11px] font-bold">
                        🧼 This bed is currently in Maintenance / Disinfection.
                      </div>
                      <button
                        onClick={() => toggleCleaning(selectedBed)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-white"
                      >
                        <Check size={14} />
                        <span>Ready For Patients</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Assign Patient Space</span>
                      <p className="text-[11px] text-slate-300">Choose a waiting patient to allocate to {selectedBed.name}:</p>
                      <select 
                        className="w-full p-2 border border-slate-700 bg-slate-800 text-xs rounded text-white"
                        value={selectedAdmittingPatientId}
                        onChange={(e) => setSelectedAdmittingPatientId(e.target.value)}
                      >
                        <option value="">-- Choose Patient --</option>
                        {patientsWaiting.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCleaning(selectedBed)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded text-amber-500 cursor-pointer"
                        >
                          Set Cleaning
                        </button>
                        <button
                          onClick={() => handleAssignBed(selectedBed, selectedAdmittingPatientId)}
                          disabled={!selectedAdmittingPatientId}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950 text-xs font-bold rounded text-white cursor-pointer"
                        >
                          Assign Bed
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
