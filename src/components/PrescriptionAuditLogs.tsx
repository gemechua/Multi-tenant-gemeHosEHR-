import React, { useState, useEffect } from 'react';
import { 
  collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, where 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  ShieldCheck, History, Search, Filter, Calendar, User, Eye, X, 
  RefreshCw, FileText, CheckCircle2, AlertTriangle, ArrowRight, Download,
  Tag, Activity, Sparkles
} from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  action: 'CREATION' | 'MODIFICATION' | 'CANCELLATION' | 'STATUS_CHANGE' | 'DISPENSED' | 'REJECTED';
  prescription_id: string;
  patient_mrn: string;
  medication_name: string;
  user_email: string;
  user_role?: string;
  previous_state?: any;
  new_state?: any;
  timestamp: string;
  details?: string;
  ip_address?: string;
}



interface PrescriptionAuditLogsProps {
  hospital_id?: string;
  onClose?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export async function logPrescriptionAuditEvent(data: {
  action: 'CREATION' | 'MODIFICATION' | 'CANCELLATION' | 'STATUS_CHANGE' | 'DISPENSED' | 'REJECTED';
  prescription_id: string;
  patient_mrn: string;
  medication_name: string;
  details?: string;
  previous_state?: any;
  new_state?: any;
  user_email?: string;
  user_role?: string;
  hospital_id?: string;
}) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'prescription_audit_logs'), {
      ...data,
      user_email: data.user_email || user?.email || 'staff.pharmacist@hospital.org',
      user_role: data.user_role || 'Hospital Staff',
      timestamp: new Date().toISOString(),
      created_at: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to log prescription audit event to Firestore:', err);
  }
}

export default function PrescriptionAuditLogs({ hospital_id, onClose, addToast }: PrescriptionAuditLogsProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [hospital_id]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let q;
      if (hospital_id) {
          q = query(collection(db, 'prescription_audit_logs'), where('hospital_id', '==', hospital_id), limit(150));
      } else {
          const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
          const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
          const hId = activeHospital?.hospital_unique_number;
          if (hId) {
             q = query(collection(db, 'prescription_audit_logs'), where('hospital_id', '==', hId), limit(150));
          } else {
             q = query(collection(db, 'prescription_audit_logs'), limit(150));
          }
      }
      
      const snap = await getDocs(q);
      const fetched: AuditLogEntry[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data();
        fetched.push({ id: docSnap.id, ...(data as any) } as AuditLogEntry);
      });

      fetched.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setLogs(fetched);
    } catch (err) {
      console.error('Error loading prescription audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    // Action type filter
    if (actionFilter !== 'ALL' && log.action !== actionFilter) {
      return false;
    }

    // Date range filter
    if (startDate) {
      const logTime = new Date(log.timestamp).getTime();
      const start = new Date(startDate).getTime();
      if (logTime < start) return false;
    }
    if (endDate) {
      const logTime = new Date(log.timestamp).getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();
      if (logTime > end) return false;
    }

    // Search query (MRN, medication, user email, details)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mrn = (log.patient_mrn || '').toLowerCase();
      const med = (log.medication_name || '').toLowerCase();
      const user = (log.user_email || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const rxId = (log.prescription_id || '').toLowerCase();

      if (!mrn.includes(q) && !med.includes(q) && !user.includes(q) && !details.includes(q) && !rxId.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATION':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 w-fit"><Sparkles size={11} /> Creation</span>;
      case 'MODIFICATION':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[10px] flex items-center gap-1 w-fit"><History size={11} /> Modification</span>;
      case 'DISPENSED':
        return <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold text-[10px] flex items-center gap-1 w-fit"><CheckCircle2 size={11} /> Dispensed</span>;
      case 'STATUS_CHANGE':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-[10px] flex items-center gap-1 w-fit"><Activity size={11} /> Status Change</span>;
      case 'CANCELLATION':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 w-fit"><X size={11} /> Cancellation</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1 w-fit"><AlertTriangle size={11} /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 font-bold text-[10px]">{action}</span>;
    }
  };

  const exportAuditCsv = () => {
    if (filteredLogs.length === 0) {
      addToast?.('info', 'No audit log entries available to export.');
      return;
    }

    const headers = ['Audit ID', 'Action', 'Prescription ID', 'Patient MRN', 'Medication', 'User Email', 'User Role', 'Timestamp', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.action,
      l.prescription_id,
      l.patient_mrn,
      `"${(l.medication_name || '').replace(/"/g, '""')}"`,
      l.user_email,
      l.user_role || 'Staff',
      l.timestamp,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Prescription_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast?.('success', `Exported ${filteredLogs.length} audit log entries to CSV.`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Prescription Audit Logs & Trail
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Traceability engine for prescription creation, modifications, status changes, and cancellations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditCsv}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Refresh Audit Logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search MRN, Drug, User..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Action Type */}
        <div className="flex items-center gap-1.5">
          <Filter className="text-slate-400" size={14} />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATION">Creation</option>
            <option value="MODIFICATION">Modification</option>
            <option value="DISPENSED">Dispensed</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="CANCELLATION">Cancellation</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            title="Filter Start Date"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            title="Filter End Date"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Querying audit logger for prescription modifications...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="mx-auto text-slate-300 dark:text-slate-700" size={32} />
            <p className="text-slate-700 dark:text-slate-300 text-xs font-bold">No prescription audit log entries found</p>
            <p className="text-slate-400 text-[11px]">Try adjusting your search query or action type filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Prescription / Patient</th>
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">User / Clinician</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    {getActionBadge(log.action)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {log.patient_mrn}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      ID: {log.prescription_id}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.medication_name || '—'}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      {log.user_email}
                    </div>
                    {log.user_role && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.user_role}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected Audit Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={20} />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit Trail Entry Details</h4>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Action Type</span>
                  {getActionBadge(selectedLog.action)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Log Reference</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedLog.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Patient MRN</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedLog.patient_mrn}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Prescription ID</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{selectedLog.prescription_id}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Medication Subject</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedLog.medication_name}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Explanation / Reason</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLog.details || 'No detailed log message recorded.'}</p>
              </div>

              {/* State Diffs */}
              {(selectedLog.previous_state || selectedLog.new_state) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">State Snapshot Diff</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                      <span className="text-rose-700 dark:text-rose-400 font-bold block text-[10px] mb-1">Previous State:</span>
                      <pre className="font-mono text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedLog.previous_state ? JSON.stringify(selectedLog.previous_state, null, 2) : 'None'}
                      </pre>
                    </div>

                    <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold block text-[10px] mb-1">New State:</span>
                      <pre className="font-mono text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedLog.new_state ? JSON.stringify(selectedLog.new_state, null, 2) : 'None'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>User: <strong>{selectedLog.user_email}</strong></span>
                <span>Timestamp: <strong>{new Date(selectedLog.timestamp).toLocaleString()}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
