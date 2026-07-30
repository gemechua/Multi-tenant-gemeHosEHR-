import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Bed, Activity, Search, AlertCircle
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PatientWaitingQueueBoardProps {
  hospital_id: string;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

const PatientWaitingQueueBoard: React.FC<PatientWaitingQueueBoardProps> = ({ hospital_id, addToast }) => {
  const [activeTab, setActiveTab] = useState<'outpatient' | 'inpatient'>('outpatient');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    let outpatients: any[] = [];
    let inpatients: any[] = [];

    const opdUnsub = onSnapshot(collection(db, 'Form_1_1_1'), (snapshot) => {
      outpatients = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.Field_1 || data.patientName || data.name || 'Unknown Patient',
          mrn: data.Field_2 || data.mrn || data.patientId || 'MRN-NEW',
          age: data.Field_3 || data.age || 'Adult',
          category: 'outpatient',
          unit: data.Field_4 || data.clinic || data.unit || 'General OPD',
          urgency: data.Field_5 || data.urgency || data.priority || 'Routine',
          status: 'pending_waiting',
          chiefComplaint: data.Field_6 || data.chiefComplaint || data.diagnosis || 'Clinical consultation required',
          doctorAssigned: data.Field_7 || data.doctor || 'Unassigned',
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });
      setPatients([...outpatients, ...inpatients].sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });

    const ipdUnsub = onSnapshot(collection(db, 'Form_1_1_1_q'), (snapshot) => {
      inpatients = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.Field_1 || data.patientName || data.name || 'Unknown Patient',
          mrn: data.Field_2 || data.mrn || data.patientId || 'MRN-NEW',
          age: data.Field_3 || data.age || 'Adult',
          category: 'inpatient',
          ward: data.Field_4 || data.ward || 'Ward A (Internal Med)',
          urgency: data.Field_5 || data.urgency || data.priority || 'Routine',
          status: 'pending_admission',
          chiefComplaint: data.Field_6 || data.clinicalDiagnosis || data.diagnosis || 'Clinical consultation required',
          requestedBy: data.Field_7 || data.requestedBy || 'Unassigned',
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });
      setPatients([...outpatients, ...inpatients].sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });

    return () => {
      opdUnsub();
      ipdUnsub();
    };
  }, []);

  const calculateWaitingTime = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${Math.max(1, diffMins)} mins`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} hr ${mins} mins`;
  };

  const filteredPatients = patients.filter(p => {
    const matchesTab = p.category === activeTab;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchLower) || 
      p.mrn?.toLowerCase().includes(searchLower);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Patient Pending Waiting & Admission Board
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Real-time tracking from schema tables (Outpatient queues and Inpatient Admission Ward).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab('outpatient')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'outpatient'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity size={15} />
              <span>Outpatient Waiting ({patients.filter(p => p.category === 'outpatient').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('inpatient')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'inpatient'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bed size={15} />
              <span>Inpatient Admission ({patients.filter(p => p.category === 'inpatient').length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by patient name or MRN..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 rounded-tl-2xl">Patient Info</th>
              <th className="py-3 px-4">Waiting Time</th>
              <th className="py-3 px-4">{activeTab === 'outpatient' ? 'Unit / Clinic' : 'Ward'}</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4">Chief Complaint / Diagnosis</th>
              <th className="py-3 px-4 rounded-tr-2xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Clock size={32} className="text-slate-300 dark:text-slate-700 mb-2 animate-spin" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Loading live queues...</p>
                  </div>
                </td>
              </tr>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{p.mrn} • {p.age}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-500 animate-spin" />
                      {calculateWaitingTime(p.createdAt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {p.category === 'outpatient' ? p.unit : p.ward}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide
                      ${p.urgency.toLowerCase().includes('urgent') || p.urgency.toLowerCase().includes('critical') || p.urgency.toLowerCase().includes('emergency')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                        : p.urgency.toLowerCase().includes('moderate')
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                      {p.urgency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-600 dark:text-slate-300 max-w-[200px] truncate block" title={p.chiefComplaint}>
                      {p.chiefComplaint}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg font-bold transition-all text-xs">
                      {activeTab === 'outpatient' ? 'Start Consult' : 'Assign Bed'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Users size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No pending waiting patients found.</p>
                    <p className="text-xs text-slate-400 mt-1">Record patients in the schema tables to start queue waiting and admission tracking.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientWaitingQueueBoard;
