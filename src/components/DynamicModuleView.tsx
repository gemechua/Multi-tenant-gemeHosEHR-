import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logSecurityEvent } from '../lib/auditLogger';
import { FileText, Plus, Save, Clock, Trash2, CheckCircle2, Database, Mic, MicOff, LogOut, ShieldCheck, ArrowLeft } from 'lucide-react';

import DHIS2ServiceLayer from './DHIS2ServiceLayer';
import { InsuranceDashboard } from './InsuranceDashboard';
import { LaboratoryDashboard } from './LaboratoryDashboard';
import { DispensaryDashboard } from './DispensaryDashboard';
import { LiaisonDashboard } from './LiaisonDashboard';
import { ProcedurePaymentDashboard } from './ProcedurePaymentDashboard';
import PersonnelClockIn from './PersonnelClockIn';
import Module3HealthService from './Module3HealthService';
import Module4QualityImprovement from './Module4QualityImprovement';
import Module5EnvironmentalHealth from './Module5EnvironmentalHealth';
import Module9FacilityHub from './Module9FacilityHub';
import Module1PerformanceIS from './Module1PerformanceIS';
import Module11PharmacyHub from './Module11PharmacyHub';
import Module12SecurityHub from './Module12SecurityHub';
import AssessmentAuditTool from './AssessmentAuditTool';
import MonthlyReportTable from './MonthlyReportTable';
import HospitalIntakeDashboard from './HospitalIntakeDashboard';
import ModulePasscodeModal from './ModulePasscodeModal';
import { MONTHLY_REPORTS_SCHEMA } from '../data/monthlyReportSchema';

import { Language, translate } from '../lib/translations';

interface DynamicModuleViewProps {
  activeTab: string;
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  setActiveTab: (tab: string) => void;
  currentLanguage?: Language;
}

const MODULE_FORMS: Record<string, string[]> = {
  'Module 1: Performance IS': [
    'Global Hospital KPI Dashboard',
    'Unit Performance Heatmap',
    'Strategic Alignment Score',
    'Resource Optimization Insights'
  ],
  'Module 2: Administration': [
    'Hospital Board lead',
    'Add new yearly, monthly action plan',
    'Chief executive office (manager activity)',
    'Add new yearly, monthly, daily action plan',
    'Add new yearly, monthly, daily action plan for medical director',
    'Add new yearly, monthly, daily action plan for nurse director'
  ],
  'Module 3: Health Service IS': [
    'Consolidated 33-Format Hub',
    'Add new yearly, monthly, daily action plan',
    'Service Assessment (Ch 1-23)',
    'KPI for all hospital service unit activities',
    'Monthly report for all hospital service unit activities',
    'Generate monthly report sent to DHIS2',
    'Notification daily activities summary',
    ...Object.values(MONTHLY_REPORTS_SCHEMA).map(f => `Monthly report format ${f.id}: ${f.title}`)
  ],
  'Module 4: Quality Improvement': [
    'Hospital Quality Assessment (Ch 1-23)',
    'Add new yearly, monthly, daily action plan',
    'All quality unit activities',
    'Chart Audit',
    'Death Audit',
    'Service Audit',
    'All services Audit'
  ],
  'Module 5: Environmental Health': [
    'Environmental health',
    'Add new yearly, monthly, daily action plan',
    'Cash audit',
    'Infection prevention control IPC',
    'Food service audit',
    'Cleaner monitoring'
  ],
  'Module 9: Facility Equipment': [
    'Add new yearly, monthly, daily action plan',
    'Add all activities facility manager',
    'Add any damaged and non-functional equipment maintained'
  ],
  'Module 10: Bio Medical': [
    'Add new yearly, monthly, daily action plan',
    'Add non-functional',
    'Add functional'
  ],
  'Module 11: Pharmacy': [
    'Add dispensary prescribing',
    'Add dispensary monitoring',
    'Add inventory',
    'Add drug stock out monitoring',
    'Add purchased drug stock out monitoring',
    'Add auditory drug stock out monitoring'
  ],
  'Module 12: Security Guard': [
    'Duty program shift',
    'Daily report'
  ]
};

export default function DynamicModuleView({ activeTab, activeHospital, addToast, setActiveTab, currentLanguage = 'en' }: DynamicModuleViewProps) {
  const SECURE_MODULES = [
    'Module 3: Health Service IS',
    'Module 4: Quality Improvement',
    'Module 5: Environmental Health',
    'Module 9: Facility Equipment',
    'Module 10: Bio Medical',
    'Module 11: Pharmacy',
    'Module 12: Security Guard'
  ];

  const requiresAuth = SECURE_MODULES.includes(activeTab);
  const storageKey = `module_authenticated_${activeTab.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const [moduleAuth, setModuleAuth] = useState<'authenticated' | 'skipped' | null>(() => {
    if (!requiresAuth) return 'authenticated';
    return localStorage.getItem(storageKey) === 'true' ? 'authenticated' : null;
  });

  useEffect(() => {
    if (SECURE_MODULES.includes(activeTab)) {
      if (localStorage.getItem(`module_authenticated_${activeTab.replace(/[^a-zA-Z0-9]/g, '_')}`) === 'true') {
        setModuleAuth('authenticated');
      } else {
        setModuleAuth(null);
      }
    } else {
      setModuleAuth('authenticated');
    }
  }, [activeTab]);

  const forms = MODULE_FORMS[activeTab] || [];
  const [selectedForm, setSelectedForm] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState<string | null>(null);

  const toggleVoice = (field: string) => {
    if (isListening === field) {
      setIsListening(null);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      addToast('error', 'Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(field);
    recognition.onend = () => setIsListening(null);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (field === 'description' || field === 'remarks') {
        setFormData(prev => ({ 
          ...prev, 
          [field]: (prev[field as 'description' | 'remarks'] ? prev[field as 'description' | 'remarks'] + ' ' : '') + text 
        }));
      }
    };
    recognition.onerror = () => setIsListening(null);

    recognition.start();
  };

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    setSelectedForm(forms[0] || '');
  }, [activeTab, forms]);

  useEffect(() => {
    if (selectedForm && moduleAuth !== null) {
      setFormData(prev => ({ ...prev, title: selectedForm }));
      fetchSubmissions();
    }
  }, [selectedForm, activeTab, moduleAuth]);

  const fetchSubmissions = async () => {
    if (moduleAuth === 'skipped') {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const collectionName = selectedForm === 'For all employment attendance monitoring' 
        ? 'hr_attendance_registry' 
        : 'dynamic_modules_submissions';
      
      // Re-writing query logic to be cleaner and handle HR specially
      let hrQuery;
      if (selectedForm === 'For all employment attendance monitoring') {
        hrQuery = query(
          collection(db, 'hr_attendance_registry'),
          where('hospital_id', '==', activeHospital?.hospital_unique_number || 'TENANT-ID')
        );
      } else {
        hrQuery = query(
          collection(db, 'dynamic_modules_submissions'),
          where('moduleName', '==', activeTab),
          where('formName', '==', selectedForm),
          where('hospital_id', '==', activeHospital?.hospital_unique_number || 'TENANT-ID')
        );
      }

      const snap = await getDocs(hrQuery);
      const list = snap.docs.map(doc => {
        const data = doc.data() as any;
        if (selectedForm === 'For all employment attendance monitoring') {
          return {
            id: doc.id,
            data: {
              date: data.timestamp?.toDate ? data.timestamp.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: 'Completed',
              description: `Attendance: ${data.employeeName} (${data.employeeId}) ${data.action?.replace('-', ' ') || 'activity'} recorded. Identity verified via camera/mic/biometrics.`,
              remarks: data.location?.lat ? `Verified at GPS: ${data.location.lat.toFixed(3)}, ${data.location.lon.toFixed(3)}` : (data.audioVerified ? 'Audio verification successful' : 'Identity verified'),
              photo: data.photo,
              timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
            }
          };
        }
        return { id: doc.id, ...data, createdAt: data.createdAt };
      });
      
      if (selectedForm === 'For all employment attendance monitoring') {
        list.sort((a: any, b: any) => b.data.timestamp - a.data.timestamp);
      } else {
        list.sort((a: any, b: any) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
      }
      setSubmissions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'dynamic_modules_submissions'), {
        moduleName: activeTab,
        formName: selectedForm,
        data: formData,
        hospital_id: activeHospital?.hospital_unique_number || 'TENANT-ID',
        createdAt: serverTimestamp()
      });
      
      await logSecurityEvent('CREATE_SUBMISSION', `dynamic_modules_submissions`, `Module: ${activeTab}, Form: ${selectedForm}`);
      
      addToast('success', `${selectedForm} submitted successfully`);
      setFormData({
        title: selectedForm,
        description: '',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to submit form');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record? This action will be logged for security audit.')) return;
    try {
      await deleteDoc(doc(db, 'dynamic_modules_submissions', id));
      await logSecurityEvent('DELETE_SUBMISSION', `dynamic_modules_submissions/${id}`, `Module: ${activeTab}`);
      addToast('info', 'Record deleted');
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      {requiresAuth && !moduleAuth && (
        <ModulePasscodeModal
          moduleName={activeTab}
          onSuccess={() => setModuleAuth('authenticated')}
          onSkip={() => setModuleAuth('skipped')}
          onCancel={() => setActiveTab('Dashboard')}
          addToast={addToast}
        />
      )}

      {/* Module Session Action Header with Logout button */}
      {requiresAuth && moduleAuth && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-slate-400 font-medium">Dynamic Module Session:</span>
            <strong className="text-white font-extrabold uppercase tracking-wide">{translate(activeTab, currentLanguage)}</strong>
            {moduleAuth === 'skipped' ? (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-amber-500/30">
                Preview Mode
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-emerald-500/30">
                Passcode Verified
              </span>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.removeItem(storageKey);
              localStorage.removeItem(`${storageKey}_user`);
              setModuleAuth(null);
              addToast('info', `Logged out of ${activeTab}. Sign in or sign up required.`);
            }}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            title={`Sign Out & Log Out of ${activeTab}`}
          >
            <LogOut size={13} />
            <span>Log Out {activeTab}</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>
          <p className="text-gray-500 mt-1">Manage forms and activities for this module.</p>
        </div>
        {activeTab !== 'Module 12: Security Guard' && (
          <button
            onClick={() => {
              sessionStorage.setItem('explorer_initial_entity', 'Form_1_1_1_2');
              setActiveTab('Data & Explorer');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <Database size={16} />
            Return to Data Explorer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Module Forms</h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
              <button
                onClick={() => setSelectedForm('')}
                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedForm === ''
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                }`}
              >
                Dashboard Overview
              </button>
              {forms.map(form => (
                <button
                  key={form}
                  onClick={() => setSelectedForm(form)}
                  className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedForm === form
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  {form}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedForm === '' ? (
            <HospitalIntakeDashboard 
              activeHospital={activeHospital} 
              forms={forms} 
              onSelectForm={setSelectedForm} 
            />
          ) : (
            <>
              <button
                onClick={() => setSelectedForm('')}
                className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText size={18} className="text-indigo-600" />
                      {selectedForm} Intake
                    </span>
                    <button 
                      onClick={() => setSelectedForm('')}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Back to Dashboard
                    </button>
                  </h3>
                </div>
                
                {selectedForm === 'Health insurance service monitoring' ? (
              <InsuranceDashboard />
            ) : selectedForm === 'Add new yearly, monthly, daily action plan' && activeTab === 'Module 4: Quality Improvement' ? (
              <Module4QualityImprovement 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : activeTab === 'Module 5: Environmental Health' && 
                ['Environmental health', 'Infection prevention control IPC', 'Food service audit', 'Cleaner monitoring'].includes(selectedForm) ? (
              <Module5EnvironmentalHealth 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : activeTab === 'Module 9: Facility Equipment' && 
                ['Add all activities facility manager', 'Add any damaged and non-functional equipment maintained'].includes(selectedForm) ? (
              <Module9FacilityHub 
                activeHospital={activeHospital} 
                addToast={addToast} 
                type="Facility"
              />
            ) : activeTab === 'Module 10: Bio Medical' && 
                ['Add non-functional', 'Add functional'].includes(selectedForm) ? (
              <Module9FacilityHub 
                activeHospital={activeHospital} 
                addToast={addToast} 
                type="Biomedical"
              />
            ) : activeTab === 'Module 12: Security Guard' && 
                ['Duty program shift', 'Daily report'].includes(selectedForm) ? (
              <Module12SecurityHub 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : activeTab === 'Module 1: Performance IS' ? (
              <Module1PerformanceIS 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : activeTab === 'Module 11: Pharmacy' && 
                ['Add inventory', 'Add drug stock out monitoring', 'Add purchased drug stock out monitoring', 'Add auditory drug stock out monitoring', 'Add dispensary prescribing', 'Add dispensary monitoring'].includes(selectedForm) ? (
              <Module11PharmacyHub 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : selectedForm === 'Service Assessment (Ch 1-23)' || selectedForm === 'Hospital Quality Assessment (Ch 1-23)' ? (
              <AssessmentAuditTool 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : selectedForm === 'Consolidated 33-Format Hub' ? (
              <Module3HealthService 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            ) : selectedForm?.startsWith('Monthly report format ') ? (
              (() => {
                const idMatch = selectedForm.match(/format (\d+):/);
                const formatId = idMatch ? parseInt(idMatch[1]) : null;
                return formatId ? (
                  <MonthlyReportTable 
                    formatId={formatId} 
                    activeHospital={activeHospital} 
                    addToast={addToast} 
                  />
                ) : <div>Select a format</div>;
              })()
            ) : activeTab === 'Laboratory' ? (
              <LaboratoryDashboard activeHospital={activeHospital} addToast={addToast} />
            ) : activeTab === 'Dispensary' ? (
              <DispensaryDashboard activeHospital={activeHospital} addToast={addToast} />
            ) : activeTab === 'Liaison' ? (
              <LiaisonDashboard activeHospital={activeHospital} addToast={addToast} />
            ) : activeTab === 'Procedure Payment' ? (
              <ProcedurePaymentDashboard activeHospital={activeHospital} addToast={addToast} />
            ) : selectedForm === 'Generate monthly report sent to DHIS2' ? (
              <DHIS2ServiceLayer 
                activeHospital={activeHospital} 
                addToast={addToast} 
                onSuccess={fetchSubmissions} 
              />
            ) : selectedForm === 'For all employment attendance monitoring' ? (
              <PersonnelClockIn 
                activeHospital={activeHospital} 
                addToast={addToast} 
                onSuccess={fetchSubmissions} 
              />
            ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                  <span>Description / Details</span>
                  <button 
                    type="button"
                    onClick={() => toggleVoice('description')}
                    className={`p-1 rounded-full transition-colors ${isListening === 'description' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Dictate description"
                  >
                    {isListening === 'description' ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed information here..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                  <span>Remarks</span>
                  <button 
                    type="button"
                    onClick={() => toggleVoice('remarks')}
                    className={`p-1 rounded-full transition-colors ${isListening === 'remarks' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Dictate remarks"
                  >
                    {isListening === 'remarks' ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                </label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional remarks"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save size={18} />
                  Save Record
                </button>
              </div>
            </form>
            )}
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
}
