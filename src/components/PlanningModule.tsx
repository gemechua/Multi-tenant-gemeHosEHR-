import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Search, Calendar, Target, TrendingUp, CheckCircle, 
  Clock, AlertTriangle, Building, RefreshCw, BarChart2, Award, ArrowUpRight, 
  Trash2, Eye, Pencil, ShieldAlert, CheckSquare, PlusCircle, Check, X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { useSkippedContext } from './SecureModuleWrapper';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';

interface PlanningModuleProps {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  kpi: string;
  priority: 'High' | 'Medium' | 'Low';
  leadDepartment: string;
  hospital_id: string;
  createdAt?: any;
}

interface OperationalPlan {
  id: string;
  activity: string;
  target: number;
  achieved: number;
  due_date: string;
  type: 'yearly' | 'monthly' | 'weekly' | 'daily';
  status: 'Pending' | 'In Progress' | 'Completed';
  strategicGoalId?: string;
  hospital_id: string;
  createdAt?: any;
}

export default function PlanningModule({ activeHospital, addToast }: PlanningModuleProps) {
  const { isSkipped } = useSkippedContext();
  const [activeSubTab, setActiveSubTab] = useState<'Dashboard' | 'Strategic' | 'Operational'>('Dashboard');
  const [loading, setLoading] = useState(true);

  // Lists from Database
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>([]);
  const [operationalPlans, setOperationalPlans] = useState<OperationalPlan[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals
  const [showStrategicModal, setShowStrategicModal] = useState(false);
  const [showOperationalModal, setShowOperationalModal] = useState(false);
  const [editingStrategic, setEditingStrategic] = useState<StrategicGoal | null>(null);
  const [editingOperational, setEditingOperational] = useState<OperationalPlan | null>(null);

  // Strategic Form State
  const [strategicForm, setStrategicForm] = useState({
    title: '',
    description: '',
    timeframe: '3 Years',
    kpi: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    leadDepartment: 'Clinical Quality'
  });

  // Operational Form State
  const [operationalForm, setOperationalForm] = useState({
    activity: '',
    target: 1,
    achieved: 0,
    due_date: '',
    type: 'yearly' as 'yearly' | 'monthly' | 'weekly' | 'daily',
    status: 'Pending' as 'Pending' | 'In Progress' | 'Completed',
    strategicGoalId: ''
  });

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  // Fetch data
  useEffect(() => {
    if (isSkipped) {
      setStrategicGoals([]);
      setOperationalPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Strategic Goals subscription
    const strategicQuery = query(
      collection(db, 'strategic_goals'),
      where('hospital_id', '==', hospital_id)
    );

    const unsubscribeStrategic = onSnapshot(
      strategicQuery,
      (snapshot) => {
        const goals: StrategicGoal[] = [];
        snapshot.forEach((doc) => {
          goals.push({ id: doc.id, ...doc.data() } as StrategicGoal);
        });
        setStrategicGoals(goals);
      },
      (error) => {
        console.error('Error listening to strategic goals:', error);
        addToast('error', 'Unable to retrieve strategic goals. Please check Firestore rules.');
      }
    );

    // Operational plans subscription
    const operationalQuery = query(
      collection(db, 'planning_records'),
      where('hospital_id', '==', hospital_id)
    );

    const unsubscribeOperational = onSnapshot(
      operationalQuery,
      (snapshot) => {
        const plans: OperationalPlan[] = [];
        snapshot.forEach((doc) => {
          plans.push({ id: doc.id, ...doc.data() } as OperationalPlan);
        });
        setOperationalPlans(plans);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to operational planning records:', error);
        addToast('error', 'Unable to retrieve operational planning records.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeStrategic();
      unsubscribeOperational();
    };
  }, [hospital_id]);

  // Handle Strategic Goal Submission
  const handleStrategicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategicForm.title.trim()) {
      addToast('error', 'Strategic goal title is required');
      return;
    }

    if (isFakeOrFalseRow(strategicForm)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake strategic goals to protect planning data integrity!');
      return;
    }

    try {
      if (editingStrategic) {
        const goalRef = doc(db, 'strategic_goals', editingStrategic.id);
        await updateDoc(goalRef, {
          title: strategicForm.title,
          description: strategicForm.description,
          timeframe: strategicForm.timeframe,
          kpi: strategicForm.kpi,
          priority: strategicForm.priority,
          leadDepartment: strategicForm.leadDepartment
        });
        addToast('success', 'Strategic Goal updated successfully.');
      } else {
        await addDoc(collection(db, 'strategic_goals'), {
          ...strategicForm,
          hospital_id,
          hospitalName: activeHospital?.name || '',
          departmentName: activeHospital?.department || '',
          hospitalId: Number(activeHospital?.hospital_unique_number || 0),
          createdAt: serverTimestamp()
        });
        addToast('success', 'Strategic Goal created successfully.');
      }
      setShowStrategicModal(false);
      setEditingStrategic(null);
      setStrategicForm({
        title: '',
        description: '',
        timeframe: '3 Years',
        kpi: '',
        priority: 'Medium',
        leadDepartment: 'Clinical Quality'
      });
    } catch (error) {
      console.error('Error saving strategic goal:', error);
      addToast('error', 'Failed to save Strategic Goal to secure database.');
    }
  };

  // Handle Operational Plan Submission
  const handleOperationalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationalForm.activity.trim()) {
      addToast('error', 'Activity description is required');
      return;
    }

    if (isFakeOrFalseRow(operationalForm)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake operational action plans to protect planning data integrity!');
      return;
    }

    try {
      if (editingOperational) {
        const planRef = doc(db, 'planning_records', editingOperational.id);
        await updateDoc(planRef, {
          activity: operationalForm.activity,
          target: Number(operationalForm.target),
          achieved: Number(operationalForm.achieved),
          due_date: operationalForm.due_date,
          type: operationalForm.type,
          status: operationalForm.status,
          strategicGoalId: operationalForm.strategicGoalId || null
        });
        addToast('success', 'Operational Plan updated successfully.');
      } else {
        await addDoc(collection(db, 'planning_records'), {
          activity: operationalForm.activity,
          target: Number(operationalForm.target),
          achieved: Number(operationalForm.achieved),
          due_date: operationalForm.due_date,
          type: operationalForm.type,
          status: operationalForm.status,
          strategicGoalId: operationalForm.strategicGoalId || null,
          hospital_id,
          hospitalName: activeHospital?.name || '',
          departmentName: activeHospital?.department || '',
          hospitalId: Number(activeHospital?.hospital_unique_number || 0),
          createdAt: serverTimestamp()
        });
        addToast('success', 'Operational Action Plan registered.');
      }
      setShowOperationalModal(false);
      setEditingOperational(null);
      setOperationalForm({
        activity: '',
        target: 1,
        achieved: 0,
        due_date: '',
        type: 'yearly',
        status: 'Pending',
        strategicGoalId: ''
      });
    } catch (error) {
      console.error('Error saving operational record:', error);
      addToast('error', 'Failed to register action plan.');
    }
  };

  // Quick progress increment
  const handleQuickProgress = async (plan: OperationalPlan) => {
    if (plan.achieved >= plan.target) {
      addToast('info', 'This target has already been fully achieved!');
      return;
    }
    const newAchieved = plan.achieved + 1;
    const newStatus = newAchieved >= plan.target ? 'Completed' : 'In Progress';
    try {
      const planRef = doc(db, 'planning_records', plan.id);
      await updateDoc(planRef, {
        achieved: newAchieved,
        status: newStatus
      });
      addToast('success', `Progress logged! "${plan.activity}" achieved incremented.`);
    } catch (error) {
      console.error('Error incrementing progress:', error);
      addToast('error', 'Failed to log quick progress.');
    }
  };

  // Delete strategic goal
  const handleDeleteStrategic = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Strategic Goal? Related plans will remain active.')) {
      try {
        await deleteDoc(doc(db, 'strategic_goals', id));
        addToast('success', 'Strategic Goal removed.');
      } catch (error) {
        addToast('error', 'Error removing strategic goal.');
      }
    }
  };

  // Delete operational plan
  const handleDeleteOperational = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Action Plan?')) {
      try {
        await deleteDoc(doc(db, 'planning_records', id));
        addToast('success', 'Operational Plan removed.');
      } catch (error) {
        addToast('error', 'Error removing operational plan.');
      }
    }
  };

  // Pre-populate Strategic Goal edit form
  const startEditStrategic = (goal: StrategicGoal) => {
    setEditingStrategic(goal);
    setStrategicForm({
      title: goal.title,
      description: goal.description,
      timeframe: goal.timeframe,
      kpi: goal.kpi,
      priority: goal.priority,
      leadDepartment: goal.leadDepartment
    });
    setShowStrategicModal(true);
  };

  // Pre-populate Operational Plan edit form
  const startEditOperational = (plan: OperationalPlan) => {
    setEditingOperational(plan);
    setOperationalForm({
      activity: plan.activity,
      target: plan.target,
      achieved: plan.achieved,
      due_date: plan.due_date,
      type: plan.type,
      status: plan.status,
      strategicGoalId: plan.strategicGoalId || ''
    });
    setShowOperationalModal(true);
  };

  // Filter lists
  const filteredGoals = strategicGoals
    .filter(goal => !isFakeOrFalseRow(goal))
    .filter(goal => {
      const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            goal.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || goal.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });

  const filteredPlans = operationalPlans
    .filter(plan => !isFakeOrFalseRow(plan))
    .filter(plan => {
      const matchesSearch = plan.activity.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCycle = cycleFilter === 'all' || plan.type === cycleFilter;
      return matchesSearch && matchesCycle;
    });

  // KPI calculations
  const validStrategicGoals = strategicGoals.filter(goal => !isFakeOrFalseRow(goal));
  const validOperationalPlans = operationalPlans.filter(plan => !isFakeOrFalseRow(plan));

  const totalGoals = validStrategicGoals.length;
  const totalPlans = validOperationalPlans.length;
  const completedPlans = validOperationalPlans.filter(p => p.status === 'Completed').length;
  const inProgressPlans = validOperationalPlans.filter(p => p.status === 'In Progress').length;
  const pendingPlans = validOperationalPlans.filter(p => p.status === 'Pending').length;
  const overallProgressPercent = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // Department distribution
  const deptSummary: { [key: string]: number } = {};
  validStrategicGoals.forEach(g => {
    deptSummary[g.leadDepartment] = (deptSummary[g.leadDepartment] || 0) + 1;
  });

  return (
    <div className="space-y-6" id="planning-module">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-6">
          <ClipboardList size={280} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase w-fit mb-3">
              <Award size={14} />
              <span>Executive Management Division</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Planning & Strategic Management Hub</h2>
            <p className="text-emerald-100 mt-2 text-sm max-w-2xl font-medium">
              Formulate, execute, and monitor long-term Strategic Objectives alongside short-term Operational Action Plans to drive clinical excellence, infrastructure development, and budget accountability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingStrategic(null);
                setStrategicForm({
                  title: '',
                  description: '',
                  timeframe: '3 Years',
                  kpi: '',
                  priority: 'Medium',
                  leadDepartment: 'Clinical Quality'
                });
                setShowStrategicModal(true);
              }}
              className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Add Strategic Goal</span>
            </button>
            <button
              onClick={() => {
                setEditingOperational(null);
                setOperationalForm({
                  activity: '',
                  target: 1,
                  achieved: 0,
                  due_date: '',
                  type: 'yearly',
                  status: 'Pending',
                  strategicGoalId: ''
                });
                setShowOperationalModal(true);
              }}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Operational Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-2">
        {(['Dashboard', 'Strategic', 'Operational'] as const).map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 px-6 text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'border-emerald-600 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'Dashboard' && 'Dashboard Overview'}
              {tab === 'Strategic' && 'Strategic Goals (Long-term)'}
              {tab === 'Operational' && 'Operational Plans (Short-term)'}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="animate-spin text-emerald-600" size={32} />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading planning databases...</p>
        </div>
      ) : (
        <>
          {/* Active Tab rendering */}
          {activeSubTab === 'Dashboard' && (
            <div className="space-y-6">
              {/* Stat Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Strategic Goals</span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalGoals}</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">Directing long-term vision</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                    <Target size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Action Plans</span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalPlans}</h3>
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      {pendingPlans} Pending, {inProgressPlans} Active
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                    <ClipboardList size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Execution rate</span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{overallProgressPercent}%</h3>
                    <div className="w-24 bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${overallProgressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                    <CheckCircle size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Completed Plans</span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{completedPlans}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Out of {totalPlans} registered</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600">
                    <BarChart2 size={22} />
                  </div>
                </div>
              </div>

              {/* Graphical distribution and highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">Active Operational Execution Progress</h4>
                        <p className="text-xs text-slate-500">Comparing physical Target outputs against actual results achieved.</p>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-300 rounded-md">Live Sync</span>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {operationalPlans.slice(0, 5).map((plan) => {
                        const pct = Math.min(100, plan.target > 0 ? Math.round((plan.achieved / plan.target) * 100) : 0);
                        return (
                          <div key={plan.id} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  plan.status === 'Completed' ? 'bg-emerald-500' :
                                  plan.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">{plan.activity}</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded">
                                  {plan.type}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">{plan.achieved} / {plan.target}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-emerald-600 w-10 text-right">{pct}%</span>
                              <button
                                onClick={() => handleQuickProgress(plan)}
                                title="Increment Achieved Progress"
                                className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {operationalPlans.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                          <ClipboardList className="mx-auto mb-2 opacity-50" size={32} />
                          <p className="text-sm font-bold">No Operational Action Plans Registered Yet.</p>
                          <p className="text-xs mt-1">Get started by creating your first action plan inside the Operational tab.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSubTab('Operational')}
                    className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Manage Operational Action Plans</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">Strategic Objective Focus</h4>
                    <p className="text-xs text-slate-500 mb-6">Distribution of active strategic long-term goals by executive division.</p>

                    {totalGoals > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(deptSummary).map(([dept, count]) => {
                          const percent = Math.round((count / totalGoals) * 100);
                          return (
                            <div key={dept} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                                <span className="truncate max-w-xs">{dept}</span>
                                <span>{count} goal{count > 1 ? 's' : ''} ({percent}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full" 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                        <Target className="mx-auto mb-2 opacity-50" size={32} />
                        <p className="text-sm font-bold">No Strategic Goals Formulated.</p>
                        <p className="text-xs mt-1">Define long-term strategic directions to organize operational efforts.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveSubTab('Strategic')}
                    className="mt-6 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Formulate Strategic Goals</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'Strategic' && (
            <div className="space-y-6">
              {/* Toolbar & Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search strategic goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Strategic Goals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGoals.map((goal) => {
                  const relatedPlansCount = operationalPlans.filter(p => p.strategicGoalId === goal.id).length;
                  return (
                    <div 
                      key={goal.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Priority Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider rounded-md ${
                            goal.priority === 'High' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' :
                            goal.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600'
                          }`}>
                            {goal.priority} Priority
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-md">
                            {goal.timeframe}
                          </span>
                        </div>

                        <h4 className="text-lg font-black text-slate-900 dark:text-white leading-snug mb-2">{goal.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{goal.description}</p>

                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">KPI Target:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{goal.kpi}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Lead Team:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{goal.leadDepartment}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Action Plans:</span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold font-mono">
                              {relatedPlansCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditStrategic(goal)}
                          title="Edit Strategic Goal"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteStrategic(goal.id)}
                          title="Delete Strategic Goal"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredGoals.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                    <Target className="mx-auto mb-2 opacity-45" size={48} />
                    <h5 className="font-bold text-lg text-slate-950 dark:text-white">No Strategic Goals Formulated</h5>
                    <p className="text-xs mt-1 max-w-sm mx-auto">Define long-term targets such as expanding service capability, enhancing safety indexes, or structural renovations.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'Operational' && (
            <div className="space-y-6">
              {/* Toolbar & Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cycle:</span>
                  <select
                    value={cycleFilter}
                    onChange={(e) => setCycleFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  >
                    <option value="all">All Cycles</option>
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              {/* Operational Plans Table/List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                        <th className="py-4 px-6">Cycle</th>
                        <th className="py-4 px-6">Action / Activity Plan</th>
                        <th className="py-4 px-6">Linked Strategic Goal</th>
                        <th className="py-4 px-6">Target Outputs</th>
                        <th className="py-4 px-6">Due Date</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPlans.map((plan) => {
                        const matchedGoal = strategicGoals.find(g => g.id === plan.strategicGoalId);
                        const progressPct = plan.target > 0 ? Math.min(100, Math.round((plan.achieved / plan.target) * 100)) : 0;
                        return (
                          <tr key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 text-xs">
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`px-2.5 py-1 uppercase text-[9px] font-black tracking-wider rounded-md ${
                                plan.type === 'yearly' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' :
                                plan.type === 'monthly' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                                plan.type === 'weekly' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' :
                                'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600'
                              }`}>
                                {plan.type}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-900 dark:text-white">{plan.activity}</p>
                              {/* Inline mini progress bar */}
                              <div className="flex items-center gap-2 mt-2 max-w-xs">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressPct}%` }} />
                                </div>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{progressPct}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 max-w-xs truncate">
                              {matchedGoal ? (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400" title={matchedGoal.title}>
                                  {matchedGoal.title}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">None</span>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                                  {plan.achieved} / {plan.target}
                                </span>
                                <button
                                  onClick={() => handleQuickProgress(plan)}
                                  title="Increment output"
                                  className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-medium">
                              {plan.due_date ? new Date(plan.due_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-md uppercase text-[9px] font-black tracking-wider ${
                                plan.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                plan.status === 'In Progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {plan.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => startEditOperational(plan)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="Edit Plan"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOperational(plan.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="Delete Plan"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredPlans.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-slate-400">
                            <ClipboardList className="mx-auto mb-2 opacity-45" size={40} />
                            <p className="font-bold text-sm">No Operational Plans Registered</p>
                            <p className="text-xs mt-1">Add details regarding operational deliverables and track their outputs.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Strategic Goal Form Modal */}
      {showStrategicModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">Strategic Management</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingStrategic ? 'Edit Strategic Goal' : 'Formulate New Strategic Goal'}
                </h3>
              </div>
              <button 
                onClick={() => setShowStrategicModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleStrategicSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Strategic Objective Title *</label>
                <input 
                  type="text"
                  value={strategicForm.title}
                  onChange={(e) => setStrategicForm({...strategicForm, title: e.target.value})}
                  placeholder="e.g. Zero-Tolerance Clinical Safety Protocol"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Description / Goals Context</label>
                <textarea 
                  value={strategicForm.description}
                  onChange={(e) => setStrategicForm({...strategicForm, description: e.target.value})}
                  placeholder="Elaborate on why this goal is required, metrics of definition, and clinical scope."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Target Timeframe</label>
                  <select 
                    value={strategicForm.timeframe}
                    onChange={(e) => setStrategicForm({...strategicForm, timeframe: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1 Year">1 Year (Short-term)</option>
                    <option value="3 Years">3 Years (Medium-term)</option>
                    <option value="5 Years">5 Years (Long-term)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Priority</label>
                  <select 
                    value={strategicForm.priority}
                    onChange={(e) => setStrategicForm({...strategicForm, priority: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">KPI / Target Metric *</label>
                  <input 
                    type="text"
                    value={strategicForm.kpi}
                    onChange={(e) => setStrategicForm({...strategicForm, kpi: e.target.value})}
                    placeholder="e.g. < 0.1% medication errors"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Lead Department</label>
                  <select 
                    value={strategicForm.leadDepartment}
                    onChange={(e) => setStrategicForm({...strategicForm, leadDepartment: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Clinical Quality">Clinical Quality</option>
                    <option value="Executive Management">Executive Management</option>
                    <option value="Finance & Budget">Finance & Budget</option>
                    <option value="Human Resource">Human Resource</option>
                    <option value="Logistics & Facility">Logistics & Facility</option>
                    <option value="Pharmacy Department">Pharmacy Department</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowStrategicModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Strategic Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operational Plan Form Modal */}
      {showOperationalModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase font-mono">Operational Planning</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingOperational ? 'Edit Operational Plan' : 'Define New Action Plan'}
                </h3>
              </div>
              <button 
                onClick={() => setShowOperationalModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOperationalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Action Plan Activity Description *</label>
                <input 
                  type="text"
                  value={operationalForm.activity}
                  onChange={(e) => setOperationalForm({...operationalForm, activity: e.target.value})}
                  placeholder="e.g. Conduct HIPAA Compliance Training"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Link to Long-term Strategic Goal</label>
                <select 
                  value={operationalForm.strategicGoalId}
                  onChange={(e) => setOperationalForm({...operationalForm, strategicGoalId: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- No Direct Strategic Alignment --</option>
                  {strategicGoals.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Target Output Quantity *</label>
                  <input 
                    type="number"
                    min="1"
                    value={operationalForm.target}
                    onChange={(e) => setOperationalForm({...operationalForm, target: Number(e.target.value)})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Achieved Quantity *</label>
                  <input 
                    type="number"
                    min="0"
                    value={operationalForm.achieved}
                    onChange={(e) => setOperationalForm({...operationalForm, achieved: Number(e.target.value)})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Time Cycle / Type</label>
                  <select 
                    value={operationalForm.type}
                    onChange={(e) => setOperationalForm({...operationalForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Operational Status</label>
                  <select 
                    value={operationalForm.status}
                    onChange={(e) => setOperationalForm({...operationalForm, status: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Target Completion Date</label>
                <input 
                  type="date"
                  value={operationalForm.due_date}
                  onChange={(e) => setOperationalForm({...operationalForm, due_date: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowOperationalModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Action Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
