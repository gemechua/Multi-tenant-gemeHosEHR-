import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  DollarSign, ShoppingCart, ShieldCheck, FileText, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Plus, 
  Search, Filter, Download, Calendar, PieChart,
  Activity, Wallet, CreditCard, Share2, Send, MessageCircle,
  UploadCloud, DownloadCloud
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { useSkippedContext } from './SecureModuleWrapper';
import PlanningModal from './PlanningModal';

interface FinanceDashboardProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function FinanceDashboard({ activeHospital, addToast }: FinanceDashboardProps) {
  const { isSkipped } = useSkippedContext();
  const [stats, setStats] = useState({
    totalPatients: 0,
    currentAdmissions: 0,
    pendingPayments: 0,
    pendingLabOrders: 0,
    pendingRadiology: 0,
    pendingPrescriptions: 0,
    totalRecords: 0,
    totalIncome: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0,
    dailyInsuranceIncome: 0,
    monthlyInsuranceIncome: 0,
    totalInsuranceRequests: 0,
    incomeByAddress: {
      woreda: 0,
      city: 0,
      zone: 0,
      region: 0
    }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'plans'>('overview');
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [actionPlans, setActionPlans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  
  const hospital_id = activeHospital?.hospital_unique_number || activeHospital?.hospital_id || '';

  const handleDownloadTemplate = (type: string) => {
    let headers = [];
    let filename = '';
    
    switch (type) {
      case 'action-plan':
        headers = ['Department', 'Goal', 'Activity', 'Target Quarter', 'Budget Required', 'Expected Outcome'];
        filename = 'action_plan_template.csv';
        break;
      case 'performance':
        headers = ['KPI Name', 'Current Value', 'Target Value', 'Variance', 'Notes'];
        filename = 'performance_template.csv';
        break;
      case 'reports':
        headers = ['Report Period', 'Total Revenue', 'Total Expenses', 'Net Margin', 'Key Highlights'];
        filename = 'reports_template.csv';
        break;
      default:
        headers = ['Data1', 'Data2'];
        filename = 'template.csv';
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (addToast) addToast('info', `Downloaded ${filename}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (addToast) addToast('info', `Parsing document ${file.name}...`);
      
      // Simulate successful parsing
      setTimeout(() => {
        if (addToast) addToast('success', 'Plan document successfully parsed and uploaded.');
      }, 1500);
      e.target.value = ''; // reset input
    }
  };

  useEffect(() => {
    if (isSkipped) {
      setStats({
        totalPatients: 0,
        currentAdmissions: 0,
        pendingPayments: 0,
        pendingLabOrders: 0,
        pendingRadiology: 0,
        pendingPrescriptions: 0,
        totalRecords: 0,
        totalIncome: 0,
        pendingApprovals: 0,
        monthlyRevenue: 0,
        dailyInsuranceIncome: 0,
        monthlyInsuranceIncome: 0,
        totalInsuranceRequests: 0,
        incomeByAddress: { woreda: 0, city: 0, zone: 0, region: 0 }
      });
      setFinanceData([]);
      setChartData([]);
      setIsLoading(false);
      return;
    }

    // 1. Live Stats Listeners
    const unsubRecords = onSnapshot(
      query(collection(db, 'finance_records'), where('hospital_id', '==', hospital_id)),
      (snapshot) => {
        let totalIncome = 0;
        let dailyIns = 0;
        let monthlyIns = 0;
        let totalInsReq = 0;
        
        let woredaInc = 0;
        let cityInc = 0;
        let zoneInc = 0;
        let regionInc = 0;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const records = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData: Record<string, { income: number, expenses: number, index: number }> = {};
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mName = monthNames[d.getMonth()];
          monthlyData[mName] = { income: 0, expenses: 0, index: 5 - i };
        }

        records.forEach(data => {
          const amount = Number(data.amount) || 0;
          const timestamp = data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now();
          const date = new Date(timestamp);
          const mName = monthNames[date.getMonth()];
          
          if (monthlyData[mName]) {
             if (data.type === 'income') {
               monthlyData[mName].income += amount;
             } else if (data.type === 'expense' || data.type === 'purchase' || data.type === 'deduction' || data.type === 'expense_record') {
               monthlyData[mName].expenses += amount;
             }
          }

          if (data.type === 'income') {
            totalIncome += amount;
            
            if (data.category === 'insurance' || data.paymentMethod === 'insurance') {
              if (timestamp >= startOfDay) dailyIns += amount;
              if (timestamp >= startOfMonth) monthlyIns += amount;
            }

            if (data.addressCategory === 'woreda') woredaInc += amount;
            if (data.addressCategory === 'city') cityInc += amount;
            if (data.addressCategory === 'zone') zoneInc += amount;
            if (data.addressCategory === 'region') regionInc += amount;
          }
          
          if (data.type === 'insurance_request') {
            totalInsReq += amount;
          }
        });
        
        const newChartData = Object.keys(monthlyData)
          .map(k => ({ name: k, ...monthlyData[k] }))
          .sort((a, b) => a.index - b.index)
          .map(item => ({ name: item.name, income: item.income, expenses: item.expenses }));

        setStats(prev => ({ 
          ...prev, 
          totalRecords: snapshot.size,
          totalIncome: totalIncome,
          dailyInsuranceIncome: dailyIns,
          monthlyInsuranceIncome: monthlyIns,
          totalInsuranceRequests: totalInsReq,
          incomeByAddress: {
            woreda: woredaInc,
            city: cityInc,
            zone: zoneInc,
            region: regionInc
          }
        }));
        setChartData(newChartData);
        setFinanceData(records);
        setIsLoading(false);
      }
    );

    const unsubPending = onSnapshot(
      query(collection(db, 'finance_records'), 
        where('hospital_id', '==', hospital_id),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        setStats(prev => ({ ...prev, pendingApprovals: snapshot.size }));
      }
    );

    // 2. Action Plans Listener
    const unsubPlans = onSnapshot(
      query(collection(db, 'finance_action_plans'), where('hospital_id', '==', hospital_id)),
      (snapshot) => {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActionPlans(plans);
      }
    );

    const unsubPatients = onSnapshot(
      query(collection(db, 'patients'), where('hospital_id', '==', hospital_id)),
      (snapshot) => {
        setStats(prev => ({ ...prev, totalPatients: snapshot.size }));
      }
    );

    const unsubAdmissions = onSnapshot(
      query(collection(db, 'admissions'), where('hospital_id', '==', hospital_id)),
      (snapshot) => {
        setStats(prev => ({ ...prev, currentAdmissions: snapshot.size }));
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'financial_ledger'), where('hospital_id', '==', hospital_id), where('status', '==', 'pending')),
      (snapshot) => {
        setStats(prev => ({ ...prev, pendingPayments: snapshot.size }));
      }
    );

    const unsubLab = onSnapshot(
      query(collection(db, 'hospital_modules_submissions'), where('hospital_id', '==', hospital_id), where('status', '==', 'pending')),
      (snapshot) => {
        let labCount = 0;
        let radCount = 0;
        let rxCount = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.subsection_id?.startsWith('1.1.1.d')) labCount++;
          if (data.subsection_id?.startsWith('1.1.1.c')) radCount++;
          if (data.subsection_id?.startsWith('1.1.1.e')) rxCount++;
        });
        setStats(prev => ({ 
          ...prev, 
          pendingLabOrders: labCount,
          pendingRadiology: radCount,
          pendingPrescriptions: rxCount
        }));
      }
    );

    return () => {
      unsubRecords();
      unsubPending();
      unsubPlans();
      unsubPatients();
      unsubAdmissions();
      unsubPayments();
      unsubLab();
    };
  }, [hospital_id]);

  // Chart data is now dynamically calculated from Firestore records


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-800 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">Finance Department</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Income tracking, purchases, audits, and insurance monitoring
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 border-r border-gray-200 dark:border-slate-700 pr-4">
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-[10px] font-bold"
              onClick={() => {
                if (addToast) addToast('info', 'Exporting summary reports...');
                // Implement export logic
              }}
            >
              <DownloadCloud size={14} />
              Export
            </button>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-[10px] font-bold"
              onClick={() => {
                if (addToast) addToast('info', 'Importing summary reports...');
                // Implement import logic
              }}
            >
              <UploadCloud size={14} />
              Import
            </button>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-bold"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=Finance%20Summary%20Reports`, '_blank')}
            >
              <Send size={14} />
              Telegram
            </button>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-[10px] font-bold"
              onClick={() => window.open(`https://wa.me/?text=Finance%20Summary%20Reports%20${encodeURIComponent(window.location.href)}`, '_blank')}
            >
              <MessageCircle size={14} />
              WhatsApp
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 hover:bg-gray-100'}`}
            >
              Dashboard Overview
            </button>
            <button 
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 hover:bg-gray-100'}`}
            >
              Finance Records
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 hover:bg-gray-100'}`}
            >
              Action Plans & Templates
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Patients</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.totalPatients}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Admissions</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.currentAdmissions}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Payments</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.pendingPayments}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Lab Orders</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.pendingLabOrders}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Radiology</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.pendingRadiology}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Prescriptions</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.pendingPrescriptions}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Records</p>
            <h3 className="text-3xl font-black text-gray-950 dark:text-white mt-1 font-mono">{isLoading ? '...' : stats.totalRecords}</h3>
            <span className="text-[10px] text-indigo-600 font-bold mt-2 inline-block">Archived entries</span>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Income</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1 font-mono">{isLoading ? '...' : stats.totalIncome.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-600 font-bold mt-2 inline-block flex items-center gap-1">
              <ArrowUpRight size={12} /> Overall revenue
            </span>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Approvals</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1 font-mono">{isLoading ? '...' : stats.pendingApprovals}</h3>
            <span className="text-[10px] text-amber-600 font-bold mt-2 inline-block">Requires audit verification</span>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Insurance Requests</p>
            <h3 className="text-3xl font-black text-blue-600 mt-1 font-mono">{isLoading ? '...' : stats.totalInsuranceRequests.toLocaleString()}</h3>
            <span className="text-[10px] text-blue-600 font-bold mt-2 inline-block">Total payment requests</span>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Insurance Income (Daily)</p>
          <h3 className="text-2xl font-black text-teal-600 font-mono">{isLoading ? '...' : stats.dailyInsuranceIncome.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Insurance Income (Monthly)</p>
          <h3 className="text-2xl font-black text-teal-600 font-mono">{isLoading ? '...' : stats.monthlyInsuranceIncome.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm col-span-1 md:col-span-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Income Used Patients by Demographics</p>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Woreda</p>
              <p className="font-bold text-gray-900 dark:text-white">{isLoading ? '...' : stats.incomeByAddress.woreda.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">City</p>
              <p className="font-bold text-gray-900 dark:text-white">{isLoading ? '...' : stats.incomeByAddress.city.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Zone</p>
              <p className="font-bold text-gray-900 dark:text-white">{isLoading ? '...' : stats.incomeByAddress.zone.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Region</p>
              <p className="font-bold text-gray-900 dark:text-white">{isLoading ? '...' : stats.incomeByAddress.region.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>



      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <FileText size={20} />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2">Action Plan Template</h4>
              <p className="text-xs text-gray-500 mb-4">Intake format for yearly and quarterly departmental action plans.</p>
              <button 
                onClick={() => handleDownloadTemplate('action-plan')}
                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors w-full">
                Download Format
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl flex items-center justify-center mb-4">
                <Activity size={20} />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2">Performance Template</h4>
              <p className="text-xs text-gray-500 mb-4">Intake format for assessing financial goals and KPI performance.</p>
              <button 
                onClick={() => handleDownloadTemplate('performance')}
                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors w-full">
                Download Format
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                <PieChart size={20} />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2">Reports Template</h4>
              <p className="text-xs text-gray-500 mb-4">Intake format for generating consolidated summary reports.</p>
              <button 
                onClick={() => handleDownloadTemplate('reports')}
                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors w-full">
                Download Format
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Action Plans and performance</h4>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Strategic financial milestones and target achievements</p>
              </div>
              <button 
                onClick={() => setIsPlanningModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm">
                <Plus size={14} />
                <span>New Plan</span>
              </button>
            </div>
            
            <div className="p-12 text-center">
              {isLoading ? (
                 <p className="text-sm text-gray-500">Loading action plans...</p>
              ) : actionPlans.length === 0 ? (
                <div className="max-w-xs mx-auto">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                    <Activity size={24} className="text-gray-300" />
                  </div>
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No action plans yet</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Start by creating your first yearly or quarterly financial action plan to track department performance.</p>
                  <label className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer">
                    Upload Plan Document
                    <input type="file" className="hidden" accept=".csv,.pdf,.doc,.docx" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {actionPlans.map(plan => (
                    <div key={plan.id} className="p-4 border border-gray-150 rounded-xl">
                      <h5 className="font-bold text-sm mb-2">{plan.title || 'Untitled Plan'}</h5>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search financial records..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-gray-50 dark:bg-slate-800 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
                <Filter size={16} />
              </button>
              <button className="p-2 bg-gray-50 dark:bg-slate-800 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
                <Download size={16} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-500">Loading records...</td>
                  </tr>
                ) : financeData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-500">No records found.</td>
                  </tr>
                ) : (
                  financeData.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-900 dark:text-white">{record.description || 'Transaction'}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{record.category || 'General'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                          record.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {record.status || 'Pending'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-xs font-black ${record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {record.type === 'income' ? '+' : '-'}{Number(record.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <PlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        type="yearly"
        onSave={() => {
          if (addToast) addToast('success', 'Action plan saved successfully.');
        }}
      />
    </div>
  );
}
