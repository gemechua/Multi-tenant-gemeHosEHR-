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
  Calendar, Users, CheckCircle, Clock, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'Annual' | 'Maternity' | 'Paternity' | 'Study' | 'Bereavement' | 'Emergency' | 'Other';
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  approvedBy: string;
  hospital_id: string;
}

const INITIAL_LEAVES: any[] = [];

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

const LEAVE_TYPES = ['Annual', 'Maternity', 'Paternity', 'Study', 'Bereavement', 'Emergency', 'Other'];
const STATUSES = ['Pending', 'Approved', 'Rejected'];

interface HRLeaveProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRLeave({ hospital_id, addToast }: HRLeaveProps) {
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // New Record State
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Clinical Services',
    leaveType: 'Annual' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
    status: 'Pending' as const,
    approvedBy: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StaffLeave>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const leaveRef = collection(db, 'hr_leaves');
    
    const unsubscribe = onSnapshot(leaveRef, async (snapshot) => {
      let list: StaffLeave[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as StaffLeave);
      });

      // Filter by hospital_id
      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_LEAVES.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_LEAVES) {
              await addDoc(collection(db, 'hr_leaves'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_leaves:', err);
          }
        } else {
          setLeaves([]);
        }
      } else {
        setLeaves(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Leave loading error:', error);
      addToast('error', 'Error loading leave logs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const calculateDays = (start: string, end: string) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diff = eDate.getTime() - sDate.getTime();
    if (isNaN(diff)) return 1;
    const days = Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeName || !newRecord.reason) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    if (!newRecord.startDate || isNaN(Date.parse(newRecord.startDate))) {
      addToast('error', 'Validation Error: Start Date is invalid.');
      return;
    }

    if (!newRecord.endDate || isNaN(Date.parse(newRecord.endDate))) {
      addToast('error', 'Validation Error: End Date is invalid.');
      return;
    }

    if (new Date(newRecord.endDate) < new Date(newRecord.startDate)) {
      addToast('error', 'Validation Error: End Date cannot be before Start Date.');
      return;
    }

    try {
      setLoading(true);
      const days = calculateDays(newRecord.startDate, newRecord.endDate);
      await addDoc(collection(db, 'hr_leaves'), {
        ...newRecord,
        employeeId: newRecord.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        totalDays: days,
        hospital_id
      });
      addToast('success', '✓ Leave request logged successfully.');
      setIsAdding(false);
      setNewRecord({
        employeeId: '',
        employeeName: '',
        department: 'Clinical Services',
        leaveType: 'Annual' as const,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: '',
        status: 'Pending' as const,
        approvedBy: ''
      });
    } catch (err) {
      console.error('Error adding leave request:', err);
      addToast('error', 'Failed to log leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const currentRecord = leaves.find(l => l.id === id);
    const finalStart = editFormData.startDate || currentRecord?.startDate || '';
    const finalEnd = editFormData.endDate || currentRecord?.endDate || '';

    if (!finalStart || isNaN(Date.parse(finalStart))) {
      addToast('error', 'Validation Error: Start Date is invalid.');
      return;
    }

    if (!finalEnd || isNaN(Date.parse(finalEnd))) {
      addToast('error', 'Validation Error: End Date is invalid.');
      return;
    }

    if (new Date(finalEnd) < new Date(finalStart)) {
      addToast('error', 'Validation Error: End Date cannot be before Start Date.');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_leaves', id);
      
      const updatedData = { ...editFormData };
      updatedData.totalDays = calculateDays(finalStart, finalEnd);

      await updateDoc(docRef, updatedData);
      addToast('success', '✓ Leave request updated.');
      setEditingId(null);
    } catch (err) {
      console.error('Error updating leave request:', err);
      addToast('error', 'Failed to update leave log');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave record?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_leaves', id));
      addToast('success', 'Leave record deleted.');
    } catch (err) {
      console.error('Error deleting leave record:', err);
      addToast('error', 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const filteredList = leaves.filter(item => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeId || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="text-indigo-600" size={16} /> Clinical Leave & Balance Registry
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Authorize annual rest periods, study/course releases, emergency days, and maternity/paternity tracking.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? 'Cancel Form' : 'Log Leave Request'}
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
            <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest">Register New Leave Request</h5>
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
                  placeholder="e.g. EMP-006" 
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
                <label className="block font-bold text-slate-500 mb-1">Leave Type</label>
                <select 
                  value={newRecord.leaveType} 
                  onChange={e => setNewRecord({...newRecord, leaveType: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Start Date*</label>
                <input 
                  type="date" 
                  value={newRecord.startDate} 
                  onChange={e => setNewRecord({...newRecord, startDate: e.target.value})} 
                  className={`w-full p-2 border rounded-lg focus:ring-1 ${
                    !newRecord.startDate || isNaN(Date.parse(newRecord.startDate))
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">End Date*</label>
                <input 
                  type="date" 
                  value={newRecord.endDate} 
                  onChange={e => setNewRecord({...newRecord, endDate: e.target.value})} 
                  className={`w-full p-2 border rounded-lg focus:ring-1 ${
                    !newRecord.endDate || isNaN(Date.parse(newRecord.endDate)) || (new Date(newRecord.endDate) < new Date(newRecord.startDate))
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />
                {newRecord.startDate && newRecord.endDate && new Date(newRecord.endDate) < new Date(newRecord.startDate) && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">End Date cannot be before Start Date</span>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Approval Sign-off Status</label>
                <select 
                  value={newRecord.status} 
                  onChange={e => setNewRecord({...newRecord, status: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Approved By (Auditor Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. W/ro Hana" 
                  value={newRecord.approvedBy} 
                  onChange={e => setNewRecord({...newRecord, approvedBy: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="md:col-span-4">
                <label className="block font-bold text-slate-500 mb-1">Reason & Clinical Shift Handover Remarks*</label>
                <input 
                  type="text" 
                  placeholder="Explain why, and who is on call for coverage..." 
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
                Log Leave Record
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
            placeholder="Search leave logs by staff member, reasons, or approvers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0 w-full md:w-auto justify-end">
          <span className="font-bold text-slate-400 uppercase">Approval Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-lg py-1.5 px-3 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Requests</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3.5 px-4">Personnel</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">End Date</th>
                <th className="py-3.5 px-4">Total Days</th>
                <th className="py-3.5 px-4">Shift Handover / Purpose</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Approver</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <RefreshCw size={20} className="mx-auto animate-spin mb-2 text-indigo-600" />
                    Loading leave registries...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No staff leave records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const isEditing = editingId === item.id;
                  const currentStart = isEditing ? (editFormData.startDate !== undefined ? editFormData.startDate : item.startDate) : item.startDate;
                  const currentEnd = isEditing ? (editFormData.endDate !== undefined ? editFormData.endDate : item.endDate) : item.endDate;
                  const isDateInvalid = !currentStart || !currentEnd || isNaN(Date.parse(currentStart)) || isNaN(Date.parse(currentEnd)) || (new Date(currentEnd) < new Date(currentStart));

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-all ${isEditing && isDateInvalid ? 'bg-rose-50/20' : ''}`}>
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
                      <td className="py-3.5 px-4 font-bold text-indigo-600">
                        {isEditing ? (
                          <select 
                            value={editFormData.leaveType || item.leaveType} 
                            onChange={e => setEditFormData({...editFormData, leaveType: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs"
                          >
                            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : item.leaveType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="date" 
                              value={editFormData.startDate !== undefined ? editFormData.startDate : item.startDate} 
                              onChange={e => setEditFormData({...editFormData, startDate: e.target.value})} 
                              className={`border p-1 rounded bg-white text-xs ${
                                isDateInvalid ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-slate-200 focus:ring-indigo-500'
                              }`}
                            />
                          </div>
                        ) : item.startDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="date" 
                              value={editFormData.endDate !== undefined ? editFormData.endDate : item.endDate} 
                              onChange={e => setEditFormData({...editFormData, endDate: e.target.value})} 
                              className={`border p-1 rounded bg-white text-xs ${
                                isDateInvalid ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-slate-200 focus:ring-indigo-500'
                              }`}
                            />
                            {isDateInvalid && (
                              <span className="text-[9px] text-rose-500 font-bold block">Invalid range</span>
                            )}
                          </div>
                        ) : item.endDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-800 text-center">
                        {isEditing && !isDateInvalid ? `${calculateDays(currentStart, currentEnd)} Days` : `${item.totalDays} Days`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.reason || item.reason} 
                            onChange={e => setEditFormData({...editFormData, reason: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs w-full"
                          />
                        ) : item.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.status || item.status} 
                            onChange={e => setEditFormData({...editFormData, status: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                            item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                            item.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 
                            'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-bold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.approvedBy || item.approvedBy} 
                            onChange={e => setEditFormData({...editFormData, approvedBy: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs w-28"
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
                              title="Edit Leave"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)} 
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Delete Leave"
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
