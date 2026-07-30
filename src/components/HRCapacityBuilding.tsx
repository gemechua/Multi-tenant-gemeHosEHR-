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
  GraduationCap, Calendar, BookOpen, MapPin, Award 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CapacityBuildingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  courseName: string;
  institution: string;
  startDate: string;
  endDate: string;
  fundingSource: 'Hospital Funded' | 'Self-Funded' | 'Sponsor';
  status: 'Nominated' | 'Ongoing' | 'Completed';
  skillsGained: string;
  hospital_id: string;
}

const INITIAL_RECORDS: any[] = [];

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

const FUNDING_SOURCES = ['Hospital Funded', 'Self-Funded', 'Sponsor'];
const STATUSES = ['Nominated', 'Ongoing', 'Completed'];

interface HRCapacityBuildingProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRCapacityBuilding({ hospital_id, addToast }: HRCapacityBuildingProps) {
  const [records, setRecords] = useState<CapacityBuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // New Record State
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Clinical Services',
    courseName: '',
    institution: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fundingSource: 'Hospital Funded' as const,
    status: 'Nominated' as const,
    skillsGained: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CapacityBuildingRecord>>({});

  // Sync / Listen
  useEffect(() => {
    setLoading(true);
    const cbRef = collection(db, 'hr_capacity_building');
    
    const unsubscribe = onSnapshot(cbRef, async (snapshot) => {
      let list: CapacityBuildingRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CapacityBuildingRecord);
      });

      const filtered = list.filter(item => item.hospital_id === hospital_id);

      if (filtered.length === 0) {
        if (INITIAL_RECORDS.length > 0) {
          // Seed if empty
          try {
            for (const item of INITIAL_RECORDS) {
              await addDoc(collection(db, 'hr_capacity_building'), {
                ...item,
                hospital_id
              });
            }
          } catch (err) {
            console.error('Failed to seed hr_capacity_building:', err);
          }
        } else {
          setRecords([]);
        }
      } else {
        setRecords(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Capacity Building loading error:', error);
      addToast('error', 'Error loading Capacity Building records');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospital_id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeId || !newRecord.employeeName || !newRecord.courseName || !newRecord.institution) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'hr_capacity_building'), {
        ...newRecord,
        hospital_id
      });
      addToast('success', `✓ Registered ${newRecord.employeeName} in training.`);
      setIsAdding(false);
      // Reset
      setNewRecord({
        employeeId: '',
        employeeName: '',
        department: 'Clinical Services',
        courseName: '',
        institution: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fundingSource: 'Hospital Funded',
        status: 'Nominated',
        skillsGained: ''
      });
    } catch (err) {
      addToast('error', 'Failed to save capacity building record.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (record: CapacityBuildingRecord) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async (id: string) => {
    if (!editFormData.employeeName || !editFormData.courseName) {
      addToast('error', 'Employee name and Course name are required.');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'hr_capacity_building', id);
      await updateDoc(docRef, {
        employeeId: editFormData.employeeId,
        employeeName: editFormData.employeeName,
        department: editFormData.department,
        courseName: editFormData.courseName,
        institution: editFormData.institution,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        fundingSource: editFormData.fundingSource,
        status: editFormData.status,
        skillsGained: editFormData.skillsGained
      });
      addToast('success', '✓ Capacity Building record updated.');
      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      addToast('error', 'Failed to update record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the capacity building log for ${name}?`)) {
      return;
    }
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hr_capacity_building', id));
      addToast('success', '✓ Record successfully deleted.');
    } catch (err) {
      addToast('error', 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (r.employeeName || '').toLowerCase().includes(q) ||
      (r.employeeId || '').toLowerCase().includes(q) ||
      (r.courseName || '').toLowerCase().includes(q) ||
      (r.institution || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || r.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Calculate stats
  const totalEnrolled = records.length;
  const ongoingCount = records.filter(r => r.status === 'Ongoing').length;
  const completedCount = records.filter(r => r.status === 'Completed').length;
  const nominatedCount = records.filter(r => r.status === 'Nominated').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled in Training', val: totalEnrolled, sub: 'Staff upgrading skills', icon: GraduationCap, color: 'indigo' },
          { label: 'Active Ongoing Programs', val: ongoingCount, sub: 'In class or workshop', icon: BookOpen, color: 'emerald' },
          { label: 'Completed Upgrades', val: completedCount, sub: 'Certified and credentialed', icon: Award, color: 'amber' },
          { label: 'Pending Nominations', val: nominatedCount, sub: 'Approved for funding', icon: Calendar, color: 'violet' }
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
              placeholder="Search by ID, Name, Course, Center..."
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
          {isAdding ? 'Close Drawer' : 'Nominate Training'}
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
              <GraduationCap className="text-indigo-600" size={16} />
              Register Staff Member for Professional Upgrade Course
            </h4>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-006"
                  value={newRecord.employeeId}
                  onChange={(e) => setNewRecord({ ...newRecord, employeeId: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. W/ro Chaltu Alimu"
                  value={newRecord.employeeName}
                  onChange={(e) => setNewRecord({ ...newRecord, employeeName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={newRecord.department}
                  onChange={(e) => setNewRecord({ ...newRecord, department: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course / Specialization Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU Neonatal Ventilator Management"
                  value={newRecord.courseName}
                  onChange={(e) => setNewRecord({ ...newRecord, courseName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Educational Institution *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Addis Ababa University"
                  value={newRecord.institution}
                  onChange={(e) => setNewRecord({ ...newRecord, institution: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Training Start Date</label>
                <input
                  type="date"
                  value={newRecord.startDate}
                  onChange={(e) => setNewRecord({ ...newRecord, startDate: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expected Completion Date</label>
                <input
                  type="date"
                  value={newRecord.endDate}
                  onChange={(e) => setNewRecord({ ...newRecord, endDate: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Funding Program</label>
                <select
                  value={newRecord.fundingSource}
                  onChange={(e) => setNewRecord({ ...newRecord, fundingSource: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {FUNDING_SOURCES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Upgrade / Nominee Status</label>
                <select
                  value={newRecord.status}
                  onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Primary Learning Skills Gained</label>
                <input
                  type="text"
                  placeholder="e.g. Specialized ICU pediatric diagnostics"
                  value={newRecord.skillsGained}
                  onChange={(e) => setNewRecord({ ...newRecord, skillsGained: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Register Training
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity Building Register Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Upgrade Course Title</th>
                <th className="py-3 px-4">Institution / Center</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Funding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Target Skills Gained</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <span className="text-slate-400 font-bold">Synchronizing Training Logs...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 font-bold">
                    No active capacity building logs found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/40 transition-colors ${isEditing ? 'bg-indigo-50/10' : ''}`}>
                      {/* Member */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editFormData.employeeName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, employeeName: e.target.value })}
                              className="px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full font-bold"
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

                      {/* Course */}
                      <td className="py-3 px-4 font-semibold text-slate-950 max-w-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.courseName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, courseName: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.courseName
                        )}
                      </td>

                      {/* Center */}
                      <td className="py-3 px-4 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.institution || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.institution
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="date"
                              value={editFormData.startDate || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                              className="px-1.5 py-0.5 border border-gray-300 rounded text-[10px]"
                            />
                            <input
                              type="date"
                              value={editFormData.endDate || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                              className="px-1.5 py-0.5 border border-gray-300 rounded text-[10px]"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="block">{item.startDate}</span>
                            <span className="block text-[10px] text-slate-400">to {item.endDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Funding */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.fundingSource || 'Hospital Funded'}
                            onChange={(e) => setEditFormData({ ...editFormData, fundingSource: e.target.value as any })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            {FUNDING_SOURCES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                            item.fundingSource === 'Hospital Funded' ? 'bg-indigo-50 text-indigo-600' :
                            item.fundingSource === 'Sponsor' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.fundingSource}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editFormData.status || 'Nominated'}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wide text-[9px] ${
                            item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            item.status === 'Ongoing' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* Skills Gained */}
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate font-medium" title={item.skillsGained}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.skillsGained || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, skillsGained: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          item.skillsGained || '--'
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
                              title="Edit training log"
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
