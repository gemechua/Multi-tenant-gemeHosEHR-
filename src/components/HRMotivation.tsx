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
  Sparkles, Calendar, Users, Award, Gift, Heart, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffMotivation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  recognitionType: 'Employee of the Month' | 'Patient Care Excellence' | 'Safety Champion' | 'Milestone Bonus' | 'Peer Recognition' | 'Extra Shift Incentive';
  dateAwarded: string;
  rewardDescription: string;
  reason: string;
  approvedBy: string;
  hospital_id: string;
}

const INITIAL_MOTIVATIONS: any[] = [];

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

const RECOGNITION_TYPES = [
  'Employee of the Month',
  'Patient Care Excellence',
  'Safety Champion',
  'Milestone Bonus',
  'Peer Recognition',
  'Extra Shift Incentive'
];

interface HRMotivationProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRMotivation({ hospital_id, addToast }: HRMotivationProps) {
  const [motivations, setMotivations] = useState<StaffMotivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // New Record State
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Clinical Services',
    recognitionType: 'Employee of the Month' as const,
    dateAwarded: new Date().toISOString().split('T')[0],
    rewardDescription: '',
    reason: '',
    approvedBy: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StaffMotivation>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const motRef = collection(db, 'hr_motivations');
    
    const unsubscribe = onSnapshot(motRef, async (snapshot) => {
      let list: StaffMotivation[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as StaffMotivation);
      });

      // Filter by hospital_id
      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_MOTIVATIONS.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_MOTIVATIONS) {
              await addDoc(collection(db, 'hr_motivations'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_motivations:', err);
          }
        } else {
          setMotivations([]);
        }
      } else {
        setMotivations(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Motivation loading error:', error);
      addToast('error', 'Error loading staff motivation records');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeName || !newRecord.rewardDescription || !newRecord.reason) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    const dateStr = newRecord.dateAwarded;
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      addToast('error', 'Validation Error: Please select a valid Date Awarded.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_motivations'), {
        ...newRecord,
        employeeId: newRecord.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        hospital_id
      });
      addToast('success', '✓ Recognition and incentive award logged.');
      setIsAdding(false);
      setNewRecord({
        employeeId: '',
        employeeName: '',
        department: 'Clinical Services',
        recognitionType: 'Employee of the Month' as const,
        dateAwarded: new Date().toISOString().split('T')[0],
        rewardDescription: '',
        reason: '',
        approvedBy: ''
      });
    } catch (err) {
      console.error('Error adding motivation record:', err);
      addToast('error', 'Failed to log motivation record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (editFormData.dateAwarded !== undefined) {
      if (!editFormData.dateAwarded || isNaN(Date.parse(editFormData.dateAwarded))) {
        addToast('error', 'Validation Error: Please enter a valid Date Awarded.');
        return;
      }
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_motivations', id);
      await updateDoc(docRef, editFormData);
      addToast('success', '✓ Motivation record updated.');
      setEditingId(null);
    } catch (err) {
      console.error('Error updating motivation record:', err);
      addToast('error', 'Failed to update motivation record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this motivation record?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_motivations', id));
      addToast('success', 'Incentive record removed successfully.');
    } catch (err) {
      console.error('Error deleting incentive record:', err);
      addToast('error', 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const filteredList = motivations.filter(item => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeId || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q) ||
      (item.rewardDescription || '').toLowerCase().includes(q);
    const matchesType = typeFilter === 'All' || item.recognitionType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="text-indigo-600 animate-bounce" size={16} /> Staff Motivation & Recognition Hub
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Track milestones, reward clinical excellence, manage financial shift incentives, and log peer honors.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? 'Cancel Form' : 'Award Recognition'}
        </button>
      </div>

      {/* FORM */}
      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddSubmit}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
          >
            <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 text-indigo-600">
              <Gift size={13} /> Log Excellence Award or Shift Incentive
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Employee Name*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sister Aster Demeke" 
                  value={newRecord.employeeName} 
                  onChange={e => setNewRecord({...newRecord, employeeName: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Employee ID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. EMP-001" 
                  value={newRecord.employeeId} 
                  onChange={e => setNewRecord({...newRecord, employeeId: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Department</label>
                <select 
                  value={newRecord.department} 
                  onChange={e => setNewRecord({...newRecord, department: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Recognition Type</label>
                <select 
                  value={newRecord.recognitionType} 
                  onChange={e => setNewRecord({...newRecord, recognitionType: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {RECOGNITION_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Award Date*</label>
                <input 
                  type="date" 
                  value={newRecord.dateAwarded} 
                  onChange={e => setNewRecord({...newRecord, dateAwarded: e.target.value})} 
                  className={`w-full p-2 border rounded-lg focus:ring-1 ${
                    !newRecord.dateAwarded || isNaN(Date.parse(newRecord.dateAwarded))
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />
                {(!newRecord.dateAwarded || isNaN(Date.parse(newRecord.dateAwarded))) && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">Please enter a valid date</span>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Approved By (Medical/Clinical Lead)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Abebe" 
                  value={newRecord.approvedBy} 
                  onChange={e => setNewRecord({...newRecord, approvedBy: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-500 mb-1">Incentive Reward / Benefit Description*</label>
                <input 
                  type="text" 
                  placeholder="e.g. 5,000 ETB Shift Bonus, Certificate, Paid Leave days..." 
                  value={newRecord.rewardDescription} 
                  onChange={e => setNewRecord({...newRecord, rewardDescription: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                  required
                />
              </div>
              <div className="md:col-span-4">
                <label className="block font-bold text-slate-500 mb-1">Detailed Meritorious Performance Reason / Patient Feedback*</label>
                <input 
                  type="text" 
                  placeholder="Provide precise details of safety champion deeds, nursing speed, maternal recovery focus..." 
                  value={newRecord.reason} 
                  onChange={e => setNewRecord({...newRecord, reason: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Log Recognition Entry
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search recognition logs by employee name, reward details, or feedback reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0 w-full md:w-auto justify-end">
          <span className="font-bold text-slate-400 uppercase">Award Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-lg py-1.5 px-3 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {RECOGNITION_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* CARDS / TABLE GRID */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3.5 px-4">Staff Recipient</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Recognition Honor Type</th>
                <th className="py-3.5 px-4">Award Date</th>
                <th className="py-3.5 px-4">Reward Value Description</th>
                <th className="py-3.5 px-4">Feedback & Meritorious Reason</th>
                <th className="py-3.5 px-4">Authorized By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <RefreshCw size={20} className="mx-auto animate-spin mb-2 text-indigo-600" />
                    Refreshing hospital reward rosters...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No motivation or reward logs found matching filters.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold">{item.employeeName}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{item.employeeId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black text-[9px] uppercase">
                          {item.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.recognitionType || item.recognitionType} 
                            onChange={e => setEditFormData({...editFormData, recognitionType: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs"
                          >
                            {RECOGNITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] uppercase font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Award size={10} />
                            {item.recognitionType}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="date" 
                              value={editFormData.dateAwarded !== undefined ? editFormData.dateAwarded : item.dateAwarded} 
                              onChange={e => setEditFormData({...editFormData, dateAwarded: e.target.value})} 
                              className={`border p-1 rounded bg-white text-xs ${
                                editFormData.dateAwarded !== undefined && (!editFormData.dateAwarded || isNaN(Date.parse(editFormData.dateAwarded)))
                                  ? 'border-rose-500 focus:ring-rose-500 bg-rose-50'
                                  : 'border-slate-200 focus:ring-indigo-500'
                              }`}
                            />
                            {editFormData.dateAwarded !== undefined && (!editFormData.dateAwarded || isNaN(Date.parse(editFormData.dateAwarded))) && (
                              <span className="text-[9px] text-rose-500 font-bold block">Invalid date</span>
                            )}
                          </div>
                        ) : item.dateAwarded}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.rewardDescription || item.rewardDescription} 
                            onChange={e => setEditFormData({...editFormData, rewardDescription: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs w-full animate-pulse"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Gift size={11} className="shrink-0" />
                            {item.rewardDescription}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-sm">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.reason || item.reason} 
                            onChange={e => setEditFormData({...editFormData, reason: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs w-full"
                          />
                        ) : (
                          <p className="line-clamp-2 leading-relaxed">{item.reason}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.approvedBy || item.approvedBy} 
                            onChange={e => setEditFormData({...editFormData, approvedBy: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs"
                          />
                        ) : item.approvedBy || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleSaveEdit(item.id)} 
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => { setEditingId(item.id); setEditFormData(item); }} 
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Edit Record"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)} 
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Delete Record"
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
