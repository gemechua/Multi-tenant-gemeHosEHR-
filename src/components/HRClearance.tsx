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
  FileText, Calendar, Users, ShieldAlert, BadgeCheck, Clock, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeClearance {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  separationReason: 'Resignation' | 'Retirement' | 'Transfer' | 'Contract Completed' | 'Termination';
  effectiveDate: string;
  financeCleared: 'Cleared' | 'Pending' | 'Not Applicable';
  equipmentCleared: 'Cleared' | 'Pending' | 'Not Applicable';
  itCleared: 'Cleared' | 'Pending' | 'Not Applicable';
  adminCleared: 'Cleared' | 'Pending' | 'Not Applicable';
  overallStatus: 'Initiated' | 'In Progress' | 'Fully Discharged';
  remarks: string;
  hospital_id: string;
}

const INITIAL_CLEARANCES: any[] = [];

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

const REASONS = ['Resignation', 'Retirement', 'Transfer', 'Contract Completed', 'Termination'];
const STATUS_OPTIONS = ['Cleared', 'Pending', 'Not Applicable'];

interface HRClearanceProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRClearance({ hospital_id, addToast }: HRClearanceProps) {
  const [clearances, setClearances] = useState<EmployeeClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // New Record State
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Clinical Services',
    separationReason: 'Resignation' as const,
    effectiveDate: new Date().toISOString().split('T')[0],
    financeCleared: 'Pending' as const,
    equipmentCleared: 'Pending' as const,
    itCleared: 'Pending' as const,
    adminCleared: 'Pending' as const,
    overallStatus: 'Initiated' as const,
    remarks: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<EmployeeClearance>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const clearanceRef = collection(db, 'hr_clearances');
    
    const unsubscribe = onSnapshot(clearanceRef, async (snapshot) => {
      let list: EmployeeClearance[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as EmployeeClearance);
      });

      // Filter by hospital_id
      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_CLEARANCES.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_CLEARANCES) {
              await addDoc(collection(db, 'hr_clearances'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_clearances:', err);
          }
        } else {
          setClearances([]);
        }
      } else {
        setClearances(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Clearance loading error:', error);
      addToast('error', 'Error loading staff clearance checklists');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeName) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    const dateStr = newRecord.effectiveDate;
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      addToast('error', 'Validation Error: Please select a valid Effective Discharge Date.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_clearances'), {
        ...newRecord,
        employeeId: newRecord.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        hospital_id
      });
      addToast('success', '✓ Employee clearance checklist initiated successfully.');
      setIsAdding(false);
      setNewRecord({
        employeeId: '',
        employeeName: '',
        department: 'Clinical Services',
        separationReason: 'Resignation' as const,
        effectiveDate: new Date().toISOString().split('T')[0],
        financeCleared: 'Pending' as const,
        equipmentCleared: 'Pending' as const,
        itCleared: 'Pending' as const,
        adminCleared: 'Pending' as const,
        overallStatus: 'Initiated' as const,
        remarks: ''
      });
    } catch (err) {
      console.error('Error adding clearance:', err);
      addToast('error', 'Failed to add clearance record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (editFormData.effectiveDate !== undefined) {
      if (!editFormData.effectiveDate || isNaN(Date.parse(editFormData.effectiveDate))) {
        addToast('error', 'Validation Error: Please enter a valid Effective Discharge Date.');
        return;
      }
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_clearances', id);
      
      // Auto compute overall status if everything is cleared
      const updatedData = { ...editFormData };
      if (
        updatedData.financeCleared === 'Cleared' &&
        updatedData.equipmentCleared === 'Cleared' &&
        updatedData.itCleared === 'Cleared' &&
        updatedData.adminCleared === 'Cleared'
      ) {
        updatedData.overallStatus = 'Fully Discharged';
      } else if (
        updatedData.financeCleared === 'Pending' ||
        updatedData.equipmentCleared === 'Pending' ||
        updatedData.itCleared === 'Pending' ||
        updatedData.adminCleared === 'Pending'
      ) {
        updatedData.overallStatus = 'In Progress';
      }

      await updateDoc(docRef, updatedData);
      addToast('success', '✓ Clearance checklist updated successfully.');
      setEditingId(null);
    } catch (err) {
      console.error('Error updating clearance checklist:', err);
      addToast('error', 'Failed to update clearance checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this clearance record?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_clearances', id));
      addToast('success', 'Clearance checklist deleted.');
    } catch (err) {
      console.error('Error deleting clearance record:', err);
      addToast('error', 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const filteredList = clearances.filter(item => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeId || '').toLowerCase().includes(q) ||
      (item.remarks || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || item.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="text-indigo-600" size={16} /> Hospital Exit Clearance Checklist
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Initiate, audit, and approve separation clearance checklists across hospital departments.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? 'Cancel Form' : 'Initiate Exit Clearance'}
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
            <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest">Initiate Outward Exit Clearance</h5>
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
                  placeholder="e.g. EMP-015" 
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
                <label className="block font-bold text-slate-500 mb-1">Separation Reason</label>
                <select 
                  value={newRecord.separationReason} 
                  onChange={e => setNewRecord({...newRecord, separationReason: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Effective Discharge Date*</label>
                <input 
                  type="date" 
                  value={newRecord.effectiveDate} 
                  onChange={e => setNewRecord({...newRecord, effectiveDate: e.target.value})} 
                  className={`w-full p-2 border rounded-lg focus:ring-1 ${
                    !newRecord.effectiveDate || isNaN(Date.parse(newRecord.effectiveDate))
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />
                {(!newRecord.effectiveDate || isNaN(Date.parse(newRecord.effectiveDate))) && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">Please enter a valid date</span>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Finance & Salaries Cleared?</label>
                <select 
                  value={newRecord.financeCleared} 
                  onChange={e => setNewRecord({...newRecord, financeCleared: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Medical Supplies & Uniforms returned?</label>
                <select 
                  value={newRecord.equipmentCleared} 
                  onChange={e => setNewRecord({...newRecord, equipmentCleared: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Hospital IT Assets & Badge Cleared?</label>
                <select 
                  value={newRecord.itCleared} 
                  onChange={e => setNewRecord({...newRecord, itCleared: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block font-bold text-slate-500 mb-1">Detailed Clearance & Separation Remarks</label>
                <input 
                  type="text" 
                  placeholder="Notes about handover, remaining duties, etc." 
                  value={newRecord.remarks} 
                  onChange={e => setNewRecord({...newRecord, remarks: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Initiate Clearance Checklist
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
            placeholder="Search clearance checklist by employee name, id or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0 w-full md:w-auto justify-end">
          <span className="font-bold text-slate-400 uppercase">Clearance Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-lg py-1.5 px-3 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Stages</option>
            <option value="Initiated">Initiated</option>
            <option value="In Progress">In Progress</option>
            <option value="Fully Discharged">Fully Discharged</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Separation Reason</th>
                <th className="py-3.5 px-4">Effective Date</th>
                <th className="py-3.5 px-4">Finance Gate</th>
                <th className="py-3.5 px-4">Equipment Gate</th>
                <th className="py-3.5 px-4">IT/Badge Gate</th>
                <th className="py-3.5 px-4">Admin Gate</th>
                <th className="py-3.5 px-4">Discharge State</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <RefreshCw size={20} className="mx-auto animate-spin mb-2 text-indigo-600" />
                    Synchronizing outward clearance logs...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No outward exit clearance checklists found matching filters.
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
                      <td className="py-3.5 px-4 text-slate-800 font-bold">
                        {isEditing ? (
                          <select 
                            value={editFormData.separationReason || item.separationReason} 
                            onChange={e => setEditFormData({...editFormData, separationReason: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs"
                          >
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className="text-slate-700">{item.separationReason}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="date" 
                              value={editFormData.effectiveDate !== undefined ? editFormData.effectiveDate : item.effectiveDate} 
                              onChange={e => setEditFormData({...editFormData, effectiveDate: e.target.value})} 
                              className={`border p-1 rounded bg-white text-xs ${
                                editFormData.effectiveDate !== undefined && (!editFormData.effectiveDate || isNaN(Date.parse(editFormData.effectiveDate)))
                                  ? 'border-rose-500 focus:ring-rose-500 bg-rose-50'
                                  : 'border-slate-200 focus:ring-indigo-500'
                              }`}
                            />
                            {editFormData.effectiveDate !== undefined && (!editFormData.effectiveDate || isNaN(Date.parse(editFormData.effectiveDate))) && (
                              <span className="text-[9px] text-rose-500 font-bold block">Invalid date</span>
                            )}
                          </div>
                        ) : item.effectiveDate}
                      </td>
                      {/* Finance gate check-off */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.financeCleared || item.financeCleared} 
                            onChange={e => setEditFormData({...editFormData, financeCleared: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-[10px]"
                          >
                            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            item.financeCleared === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 
                            item.financeCleared === 'Pending' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>{item.financeCleared}</span>
                        )}
                      </td>
                      {/* Equipment gate check-off */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.equipmentCleared || item.equipmentCleared} 
                            onChange={e => setEditFormData({...editFormData, equipmentCleared: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-[10px]"
                          >
                            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            item.equipmentCleared === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 
                            item.equipmentCleared === 'Pending' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>{item.equipmentCleared}</span>
                        )}
                      </td>
                      {/* IT gate check-off */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.itCleared || item.itCleared} 
                            onChange={e => setEditFormData({...editFormData, itCleared: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-[10px]"
                          >
                            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            item.itCleared === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 
                            item.itCleared === 'Pending' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>{item.itCleared}</span>
                        )}
                      </td>
                      {/* Admin gate check-off */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.adminCleared || item.adminCleared} 
                            onChange={e => setEditFormData({...editFormData, adminCleared: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-[10px]"
                          >
                            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            item.adminCleared === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 
                            item.adminCleared === 'Pending' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>{item.adminCleared}</span>
                        )}
                      </td>
                      {/* Overall Discharge Stage */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          item.overallStatus === 'Fully Discharged' ? 'bg-indigo-600 text-white' : 
                          item.overallStatus === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.overallStatus === 'Fully Discharged' && <BadgeCheck size={10} />}
                          {item.overallStatus}
                        </span>
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
                              title="Edit Clearance"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)} 
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Delete Checklist"
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
