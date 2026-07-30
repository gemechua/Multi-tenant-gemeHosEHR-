import React, { useState } from 'react';
import { Calendar, Users, MapPin, Plus, Search, Filter, Trash2, Edit3, ShieldCheck } from 'lucide-react';

interface DutyRosterProps {
  rosters: any[];
  onAddRoster: (data: any) => void;
  onDeleteRoster: (id: string) => void;
  loading: boolean;
}

export default function DutyRoster({ rosters, onAddRoster, onDeleteRoster, loading }: DutyRosterProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    effectiveDate: new Date().toISOString().split('T')[0],
    guardName: '',
    guardId: '',
    shiftBlock: 'Morning (07:00 - 15:00)',
    zone: 'Main Gate',
    supervisor: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRoster({
      ...formData,
      scheduleId: `SCH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'Scheduled'
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search roster..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Plan New Shift
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} />
            Shift Assignment (Duty Management)
          </h4>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Date</label>
              <input 
                type="date" 
                required
                value={formData.effectiveDate}
                onChange={e => setFormData({...formData, effectiveDate: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guard Name</label>
              <input 
                type="text" 
                required
                placeholder="Enter guard name"
                value={formData.guardName}
                onChange={e => setFormData({...formData, guardName: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Block</label>
              <select 
                value={formData.shiftBlock}
                onChange={e => setFormData({...formData, shiftBlock: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option>Morning (07:00 - 15:00)</option>
                <option>Afternoon (15:00 - 23:00)</option>
                <option>Night (23:00 - 07:00)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post / Zone</label>
              <select 
                value={formData.zone}
                onChange={e => setFormData({...formData, zone: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option>Main Gate</option>
                <option>ER Entrance</option>
                <option>Pharmacy / Lab Zone</option>
                <option>Perimeter Patrol</option>
                <option>Wards Wing</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor</label>
              <input 
                type="text" 
                required
                placeholder="Name of supervisor"
                value={formData.supervisor}
                onChange={e => setFormData({...formData, supervisor: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all"
              >
                SAVE ASSIGNMENT
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-tight">
            <ShieldCheck size={16} className="text-emerald-600" />
            Duty Roster & Zone Planning
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Guard</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Post/Zone</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rosters.length > 0 ? (
                rosters.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-indigo-600 font-mono">{item.scheduleId}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{item.effectiveDate}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{item.guardName}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.zone}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.shiftBlock}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onDeleteRoster(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No shifts assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
