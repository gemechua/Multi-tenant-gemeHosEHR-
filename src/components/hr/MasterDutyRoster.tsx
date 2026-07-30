import React, { useState } from 'react';
import { Calendar, Users, MapPin, Plus, Search, Filter, Trash2, ShieldCheck, Clock, Lock, CheckCircle2 } from 'lucide-react';

interface Shift {
  id: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  departmentId: string;
  roleCategory: string;
  dateEffective: string;
  shiftType: 'Day' | 'Night' | 'On-Call' | 'Weekend';
  status: 'Scheduled' | 'Published' | 'Locked';
}

interface MasterDutyRosterProps {
  shifts: Shift[];
  staff: any[];
  onAddShift: (data: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDeleteShift: (id: string) => void;
  loading: boolean;
}

export default function MasterDutyRoster({ shifts, staff, onAddShift, onUpdateStatus, onDeleteShift, loading }: MasterDutyRosterProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    staffId: '',
    departmentId: 'Clinical Services',
    roleCategory: 'Physician',
    dateEffective: new Date().toISOString().split('T')[0],
    shiftType: 'Day' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStaff = staff.find(s => s.employeeId === formData.staffId);
    onAddShift({
      ...formData,
      staffName: selectedStaff ? selectedStaff.fullName : 'Unknown Staff',
      shiftId: `SHF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'Scheduled'
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by staff or shift ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Plan New Shift
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="text-indigo-600" size={20} />
            Master Duty Planning
          </h4>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</label>
              <select 
                required
                value={formData.staffId}
                onChange={e => setFormData({...formData, staffId: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select Staff</option>
                {staff.map(s => (
                  <option key={s.id} value={s.employeeId}>{s.fullName} ({s.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department / Sector</label>
              <select 
                value={formData.departmentId}
                onChange={e => setFormData({...formData, departmentId: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option>Clinical Services</option>
                <option>Nursing Care</option>
                <option>Midwifery</option>
                <option>Pharmacy</option>
                <option>Laboratory</option>
                <option>Radiology</option>
                <option>Administration</option>
                <option>Support Services</option>
                <option>Security</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Category</label>
              <select 
                value={formData.roleCategory}
                onChange={e => setFormData({...formData, roleCategory: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option>Physician</option>
                <option>Nurse</option>
                <option>Midwife</option>
                <option>Technician</option>
                <option>Pharmacist</option>
                <option>Security</option>
                <option>Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Date</label>
              <input 
                type="date" 
                required
                value={formData.dateEffective}
                onChange={e => setFormData({...formData, dateEffective: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Type</label>
              <select 
                value={formData.shiftType}
                onChange={e => setFormData({...formData, shiftType: e.target.value as any})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
                <option value="On-Call">On-Call</option>
                <option value="Weekend">Weekend Duty</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest"
              >
                SAVE TO ROSTER
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-tight">
            <ShieldCheck size={16} className="text-indigo-600" />
            Master Duty Roster (Planning Hub)
          </h4>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
              <div className="w-2 h-2 rounded-full bg-amber-400" /> Scheduled
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
              <div className="w-2 h-2 rounded-full bg-emerald-400" /> Published
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
              <div className="w-2 h-2 rounded-full bg-slate-400" /> Locked
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dept/Unit</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shifts.length > 0 ? (
                shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-indigo-600 font-mono">{shift.shiftId}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{shift.staffName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{shift.staffId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{shift.departmentId}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{shift.dateEffective}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {shift.shiftType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          shift.status === 'Scheduled' ? 'bg-amber-400' : 
                          shift.status === 'Published' ? 'bg-emerald-400' : 'bg-slate-400'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {shift.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shift.status === 'Scheduled' && (
                          <button 
                            onClick={() => onUpdateStatus(shift.id, 'Published')}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg title='Publish'"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {shift.status === 'Published' && (
                          <button 
                            onClick={() => onUpdateStatus(shift.id, 'Locked')}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg title='Lock'"
                          >
                            <Lock size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => onDeleteShift(shift.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">No shifts planned for the selected period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
