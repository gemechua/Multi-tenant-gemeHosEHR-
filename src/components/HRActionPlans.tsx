import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Plus, Search, Trash2, Edit2, Check, X, 
  FileText, Calendar, Users, Activity, TrendingUp, AlertCircle,
  Upload, Paperclip, ExternalLink, FileUp, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translate } from '../lib/translations';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

// Setting worker path for PDF.js - using a CDN that matches the installed version is reliable
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface ActionPlan {
  id: string;
  title: string;
  department: string;
  responsiblePerson: string;
  targetDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  outcomeMetric: string;
  attachmentUrl?: string;
  attachmentName?: string;
  hospital_id: string;
}

const INITIAL_PLANS: any[] = [];

const DEPARTMENTS = [
  'Clinical Services',
  'Nursing Care',
  'Midwifery',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Administration',
  'Support Services'
];

interface HRActionPlansProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  currentLanguage: Language;
}

export default function HRActionPlans({ hospital_id, addToast, currentLanguage }: HRActionPlansProps) {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // New Record State
  const [newPlan, setNewPlan] = useState({
    title: '',
    department: 'Clinical Services',
    responsiblePerson: '',
    targetDate: new Date().toISOString().split('T')[0],
    priority: 'Medium' as const,
    status: 'Pending' as const,
    outcomeMetric: '',
    attachmentUrl: '',
    attachmentName: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ActionPlan>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const plansRef = collection(db, 'hr_action_plans');
    
    const unsubscribe = onSnapshot(plansRef, async (snapshot) => {
      let list: ActionPlan[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ActionPlan);
      });

      // Filter by hospital_id
      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_PLANS.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_PLANS) {
              await addDoc(collection(db, 'hr_action_plans'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_action_plans:', err);
          }
        } else {
          setPlans([]);
        }
      } else {
        setPlans(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Action Plans loading error:', error);
      addToast('error', 'Error loading Action Plan records');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.title || !newPlan.responsiblePerson || !newPlan.outcomeMetric) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_action_plans'), {
        ...newPlan,
        hospital_id
      });
      addToast('success', '✓ HR Action Plan registered successfully.');
      setIsAdding(false);
      // Reset form
      setNewPlan({
        title: '',
        department: 'Clinical Services',
        responsiblePerson: '',
        targetDate: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Pending',
        outcomeMetric: ''
      });
    } catch (err) {
      addToast('error', 'Failed to add action plan.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (plan: ActionPlan) => {
    setEditingId(plan.id);
    setEditFormData({ ...plan });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async (id: string) => {
    if (!editFormData.title || !editFormData.responsiblePerson) {
      addToast('error', 'Title and Responsible Person are required.');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_action_plans', id);
      await updateDoc(docRef, {
        title: editFormData.title,
        department: editFormData.department,
        responsiblePerson: editFormData.responsiblePerson,
        targetDate: editFormData.targetDate,
        priority: editFormData.priority,
        status: editFormData.status,
        outcomeMetric: editFormData.outcomeMetric,
        attachmentUrl: editFormData.attachmentUrl,
        attachmentName: editFormData.attachmentName
      });
      addToast('success', '✓ Action Plan updated successfully.');
      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      addToast('error', 'Failed to update Action Plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_action_plans', id));
      addToast('success', '✓ Action Plan deleted successfully.');
    } catch (err) {
      addToast('error', 'Failed to delete Action Plan.');
    } finally {
      setLoading(false);
    }
  };

  // Filter list
  const filteredPlans = plans.filter(p => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (p.title || '').toLowerCase().includes(q) ||
      (p.responsiblePerson || '').toLowerCase().includes(q) ||
      (p.outcomeMetric || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || p.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Calculate Metrics
  const total = plans.length;
  const inProgress = plans.filter(p => p.status === 'In Progress').length;
  const completed = plans.filter(p => p.status === 'Completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const handleBulkImport = async () => {
    if (!importFile) return;

    try {
      setLoading(true);
      const text = await importFile.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as any[];
          let successCount = 0;

          for (const row of rows) {
            // Basic validation and formatting
            if (row.fullName || row.candidateName) {
              const staffObj = {
                fullName: row.fullName || row.candidateName || 'Unknown Staff',
                department: row.department || 'Clinical Services',
                jobTitle: row.jobTitle || row.roleApplied || 'Staff Member',
                employmentType: row.employmentType || 'Full-time',
                status: 'Active',
                salary: Number(row.salary) || 20000,
                joinedDate: row.joinedDate || new Date().toISOString().split('T')[0],
                employeeId: row.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                hospital_id
              };

              await addDoc(collection(db, 'hr_staff_registry'), staffObj);
              successCount++;
            }
          }

          addToast('success', `${translate('Import Success', currentLanguage)}: ${successCount} records.`);
          setIsBulkImporting(false);
          setImportFile(null);
          setLoading(false);
        },
        error: (err: any) => {
          console.error('CSV Parsing Error:', err);
          addToast('error', translate('Import Error', currentLanguage));
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Import Error:', err);
      addToast('error', translate('Import Error', currentLanguage));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Import Section */}
      <AnimatePresence>
        {isBulkImporting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                <FileUp size={18} />
                {translate('Bulk Import Staff', currentLanguage)}
              </h4>
              <button onClick={() => setIsBulkImporting(false)} className="text-indigo-400 hover:text-indigo-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">CSV Structure Requirements</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600">
                  <div className="bg-slate-50 p-1.5 rounded">• fullName</div>
                  <div className="bg-slate-50 p-1.5 rounded">• department</div>
                  <div className="bg-slate-50 p-1.5 rounded">• jobTitle</div>
                  <div className="bg-slate-50 p-1.5 rounded">• salary</div>
                  <div className="bg-slate-50 p-1.5 rounded">• joinedDate</div>
                  <div className="bg-slate-50 p-1.5 rounded">• employeeId</div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-24 border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-white group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all">
                    <Upload size={24} className="text-indigo-300 group-hover:text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {importFile ? importFile.name : translate('Select File', currentLanguage)}
                    </span>
                  </div>
                </div>
                
                <button
                  disabled={!importFile || loading}
                  onClick={handleBulkImport}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  {translate('Parse CSV/PDF', currentLanguage)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: translate('Total Action Plans', currentLanguage), val: total, sub: 'Strategic objectives', icon: FileText, color: 'indigo' },
          { label: translate('In Progress Tasks', currentLanguage), val: inProgress, sub: 'Currently active', icon: Activity, color: 'amber' },
          { label: translate('Completed Milestones', currentLanguage), val: completed, sub: 'Successfully closed', icon: Check, color: 'emerald' },
          { label: translate('Objective Success Rate', currentLanguage), val: `${completionRate}%`, sub: 'Plans implemented', icon: TrendingUp, color: 'violet' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <span className="text-xl font-black text-slate-900 block">{stat.val}</span>
              <span className="text-xs text-slate-400 mt-0.5 block">{stat.sub}</span>
            </div>
            <div className={`p-2.5 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg`}>
              <stat.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row items-center gap-2 w-full">
          <button
            onClick={() => setIsBulkImporting(!isBulkImporting)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <FileUp size={14} />
            {translate('Bulk Import Staff', currentLanguage)}
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search actions, owners, metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 bg-slate-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border border-gray-200 bg-slate-50 rounded-lg text-xs py-1.5 px-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors self-stretch md:self-auto justify-center"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? 'Close Drawer' : translate('New Action Plan', currentLanguage)}
        </button>
      </div>

      {/* Add Drawer Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm p-5"
          >
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <FileText className="text-indigo-600" size={16} />
              Formulate New Strategic HR Action Plan
            </h4>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Strategic Objective / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expand Midwifery Onboarding"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={newPlan.department}
                  onChange={(e) => setNewPlan({ ...newPlan, department: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsible Owner *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Tigist"
                  value={newPlan.responsiblePerson}
                  onChange={(e) => setNewPlan({ ...newPlan, responsiblePerson: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={newPlan.targetDate}
                  onChange={(e) => setNewPlan({ ...newPlan, targetDate: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                <select
                  value={newPlan.priority}
                  onChange={(e) => setNewPlan({ ...newPlan, priority: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Status</label>
                <select
                  value={newPlan.status}
                  onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Key Performance Indicator (KPI) / Metric *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lower infant mortality stats by 12% in Midwifery"
                  value={newPlan.outcomeMetric}
                  onChange={(e) => setNewPlan({ ...newPlan, outcomeMetric: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Manual Upload Section */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{translate('Manual Upload', currentLanguage)}</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative group">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Mock upload behavior
                          setNewPlan({ 
                            ...newPlan, 
                            attachmentName: file.name,
                            attachmentUrl: URL.createObjectURL(file) 
                          });
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full px-3 py-1.5 border border-dashed border-gray-300 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center gap-2 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all">
                      <Upload size={14} className="text-slate-400 group-hover:text-indigo-500" />
                      {newPlan.attachmentName || 'Click or drag to upload Action Plan PDF/Doc'}
                    </div>
                  </div>
                  {newPlan.attachmentUrl && (
                    <div className="flex items-center gap-1">
                      {newPlan.attachmentName?.toLowerCase().endsWith('.pdf') && (
                        <button 
                          type="button"
                          onClick={() => setPreviewPdfUrl(newPlan.attachmentUrl || null)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 font-bold text-[10px]"
                        >
                          <FileText size={14} /> Preview
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => setNewPlan({ ...newPlan, attachmentUrl: '', attachmentName: '' })}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Schedule Action Plan
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editable Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-4">{translate('Action Objective', currentLanguage)}</th>
                <th className="py-3 px-4">{translate('Department', currentLanguage)}</th>
                <th className="py-3 px-4">{translate('Owner', currentLanguage)}</th>
                <th className="py-3 px-4">{translate('Target Date', currentLanguage)}</th>
                <th className="py-3 px-4">{translate('Priority', currentLanguage)}</th>
                <th className="py-3 px-4">{translate('Status', currentLanguage)}</th>
                <th className="py-3 px-4">{translate('KPI Metric', currentLanguage)}</th>
                <th className="py-3 px-4">Doc</th>
                <th className="py-3 px-4 text-right">{translate('Actions', currentLanguage)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <span className="text-slate-400 font-bold">Synchronizing Action Plans...</span>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                    No active action plans found.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/40 transition-colors ${isEditing ? 'bg-indigo-50/10' : ''}`}>
                      {/* Title */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.title || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded font-normal focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.title
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.department || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            {item.department}
                          </span>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.responsiblePerson || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, responsiblePerson: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.responsiblePerson
                        )}
                      </td>

                      {/* Target Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFormData.targetDate || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, targetDate: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.targetDate
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.priority || 'Medium'}
                            onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-[9px] ${
                            item.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                            item.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.priority}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.status || 'Pending'}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wide text-[9px] ${
                            item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            item.status === 'In Progress' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* Outcome Metric */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium max-w-xs truncate" title={item.outcomeMetric}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.outcomeMetric || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, outcomeMetric: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.outcomeMetric
                        )}
                      </td>

                      {/* Attachment */}
                      <td className="py-3.5 px-4">
                        {item.attachmentUrl ? (
                          <a 
                            href={item.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center"
                            title={item.attachmentName || 'View Document'}
                          >
                            <Paperclip size={14} />
                          </a>
                        ) : (
                          <span className="text-slate-300 flex justify-center">
                            <X size={14} className="opacity-20" />
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEditing(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                              title="Edit action item"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                              title="Delete Plan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* PDF PREVIEW MODAL */}
        <AnimatePresence>
          {previewPdfUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                    <FileText size={18} className="text-indigo-600" />
                    Document Preview
                  </h3>
                  <button onClick={() => setPreviewPdfUrl(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-100 p-4">
                  <iframe 
                    src={previewPdfUrl} 
                    className="w-full h-full min-h-[600px] border-0 rounded shadow-inner"
                    title="PDF Preview"
                  />
                </div>
                <div className="p-3 border-t border-slate-100 bg-white flex justify-end">
                  <button onClick={() => setPreviewPdfUrl(null)} className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold">
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
