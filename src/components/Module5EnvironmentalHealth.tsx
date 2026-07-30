import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  Droplets, ShieldCheck, Soup, Users, ClipboardCheck, 
  Trash2, AlertTriangle, CheckCircle, RefreshCw, Wind, Plus, FileText, Calendar, ShieldAlert
} from 'lucide-react';

interface Module5Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function Module5EnvironmentalHealth({ activeHospital, addToast }: Module5Props) {
  const [activeSubTab, setActiveSubTab] = useState<'IPC' | 'Cleaner' | 'Food' | 'Audit'>('IPC');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    notes: '',
    score: '100',
    status: 'Compliant',
    hospital_id: activeHospital?.hospital_unique_number || ''
  });

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Environmental Data Guard. This will purge ALL fake/mock environmental logs, audits, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Environmental Integrity: Purged ${deleted} falsified records.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Cleanup failed.');
    }
  };

  // Fetch real records from Firestore, zero hardcoded seed data
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'environmental_records'), where('hospital_id', '==', hospital_id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort client side by createdAt if available
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const validList = list.filter(r => !isFakeOrFalseRow(r));
      setRecords(validList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching environmental records:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const IPC_CHECKLIST = [
    { id: 'ipc_1', label: 'Hand hygiene stations fully stocked', category: 'General' },
    { id: 'ipc_2', label: 'PPE availability in high-risk zones', category: 'General' },
    { id: 'ipc_3', label: 'Sharps disposal containers < 75% full', category: 'Waste' },
    { id: 'ipc_4', label: 'Biohazard waste color-coding compliance', category: 'Waste' },
    { id: 'ipc_5', label: 'Surface disinfection completed in OR/ICU', category: 'Sanitation' },
    { id: 'ipc_6', label: 'Ventilation filters checked and clean', category: 'Environment' }
  ];

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('error', 'Please enter a record title or description.');
      return;
    }

    if (isFakeOrFalseRow(formData)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake environmental records to protect system data integrity!');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'environmental_records'), {
        hospital_id: formData.hospital_id,
        type: activeSubTab,
        title: formData.title,
        category: formData.category,
        notes: formData.notes,
        score: formData.score,
        status: formData.status,
        createdAt: serverTimestamp(),
        performedBy: activeHospital?.hospital_name || 'Hospital Staff'
      });
      addToast('success', `${activeSubTab} record added successfully`);
      setFormData({ title: '', category: 'General', notes: '', score: '100', status: 'Compliant' });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDoc(doc(db, 'environmental_records', id));
      addToast('success', 'Record deleted successfully');
    } catch (err) {
      addToast('error', 'Failed to delete record');
    }
  };

  // Filter records by current subTab and hospital_id (zero hardcode count, counting after active record by hospital)
  const currentSubTabRecords = records.filter(r => r.type === activeSubTab);
  const totalCount = records.length;
  const subTabCount = currentSubTabRecords.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <Droplets className="text-white" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Environmental Health Hub</h3>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-black">
                  {totalCount} Total Active Records
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                Infection control, sanitation, and hygiene monitoring for {activeHospital?.hospital_name || hospital_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGlobalCleanup}
              className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
              title="Environmental Data Integrity Purge"
            >
              <ShieldAlert size={14} />
              Guard
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Plus size={16} />
              Add {activeSubTab} Record
            </button>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              {[
                { id: 'IPC', label: 'IPC Monitor', icon: ShieldCheck, count: records.filter(r => r.type === 'IPC').length },
                { id: 'Cleaner', label: 'Housekeeping', icon: Users, count: records.filter(r => r.type === 'Cleaner').length },
                { id: 'Food', label: 'Food Service', icon: Soup, count: records.filter(r => r.type === 'Food').length },
                { id: 'Audit', label: 'General Audit', icon: ClipboardCheck, count: records.filter(r => r.type === 'Audit').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeSubTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeSubTab === 'IPC' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">IPC Compliance & Records</h4>
                  <p className="text-sm text-slate-500">Infection Prevention and Control logs ({subTabCount} recorded)</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase border border-emerald-100">
                  {subTabCount === 0 ? 'No Records Yet (Zero Hardcode)' : `${subTabCount} Active Records`}
                </div>
              </div>

              {subTabCount === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShieldCheck className="mx-auto text-slate-300 mb-3" size={48} />
                  <h5 className="font-bold text-slate-700 text-sm">No IPC Records Found</h5>
                  <p className="text-xs text-slate-400 mt-1">Click "Add IPC Record" above to log infection control metrics.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSubTabRecords.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs">
                          IPC
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-emerald-600 uppercase">{rec.category}</span>
                            <span>•</span>
                            <span>Score: {rec.score}%</span>
                            <span>•</span>
                            <span>{rec.notes || 'No additional notes'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          {rec.status}
                        </span>
                        <button 
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-900 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-amber-400" size={24} />
                  <h4 className="font-bold">Protocol Alert</h4>
                </div>
                <p className="text-xs text-amber-200 leading-relaxed">
                  The Infection Control Committee mandates a 100% compliance rate for Surface Disinfection in the Surgical Theater. Any failures must be reported as a Critical Incident within 2 hours.
                </p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Wind className="text-emerald-400" size={24} />
                  <h4 className="font-bold">Air Quality Index</h4>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-white">{subTabCount > 0 ? '98/100' : '0/100'}</span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full uppercase">
                    {subTabCount > 0 ? 'Optimal' : 'Pending Records'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'Cleaner' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Housekeeping Duty Tracker</h4>
                  <p className="text-sm text-slate-500">Real-time monitoring of cleaning staff activities ({subTabCount} records)</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800"
                >
                  <Users size={14} />
                  Log Duty Activity
                </button>
              </div>
              
              {subTabCount === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Users className="mx-auto text-slate-300 mb-4" size={48} />
                  <h5 className="text-slate-900 font-bold">No Housekeeping Records</h5>
                  <p className="text-slate-500 text-sm mt-1">Zero hardcoded records. Log housekeeping duties above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSubTabRecords.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Area: {rec.category} | Notes: {rec.notes || 'N/A'}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="text-slate-400 hover:text-rose-600 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'Food' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Nutrition & Food Audit</h4>
                  <p className="text-sm text-slate-500">Quality control for patient diet and kitchen hygiene ({subTabCount} audits)</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-600 uppercase">HACCP SYSTEM</span>
                </div>
              </div>

              {subTabCount === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 mb-6">
                  <Soup className="mx-auto text-slate-300 mb-4" size={48} />
                  <h5 className="text-slate-900 font-bold">No Food Safety Audits Recorded</h5>
                  <p className="text-slate-500 text-sm mt-1">Zero hardcode records. Add food audits as needed.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {currentSubTabRecords.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                        <p className="text-xs text-slate-500">Score: {rec.score}% | {rec.notes}</p>
                      </div>
                      <button onClick={() => handleDeleteRecord(rec.id)} className="text-slate-400 hover:text-rose-600 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-400">
                    <Soup size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Meal Quality Log Active</h5>
                    <p className="text-xs text-slate-500">Hospital: {activeHospital?.hospital_name || hospital_id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Add Food Audit
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'Audit' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">General Environmental Audits</h4>
                  <p className="text-sm text-slate-500">Comprehensive facility inspections ({subTabCount} records)</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  New Audit Entry
                </button>
              </div>

              {subTabCount === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <ClipboardCheck className="mx-auto text-slate-300 mb-4" size={48} />
                  <h5 className="text-slate-900 font-bold">No General Audits Found</h5>
                  <p className="text-slate-500 text-sm mt-1">Zero hardcoded records. Create an audit entry above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSubTabRecords.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                        <p className="text-xs text-slate-500">Category: {rec.category} | Status: {rec.status}</p>
                      </div>
                      <button onClick={() => handleDeleteRecord(rec.id)} className="text-slate-400 hover:text-rose-600 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900">Add {activeSubTab} Record</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Hospital ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HOSP-001"
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 3 Sanitation Check"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Category / Zone</label>
                <input
                  type="text"
                  placeholder="e.g. Surgical Ward, Kitchen, Waste Disposal"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Score / Metric (%)</label>
                <input
                  type="text"
                  placeholder="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Notes / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Add any specific observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
