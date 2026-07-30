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
  TrendingUp, Star, Award, ShieldAlert, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  evaluationPeriod: string;
  efficiencyScore: number; // 0 - 100
  qualityRating: number; // 1 - 5 stars
  coreCompetency: string;
  evaluatorName: string;
  feedbackRemarks: string;
  hospital_id: string;
}

const INITIAL_EVALUATIONS: any[] = [];

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

interface HRPerformanceProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRPerformance({ hospital_id, addToast }: HRPerformanceProps) {
  const [evals, setEvals] = useState<PerformanceEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // New Record State
  const [newEval, setNewEval] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Clinical Services',
    evaluationPeriod: 'Mid-Year 2026',
    efficiencyScore: 85,
    qualityRating: 4,
    coreCompetency: '',
    evaluatorName: '',
    feedbackRemarks: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PerformanceEvaluation>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const evalsRef = collection(db, 'hr_performance_evaluations');
    
    const unsubscribe = onSnapshot(evalsRef, async (snapshot) => {
      let list: PerformanceEvaluation[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PerformanceEvaluation);
      });

      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_EVALUATIONS.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_EVALUATIONS) {
              await addDoc(collection(db, 'hr_performance_evaluations'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_performance_evaluations:', err);
          }
        } else {
          setEvals([]);
        }
      } else {
        setEvals(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Performance loading error:', error);
      addToast('error', 'Error loading Performance Evaluation logs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEval.employeeId || !newEval.employeeName || !newEval.evaluatorName || !newEval.coreCompetency) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    const score = Number(newEval.efficiencyScore);
    if (isNaN(score) || score < 0 || score > 100) {
      addToast('error', 'Validation Error: Efficiency score must be between 0 and 100.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_performance_evaluations'), {
        ...newEval,
        efficiencyScore: score,
        hospital_id
      });
      addToast('success', `✓ Performance record for ${newEval.employeeName} saved.`);
      setIsAdding(false);
      // Reset
      setNewEval({
        employeeId: '',
        employeeName: '',
        department: 'Clinical Services',
        evaluationPeriod: 'Mid-Year 2026',
        efficiencyScore: 85,
        qualityRating: 4,
        coreCompetency: '',
        evaluatorName: '',
        feedbackRemarks: ''
      });
    } catch (err) {
      addToast('error', 'Failed to add evaluation record.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (record: PerformanceEvaluation) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async (id: string) => {
    if (!editFormData.employeeName || !editFormData.evaluatorName) {
      addToast('error', 'Employee name and Evaluator name are required.');
      return;
    }

    const score = Number(editFormData.efficiencyScore);
    if (isNaN(score) || score < 0 || score > 100) {
      addToast('error', 'Validation Error: Efficiency score must be between 0 and 100.');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_performance_evaluations', id);
      await updateDoc(docRef, {
        employeeId: editFormData.employeeId,
        employeeName: editFormData.employeeName,
        department: editFormData.department,
        evaluationPeriod: editFormData.evaluationPeriod,
        efficiencyScore: score,
        qualityRating: Number(editFormData.qualityRating),
        coreCompetency: editFormData.coreCompetency,
        evaluatorName: editFormData.evaluatorName,
        feedbackRemarks: editFormData.feedbackRemarks
      });
      addToast('success', '✓ Performance evaluation successfully updated.');
      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      addToast('error', 'Failed to update Performance record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the evaluation log for ${name}?`)) {
      return;
    }
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_performance_evaluations', id));
      addToast('success', '✓ Performance log successfully deleted.');
    } catch (err) {
      addToast('error', 'Failed to delete Performance log.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvals = evals.filter(e => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (e.employeeName || '').toLowerCase().includes(q) ||
      (e.employeeId || '').toLowerCase().includes(q) ||
      (e.coreCompetency || '').toLowerCase().includes(q) ||
      (e.evaluatorName || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Analytics Helpers
  const totalEvals = evals.length;
  const averageEfficiency = totalEvals > 0 
    ? Math.round(evals.reduce((acc, curr) => acc + (curr.efficiencyScore || 0), 0) / totalEvals)
    : 0;
  const highPerformers = evals.filter(e => e.efficiencyScore >= 90).length;
  const lowPerformers = evals.filter(e => e.efficiencyScore < 75).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Evaluations Completed', val: totalEvals, sub: 'Staff reviews registered', icon: Award, color: 'indigo' },
          { label: 'Avg Efficiency Score', val: `${averageEfficiency}%`, sub: 'Institutional standard', icon: TrendingUp, color: 'emerald' },
          { label: 'Elite Performers', val: highPerformers, sub: 'Score >= 90%', icon: Sparkles, color: 'amber' },
          { label: 'Needs Improvement', val: lowPerformers, sub: 'Score < 75%', icon: ShieldAlert, color: 'rose' }
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

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col md:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Evaluator..."
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
          {isAdding ? 'Close Drawer' : 'New Evaluation'}
        </button>
      </div>

      {/* Add Form Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm p-5"
          >
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <Award className="text-indigo-600" size={16} />
              Register Clinical Performance & Efficiency Evaluation
            </h4>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-006"
                  value={newEval.employeeId}
                  onChange={(e) => setNewEval({ ...newEval, employeeId: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. W/ro Chaltu Alimu"
                  value={newEval.employeeName}
                  onChange={(e) => setNewEval({ ...newEval, employeeName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={newEval.department}
                  onChange={(e) => setNewEval({ ...newEval, department: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Evaluation Period</label>
                <input
                  type="text"
                  value={newEval.evaluationPeriod}
                  onChange={(e) => setNewEval({ ...newEval, evaluationPeriod: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Efficiency Score (0 - 100)%</label>
                <input
                  type="number"
                  max="100"
                  min="0"
                  value={newEval.efficiencyScore}
                  onChange={(e) => setNewEval({ ...newEval, efficiencyScore: Number(e.target.value) })}
                  className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    newEval.efficiencyScore < 0 || newEval.efficiencyScore > 100
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50'
                      : 'border-gray-200 bg-slate-50 focus:ring-indigo-500'
                  }`}
                />
                {(newEval.efficiencyScore < 0 || newEval.efficiencyScore > 100) && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">Score must be between 0 and 100</span>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quality Rating (1 - 5 Stars)</label>
                <select
                  value={newEval.qualityRating}
                  onChange={(e) => setNewEval({ ...newEval, qualityRating: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {[5, 4, 3, 2, 1].map(star => <option key={star} value={star}>{star} Stars</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Evaluator / Reviewer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Abebe (Surgical Director)"
                  value={newEval.evaluatorName}
                  onChange={(e) => setNewEval({ ...newEval, evaluatorName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Core Competencies Documented</label>
                <input
                  type="text"
                  placeholder="e.g. Midwifery clinical efficiency, punctual night shifts"
                  value={newEval.coreCompetency}
                  onChange={(e) => setNewEval({ ...newEval, coreCompetency: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Constructive Feedback Remarks</label>
                <input
                  type="text"
                  placeholder="Recommended for specialized learning/upgrade courses..."
                  value={newEval.feedbackRemarks}
                  onChange={(e) => setNewEval({ ...newEval, feedbackRemarks: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Submit Evaluation Sheet
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editable Performance Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-4">Staff Personnel</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Review Cycle</th>
                <th className="py-3 px-4">Efficiency Score</th>
                <th className="py-3 px-4">Quality Rating</th>
                <th className="py-3 px-4">Demonstrated Competency</th>
                <th className="py-3 px-4">Assigned Evaluator</th>
                <th className="py-3 px-4">Performance Feedback</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <span className="text-slate-400 font-bold">Synchronizing Performance Register...</span>
                  </td>
                </tr>
              ) : filteredEvals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 font-bold">
                    No clinical evaluation records found.
                  </td>
                </tr>
              ) : (
                filteredEvals.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/40 transition-colors ${isEditing ? 'bg-indigo-50/10' : ''}`}>
                      {/* Name / ID */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editFormData.employeeName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, employeeName: e.target.value })}
                              className="px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                            <input
                              type="text"
                              value={editFormData.employeeId || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value.toUpperCase() })}
                              className="px-2 py-0.5 border border-gray-300 rounded font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="block font-bold">{item.employeeName}</span>
                            <span className="text-[10px] font-mono font-bold text-indigo-600 block">{item.employeeId}</span>
                          </div>
                        )}
                      </td>

                      {/* Dept */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.department || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          >
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">
                            {item.department}
                          </span>
                        )}
                      </td>

                      {/* Period */}
                      <td className="py-3 px-4 text-slate-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.evaluationPeriod || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, evaluationPeriod: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
                          />
                        ) : (
                          item.evaluationPeriod
                        )}
                      </td>

                      {/* Efficiency Score */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              value={editFormData.efficiencyScore ?? ''}
                              onChange={(e) => setEditFormData({ ...editFormData, efficiencyScore: e.target.value === '' ? undefined : Number(e.target.value) })}
                              className={`px-2 py-1 border rounded focus:outline-none focus:ring-1 w-16 text-xs ${
                                editFormData.efficiencyScore !== undefined && (editFormData.efficiencyScore < 0 || editFormData.efficiencyScore > 100)
                                  ? 'border-rose-500 focus:ring-rose-500 bg-rose-50'
                                  : 'border-gray-300 focus:ring-indigo-500'
                              }`}
                            />
                            {editFormData.efficiencyScore !== undefined && (editFormData.efficiencyScore < 0 || editFormData.efficiencyScore > 100) && (
                              <span className="text-[9px] text-rose-500 font-bold block">0-100 only</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`font-mono font-bold ${
                              item.efficiencyScore >= 90 ? 'text-emerald-600' :
                              item.efficiencyScore >= 75 ? 'text-amber-600' : 'text-rose-600'
                            }`}>{item.efficiencyScore}%</span>
                            <div className="w-12 bg-gray-100 h-1 rounded overflow-hidden">
                              <div 
                                className={`h-full ${
                                  item.efficiencyScore >= 90 ? 'bg-emerald-500' :
                                  item.efficiencyScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${item.efficiencyScore}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Star Rating */}
                      <td className="py-3 px-4 text-amber-500 font-bold">
                        {isEditing ? (
                          <select
                            value={editFormData.qualityRating || 5}
                            onChange={(e) => setEditFormData({ ...editFormData, qualityRating: Number(e.target.value) })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s}★</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: item.qualityRating || 5 }).map((_, idx) => (
                              <Star key={idx} size={11} fill="currentColor" />
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Core Competencies */}
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={item.coreCompetency}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.coreCompetency || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, coreCompetency: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.coreCompetency
                        )}
                      </td>

                      {/* Evaluator */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.evaluatorName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, evaluatorName: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.evaluatorName
                        )}
                      </td>

                      {/* Feedback remarks */}
                      <td className="py-3 px-4 text-slate-400 font-medium max-w-xs truncate" title={item.feedbackRemarks}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.feedbackRemarks || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, feedbackRemarks: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.feedbackRemarks || '--'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
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
                              title="Edit record"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.employeeName)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                              title="Delete record"
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
      </div>
    </div>
  );
}
