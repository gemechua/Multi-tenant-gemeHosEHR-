
import React, { useState } from 'react';
import { DollarSign, FileText, Clipboard, Activity, Search, Settings, Filter, PieChart, Briefcase, Folder, Calendar } from 'lucide-react';
import PaymentIncomeList from './PaymentIncomeList';
import PaymentWorkflowKanban from './PaymentWorkflowKanban';
import FinanceSettings from './FinanceSettings';
import FinanceInsights from './FinanceInsights';
import FiscalSnapshot from './FiscalSnapshot';
import FinancialCharts from './FinancialCharts';
import OverdueAlerts from './OverdueAlerts';
import PayrollManagement from './PayrollManagement';
import LanguageSelector from './LanguageSelector';

import FinanceFolder from './FinanceFolder';
import RecurringExpenses from './RecurringExpenses';
import BudgetManagement from './BudgetManagement';
import VendorList from './VendorList';
import PatientLaboratoryPaymentForm from './PatientLaboratoryPaymentForm';

interface Module8FinancePaymentsProps {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function Module8FinancePayments({ activeHospital, addToast }: Module8FinancePaymentsProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Payments' | 'Workflows' | 'Payroll' | 'Settings' | 'Folder' | 'Recurring' | 'Budget' | 'Vendors' | 'LabPayments'>('Overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState(['English']);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', category: 'All' });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <DollarSign className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Finance & Payments</h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Payment income & workflow management</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search payments..." 
              className="pl-9 pr-4 py-2 border rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto max-w-full">
            {[
              { id: 'Overview', label: 'Overview', icon: PieChart },
              { id: 'Payments', label: 'Payments', icon: DollarSign },
              { id: 'Workflows', label: 'Workflows', icon: Clipboard },
              { id: 'Payroll', label: 'Payroll', icon: Briefcase },
              { id: 'LabPayments', label: 'Lab Payments', icon: Activity },
              { id: 'Folder', label: 'F-FN', icon: Folder },
              { id: 'Recurring', label: 'Recurring', icon: Calendar },
              { id: 'Budget', label: 'Budget', icon: DollarSign },
              { id: 'Vendors', label: 'Vendors', icon: Search },
              { id: 'Settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showFilters && activeTab === 'Payments' && (
            <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
                <h4 className="font-bold text-xs uppercase text-slate-500">Filters</h4>
                {['type', 'status', 'category'].map(key => (
                    <div key={key}>
                        <label className="text-[10px] font-bold uppercase text-slate-400">{key}</label>
                        <select className="w-full p-2 border rounded text-xs" value={filters[key as keyof typeof filters]} onChange={(e) => setFilters({...filters, [key]: e.target.value})}>
                            <option value="All">All {key}s</option>
                            {key === 'category' && (
                                <>
                                    <option value="Patient">Patient</option>
                                    <option value="Staff">Staff</option>
                                </>
                            )}
                        </select>
                    </div>
                ))}
                <div className="pt-4 border-t">
                    <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">Language</h4>
                    <LanguageSelector selectedLanguages={selectedLanguages} onChange={setSelectedLanguages} />
                </div>
            </div>
        )}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <FiscalSnapshot />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <FinancialCharts />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <OverdueAlerts />
                    </div>
                </div>
            )}
            {activeTab === 'Payments' && (
                <>
                    <FinanceInsights />
                    <button onClick={() => setShowFilters(!showFilters)} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Filter size={14}/> Toggle Filters</button>
                    <PaymentIncomeList searchTerm={searchTerm} filters={filters} selectedLanguages={selectedLanguages} />
                </>
            )}
            {activeTab === 'Workflows' && <PaymentWorkflowKanban selectedLanguages={selectedLanguages} />}
            {activeTab === 'Payroll' && <PayrollManagement addToast={addToast} />}
            {activeTab === 'LabPayments' && (
              <div className="max-w-4xl mx-auto py-12">
                <PatientLaboratoryPaymentForm activeHospital={activeHospital} addToast={addToast} />
              </div>
            )}
            {activeTab === 'Folder' && <FinanceFolder />}
            {activeTab === 'Recurring' && <RecurringExpenses />}
            {activeTab === 'Budget' && <BudgetManagement />}
            {activeTab === 'Vendors' && <VendorList />}
            {activeTab === 'Settings' && <FinanceSettings />}
        </div>
      </div>
    </div>
  );
}
