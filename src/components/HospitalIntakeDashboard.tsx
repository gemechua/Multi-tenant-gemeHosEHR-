
import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Clock, Plus, BarChart3, 
  Calendar, CheckCircle2, AlertCircle, TrendingUp, 
  Target, BookOpen, Layers, Shield, History,
  Download, X, Filter, FileSpreadsheet
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  activeHospital: any;
  onSelectForm: (formName: string) => void;
  forms: string[];
}

export default function HospitalIntakeDashboard({ activeHospital, onSelectForm, forms }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allRecords, setAllRecords] = useState<any[]>([]);

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const fetchStatsAndRecords = async () => {
    setLoading(true);
    try {
      // Data fetching disabled to maintain 0-count baseline per request
      /*
      const planningRef = collection(db, 'planning_records');
      ...
      */
      
      const newCounts: Record<string, number> = {};
      forms.forEach(f => newCounts[f] = 0);

      setAllRecords([]);
      setCounts(newCounts);

      // Security logs disabled for baseline mode
      setAuditLogs([]);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecords();
  }, [hospital_id, forms]);

  const filteredForms = forms.filter(f => 
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecords = allRecords.filter(r => 
    r.activity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Type', 'Activity', 'Target', 'Achieved', 'Due Date', 'Status'];
    const rows = filteredRecords.map(r => [
      r.type,
      r.activity,
      r.target,
      r.achieved || 0,
      r.due_date || 'N/A',
      (r.achieved >= r.target) ? 'Completed' : 'Pending'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planning_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hospital Intake Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Consolidated management for Strategic Plans & Programming.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            <History size={16} /> Audit Log
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search planning records, activities, or document types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Layers size={14} /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <FileSpreadsheet size={14} /> Records
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredForms.map((form, index) => {
              const count = counts[form] || 0;
              return (
                <motion.button
                  key={form}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onSelectForm(form)}
                  className="group relative bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-500 hover:shadow-xl transition-all text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText size={24} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        count > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {count} Records
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors h-10 line-clamp-2">
                      {form}
                    </h3>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                        Manage →
                      </span>
                      {count === 0 && (
                        <span className="text-[10px] font-bold text-gray-400 italic">Baseline 0</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Document Type</th>
                    <th className="px-6 py-4">Planned Activity</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded capitalize">
                          {record.type} Plan
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{record.activity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[120px] bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              (record.achieved / record.target) >= 1 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min((record.achieved / record.target) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 mt-1 block">
                          {record.achieved || 0} / {record.target}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          {record.due_date || 'No date set'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => onSelectForm(record.type === 'daily' ? 'Daily activities plan and achievement' : record.type === 'weekly' ? 'Weekly activities plan and achievement' : 'Monthly activities plan and achievement')}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                        No planning records match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hospital Data Audit Log</h3>
                    <p className="text-xs text-gray-500">Security & Integrity Tracking</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAuditModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-white sticky top-0 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest z-10">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-[10px]">
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${
                            log.action?.includes('CREATE') ? 'bg-emerald-100 text-emerald-700' :
                            log.action?.includes('DELETE') ? 'bg-rose-100 text-rose-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-xs text-gray-900">
                          {log.userEmail}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 italic">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Compliance Monitoring Enabled • HIPAA Standards
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

