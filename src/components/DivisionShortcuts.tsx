import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  DollarSign, 
  Users, 
  CreditCard, 
  FileText, 
  Activity, 
  FolderOpen,
  ClipboardList,
  Cross,
  Stethoscope,
  Pill,
  Syringe,
  Scissors,
  Package,
  Baby,
  LibraryBig,
  MapPin,
  ChevronRight,
  MonitorPlay,
  HeartPulse,
  Bed,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { filterFakeOrFalseRows } from '../utils/dataIntegrity';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: any;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon size={18} />
      </div>
      <span className="text-2xl font-black text-gray-900">{value}</span>
    </div>
    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">{title}</h4>
    {subtitle && <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
  </div>
);

const ShortcutItem = ({ label, id, onSelect }: { label: string, id: string, onSelect?: (id: string) => void }) => (
  <button 
    onClick={() => onSelect?.(id)}
    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group w-full"
  >
    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md shrink-0 group-hover:scale-110 transition-transform">
      <Zap size={14} />
    </div>
    <div className="flex-1 min-w-0">
      <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{label}</h5>
      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{id}</p>
    </div>
    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 shrink-0 self-center" />
  </button>
);

const SectionHeader = ({ title, icon: Icon, color = 'indigo' }: { title: string, icon: any, color?: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className={`p-1.5 bg-${color}-100 text-${color}-700 rounded shadow-sm`}>
      <Icon size={16} />
    </div>
    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h3>
  </div>
);

export default function DivisionShortcuts({ onSelect, onBack }: { onSelect?: (id: string) => void; onBack?: () => void }) {
  const [counts, setCounts] = useState({
    totalPatients: 0,
    currentAdmissions: 0,
    pendingPayments: 0,
    pendingLabOrders: 0,
    pendingRadiology: 0,
    pendingPrescriptions: 0,
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

  useEffect(() => {
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snap) => {
      const validRows = filterFakeOrFalseRows(snap.docs.map(doc => doc.data()));
      let woredaCount = 0;
      let cityCount = 0;
      let zoneCount = 0;
      let regionCount = 0;

      validRows.forEach((p: any) => {
        if (p.woreda || p.address?.woreda) woredaCount++;
        if (p.city || p.town || p.address?.city) cityCount++;
        if (p.zone || p.subcity || p.address?.zone) zoneCount++;
        if (p.region || p.address?.region) regionCount++;
      });

      setCounts(prev => ({ 
        ...prev, 
        totalPatients: validRows.length,
        woreda: woredaCount,
        city: cityCount,
        zone: zoneCount,
        region: regionCount
      }));
    });

    const unsubAdmissions = onSnapshot(collection(db, 'Form_1_1_1_Q'), (snap) => {
      const validRows = filterFakeOrFalseRows(snap.docs.map(doc => doc.data()));
      setCounts(prev => ({ ...prev, currentAdmissions: validRows.length }));
    });

    const unsubPayments = onSnapshot(query(collection(db, 'Form_1_1_1_1'), where('status', '==', 'requested')), (snap) => {
      const validRows = filterFakeOrFalseRows(snap.docs.map(doc => doc.data()));
      setCounts(prev => ({ ...prev, pendingPayments: validRows.length }));
    });

    const unsubLabs = onSnapshot(query(collection(db, 'Form_1_1_1_F'), where('status', '==', 'pending')), (snap) => {
      const validRows = filterFakeOrFalseRows(snap.docs.map(doc => doc.data()));
      setCounts(prev => ({ ...prev, pendingLabOrders: validRows.length }));
    });

    const unsubRad = onSnapshot(query(collection(db, 'Form_1_1_1_H'), where('status', '==', 'pending')), (snap) => {
      const validRows = filterFakeOrFalseRows(snap.docs.map(doc => doc.data()));
      setCounts(prev => ({ ...prev, pendingRadiology: validRows.length }));
    });

    const unsubRx = onSnapshot(query(collection(db, 'Form_1_1_1_M'), where('status', '==', 'pending')), (snap) => {
      const validRows = filterFakeOrFalseRows(snap.docs.map(doc => doc.data()));
      setCounts(prev => ({ ...prev, pendingPrescriptions: validRows.length }));
    });

    const unsubFinanceRecords = onSnapshot(collection(db, 'finance_records'), (snap) => {
      const docs = snap.docs.map(d => d.data());
      let income = 0;
      let pendingAppr = 0;
      let insRequests = 0;
      let dailyIns = 0;
      let monthlyIns = 0;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      docs.forEach((item: any) => {
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
          insRequests++;
        }
      });

      setCounts(prev => ({
        ...prev,
        totalRecords: snap.size,
        totalIncome: income,
        pendingApprovals: pendingAppr,
        insuranceRequests: insRequests,
        dailyInsuranceIncome: dailyIns,
        monthlyInsuranceIncome: monthlyIns
      }));
    });

    return () => {
      unsubPatients();
      unsubAdmissions();
      unsubPayments();
      unsubLabs();
      unsubRad();
      unsubRx();
      unsubFinanceRecords();
    };
  }, []);

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    } else {
      window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Dashboard' }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      {/* Header */}
      <div className="p-6 md:p-8 bg-white border-b border-gray-100 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <button
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-indigo-200/60 shadow-xs"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2 text-rose-600">
            <Shield size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Restricted Access</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tight flex items-center gap-3">
          <Zap className="text-indigo-600" size={28} />
          DIVISION SHORTCUTS
        </h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Easy access to schema tables, services, and forms
        </p>

        {/* Action Shortcuts Hub Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Module 3: Health Service IS' }))}
            className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <DollarSign size={16} />
            </div>
            <div>
              <span className="block text-xs font-extrabold leading-tight">Finance Department</span>
              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                Income tracking, purchases, audits, & insurance monitoring
              </span>
            </div>
          </button>

          <button
            onClick={() => onSelect?.('1.1.1.M')}
            className="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Plus size={16} />
            </div>
            <div>
              <span className="block text-xs font-extrabold leading-tight">Add Dispensary Prescribing Intake</span>
              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                New outpatient medication intake entry
              </span>
            </div>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Module 3: Health Service IS' }))}
            className="p-3 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-700 rounded-xl border border-slate-200/80 hover:border-teal-300 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-teal-100 text-teal-700 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Pill size={16} />
            </div>
            <div>
              <span className="block text-xs font-extrabold leading-tight">Pharmacy Operations Center</span>
              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                Inventory, dispensing & stock-out monitoring
              </span>
            </div>
          </button>

          <button
            onClick={() => onSelect?.('1.1.1.1')}
            className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <span className="block text-xs font-extrabold leading-tight">Revenue & Billing Desk</span>
              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                Payment verification & cashier operations
              </span>
            </div>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Module 4: Quality Improvement' }))}
            className="p-3 bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-700 rounded-xl border border-slate-200/80 hover:border-purple-300 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Activity size={16} />
            </div>
            <div>
              <span className="block text-xs font-extrabold leading-tight">Quality Improvement</span>
              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                Hospital standards & audit metrics
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-12 pb-24">
        
        {/* FINANCE DEPARTMENT MANAGEMENT DIVISION */}
        <section>
          <SectionHeader title="Finance Department Management Division" icon={DollarSign} color="emerald" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard title="Total Patients" value={counts.totalPatients} icon={Users} color="blue" />
            <MetricCard title="Current Admissions" value={counts.currentAdmissions} icon={Bed} color="indigo" />
            <MetricCard title="Pending Payments" value={counts.pendingPayments} icon={CreditCard} color="rose" />
            <MetricCard title="Pending Lab Orders" value={counts.pendingLabOrders} icon={Activity} color="amber" />
            <MetricCard title="Pending Radiology" value={counts.pendingRadiology} icon={MonitorPlay} color="purple" />
            <MetricCard title="Pending Prescriptions" value={counts.pendingPrescriptions} icon={Pill} color="teal" />
            
            <MetricCard title="Total Records" subtitle="Archived entries" value={counts.totalRecords} icon={FolderOpen} color="slate" />
            <MetricCard title="Total Income" subtitle="Overall revenue" value={`$${counts.totalIncome.toLocaleString()}`} icon={DollarSign} color="emerald" />
            <MetricCard title="Pending Approvals" subtitle="Requires audit verification" value={counts.pendingApprovals} icon={ClipboardList} color="orange" />
            <MetricCard title="Insurance Requests" subtitle="Total payment requests" value={counts.insuranceRequests} icon={Shield} color="blue" />
            <MetricCard title="Insurance Income" subtitle="Daily" value={`$${counts.dailyInsuranceIncome.toLocaleString()}`} icon={DollarSign} color="emerald" />
            <MetricCard title="Insurance Income" subtitle="Monthly" value={`$${counts.monthlyInsuranceIncome.toLocaleString()}`} icon={DollarSign} color="emerald" />
          </div>
        </section>

        {/* Demographics */}
        <section>
          <SectionHeader title="Income Used Patients by Demographics" icon={MapPin} color="violet" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Woreda" value={counts.woreda} icon={MapPin} color="indigo" />
            <MetricCard title="City" value={counts.city} icon={MapPin} color="indigo" />
            <MetricCard title="Zone" value={counts.zone} icon={MapPin} color="indigo" />
            <MetricCard title="Region" value={counts.region} icon={MapPin} color="indigo" />
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* BILLING & CASHIER HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Billing & Cashier Hub" icon={CreditCard} color="emerald" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.0" label="Patient Registration Payment Request Add Items Form Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.1" label="Cashier Payment Verification Add Items Form Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.G" label="Patient Laboratory Payment Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.G.1" label="Cashier Laboratory Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.I" label="Patient Radiology Payment Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.I.1" label="Cashier Radiology Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.N" label="Patient Prescription Payment Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.N.1" label="Cashier Prescription Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.P" label="Outpatient Procedure Payment Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.P.1" label="Cashier Procedure Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.R.1" label="Liaison Inpatient Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.R.2" label="Cashier Liaison Inpatient Deposit Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.T.1" label="Admitted Patient Prescription Payment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.T.2" label="Cashier Admitted Patient Prescription Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.1" label="Inpatient Lab Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.2" label="Admitted Patient Lab Cash / CBHI Payment Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.3" label="Cashier Inpatient Lab Payment Paid Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.6" label="Inpatient Radiology Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.7" label="Cashier Inpatient Radiology Paid Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z" label="Payment Request for Operating Room Procedure" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.1" label="Cashier OR Procedure Paid Verification Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.3" label="Cashier Inpatient Discharge Prescription Payment Verification Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.4" label="Liaison discharge Inpatient Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.5" label="Cashier Liaison Inpatient Deposit Verification" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.11.A" label="Payment Request / Transaction" />
            </div>
          </section>

          {/* CLINICAL SERVICES HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Clinical Services Hub" icon={Stethoscope} color="blue" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.2" label="EHR Clinical Hub Folder (Open Hub)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.C" label="Patient Clinical History Taken Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.D" label="Patient Clinical Assessment Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.E" label="Patient Clinical Diagnosis Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.L" label="Patient Older Add Items Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.O" label="Patient Procedure Submitted Intake" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.R.A" label="Bed" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.9.LABOR" label="Latent Phase Assessment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.10" label="Active Phase Assessment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.11.MONITORING" label="Second Stage Monitoring / Delivery Outcome" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.12" label="Third Stage (Placental) Assessment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.13" label="Postpartum Care Services" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.14" label="Cesarean Section Details" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.18.A" label="Vaccine Master Registry / Immunizations / AEFI" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.19.A" label="KMC Session Record" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.20.A" label="Contraceptive Counseling" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.7.A" label="Immunization Boosters" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.9.A" label="IM Consultation (SOAP) / Chronic Disease Mgt" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.11.A" label="Hospital Service Catalog" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.12.A" label="Dental Encounter / Charting / Procedures" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.13.A" label="Ophthalmology Encounter / Procedures" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.14.A" label="Physiatry / Rehab / Assistive Devices" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.15.A" label="ART Regimen / Follow-up Visits" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.16.A" label="TB Treatment Logs / Outcomes" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.17.A" label="Chronic Disease Registry / OPD Encounters" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.18.A" label="Cervical Cancer Pathology / Treatment / Surveillance" />
            </div>
          </section>

          {/* INPATIENT & WARD MANAGEMENT */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Inpatient & Ward Management" icon={Bed} color="indigo" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.Q" label="Patient Ward Admission Form" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.U" label="Inter-Department Consultation Ward Physician" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.W" label="Inpatient Nursing Care Plan, Prognosis & Discharge" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.19.A" label="NICU Daily Log" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.8.A" label="ICU Admission / Daily Systems Assessment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.19.B" label="Discharge Summaries" />
            </div>
          </section>

          {/* RECEPTION & APPOINTMENT HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Reception & Appointment Hub" icon={Users} color="fuchsia" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.A" label="Patient Registration & Background Info (Open Account Folder)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.R" label="Liaison Office Inpatient Intake & Referral" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.1" label="Antenatal Episode Registration" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.6.A" label="Surgical Bookings" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.15.A" label="ART Enrollment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.16.A" label="TB Case Enrollment" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.A" label="Appointment" />
            </div>
          </section>

          {/* LABORATORY SERVICES HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Laboratory Services Hub" icon={Activity} color="amber" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.F" label="Patient Laboratory Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V" label="Inpatient Laboratory Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.4" label="outpatient and Inpatient Laboratory Investigation Results" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.j" label="1.1.1.j emergency laboratory results schema tables" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.9.A" label="IM Lab Results" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.15.A" label="ART Lab Monitoring" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.16.A" label="TB Diagnostics" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.17.A" label="Chronic Lab Monitoring" />
            </div>
          </section>

          {/* RADIOLOGY & IMAGING HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Radiology & Imaging Hub" icon={MonitorPlay} color="purple" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.H" label="Patient Radiology Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.5" label="Inpatient Radiology Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.8" label="outpatient and Inpatient Radiology Report & Results" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.k" label="1.1.1.k emergency radiology results schema tables" />
            </div>
          </section>

          {/* PHARMACY & MEDICATION HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Pharmacy & Medication Hub" icon={Pill} color="teal" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.M" label="Outpatient Prescription Submitted" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.M.1" label="Chronic Medication Refill Request Workflow" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.M.2" label="Doctor Refill Approval Queue" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.T" label="Admitted Patient Prescription Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.U.1" label="Admitted Patients Medication Given Records" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.2" label="Admitted Inpatient Prescription Request Form (Discharge)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.9.A" label="Prescription Module" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.11.A" label="Oxygen Prescription" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.13.A" label="Ophthalmology Prescription" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.17.A" label="Chronic Medication Refills" />
            </div>
          </section>

          {/* TRIAGE & VITAL SIGNS HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Triage & Vital Signs Hub" icon={HeartPulse} color="rose" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.A" label="Pre-Triage Screen Intake Add Items Form Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.B" label="Triage Add Items Form & Vitals Signs Summary" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.S" label="Admitted Inpatient Vital Signs & Pain Score" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.7.A" label="Developmental Screening" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.8.A" label="ICU Hourly Vitals (Hemodynamics)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.10.A" label="Vital Signs Monitoring / Fluid Balance Logs" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.10.A" label="Vitals Deterioration Alerts" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.11.A" label="Oxygen Prescription / Titration Log" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.13.A" label="Ophthalmology Vitals" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.18.A" label="Cervical Cancer Screening" />
            </div>
          </section>

          {/* OPERATING THEATER & SURGERY */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Operating Theater & Surgery" icon={Scissors} color="sky" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.X" label="Inpatient Surgery Safety Checklist & Anesthesia Intake" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y" label="Maternity Care Services" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.9.LABOR" label="Labor Episode Admission" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.15" label="Post-Op Recovery Monitoring (PACU)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.16" label="Post-Op Ward Transfer Record" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.22.A" label="Gyn Surgeries" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.6.A" label="Surgical Master Registry / Bookings / Theatre Time Logs" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.8.A" label="ICU Ventilator Settings" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.19.C" label="Surgical Consent Forms / Signatures" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.19.A" label="Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.19.B" label="Post-Op PACU Log / Orders / Wound Care / Complications" />
            </div>
          </section>

          {/* INVENTORY & MEDICAL SUPPLY */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Inventory & Medical Supply" icon={Package} color="amber" />
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.A.B" label="INVENTORY" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.A.C" label="MEDICAL SUPPLY" />
            </div>
          </section>

          {/* MATERNITY & CHILD CARE HUB */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
            <SectionHeader title="Maternity & Child Care Hub" icon={Baby} color="pink" />
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              <ShortcutItem onSelect={onSelect} id="1.1.1.F" label="Patient Laboratory Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V" label="Inpatient Laboratory Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.V.4" label="outpatient and Inpatient Laboratory Investigation Results" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.2" label="ANC Visit Record" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.3" label="ANC Visit Record (3-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.4" label="ANC Visit Record (4-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.5" label="ANC Visit Record (5-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.6" label="ANC Visit Record (6-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.7" label="ANC Visit Record (7-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.8" label="ANC Visit Record (8-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.17" label="Master Birth Summary View" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.19.A" label="Newborn Registry / Neonatal Routine Care" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.20.A" label="Abortion/PAC Episodes / PAC Management Details" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.21.A" label="FP Method Registry / Provision / Removal" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Y.22.A" label="Gyn Encounters / Investigations" />
              <ShortcutItem onSelect={onSelect} id="1.1.1.Z.7.A" label="Pediatric Growth Monitoring / Consultation" />
            </div>
          </section>
          
          {/* COMPREHENSIVE CLINICAL FORMS DIRECTORY */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
            <SectionHeader title="Comprehensive Clinical Forms Directory (156 Total Modules & Registers)" icon={LibraryBig} color="slate" />
            <p className="text-xs text-gray-500 mb-4 font-medium">
              Complete alphabetical and series-indexed catalog of all 156 Electronic Health Record (EHR) clinical registers, billing verification forms, surgical checklists, and specialty care directories. Click any form to launch directly into its dedicated data explorer view.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4 max-h-[550px] overflow-y-auto pr-2">
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1" label="1.1.1 Patient Registration & Background Info" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_0" label="1.1.1.0 Patient Registration Payment Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_1" label="1.1.1.1 Cashier Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_2" label="1.1.1.2 EHR Clinical Hub Folder (Universal Hub)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_A" label="1.1.1.A Pre-Triage Screen Intake" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_B" label="1.1.1.B Triage Add Items Form & Vitals Signs" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_C" label="1.1.1.C Patient Clinical History Taken Summary" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_D" label="1.1.1.D Patient Clinical Assessment Summary" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_E" label="1.1.1.E Patient Clinical Diagnosis Summary" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_F" label="1.1.1.F Patient Laboratory Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_G" label="1.1.1.G Patient Laboratory Payment Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_G_1" label="1.1.1.G.1 Cashier Laboratory Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_H" label="1.1.1.H Patient Radiology Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_I" label="1.1.1.I Patient Radiology Payment Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_I_1" label="1.1.1.I.1 Cashier Radiology Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_L" label="1.1.1.L Patient Older Add Items Form" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_M" label="1.1.1.M Outpatient Prescription Submitted" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_M_1" label="1.1.1.M.1 Chronic Medication Refill Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_M_2" label="1.1.1.M.2 Doctor Refill Approval Queue" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_N" label="1.1.1.N Patient Prescription Payment Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_N_1" label="1.1.1.N.1 Cashier Prescription Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_O" label="1.1.1.O Patient Procedure Submitted Intake" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_P" label="1.1.1.P Outpatient Procedure Payment Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_P_1" label="1.1.1.P.1 Cashier Procedure Payment Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Q" label="1.1.1.Q Patient Ward Admission Form" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_R" label="1.1.1.R Liaison Office Inpatient Intake & Referral" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_R_1" label="1.1.1.R.1 Liaison Inpatient Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_R_2" label="1.1.1.R.2 Cashier Liaison Inpatient Deposit Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_S" label="1.1.1.S Admitted Inpatient Vital Signs & Pain Score" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_T" label="1.1.1.T Admitted Patient Prescription Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_T_1" label="1.1.1.T.1 Admitted Patient Prescription Payment" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_T_2" label="1.1.1.T.2 Cashier Admitted Patient Prescription Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_U" label="1.1.1.U Inter-Department Consultation Ward Physician" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_U_1" label="1.1.1.U.1 Admitted Patients Medication Given Records" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V" label="1.1.1.V Inpatient Laboratory Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_1" label="1.1.1.V.1 Inpatient Lab Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_2" label="1.1.1.V.2 Admitted Patient Lab Cash / CBHI Payment" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_3" label="1.1.1.V.3 Cashier Inpatient Lab Payment Paid Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_4" label="1.1.1.V.4 Outpatient & Inpatient Lab Investigation Results" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_5" label="1.1.1.V.5 Inpatient Radiology Investigation Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_6" label="1.1.1.V.6 Inpatient Radiology Payment Request Form" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_7" label="1.1.1.V.7 Cashier Inpatient Radiology Paid Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_V_8" label="1.1.1.V.8 Outpatient & Inpatient Radiology Results" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_W" label="1.1.1.W Inpatient Nursing Care Plan & Discharge Summary" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_X" label="1.1.1.X Inpatient Surgery Safety Checklist & Anesthesia" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y" label="1.1.1.Y Maternity Care Services Directory" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_1" label="1.1.1.Y.1 Antenatal Episode Registration" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_2" label="1.1.1.Y.2 ANC Visit Record (General)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_3" label="1.1.1.Y.3 ANC Visit Record (3-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_4" label="1.1.1.Y.4 ANC Visit Record (4-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_5" label="1.1.1.Y.5 ANC Visit Record (5-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_6" label="1.1.1.Y.6 ANC Visit Record (6-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_7" label="1.1.1.Y.7 ANC Visit Record (7-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_8" label="1.1.1.Y.8 ANC Visit Record (8-Visit Protocol)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_9_LABOR" label="1.1.1.Y.9.LABOR Latent Phase Assessment" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_10" label="1.1.1.Y.10 Active Phase Assessment" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_11_MONITORING" label="1.1.1.Y.11.MONITORING Second Stage Monitoring & Delivery Outcome" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_12" label="1.1.1.Y.12 Third Stage (Placental) Assessment" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_13" label="1.1.1.Y.13 Postpartum Care Services" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_14" label="1.1.1.Y.14 Cesarean Section Details" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_15" label="1.1.1.Y.15 Post-Op Recovery Monitoring (PACU)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_16" label="1.1.1.Y.16 Post-Op Ward Transfer Record" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_17" label="1.1.1.Y.17 Master Birth Summary View" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_18_A" label="1.1.1.Y.18.A Vaccine Master Registry / AEFI" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_19_A" label="1.1.1.Y.19.A KMC Session Record & NICU Daily Log" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_20_A" label="1.1.1.Y.20.A Contraceptive Counseling & Abortion/PAC" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_21_A" label="1.1.1.Y.21.A FP Method Registry & Provision" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Y_22_A" label="1.1.1.Y.22.A Gyn Encounters & Surgeries" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z" label="1.1.1.Z Specialty Services Hub" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_1" label="1.1.1.Z.1 Payment Request for Operating Room Procedure" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_2" label="1.1.1.Z.2 Admitted Inpatient Discharge Prescription" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_3" label="1.1.1.Z.3 Cashier Discharge Prescription Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_4" label="1.1.1.Z.4 Liaison Discharge Inpatient Payment Request" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_5" label="1.1.1.Z.5 Cashier Liaison Inpatient Deposit Verification" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_6_A" label="1.1.1.Z.6.A Surgical Master Registry & Bookings" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_7_A" label="1.1.1.Z.7.A Pediatric Growth & Immunization Boosters" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_8_A" label="1.1.1.Z.8.A ICU Admission & Ventilator Settings" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_9_A" label="1.1.1.Z.9.A IM Consultation (SOAP) & Chronic Disease" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_10_A" label="1.1.1.Z.10.A Vital Signs Monitoring & Fluid Balance" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_11_A" label="1.1.1.Z.11.A Hospital Service Catalog & Oxygen Prescription" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_12_A" label="1.1.1.Z.12.A Dental Encounter & Charting" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_13_A" label="1.1.1.Z.13.A Ophthalmology Encounter & Procedures" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_14_A" label="1.1.1.Z.14.A Physiatry & Rehab Assistive Devices" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_15_A" label="1.1.1.Z.15.A ART Regimen & Follow-up Visits" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_16_A" label="1.1.1.Z.16.A TB Treatment Logs & Outcomes" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_17_A" label="1.1.1.Z.17.A Chronic Disease Registry & OPD Encounters" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_18_A" label="1.1.1.Z.18.A Cervical Cancer Pathology & Screening" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_19_A" label="1.1.1.Z.19.A Surgical Safety Checklist (Sign-In/Out)" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_19_B" label="1.1.1.Z.19.B Post-Op PACU Log & Wound Care" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_19_C" label="1.1.1.Z.19.C Surgical Consent Forms & Signatures" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_A_B" label="1.1.1.Z.A.B Inventory & Warehouse Stock Management" />
              <ShortcutItem onSelect={onSelect} id="Form_1_1_1_Z_A_C" label="1.1.1.Z.A.C Medical Supply Procurement & Equipment" />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
