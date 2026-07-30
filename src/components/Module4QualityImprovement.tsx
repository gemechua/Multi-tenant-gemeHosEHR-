
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  ClipboardList, Plus, Calendar, Clock, CheckCircle2, AlertCircle, 
  Trash2, Filter, ChevronRight, Target, TrendingUp, Info, ShieldAlert
} from 'lucide-react';

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  type: 'Yearly' | 'Monthly' | 'Daily';
  status: 'Pending' | 'Ongoing' | 'Completed' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  responsible: string;
  createdAt: any;
}

interface Module4Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function Module4QualityImprovement({ activeHospital, addToast }: Module4Props) {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    type: 'Monthly',
    priority: 'Medium',
    deadline: '',
    responsible: ''
  });

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  useEffect(() => {
    fetchPlans();
  }, [hospital_id, filterType]);

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Quality Data Guard. This will purge ALL fake/mock action plans, audits, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Quality Integrity: Purged ${deleted} falsified records.`);
      fetchPlans();
    } catch (err) {
      console.error(err);
      addToast('error', 'Quality cleanup failed.');
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'action_plans'),
        where('hospital_id', '==', hospital_id),
        orderBy('createdAt', 'desc')
      );

      if (filterType !== 'All') {
        q = query(
          collection(db, 'action_plans'),
          where('hospital_id', '==', hospital_id),
          where('type', '==', filterType),
          orderBy('createdAt', 'desc')
        );
      }

      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActionPlan[];
      const validPlans = fetched.filter(p => !isFakeOrFalseRow(p));
      setPlans(validPlans);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to fetch action plans');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFakeOrFalseRow(newPlan)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake quality improvement plans to protect system data integrity!');
      return;
    }
    try {
      await addDoc(collection(db, 'action_plans'), {
        ...newPlan,
        hospital_id,
        hospitalName: activeHospital?.name || '',
        departmentName: activeHospital?.department || '',
        hospitalId: Number(activeHospital?.hospital_unique_number || 0),
        status: 'Pending',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || 'anonymous'
      });
      addToast('success', 'Action plan created successfully');
      setShowAddModal(false);
      setNewPlan({ title: '', description: '', type: 'Monthly', priority: 'Medium', deadline: '', responsible: '' });
      fetchPlans();
    } catch (err) {
      addToast('error', 'Failed to create plan');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'action_plans', id), { status });
      addToast('success', `Status updated to ${status}`);
      fetchPlans();
    } catch (err) {
      addToast('error', 'Update failed');
    }
  };

  const deletePlan = async (id: string) => {
    if (!window.confirm('Delete this action plan?')) return;
    try {
      await deleteDoc(doc(db, 'action_plans', id));
      addToast('success', 'Plan deleted');
      fetchPlans();
    } catch (err) {
      addToast('error', 'Delete failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-600 rounded-xl shadow-lg shadow-rose-200">
              <Target className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Quality Improvement Hub</h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Performance tracking and strategic action planning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGlobalCleanup}
              className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
              title="Quality Data Integrity Purge"
            >
              <ShieldAlert size={14} />
              Guard
            </button>
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              {['All', 'Yearly', 'Monthly', 'Daily'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-md transition-all font-bold text-xs"
            >
              <Plus size={16} />
              New Action Plan
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Action Plans</h4>
              <span className="text-[10px] font-bold text-slate-400">{plans.length} items found</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 italic">Syncing QI data...</div>
            ) : plans.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                <h5 className="text-slate-900 font-bold">No Strategic Plans Found</h5>
                <p className="text-slate-500 text-sm mt-1">Start by creating your first yearly or monthly quality improvement goal.</p>
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            plan.type === 'Yearly' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            plan.type === 'Monthly' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {plan.type} Plan
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            plan.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            plan.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-700 border-slate-100'
                          }`}>
                            {plan.priority} Priority
                          </span>
                        </div>
                        <h5 className="text-base font-bold text-slate-900 mb-1 group-hover:text-rose-600 transition-colors">{plan.title}</h5>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{plan.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <select
                          value={plan.status}
                          onChange={(e) => updateStatus(plan.id, e.target.value)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-lg border focus:ring-2 outline-none transition-all ${
                            plan.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            plan.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            plan.status === 'Delayed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option>Pending</option>
                          <option>Ongoing</option>
                          <option>Completed</option>
                          <option>Delayed</option>
                        </select>
                        <button onClick={() => deletePlan(plan.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[11px] font-bold">Deadline: {plan.deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <CheckCircle2 size={14} />
                        <span className="text-[11px] font-bold">Owner: {plan.responsible}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-[10px] font-medium italic">Added {plan.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* KPI Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-rose-600" />
                QI Performance Summary
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Avg. Completion Rate', val: '68%', color: 'emerald', trend: '+12%' },
                  { label: 'High Priority Pending', val: plans.filter(p => p.priority === 'High' && p.status !== 'Completed').length, color: 'rose', trend: 'Critical' },
                  { label: 'Units Active', val: '14/18', color: 'indigo', trend: 'Good' }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50/50 border border-${stat.color}-100`}>
                    <p className={`text-[10px] font-bold text-${stat.color}-600 uppercase mb-1`}>{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className={`text-2xl font-black text-slate-900`}>{stat.val}</span>
                      <span className={`text-[10px] font-black text-${stat.color}-700 bg-${stat.color}-100 px-2 py-0.5 rounded-full`}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white">
              <div className="flex items-center gap-2 mb-4">
                <Info size={18} className="text-rose-400" />
                <h4 className="text-sm font-bold">Compliance Tip</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                DHIS2 reporting standards require that 90% of High Priority Yearly plans have a verified responsible officer assigned. Ensure all plans include a clear deadline to avoid "Delayed" flags in the system audits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-rose-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ClipboardList size={24} />
                Create Strategic Action Plan
              </h3>
              <p className="text-rose-100 text-sm mt-1">Define quality improvement goals for your unit.</p>
            </div>
            <form onSubmit={handleAddPlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Plan Type</label>
                  <select 
                    value={newPlan.type}
                    onChange={(e) => setNewPlan({...newPlan, type: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>Yearly</option>
                    <option>Monthly</option>
                    <option>Daily</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Priority</label>
                  <select 
                    value={newPlan.priority}
                    onChange={(e) => setNewPlan({...newPlan, priority: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Goal Title</label>
                <input 
                  required
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                  placeholder="e.g. Reduce OPD waiting time by 15%"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Detailed Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="Describe the steps and expected outcomes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Deadline</label>
                  <input 
                    type="date"
                    required
                    value={newPlan.deadline}
                    onChange={(e) => setNewPlan({...newPlan, deadline: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Responsible Officer</label>
                  <input 
                    required
                    value={newPlan.responsible}
                    onChange={(e) => setNewPlan({...newPlan, responsible: e.target.value})}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-all"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
