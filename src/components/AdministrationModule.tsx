import React, { useState } from 'react';
import { Building2, Calendar, ClipboardList, Activity, ArrowRight, Plus, FileText, CheckCircle2, Circle, Clock } from 'lucide-react';
import { logSecurityEvent } from '../lib/auditLogger';

interface AdministrationModuleProps {
  activeHospital: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function AdministrationModule({ activeHospital, addToast, setActiveTab }: AdministrationModuleProps) {
  const [activeSection, setActiveSection] = useState('board');

  const navItems = [
    { id: 'board', label: 'Hospital Board Lead', icon: Building2 },
    { id: 'manager', label: 'Chief Executive Office', icon: Activity },
    { id: 'medical', label: 'Medical Director Plans', icon: FileText },
    { id: 'nurse', label: 'Nurse Director Plans', icon: ClipboardList },
  ];

  const plans: any[] = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-emerald-500 w-5 h-5" />;
      case 'in-progress': return <Clock className="text-amber-500 w-5 h-5" />;
      default: return <Circle className="text-gray-300 w-5 h-5" />;
    }
  };

  const handleAddPlan = () => {
    logSecurityEvent('CREATE_ACTION_PLAN', 'AdministrationModule', `Hospital: ${activeHospital}`);
    addToast('success', 'Plan creation opened');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Module 2: Administration</h2>
          <p className="text-gray-500 mt-1">Manage hospital board activities, executive actions, and leadership planning.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Administration Sections</h3>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} className={activeSection === item.id ? 'text-indigo-600' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {navItems.find(i => i.id === activeSection)?.label} Action Plans
              </h3>
              <button 
                onClick={handleAddPlan}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                New Action Plan
              </button>
            </div>

            <div className="space-y-4">
              {plans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(plan.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{plan.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          plan.type === 'Yearly' ? 'bg-purple-100 text-purple-700' :
                          plan.type === 'Monthly' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {plan.type}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{plan.status.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                    <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
               <h3 className="text-md font-medium text-gray-900 mb-4">Recent Submissions</h3>
               <div className="bg-slate-50 rounded-lg p-6 text-center border border-dashed border-gray-200">
                 <ClipboardList className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                 <p className="text-sm text-gray-500">No recent submissions found for this section.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
