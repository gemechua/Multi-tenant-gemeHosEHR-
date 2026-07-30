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
  ClipboardList, Calendar, Users, Award, BookOpen, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrainingAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  trainingProgram: string;
  topic: string;
  date: string;
  hoursCompleted: number;
  status: 'Attended' | 'Absent' | 'Excused';
  certificateIssued: boolean;
  remarks: string;
  hospital_id: string;
}

const INITIAL_ATTENDANCE: any[] = [];

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

interface HRTrainingAttendanceProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRTrainingAttendance({ hospital_id, addToast }: HRTrainingAttendanceProps) {
  const [attendance, setAttendance] = useState<TrainingAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // New Record State
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Clinical Services',
    trainingProgram: '',
    topic: '',
    date: new Date().toISOString().split('T')[0],
    hoursCompleted: 4,
    status: 'Attended' as const,
    certificateIssued: false,
    remarks: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TrainingAttendance>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const attendanceRef = collection(db, 'hr_training_attendance');
    
    const unsubscribe = onSnapshot(attendanceRef, async (snapshot) => {
      let list: TrainingAttendance[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TrainingAttendance);
      });

      // Filter by hospital_id
      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_ATTENDANCE.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_ATTENDANCE) {
              await addDoc(collection(db, 'hr_training_attendance'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_training_attendance:', err);
          }
        } else {
          setAttendance([]);
        }
      } else {
        setAttendance(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Training Attendance loading error:', error);
      addToast('error', 'Error loading training attendance records');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeName || !newRecord.trainingProgram || !newRecord.topic) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    const hours = Number(newRecord.hoursCompleted);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      addToast('error', 'Validation Error: Credit Hours must be a positive number between 0.5 and 24.');
      return;
    }

    const dateStr = newRecord.date;
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      addToast('error', 'Validation Error: Please select a valid date.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_training_attendance'), {
        ...newRecord,
        employeeId: newRecord.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        hospital_id
      });
      addToast('success', '✓ Training attendance record saved successfully.');
      setIsAdding(false);
      setNewRecord({
        employeeId: '',
        employeeName: '',
        department: 'Clinical Services',
        trainingProgram: '',
        topic: '',
        date: new Date().toISOString().split('T')[0],
        hoursCompleted: 4,
        status: 'Attended' as const,
        certificateIssued: false,
        remarks: ''
      });
    } catch (err) {
      console.error('Error adding training attendance:', err);
      addToast('error', 'Failed to add training attendance record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const hours = Number(editFormData.hoursCompleted);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      addToast('error', 'Validation Error: Credit Hours must be a positive number between 0.5 and 24.');
      return;
    }

    const dateStr = editFormData.date || '';
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      addToast('error', 'Validation Error: Date must be a valid date format.');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_training_attendance', id);
      await updateDoc(docRef, editFormData);
      addToast('success', '✓ Training attendance record updated.');
      setEditingId(null);
    } catch (err) {
      console.error('Error updating training attendance:', err);
      addToast('error', 'Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_training_attendance', id));
      addToast('success', 'Training attendance record deleted.');
    } catch (err) {
      console.error('Error deleting record:', err);
      addToast('error', 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const filteredList = attendance.filter(item => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.trainingProgram || '').toLowerCase().includes(q) ||
      (item.topic || '').toLowerCase().includes(q) ||
      (item.employeeId || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || item.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={16} /> Training Attendance Log
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Track clinician attendance, topic coverage, practical credit hours, and safety certification status.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? 'Cancel Form' : 'Log Attendance'}
        </button>
      </div>

      {/* ADD ATTENDANCE FORM */}
      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddSubmit}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
          >
            <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest">Register Training Attendance Entry</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Personnel Name*</label>
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
                <label className="block font-bold text-slate-500 mb-1">Training Program*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Safe Motherhood Workshop" 
                  value={newRecord.trainingProgram} 
                  onChange={e => setNewRecord({...newRecord, trainingProgram: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Syllabus Topic / Lesson*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Postpartum Hemorrhage" 
                  value={newRecord.topic} 
                  onChange={e => setNewRecord({...newRecord, topic: e.target.value})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500" 
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Attendance Date*</label>
                <input 
                  type="date" 
                  value={newRecord.date} 
                  onChange={e => setNewRecord({...newRecord, date: e.target.value})} 
                  className={`w-full p-2 border rounded-lg focus:ring-1 ${
                    !newRecord.date || isNaN(Date.parse(newRecord.date))
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />
                {(!newRecord.date || isNaN(Date.parse(newRecord.date))) && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">Please enter a valid date</span>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Credit Hours Completed (0.5 - 24)*</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={newRecord.hoursCompleted} 
                  onChange={e => setNewRecord({...newRecord, hoursCompleted: Number(e.target.value)})} 
                  className={`w-full p-2 border rounded-lg focus:ring-1 ${
                    newRecord.hoursCompleted <= 0 || newRecord.hoursCompleted > 24
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />
                {(newRecord.hoursCompleted <= 0 || newRecord.hoursCompleted > 24) && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">Must be between 0.5 and 24 hours</span>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Attendance Status</label>
                <select 
                  value={newRecord.status} 
                  onChange={e => setNewRecord({...newRecord, status: e.target.value as any})} 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Attended">Attended</option>
                  <option value="Absent">Absent</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600">
                  <input 
                    type="checkbox" 
                    checked={newRecord.certificateIssued} 
                    onChange={e => setNewRecord({...newRecord, certificateIssued: e.target.checked})} 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Certificate / Accreditation Issued
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-500 mb-1">Specific Evaluation / Technical Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. Demonstrated clinical competencies" 
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
                Log Attendance Record
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
            placeholder="Search training attendance by candidate, course, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0 w-full md:w-auto justify-end">
          <span className="font-bold text-slate-400 uppercase">Filter Dept:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-lg py-1.5 px-3 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Training Program / Course</th>
                <th className="py-3.5 px-4">Focus Syllabus Topic</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Certificate</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <Clock size={20} className="mx-auto animate-spin mb-2 text-indigo-600" />
                    Synchronizing clinical training logs...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No clinical training attendance records found matching filters.
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
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.trainingProgram || ''} 
                            onChange={e => setEditFormData({...editFormData, trainingProgram: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs w-full"
                          />
                        ) : item.trainingProgram}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFormData.topic || ''} 
                            onChange={e => setEditFormData({...editFormData, topic: e.target.value})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs w-full"
                          />
                        ) : item.topic}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="date" 
                              value={editFormData.date || ''} 
                              onChange={e => setEditFormData({...editFormData, date: e.target.value})} 
                              className={`border p-1 rounded bg-white text-xs ${
                                !editFormData.date || isNaN(Date.parse(editFormData.date))
                                  ? 'border-rose-500 focus:ring-rose-500 bg-rose-50'
                                  : 'border-slate-200 focus:ring-indigo-500'
                              }`}
                            />
                            {(!editFormData.date || isNaN(Date.parse(editFormData.date))) && (
                              <span className="text-[9px] text-rose-500 font-bold block">Invalid date</span>
                            )}
                          </div>
                        ) : item.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="number" 
                              step="0.5"
                              value={editFormData.hoursCompleted ?? ''} 
                              onChange={e => setEditFormData({...editFormData, hoursCompleted: e.target.value === '' ? undefined : Number(e.target.value)})} 
                              className={`border p-1 rounded bg-white text-xs w-16 ${
                                editFormData.hoursCompleted !== undefined && (editFormData.hoursCompleted <= 0 || editFormData.hoursCompleted > 24)
                                  ? 'border-rose-500 focus:ring-rose-500 bg-rose-50'
                                  : 'border-slate-200 focus:ring-indigo-500'
                              }`}
                            />
                            {editFormData.hoursCompleted !== undefined && (editFormData.hoursCompleted <= 0 || editFormData.hoursCompleted > 24) && (
                              <span className="text-[9px] text-rose-500 font-bold block">Range: 0.5-24</span>
                            )}
                          </div>
                        ) : `${item.hoursCompleted} hrs`}
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select 
                            value={editFormData.status || 'Attended'} 
                            onChange={e => setEditFormData({...editFormData, status: e.target.value as any})} 
                            className="border border-slate-200 p-1 rounded bg-white text-xs"
                          >
                            <option value="Attended">Attended</option>
                            <option value="Absent">Absent</option>
                            <option value="Excused">Excused</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                            item.status === 'Attended' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                            item.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 
                            'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!editFormData.certificateIssued} 
                              onChange={e => setEditFormData({...editFormData, certificateIssued: e.target.checked})} 
                              className="rounded border-slate-300 text-indigo-600"
                            />
                            Issued
                          </label>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.certificateIssued ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Award size={10} />
                            {item.certificateIssued ? 'Accredited' : 'No'}
                          </span>
                        )}
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
