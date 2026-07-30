
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow, isFakeOrFalseValue } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  Wallet, TrendingUp, DollarSign, ShoppingCart, 
  Search, FileText, CreditCard, PieChart, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, X, ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FinanceAnalyticsEngine from './FinanceAnalyticsEngine';
import { logSecurityEvent } from '../lib/auditLogger';
import { maskMRN, maskCurrency } from '../lib/masking';

interface PatientLedger {
  id: string;
  patient_mrn: string;
  total_billed: number;
  total_paid: number;
  current_balance: number;
}

interface AuditLog {
  id: string;
  table_name: string;
  record_id: number;
  action_type: string;
  changed_by: string;
  changed_at: any;
}

interface ServiceItem {
  id: string;
  service_code: string;
  service_name: string;
  unit_price: number;
}

interface Module8Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function Module8Finance({ activeHospital, addToast }: Module8Props) {
  const [activeTab, setActiveTab] = useState<'Revenue' | 'Ledger' | 'Cashier' | 'Audit' | 'Analytics' | 'Command'>('Revenue');
  const [ledgers, setLedgers] = useState<PatientLedger[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceEncounterId, setInvoiceEncounterId] = useState('');
  const [invoiceServiceId, setInvoiceServiceId] = useState('');
  const [invoiceQuantity, setInvoiceQuantity] = useState(1);
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Financial Data Guard. This will purge ALL fake/mock financial, ledger, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Data Integrity: Cleaned ${deleted} falsified records.`);
      logSecurityEvent('Finance Guard Cleanup', `Global cleanup triggered by financial controller. Deleted ${deleted} rows.`, 'High');
    } catch (err) {
      console.error(err);
      addToast('error', 'Financial cleanup failed.');
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ledgerSnap, auditSnap, serviceSnap] = await Promise.all([
          getDocs(collection(db, 'fin_patient_ledger')),
          getDocs(query(collection(db, 'audit_log'), orderBy('changed_at', 'desc'), limit(50))),
          getDocs(collection(db, 'financial_services'))
        ]);
        setLedgers(
          ledgerSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as PatientLedger))
            .filter(item => !isFakeOrFalseRow(item))
        );
        setAuditLogs(
          auditSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as AuditLog))
            .filter(item => !isFakeOrFalseRow(item))
        );
        setServices(
          serviceSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem))
            .filter(item => !isFakeOrFalseRow(item))
        );
      } catch (e) {
        console.error(e);
        addToast('error', 'Failed to fetch financial data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleInitiateInvoice = async () => {
    const service = services.find(s => s.id === invoiceServiceId);
    if (!service || !invoiceEncounterId) {
      addToast('error', 'Please select a service and provide an encounter ID');
      return;
    }

    if (isFakeOrFalseValue(invoiceEncounterId)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake invoice details to protect financial ledger integrity!');
      return;
    }

    try {
      await addDoc(collection(db, 'financial_invoices'), {
        encounter_id: invoiceEncounterId,
        total_amount: service.unit_price * invoiceQuantity,
        status: 'Draft',
        created_at: serverTimestamp(),
        hospital_id,
        hospitalName: activeHospital?.name || '',
        departmentName: activeHospital?.department || '',
        hospitalId: Number(activeHospital?.hospital_unique_number || 0)
      });
      logSecurityEvent('CREATE_INVOICE', 'FinanceHub', `Invoice created for encounter: ${invoiceEncounterId}`);
      addToast('success', 'Invoice initiated successfully');
      setShowInvoiceModal(false);
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to initiate invoice');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-600 rounded-xl shadow-lg shadow-amber-200">
              <Wallet className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Finance Management Hub</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleGlobalCleanup}
              className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
              title="Financial Data Integrity Purge"
            >
              <ShieldAlert size={14} />
              Guard
            </button>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {[
              { id: 'Revenue', label: 'Income Hub', icon: TrendingUp },
              { id: 'Ledger', label: 'Patient Ledger', icon: DollarSign },
              { id: 'Cashier', label: 'Cashier Terminals', icon: CreditCard },
              { id: 'Audit', label: 'Auditor Logs', icon: FileText },
              { id: 'Analytics', label: 'Analytics', icon: PieChart },
              { id: 'Command', label: 'Command Center', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <button 
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800"
          >
            Initiate Invoice
          </button>
        </div>
        {activeTab === 'Ledger' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-6">Patient Ledger Balances</h4>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">MRN</th>
                  <th className="px-6 py-4">Billed</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgers.map(l => (
                  <tr key={l.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{maskMRN(l.patient_mrn)}</td>
                    <td className="px-6 py-4">{maskCurrency(l.total_billed)}</td>
                    <td className="px-6 py-4 text-emerald-600">{maskCurrency(l.total_paid)}</td>
                    <td className="px-6 py-4 font-black">{maskCurrency(l.current_balance)}</td>
                    <td className="px-6 py-4">
                      {l.current_balance > 500 ? (
                        <span className="flex items-center gap-1 text-rose-600 font-bold">
                          <AlertTriangle size={14} /> High Balance
                        </span>
                      ) : <span className="text-emerald-600">Current</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'Cashier' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-6">Daily Cash Reconciliation</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 uppercase">
                <span>Item</span>
                <span>Expected</span>
                <span>Actual</span>
                <span>Variance</span>
              </div>
              {['Cash', 'Digital', 'Insurance'].map(item => (
                <div key={item} className="grid grid-cols-4 gap-4 items-center">
                  <span className="font-bold text-slate-700">{item}</span>
                  <span className="text-slate-900">$0.00</span>
                  <input type="number" className="p-2 border rounded-lg" placeholder="Enter amount" />
                  <span className="text-rose-600 font-bold">$0.00</span>
                </div>
              ))}
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold mt-4">Submit Reconciliation</button>
            </div>
          </div>
        )}
        {activeTab === 'Audit' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
             <h4 className="font-bold text-slate-900 mb-6">Financial Audit Logs</h4>
             <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map(l => (
                  <tr key={l.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{l.table_name}</td>
                    <td className="px-6 py-4">{l.action_type}</td>
                    <td className="px-6 py-4">{l.changed_by}</td>
                    <td className="px-6 py-4">{new Date(l.changed_at?.seconds * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>
        )}
        {activeTab === 'Analytics' && (
          <FinanceAnalyticsEngine />
        )}
        {activeTab === 'Command' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
             <h4 className="font-bold text-slate-900 mb-6">Finance Command Center</h4>
             <div className="grid grid-cols-4 gap-4">
               {[
                 { label: 'Clean Claim Rate', val: '88%' },
                 { label: 'Denial Rate', val: '12%' },
                 { label: 'Avg Days to Pay', val: '45' },
                 { label: 'Top 5 Denied', val: 'C-002, A-005...' }
               ].map(m => (
                 <div key={m.label} className="p-4 bg-slate-50 rounded-xl border">
                   <p className="text-[10px] uppercase font-bold text-slate-500">{m.label}</p>
                   <p className="text-xl font-black text-slate-900 mt-1">{m.val}</p>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-900">Initiate New Invoice</h4>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Encounter ID</label>
                <input 
                  type="text" 
                  value={invoiceEncounterId}
                  onChange={(e) => setInvoiceEncounterId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Enter encounter ID"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service</label>
                <select
                  value={invoiceServiceId}
                  onChange={(e) => setInvoiceServiceId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.service_name} - ${s.unit_price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={invoiceQuantity}
                  onChange={(e) => setInvoiceQuantity(parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <button 
                onClick={handleInitiateInvoice}
                className="w-full p-3 bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-amber-700"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
