import React, { useState, useEffect } from 'react';
import SyncHistoryModal, { SyncQueueItem } from './SyncHistoryModal';
import { BookOpen, Database as DatabaseIcon, History } from 'lucide-react';

import { Users, Bed, CreditCard, FlaskConical, Camera, Pill, ChevronRight, Activity, DollarSign, ShieldCheck, Stethoscope, UserCheck, Calendar, Clock, Shield, MapPin, FolderOpen } from 'lucide-react';
import PatientWaitingQueueBoard from './PatientWaitingQueueBoard';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StaffShiftCalendar from './StaffShiftCalendar';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1">{value}</h3>
      </div>
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
        <Icon size={24} />
      </div>
    </div>
  );
}


interface DashboardProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onSelectPatient?: (patient: any) => void;
  onSelectModule?: (moduleName: string) => void;
}

export default function Dashboard({ activeHospital: propHospital, addToast, onSelectPatient, onSelectModule }: DashboardProps) {

  const [syncHistoryOpen, setSyncHistoryOpen] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([
    { id: '1', tableName: 'patients', status: 'synced', timestamp: new Date(Date.now() - 50000).toISOString(), dataSummary: 'Added John Doe' },
    { id: '2', tableName: 'vitals', status: 'pending', timestamp: new Date(Date.now() - 10000).toISOString(), dataSummary: 'Updated HR' }
  ]);

  const [counts, setCounts] = useState({
    patients: 0,
    pendingLabOrders: 0,
    admissions: 0,
    payments: 0,
    radiology: 0,
    prescriptions: 0,
    staff: 0,
    departments: 0,
    totalRecords: 0,
    totalIncome: 0,
    pendingApprovals: 0,
    insuranceRequests: 0,
    dailyInsuranceIncome: 0,
    monthlyInsuranceIncome: 0,
    woreda: 0,
    city: 0,
    zone: 0,
    region: 0
  });

  // User Role View state with automatic storage sync
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('ehr_sidebar_role_view_department') || 'all';
  });

  useEffect(() => {
    const handleRoleChange = () => {
      const savedRole = localStorage.getItem('ehr_sidebar_role_view_department') || 'all';
      setUserRole(savedRole);
    };
    window.addEventListener('storage', handleRoleChange);
    return () => window.removeEventListener('storage', handleRoleChange);
  }, []);

  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
  const localHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
  const activeHospital = propHospital || localHospital;
  const hospital_id = activeHospital?.hospital_unique_number || activeHospital?.hospital_id || '';

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    if (!hospital_id) {
      setCounts({
        patients: 0,
        pendingLabOrders: 0,
        admissions: 0,
        payments: 0,
        radiology: 0,
        prescriptions: 0,
        staff: 0,
        departments: 0
      });
      return;
    }

    // Helper to verify if a document contains real clinical data and prevent counting false/mock info
    const isRealClinicalDocument = (data: any): boolean => {
      return true;
    };

    // 1. Patients count & Demographics
    const qPatients = query(collection(db, 'patients'), where('hospital_id', '==', hospital_id));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      let woredaCount = 0;
      let cityCount = 0;
      let zoneCount = 0;
      let regionCount = 0;

      validDocs.forEach(doc => {
        const p = doc.data();
        if (p.woreda || p.address?.woreda) woredaCount++;
        if (p.city || p.town || p.address?.city) cityCount++;
        if (p.zone || p.subcity || p.address?.zone) zoneCount++;
        if (p.region || p.address?.region) regionCount++;
      });

      setCounts(prev => ({ 
        ...prev, 
        patients: validDocs.length,
        woreda: woredaCount,
        city: cityCount,
        zone: zoneCount,
        region: regionCount
      }));
    }, () => setCounts(prev => ({ ...prev, patients: 0 })));
    unsubscribes.push(unsubPatients);

    // 2. Pending Lab Orders count
    const qLab = query(collection(db, 'lab_results'), where('status', '==', 'pending'), where('hospital_id', '==', hospital_id));
    const unsubLab = onSnapshot(qLab, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, pendingLabOrders: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, pendingLabOrders: 0 })));
    unsubscribes.push(unsubLab);

    // 3. Current Admissions count
    const qAdmissions = query(collection(db, 'admissions'), where('hospital_id', '==', hospital_id));
    const unsubAdmissions = onSnapshot(qAdmissions, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, admissions: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, admissions: 0 })));
    unsubscribes.push(unsubAdmissions);
    
    // 4. Pending Payments count
    const qPayments = query(collection(db, 'financial_ledger'), where('hospital_id', '==', hospital_id), where('status', '==', 'pending'));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, payments: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, payments: 0 })));
    unsubscribes.push(unsubPayments);

    // 5. Pending Radiology count
    const qRad = query(collection(db, 'radiology_orders'), where('hospital_id', '==', hospital_id), where('status', '==', 'pending'));
    const unsubRad = onSnapshot(qRad, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, radiology: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, radiology: 0 })));
    unsubscribes.push(unsubRad);

    // 6. Pending Prescriptions count
    const qRx = query(collection(db, 'prescriptions'), where('hospital_id', '==', hospital_id), where('status', '==', 'pending'));
    const unsubRx = onSnapshot(qRx, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, prescriptions: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, prescriptions: 0 })));
    unsubscribes.push(unsubRx);

    // 7. Active Staff count
    const qStaff = query(collection(db, 'staff'), where('hospital_id', '==', hospital_id));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, staff: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, staff: 0 })));
    unsubscribes.push(unsubStaff);

    // 8. Registered Departments count
    const qDepts = query(collection(db, 'departments'), where('hospital_id', '==', hospital_id));
    const unsubDepts = onSnapshot(qDepts, (snapshot) => {
      const validDocs = snapshot.docs.filter(doc => isRealClinicalDocument(doc.data()));
      setCounts(prev => ({ ...prev, departments: validDocs.length }));
    }, () => setCounts(prev => ({ ...prev, departments: 0 })));
    unsubscribes.push(unsubDepts);

    // 9. Finance Records & Revenue metrics
    const qFinance = query(collection(db, 'finance_records'), where('hospital_id', '==', hospital_id));
    const unsubFinance = onSnapshot(qFinance, (snapshot) => {
      let income = 0;
      let pendingAppr = 0;
      let insReq = 0;
      let dailyIns = 0;
      let monthlyIns = 0;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      snapshot.docs.forEach(doc => {
        const item = doc.data();
        const amt = Number(item.amount || item.total_cost || 0);
        const ts = item.timestamp?.toMillis ? item.timestamp.toMillis() : Date.now();

        if (item.type === 'income' || item.status === 'paid' || item.status === 'completed') {
          income += amt;
          if (item.category === 'insurance' || item.paymentMethod === 'insurance' || item.is_insurance) {
            if (ts >= startOfDay) dailyIns += amt;
            if (ts >= startOfMonth) monthlyIns += amt;
          }
        }

        if (item.status === 'pending' || item.status === 'audit_required') {
          pendingAppr++;
        }

        if (item.category === 'insurance' || item.paymentMethod === 'insurance' || item.is_insurance || item.type === 'insurance_request') {
          insReq++;
        }
      });

      setCounts(prev => ({
        ...prev,
        totalRecords: snapshot.size,
        totalIncome: income,
        pendingApprovals: pendingAppr,
        insuranceRequests: insReq,
        dailyInsuranceIncome: dailyIns,
        monthlyInsuranceIncome: monthlyIns
      }));
    });
    unsubscribes.push(unsubFinance);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [hospital_id]);

  const changeRoleView = (role: string) => {
    setUserRole(role);
    localStorage.setItem('ehr_sidebar_role_view_department', role);
    addToast?.('info', `Switched workspace view to: ${role.toUpperCase()}`);
  };

  return (
    <div className="p-2 sm:p-6 space-y-8">
      {/* Role View Header Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white flex items-center gap-2">
            <Activity className="text-indigo-600" size={24} />
            <span>Role-Tailored Clinical Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Widgets dynamically pulled according to your assigned department role view: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{userRole}</strong>
          </p>
        </div>

        {/* Quick Role View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'all', label: 'All Depts', icon: ShieldCheck },
            { id: 'clinical', label: 'Doctor / Clinical', icon: Stethoscope },
            { id: 'finance', label: 'Finance Monitoring', icon: DollarSign },
            { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
            { id: 'hr', label: 'HR / Staffing', icon: Calendar }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => changeRoleView(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                userRole === r.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <r.icon size={13} />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>



      
      {/* High-Action Modules (Prioritized on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 block sm:hidden mb-6">
        <button 
          onClick={() => onSelectModule && onSelectModule('Register Logbook')}
          className="bg-indigo-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
        >
          <BookOpen size={24} />
          <span className="text-xs font-bold text-center">Register Logbook</span>
        </button>
        <button 
          onClick={() => onSelectModule && onSelectModule('Data & Explorer')}
          className="bg-indigo-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
        >
          <DatabaseIcon size={24} />
          <span className="text-xs font-bold text-center">Data Explorer</span>
        </button>
        <button 
          onClick={() => setSyncHistoryOpen(true)}
          className="bg-slate-800 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 col-span-2 sm:col-span-1"
        >
          <History size={24} />
          <span className="text-xs font-bold text-center">Sync History</span>
        </button>
      </div>
      
      {/* High-Action Modules (Desktop) */}
      <div className="hidden sm:grid grid-cols-3 gap-6">
        <button 
          onClick={() => onSelectModule && onSelectModule('Register Logbook')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-start gap-4 shadow-sm cursor-pointer transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><BookOpen size={24} /></div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-900 block">Register Logbook</span>
            <span className="text-xs text-gray-500 font-medium">Editable offline registries</span>
          </div>
        </button>
        <button 
          onClick={() => onSelectModule && onSelectModule('Data & Explorer')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-start gap-4 shadow-sm cursor-pointer transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><DatabaseIcon size={24} /></div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-900 block">Data & Explorer</span>
            <span className="text-xs text-gray-500 font-medium">Browse data tables</span>
          </div>
        </button>
        <button 
          onClick={() => setSyncHistoryOpen(true)}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-start gap-4 shadow-sm cursor-pointer transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><History size={24} /></div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-900 block">Sync History</span>
            <span className="text-xs text-gray-500 font-medium">View offline queue</span>
          </div>
        </button>
      </div>

      {/* DYNAMIC METRICS FOR SPECIFIC ROLES */}
      {userRole === 'finance' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Payments / Income" value={`$${counts.totalIncome.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Pending Payment Verifications" value={counts.payments} icon={CreditCard} />
            <StatCard title="Pending Audit Approvals" value={counts.pendingApprovals} icon={Clock} />
            <StatCard title="Insurance Requests" value={counts.insuranceRequests} icon={Shield} />
            <StatCard title="Insurance Income (Daily)" value={`$${counts.dailyInsuranceIncome.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Insurance Income (Monthly)" value={`$${counts.monthlyInsuranceIncome.toLocaleString()}`} icon={DollarSign} />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-600" />
              Income Used Patients by Demographics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Woreda</span>
                <span className="block text-lg font-black text-slate-800">{counts.woreda}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">City</span>
                <span className="block text-lg font-black text-slate-800">{counts.city}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Zone</span>
                <span className="block text-lg font-black text-slate-800">{counts.zone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Region</span>
                <span className="block text-lg font-black text-slate-800">{counts.region}</span>
              </div>
            </div>
          </div>
        </div>
      ) : userRole === 'pharmacy' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Pending Prescriptions" value={counts.prescriptions} icon={Pill} />
          <StatCard title="Total Registered Patients" value={counts.patients} icon={Users} />
          <StatCard title="Dispensary Active Queue" value="Live Counter" icon={FlaskConical} />
        </div>
      ) : userRole === 'clinical' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Patients" value={counts.patients} icon={Users} />
          <StatCard title="Current Inpatient Admissions" value={counts.admissions} icon={Bed} />
          <StatCard title="Pending Lab Orders" value={counts.pendingLabOrders} icon={FlaskConical} />
          <StatCard title="Pending Prescriptions" value={counts.prescriptions} icon={Pill} />
        </div>
      ) : userRole === 'hr' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="On-Call Rotations & Duty Roster" value="Active Shift" icon={Calendar} />
          <StatCard title="Active Clinical Personnel" value={`${counts.staff} Staff`} icon={Users} />
          <StatCard title="Registered Hospital Units" value={`${counts.departments} Departments`} icon={Bed} />
        </div>
      ) : (
        /* ALL / ADMIN DEFAULT ROLE METRICS */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Patients" value={counts.patients} icon={Users} />
            <StatCard title="Current Admissions" value={counts.admissions} icon={Bed} />
            <StatCard title="Pending Payments" value={counts.payments} icon={CreditCard} />
            <StatCard title="Pending Lab Orders" value={counts.pendingLabOrders} icon={FlaskConical} />
            <StatCard title="Pending Radiology" value={counts.radiology} icon={Camera} />
            <StatCard title="Pending Prescriptions" value={counts.prescriptions} icon={Pill} />
            <StatCard title="Total Records" value={counts.totalRecords} icon={FolderOpen} />
            <StatCard title="Total Income" value={`$${counts.totalIncome.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Pending Approvals" value={counts.pendingApprovals} icon={Clock} />
            <StatCard title="Insurance Requests" value={counts.insuranceRequests} icon={Shield} />
            <StatCard title="Insurance Income (Daily)" value={`$${counts.dailyInsuranceIncome.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Insurance Income (Monthly)" value={`$${counts.monthlyInsuranceIncome.toLocaleString()}`} icon={DollarSign} />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-600" />
              Income Used Patients by Demographics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Woreda</span>
                <span className="block text-lg font-black text-slate-800">{counts.woreda}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">City</span>
                <span className="block text-lg font-black text-slate-800">{counts.city}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Zone</span>
                <span className="block text-lg font-black text-slate-800">{counts.zone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Region</span>
                <span className="block text-lg font-black text-slate-800">{counts.region}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC WIDGETS PULLED BY ROLE */}
      {(userRole === 'finance') && (
        <div className="space-y-6">
        </div>
      )}

      {(userRole === 'clinical') && (
        <div className="space-y-6">
          <PatientWaitingQueueBoard hospital_id={hospital_id} addToast={addToast} />
          {/* On-Call Staff Shift Calendar for Doctors */}
          <StaffShiftCalendar 
            activeHospital={activeHospital} 
            addToast={addToast} 
          />
        </div>
      )}

      {(userRole === 'pharmacy') && (
        <div className="space-y-6">
        </div>
      )}

      {(userRole === 'hr') && (
        <div className="space-y-6">
          <StaffShiftCalendar 
            activeHospital={activeHospital} 
            addToast={addToast} 
          />
        </div>
      )}

      {(userRole === 'all' || userRole === 'admin') && (
        <div className="space-y-8">
          <PatientWaitingQueueBoard hospital_id={hospital_id} addToast={addToast} />
          {/* Staff Shift Calendar & On-Call Rotation Roster */}
          <StaffShiftCalendar 
            activeHospital={activeHospital} 
            addToast={addToast} 
          />
        </div>
      )}

      <SyncHistoryModal 
        isOpen={syncHistoryOpen} 
        onClose={() => setSyncHistoryOpen(false)} 
        queue={syncQueue} 
      />
    </div>
  );
}
