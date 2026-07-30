import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, UserCheck, ShieldCheck, Filter, ArrowLeftRight, Plus, CheckCircle2, ChevronLeft, ChevronRight, Stethoscope, AlertCircle, Building, Sparkles } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StaffShiftCalendarProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export interface ShiftEntry {
  id: string;
  staffName: string;
  role: string; // Doctor, Nurse, Pharmacist, Lab Tech, Security, Administrator
  department: string;
  shiftType: 'Morning (07:00-15:00)' | 'Evening (15:00-23:00)' | 'Night (23:00-07:00)' | 'On-Call (24 Hours)';
  date: string;
  status: 'Scheduled' | 'On-Duty' | 'Completed' | 'Swap Pending';
  isLead: boolean;
  phone?: string;
}

export default function StaffShiftCalendar({ activeHospital, addToast }: StaffShiftCalendarProps) {
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedShiftType, setSelectedShiftType] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapShift, setSwapShift] = useState<ShiftEntry | null>(null);
  const [swapTargetStaff, setSwapTargetStaff] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShift, setNewShift] = useState<Partial<ShiftEntry>>({
    staffName: '',
    role: 'Doctor',
    department: 'Emergency & Triage',
    shiftType: 'Morning (07:00-15:00)',
    date: new Date().toISOString().split('T')[0],
    isLead: false
  });

  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
  const localHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
  const hospital = activeHospital || localHospital;
  const hospital_id = hospital?.hospital_unique_number || hospital?.hospital_id || '';

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadShifts = async () => {
      if (!db || !hospital_id) {
        setShifts(getFallbackDemoShifts());
        return;
      }

      try {
        const ref = collection(db, 'staff_shifts');
        const q = query(ref, where('hospital_id', '==', hospital_id));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            setShifts(getFallbackDemoShifts());
          } else {
            const list: ShiftEntry[] = snapshot.docs.map(doc => ({
              id: doc.id,
              staffName: doc.data().staffName || 'Staff Member',
              role: doc.data().role || 'Clinician',
              department: doc.data().department || 'Clinical',
              shiftType: doc.data().shiftType || 'Morning (07:00-15:00)',
              date: doc.data().date || new Date().toISOString().split('T')[0],
              status: doc.data().status || 'Scheduled',
              isLead: !!doc.data().isLead,
              phone: doc.data().phone || '+251 91 123 4567'
            }));
            setShifts(list);
          }
        }, () => setShifts(getFallbackDemoShifts()));
      } catch (err) {
        setShifts(getFallbackDemoShifts());
      }
    };

    loadShifts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [hospital_id]);

  const getFallbackDemoShifts = (): ShiftEntry[] => {
    return [];
  };

  const handleRequestSwap = () => {
    if (!swapShift) return;
    setShifts(prev => prev.map(s => s.id === swapShift.id ? { ...s, status: 'Swap Pending' } : s));
    setShowSwapModal(false);
    if (addToast) addToast('info', `Shift swap request submitted for ${swapShift.staffName}. Management notified.`);
  };

  const handleCreateShift = async () => {
    if (!newShift.staffName) {
      if (addToast) addToast('error', 'Please enter the staff member name.');
      return;
    }

    const shiftData: ShiftEntry = {
      id: 'sh-' + Date.now(),
      staffName: newShift.staffName,
      role: newShift.role || 'Clinician',
      department: newShift.department || 'Emergency & Triage',
      shiftType: newShift.shiftType as any || 'Morning (07:00-15:00)',
      date: newShift.date || selectedDate,
      status: 'Scheduled',
      isLead: !!newShift.isLead,
      phone: '+251 90 000 0000'
    };

    setShifts(prev => [...prev, shiftData]);

    if (db && hospital_id) {
      try {
        await addDoc(collection(db, 'staff_shifts'), { ...shiftData, hospital_id });
      } catch (e) {
        console.warn('Error saving shift:', e);
      }
    }

    setShowAddModal(false);
    if (addToast) addToast('success', `Assigned shift for ${newShift.staffName} on ${shiftData.date}`);
  };

  const filteredShifts = shifts.filter(s => {
    const matchDept = selectedDept === 'All' || s.department === selectedDept;
    const matchType = selectedShiftType === 'All' || s.shiftType.includes(selectedShiftType);
    const matchDate = s.date === selectedDate;
    return matchDept && matchType && matchDate;
  });

  const DEPARTMENTS = ['All', 'Emergency & Triage', 'Surgery & OR', 'Pharmacy & Dispensary', 'Radiology & Imaging', 'Security & Gate Ops', 'ICU & Inpatient'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              Staff Shift & On-Call Rotation Calendar
              <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                Live Roster
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Daily shift schedules, emergency on-call specialist assignments, and automated coverage tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-extrabold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Assign Shift
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider shrink-0">Dept:</span>
          {DEPARTMENTS.slice(0, 5).map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedDept === dept
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <select
            value={selectedShiftType}
            onChange={(e) => setSelectedShiftType(e.target.value)}
            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl px-2.5 py-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <option value="All">All Shift Types</option>
            <option value="Morning">Morning (07:00-15:00)</option>
            <option value="Evening">Evening (15:00-23:00)</option>
            <option value="Night">Night (23:00-07:00)</option>
            <option value="On-Call">On-Call Roster</option>
          </select>
        </div>
      </div>

      {/* Roster Cards Grid */}
      {filteredShifts.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <CalendarIcon size={24} className="mx-auto text-slate-400 mb-1" />
          <div>No staff shifts scheduled for {selectedDate} in {selectedDept}.</div>
          <div className="text-[11px] text-slate-500">Click "+ Assign Shift" to schedule a clinician or support team member.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className={`p-4 rounded-2xl border transition-all shadow-3xs flex flex-col justify-between gap-3 ${
                shift.isLead
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/80'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        {shift.staffName}
                        {shift.isLead && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-black uppercase rounded border border-amber-300">
                            LEAD
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {shift.role}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    shift.status === 'On-Duty'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                      : shift.status === 'Swap Pending'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}>
                    {shift.status}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1 text-[11px]">
                  <div className="text-slate-700 dark:text-slate-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-indigo-600" /> {shift.shiftType}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building size={12} /> Dept: {shift.department}
                  </div>
                  {shift.phone && (
                    <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      📞 {shift.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Date: {shift.date}</span>
                <button
                  onClick={() => {
                    setSwapShift(shift);
                    setShowSwapModal(true);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeftRight size={11} /> Request Swap
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Shift Swap */}
      {showSwapModal && swapShift && (
        <div className="fixed inset-0 z-[160] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-indigo-600" />
              Request Shift Swap
            </h3>
            <p className="text-xs text-slate-500">
              Submit a swap request for <strong>{swapShift.staffName}</strong> ({swapShift.shiftType} on {swapShift.date}).
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Target Substitute Staff Member
              </label>
              <input
                type="text"
                placeholder="Enter replacement doctor/nurse name..."
                value={swapTargetStaff}
                onChange={(e) => setSwapTargetStaff(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSwapModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestSwap}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Submit Swap Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Assigning New Shift */}
      {showAddModal && (
        <div className="fixed inset-0 z-[160] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" />
              Assign New Clinical Shift
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Staff Name *</label>
                <input
                  type="text"
                  placeholder="Dr. Abera / Sister Tirhas"
                  value={newShift.staffName}
                  onChange={(e) => setNewShift({ ...newShift, staffName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Role / Designation</label>
                <select
                  value={newShift.role}
                  onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value="Senior Consultant MD">Senior Consultant MD</option>
                  <option value="Emergency Specialist">Emergency Specialist</option>
                  <option value="General Practitioner">General Practitioner</option>
                  <option value="Triage Nurse">Triage Nurse</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Radiology Technician">Radiology Technician</option>
                  <option value="Security Supervisor">Security Supervisor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
                <select
                  value={newShift.department}
                  onChange={(e) => setNewShift({ ...newShift, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value="Emergency & Triage">Emergency & Triage</option>
                  <option value="Surgery & OR">Surgery & OR</option>
                  <option value="Pharmacy & Dispensary">Pharmacy & Dispensary</option>
                  <option value="Radiology & Imaging">Radiology & Imaging</option>
                  <option value="ICU & Inpatient">ICU & Inpatient</option>
                  <option value="Security & Gate Ops">Security & Gate Ops</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Shift Hours</label>
                <select
                  value={newShift.shiftType}
                  onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value="Morning (07:00-15:00)">Morning (07:00-15:00)</option>
                  <option value="Evening (15:00-23:00)">Evening (15:00-23:00)</option>
                  <option value="Night (23:00-07:00)">Night (23:00-07:00)</option>
                  <option value="On-Call (24 Hours)">On-Call (24 Hours)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Shift Date</label>
                <input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isLeadCheck"
                  checked={newShift.isLead}
                  onChange={(e) => setNewShift({ ...newShift, isLead: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isLeadCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Designate as Shift Lead / On-Call Lead
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShift}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Save Shift Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
