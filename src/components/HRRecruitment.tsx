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
  UserPlus, Briefcase, ChevronRight, ClipboardList 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecruitmentRecord {
  id: string;
  candidateName: string;
  department: string;
  jobTitle: string;
  interviewer: string;
  onboardingStage: 'Interviewing' | 'Offer Extended' | 'Onboarding' | 'Completed';
  startDate: string;
  checklistProgress: number; // 0 - 100
  assignedMentor: string;
  hospital_id: string;
}

const INITIAL_RECRUITS: any[] = [];

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

const ONBOARDING_STAGES = ['Interviewing', 'Offer Extended', 'Onboarding', 'Completed'];

interface HRRecruitmentProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRRecruitment({ hospital_id, addToast }: HRRecruitmentProps) {
  const [recruits, setRecruits] = useState<RecruitmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // New Record Form State
  const [newRecruit, setNewRecruit] = useState({
    candidateName: '',
    department: 'Clinical Services',
    jobTitle: '',
    interviewer: '',
    onboardingStage: 'Interviewing' as const,
    startDate: new Date().toISOString().split('T')[0],
    checklistProgress: 0,
    assignedMentor: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<RecruitmentRecord>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const recRef = collection(db, 'hr_recruitment');
    
    const unsubscribe = onSnapshot(recRef, async (snapshot) => {
      let list: RecruitmentRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as RecruitmentRecord);
      });

      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_RECRUITS.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_RECRUITS) {
              await addDoc(collection(db, 'hr_recruitment'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_recruitment:', err);
          }
        } else {
          setRecruits([]);
        }
      } else {
        setRecruits(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Recruitment loading error:', error);
      addToast('error', 'Error loading Recruitment records');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecruit.candidateName || !newRecruit.jobTitle || !newRecruit.interviewer) {
      addToast('error', 'Please fill in candidate name, job title, and interviewer.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_recruitment'), {
        ...newRecruit,
        hospital_id
      });
      addToast('success', `✓ Successfully registered recruit ${newRecruit.candidateName}.`);
      setIsAdding(false);
      // Reset Form
      setNewRecruit({
        candidateName: '',
        department: 'Clinical Services',
        jobTitle: '',
        interviewer: '',
        onboardingStage: 'Interviewing',
        startDate: new Date().toISOString().split('T')[0],
        checklistProgress: 0,
        assignedMentor: ''
      });
    } catch (err) {
      addToast('error', 'Failed to register new employment.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (record: RecruitmentRecord) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async (id: string) => {
    if (!editFormData.candidateName || !editFormData.jobTitle) {
      addToast('error', 'Candidate Name and Job Title are required.');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_recruitment', id);
      await updateDoc(docRef, {
        candidateName: editFormData.candidateName,
        department: editFormData.department,
        jobTitle: editFormData.jobTitle,
        interviewer: editFormData.interviewer,
        onboardingStage: editFormData.onboardingStage,
        startDate: editFormData.startDate,
        checklistProgress: Number(editFormData.checklistProgress),
        assignedMentor: editFormData.assignedMentor
      });
      addToast('success', '✓ Recruitment profile updated.');
      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      addToast('error', 'Failed to update recruitment profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from the hiring pipeline?`)) {
      return;
    }
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_recruitment', id));
      addToast('success', '✓ Candidate record successfully deleted.');
    } catch (err) {
      addToast('error', 'Failed to delete candidate record.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecruits = recruits.filter(r => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (r.candidateName || '').toLowerCase().includes(q) ||
      (r.jobTitle || '').toLowerCase().includes(q) ||
      (r.interviewer || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || r.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Calculate stats
  const totalPipeline = recruits.length;
  const interviewingCount = recruits.filter(r => r.onboardingStage === 'Interviewing').length;
  const onboardingCount = recruits.filter(r => r.onboardingStage === 'Onboarding').length;
  const completedCount = recruits.filter(r => r.onboardingStage === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Recruitment Pipeline', val: totalPipeline, sub: 'Total active processes', icon: UserPlus, color: 'indigo' },
          { label: 'Active Interviews', val: interviewingCount, sub: 'Screening/Panel stage', icon: Briefcase, color: 'emerald' },
          { label: 'Onboarding Hires', val: onboardingCount, sub: 'Credentialing & induction', icon: ChevronRight, color: 'amber' },
          { label: 'Onboarding Completed', val: completedCount, sub: 'Fully integrated staff', icon: Check, color: 'violet' }
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
              placeholder="Search candidate name, job role, mentor..."
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
          {isAdding ? 'Close Drawer' : 'New Candidate'}
        </button>
      </div>

      {/* Form Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm p-5"
          >
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <UserPlus className="text-indigo-600" size={16} />
              Register New Candidate / Employment Prospect
            </h4>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. W/rt Almaz Beyene"
                  value={newRecruit.candidateName}
                  onChange={(e) => setNewRecruit({ ...newRecruit, candidateName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={newRecruit.department}
                  onChange={(e) => setNewRecruit({ ...newRecruit, department: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prospect Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midwife, Lead Pharmacist"
                  value={newRecruit.jobTitle}
                  onChange={(e) => setNewRecruit({ ...newRecruit, jobTitle: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Interviewer *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. W/ro Chaltu Alimu"
                  value={newRecruit.interviewer}
                  onChange={(e) => setNewRecruit({ ...newRecruit, interviewer: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Stage</label>
                <select
                  value={newRecruit.onboardingStage}
                  onChange={(e) => setNewRecruit({ ...newRecruit, onboardingStage: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {ONBOARDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expected Start Date</label>
                <input
                  type="date"
                  value={newRecruit.startDate}
                  onChange={(e) => setNewRecruit({ ...newRecruit, startDate: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Onboarding Progress (0 - 100)%</label>
                <input
                  type="number"
                  max="100"
                  min="0"
                  value={newRecruit.checklistProgress}
                  onChange={(e) => setNewRecruit({ ...newRecruit, checklistProgress: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Induction Mentor</label>
                <input
                  type="text"
                  placeholder="e.g. Sister Tigist"
                  value={newRecruit.assignedMentor}
                  onChange={(e) => setNewRecruit({ ...newRecruit, assignedMentor: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Add Candidate to Pipeline
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-4">Candidate & Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Primary Interviewer</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4">Est. Start Date</th>
                <th className="py-3 px-4">Onboarding Induction Checklist</th>
                <th className="py-3 px-4">Assigned Onboarding Mentor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <span className="text-slate-400 font-bold">Synchronizing Recruitment Logs...</span>
                  </td>
                </tr>
              ) : filteredRecruits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                    No active recruits found.
                  </td>
                </tr>
              ) : (
                filteredRecruits.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/40 transition-colors ${isEditing ? 'bg-indigo-50/10' : ''}`}>
                      {/* Name & Title */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editFormData.candidateName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, candidateName: e.target.value })}
                              className="px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full font-bold text-xs"
                            />
                            <input
                              type="text"
                              value={editFormData.jobTitle || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, jobTitle: e.target.value })}
                              className="px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="block font-bold text-slate-900">{item.candidateName}</span>
                            <span className="text-[10px] text-indigo-600 font-semibold block">{item.jobTitle}</span>
                          </div>
                        )}
                      </td>

                      {/* Department */}
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

                      {/* Interviewer */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.interviewer || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, interviewer: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs w-full"
                          />
                        ) : (
                          item.interviewer
                        )}
                      </td>

                      {/* Stage */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.onboardingStage || 'Interviewing'}
                            onChange={(e) => setEditFormData({ ...editFormData, onboardingStage: e.target.value as any })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          >
                            {ONBOARDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wide text-[9px] ${
                            item.onboardingStage === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            item.onboardingStage === 'Onboarding' ? 'bg-amber-50 text-amber-600' :
                            item.onboardingStage === 'Offer Extended' ? 'bg-blue-50 text-blue-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.onboardingStage}
                          </span>
                        )}
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFormData.startDate || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs w-28"
                          />
                        ) : (
                          item.startDate
                        )}
                      </td>

                      {/* Progress bar */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editFormData.checklistProgress || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, checklistProgress: Number(e.target.value) })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs w-16"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-slate-600">{item.checklistProgress}%</span>
                            <div className="w-16 bg-gray-100 h-1 rounded overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500"
                                style={{ width: `${item.checklistProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Mentor */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.assignedMentor || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, assignedMentor: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          />
                        ) : (
                          item.assignedMentor || 'Unassigned'
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
                              onClick={() => handleDelete(item.id, item.candidateName)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                              title="Delete candidate"
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
