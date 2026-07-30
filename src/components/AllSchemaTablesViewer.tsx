import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, limit, onSnapshot } from 'firebase/firestore';
import { Database, Search, Plus, RefreshCw, Layers, Table, Check, HelpCircle, FileText, Sparkles } from 'lucide-react';
import { SCHEMA_WORKFLOW_STATIONS } from './RegisterLogbook';

interface AllSchemaTablesViewerProps {
  db: any;
  hospital_id: string;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function AllSchemaTablesViewer({ db, hospital_id, addToast }: AllSchemaTablesViewerProps) {
  const [selectedStation, setSelectedStation] = useState(SCHEMA_WORKFLOW_STATIONS[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [simulating, setSimulating] = useState(false);

  // Fetch records in real-time or via onSnapshot
  useEffect(() => {
    if (!db || !selectedStation) return;
    setLoading(true);
    
    const colRef = collection(db, selectedStation.formId);
    const q = hospital_id 
      ? query(colRef, where('hospital_id', '==', hospital_id), limit(50))
      : query(colRef, limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRecords(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schema table records:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, selectedStation, hospital_id]);

  // Generate realistic seed rows for any chosen station
  const handleSimulateEntry = async () => {
    if (!db || !selectedStation) return;
    setSimulating(true);
    try {
      const randId = Math.floor(Math.random() * 9000) + 1000;
      const names = ["Kassa Belay", "Fatuma Omar", "Chala Kebede", "Aster Tolossa", "Haile Selassie", "Genet Demeke"];
      const clinicians = ["Dr. Alene Kebede (MD)", "Dr. Bethlehem Kebede (MD)", "Dr. Solomon Tadesse (MD)", "Dr. Yared Assefa (Surgeon)"];
      
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomClinician = clinicians[Math.floor(Math.random() * clinicians.length)];
      const mrn = `MRN-2026-${randId}`;

      let simulatedData: any = {
        hospital_id: hospital_id || 'HOSP-DEFAULT',
        patient_mrn: mrn,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };

      // Customize seed row based on the specific schema formId
      switch (selectedStation.formId) {
        case 'Form_1_1_1':
          simulatedData.patient_name = randomName;
          simulatedData.age = Math.floor(Math.random() * 50) + 18;
          simulatedData.gender = Math.random() > 0.5 ? 'Male' : 'Female';
          simulatedData.contact_number = "0911" + Math.floor(Math.random() * 900000) + 100000;
          break;
        case 'Form_1_1_1_0':
          simulatedData.payment_type = "Registration Fee";
          simulatedData.amount = 150;
          simulatedData.status = "Pending";
          break;
        case 'Form_1_1_1_1':
          simulatedData.payment_type = "Registration Fee";
          simulatedData.amount = 150;
          simulatedData.receipt_number = `REC-REG-${randId}`;
          simulatedData.status = "Verified";
          break;
        case 'Form_1_1_1_a':
          simulatedData.temp = 37.2;
          simulatedData.bp = "120/80";
          simulatedData.screening_notes = "Normal ambulatory condition, patient alert and oriented.";
          break;
        case 'Form_1_1_1_b':
          simulatedData.triage_priority = "Yellow (Urgent)";
          simulatedData.hr = 88;
          simulatedData.spo2 = 96;
          simulatedData.temp = 38.1;
          simulatedData.rr = 20;
          break;
        case 'Form_1_1_1_c':
          simulatedData.clinical_history = "Patient reports mild headache, persistent low-grade fever for 3 days, and general joint fatigue.";
          simulatedData.allergies = "None declared";
          break;
        case 'Form_1_1_1_d':
          simulatedData.clinical_assessment = "Abdomen soft and non-tender. Lungs clear to auscultation bilaterally. Heart rate regular.";
          break;
        case 'Form_1_1_1_e':
          simulatedData.diagnosis_notes = "Acute Pharyngitis vs Mild Respiratory Tract infection.";
          simulatedData.icd10_code = "J02.9";
          break;
        case 'Form_1_1_1_f':
          simulatedData.investigation_type = "Complete Blood Count (CBC) & Malaria Smear";
          simulatedData.priority = "Urgent";
          break;
        case 'Form_1_1_1_g':
          simulatedData.investigation_type = "Laboratory Tests Payment";
          simulatedData.amount = 320;
          simulatedData.status = "Pending";
          break;
        case 'Form_1_1_1_h':
          simulatedData.radiology_type = "Chest X-Ray PA View";
          simulatedData.notes = "Suspected Lobar Pneumonia";
          break;
        case 'Form_1_1_1_i':
          simulatedData.radiology_type = "X-Ray PA View Payment";
          simulatedData.amount = 450;
          simulatedData.status = "Pending";
          break;
        case 'Form_1_1_1_m':
          simulatedData.prescription_medication = "Amoxicillin 500mg (PO) TID x 7 days & Paracetamol 500mg PRN";
          simulatedData.dispense_status = "Pending Pharmacy Billing";
          break;
        case 'Form_1_1_1_q':
          simulatedData.admitted_ward = ["surgical ward", "medical ward", "pediatric ward", "gynecologists ward"][Math.floor(Math.random() * 4)];
          simulatedData.admission_diagnosis = ["Malaria", "Pneumonia", "Typhoid Fever", "UTI"][Math.floor(Math.random() * 4)];
          simulatedData.admitting_clinician = randomClinician;
          simulatedData.admission_icd10 = "A01.0";
          break;
        case 'Form_1_1_1_r':
          simulatedData.discharge_diagnosis = "Pneumonia Treated & Resolved";
          simulatedData.discharge_condition = "Stable, ambulatory, discharged home with medication.";
          simulatedData.discharging_officer = randomClinician;
          break;
        case 'Form_1_1_1_v':
          simulatedData.gestational_age_weeks = 24;
          simulatedData.anc_visit_number = "2nd Visit";
          simulatedData.maternal_risk_factors = "No immediate maternal risk factors observed.";
          break;
        case 'Form_1_1_1_z':
          simulatedData.emergency_category = "Red - Resuscitation";
          simulatedData.vital_signs = "Unstable, high heart rate, shallow breathing.";
          simulatedData.first_line_intervention = "Intravenous fluids initiated, oxygen via face mask at 6L/min.";
          break;
        default:
          simulatedData.simulated_record_type = "General Workflow Form Entry";
          simulatedData.general_note = "Auto-generated sample workflow metrics entry.";
          break;
      }

      await addDoc(collection(db, selectedStation.formId), simulatedData);
      addToast?.('success', `Simulated database entry created in live ${selectedStation.formId} (${selectedStation.name}) successfully!`);
    } catch (err: any) {
      console.error(err);
      addToast?.('error', 'Failed to seed simulated entry.');
    } finally {
      setSimulating(false);
    }
  };

  // Extract table headers dynamically based on fetched keys
  const getDynamicHeaders = () => {
    if (records.length === 0) return ['patient_mrn', 'created_at'];
    const keys = new Set<string>();
    records.forEach(rec => {
      Object.keys(rec).forEach(key => {
        if (key !== 'id' && key !== 'hospital_id' && typeof rec[key] !== 'object') {
          keys.add(key);
        }
      });
    });
    return Array.from(keys).slice(0, 7); // Show max 7 columns for compact dashboard layout
  };

  const headers = getDynamicHeaders();

  // Search filter
  const filteredRecords = records.filter(rec => {
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.toLowerCase();
    return Object.values(rec).some(val => 
      String(val).toLowerCase().includes(queryLower)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-0 my-6 animate-fadeIn print:hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Layers size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">
              All Schema Tables Live Feed (1.1.1 to 1.1.1.z)
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              All Modules Stacked. View, inspect, and seed live entries across all 18 clinical databases.
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulateEntry}
          disabled={simulating}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
        >
          <Sparkles size={13} className="animate-pulse text-yellow-300" />
          <span>{simulating ? 'Simulating...' : 'Seed Live Entry'}</span>
        </button>
      </div>

      {/* Grid selector / Left & Right Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 border-b border-slate-100 dark:border-slate-800">
        {/* Sidebar select list */}
        <div className="lg:col-span-1 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 max-h-[450px] overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
          <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider px-2 mb-2 block">
            Select Database Table
          </div>
          {SCHEMA_WORKFLOW_STATIONS.map((st) => {
            const isSelected = selectedStation.formId === st.formId;
            return (
              <button
                key={st.formId}
                onClick={() => setSelectedStation(st)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600 text-white font-extrabold shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <Database size={13} className={isSelected ? 'text-white' : 'text-indigo-400'} />
                  <span className="truncate">{st.name}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {st.formId.replace('Form_1_1_1_', '').replace('Form_1_1_1', '1.1.1')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Live Table Display */}
        <div className="lg:col-span-3 p-6 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/40">
                  {selectedStation.formId}
                </span>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                  {selectedStation.name}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Displaying the latest submissions in this schema collection ({records.length} total fetched)
              </p>
            </div>

            {/* Table Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-1 py-20 text-center text-xs text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-indigo-500" />
              <span>Fetching live Firestore collection entries...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex-1 py-16 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Table size={24} className="text-slate-300 dark:text-slate-700" />
              <span>No database entries found in this collection. Click "Seed Live Entry" to add simulated data.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2.5 px-3">Patient MRN</th>
                    {headers.filter(h => h !== 'patient_mrn').map((header) => (
                      <th key={header} className="py-2.5 px-3 truncate">
                        {header.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                  {filteredRecords.map((rec) => (
                    <tr 
                      key={rec.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all font-medium text-slate-700 dark:text-slate-300"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rec.patient_mrn || 'N/A'}
                      </td>
                      {headers.filter(h => h !== 'patient_mrn').map((header) => (
                        <td key={header} className="py-2.5 px-3 truncate max-w-[200px]" title={String(rec[header])}>
                          {String(rec[header] ?? '—')}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono text-[10px] text-slate-400">
                        {rec.created_at ? new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
