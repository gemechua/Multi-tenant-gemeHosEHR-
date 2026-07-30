import React, { useState } from 'react';
import { 
  Zap, Play, Plus, Trash2, Edit3, Clock, Settings, AlertCircle, 
  CheckCircle2, ArrowRight, Bot, Sparkles, Database, MessageSquare, 
  Activity, FileText, Check, Copy, PlusCircle, Sliders, UserCheck, 
  HeartPulse, HelpCircle, ChevronRight, RefreshCw, Layers
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  status: 'Active' | 'Inactive';
  lastExecuted: string;
  executionCount: number;
}

const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'High-Risk Diabetic Outreach',
    description: 'Triggers when a glucose lab result exceeds critical thresholds. Automatically alerts care coordinators and schedules wellness outreach.',
    trigger: 'On Lab Observation Released',
    condition: 'Value Quantity > 125 mg/dL',
    action: 'Queue Outpatient Wellness Outreach via Outreach Coordinator',
    status: 'Active',
    lastExecuted: '2026-06-24 14:12:05',
    executionCount: 28
  },
  {
    id: 'rule-2',
    name: 'Post-Discharge Claims Audit',
    description: 'Once a clinical encounter terminates, pipe the recorded ICD-10 diagnostic codes through the billing compliance auditor agent.',
    trigger: 'On Encounter Finished',
    condition: 'Encounter Class is Outpatient/Ambulatory',
    action: 'Dispatch Audit Log to ICD-10 Billing Compliance Auditor',
    status: 'Active',
    lastExecuted: '2026-06-24 13:45:50',
    executionCount: 142
  },
  {
    id: 'rule-3',
    name: 'New Patient Onboarding Flow',
    description: 'Triggers on patient profile registration. Synchronizes local hospital nodes and sends friendly intake guides.',
    trigger: 'On Patient Registered',
    condition: 'Patient has mobile number listed',
    action: 'Send Welcome Intake SMS & Push FHIR to EHR cluster',
    status: 'Active',
    lastExecuted: '2026-06-24 14:28:11',
    executionCount: 94
  },
  {
    id: 'rule-4',
    name: 'Metformin Prescription Review',
    description: 'Fires when Metformin is requested. Inspects historic renal function lab work for safety clearances.',
    trigger: 'On Medication Prescribed',
    condition: 'Medication display includes Metformin',
    action: 'Query EGFR lab tests & cross-verify safety tolerances',
    status: 'Inactive',
    lastExecuted: '2026-06-22 10:05:12',
    executionCount: 19
  }
];

export default function AutomationsTab() {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Rule builder form states
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('On Lab Observation Released');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleAction, setNewRuleAction] = useState('Queue Outpatient Wellness Outreach via Outreach Coordinator');

  // Interactive Simulator States
  const [selectedSimRule, setSelectedSimRule] = useState<AutomationRule>(rules[0]);
  const [simPatientName, setSimPatientName] = useState('Sample Patient');
  const [simValueInput, setSimValueInput] = useState('142 mg/dL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationStep, setSimulationStep] = useState<number>(0);

  // Stats Counters
  const totalExecutions = rules.reduce((acc, curr) => acc + curr.executionCount, 0);
  const activeCount = rules.filter(r => r.status === 'Active').length;

  const handleToggleRuleStatus = (id: string) => {
    setRules(prev => prev.map(rule => {
      if (rule.id === id) {
        const nextStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
        return { ...rule, status: nextStatus };
      }
      return rule;
    }));
  };

  const handleDeleteRule = (id: string) => {
    if (confirm("Are you sure you want to delete this clinical automation rule?")) {
      setRules(prev => prev.filter(rule => rule.id !== id));
      if (selectedSimRule.id === id && rules.length > 1) {
        setSelectedSimRule(rules.find(r => r.id !== id) || rules[0]);
      }
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleCondition.trim()) {
      alert("Please provide a rule name and specify logical conditions.");
      return;
    }

    const createdRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      description: newRuleDesc || 'Custom automated routing rule matching custom trigger parameters.',
      trigger: newRuleTrigger,
      condition: newRuleCondition,
      action: newRuleAction,
      status: 'Active',
      lastExecuted: 'Never',
      executionCount: 0
    };

    setRules(prev => [createdRule, ...prev]);
    setShowCreateModal(false);
    
    // Reset form
    setNewRuleName('');
    setNewRuleDesc('');
    setNewRuleTrigger('On Lab Observation Released');
    setNewRuleCondition('');
    setNewRuleAction('Queue Outpatient Wellness Outreach via Outreach Coordinator');
  };

  const runSimulationTest = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationLogs([]);

    const eventTime = new Date().toLocaleTimeString();
    
    // Step by step log injection
    const steps = [
      `[${eventTime}] 🚀 AUTOMATION ENGINE TRIGGERED: "${selectedSimRule.trigger}" detected.`,
      `[${eventTime}] 🔍 Extracting context: Patient="${simPatientName}", Variable="${simValueInput}"`,
      `[${eventTime}] ⚙️ Evaluating condition: [${selectedSimRule.condition}] on incoming payload...`,
      `[${eventTime}] ✅ Logical Verification: CONDITION MATCHED (Target complies with parameters).`,
      `[${eventTime}] ⚡ Dispatching Action node: "${selectedSimRule.action}"`,
      `[${eventTime}] 📱 Syncing downstream EHR networks - Transmitted FHIR r4 packet.`,
      `[${eventTime}] 🎉 AUTOMATION SUCCESSFUL: Workflow pipeline complete in 184ms.`
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        setSimulationLogs(prev => [...prev, steps[currentIdx]]);
        setSimulationStep(currentIdx + 1);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        // Increment execution count of simulated rule
        setRules(prev => prev.map(rule => {
          if (rule.id === selectedSimRule.id) {
            return {
              ...rule,
              executionCount: rule.executionCount + 1,
              lastExecuted: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
          }
          return rule;
        }));
      }
    }, 450);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12" id="automations_page_root">
      
      {/* Banner / Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Zap size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600 block mb-0.5">
                  Workflow Orchestrator
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Clinical Event Automations
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Construct logical trigger-condition-action pipelines that instantly synchronize patient actions, automate coordinator text message outreach, and coordinate with clinical billing and AI auditing loops.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>New Automation Rule</span>
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Zap size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Pipelines</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-950">{activeCount}</span>
              <span className="text-xs text-gray-400">of {rules.length} configured</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Activity size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Trigger Events</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-950">{totalExecutions}</span>
              <span className="text-xs text-teal-600 font-bold">100% Delivery</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Avg Execution Delay</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-950">148 ms</span>
              <span className="text-xs text-gray-400">Local Sandbox Loop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Rules list & Sandbox Playground simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Span 7: Configured Automation Pipelines */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Layers size={13} />
            <span>Configured Automation Pipelines</span>
          </h3>

          <div className="space-y-3">
            {rules.map((rule) => {
              const isActive = rule.status === 'Active';
              return (
                <div 
                  key={rule.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all relative ${
                    isActive 
                      ? 'border-gray-200 hover:border-gray-300' 
                      : 'border-gray-150 bg-gray-50/20 opacity-80'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-gray-950">{rule.name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {rule.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleRuleStatus(rule.id)}
                        className={`p-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          isActive 
                            ? 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200' 
                            : 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
                        }`}
                        title={isActive ? "Disable Pipeline" : "Enable Pipeline"}
                      >
                        <Zap size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 border border-gray-200 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Flow pipeline diagram connector */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] bg-gray-50/50 p-3 rounded-xl border border-gray-200/50 font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">1. TRIGGER</span>
                      <span className="text-gray-800 truncate block font-bold" title={rule.trigger}>
                        {rule.trigger}
                      </span>
                    </div>

                    <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-gray-150 md:pl-3 pt-2 md:pt-0">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">2. IF CONDITION</span>
                      <span className="text-gray-800 truncate block font-bold" title={rule.condition}>
                        {rule.condition}
                      </span>
                    </div>

                    <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-gray-150 md:pl-3 pt-2 md:pt-0">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">3. DISPATCH ACTION</span>
                      <span className="text-amber-700 truncate block font-bold" title={rule.action}>
                        {rule.action}
                      </span>
                    </div>
                  </div>

                  {/* Execute Count & Footer */}
                  <div className="mt-3.5 flex justify-between items-center text-[10px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <Activity size={11} className="text-gray-400 shrink-0" />
                      <span>Executed <strong>{rule.executionCount}</strong> times</span>
                    </div>

                    <div>
                      <span>Last: {rule.lastExecuted}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Span 5: Live Pipeline Simulation Sandbox */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Play size={13} />
            <span>Interactive Simulator Workspace</span>
          </h3>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-gray-100 pb-3">
              <h4 className="font-extrabold text-sm text-gray-950">Workflow Dispatch Simulator</h4>
              <p className="text-xs text-gray-400">Test how the orchestrator evaluates pipelines against patient records.</p>
            </div>

            {/* Form selectors */}
            <div className="space-y-3 text-xs">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Pipeline Target</label>
                <select
                  value={selectedSimRule.id}
                  onChange={(e) => {
                    const found = rules.find(r => r.id === e.target.value);
                    if (found) {
                      setSelectedSimRule(found);
                      setSimulationLogs([]);
                      setSimulationStep(0);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-bold text-gray-800 cursor-pointer"
                >
                  {rules.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Simulate Patient</label>
                  <input
                    type="text"
                    value={simPatientName}
                    onChange={(e) => setSimPatientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Trigger Value Indicator</label>
                  <input
                    type="text"
                    value={simValueInput}
                    onChange={(e) => setSimValueInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-semibold"
                    placeholder="e.g. 135 mg/dL"
                  />
                </div>
              </div>

              {/* Action Trigger */}
              <button
                onClick={runSimulationTest}
                disabled={isSimulating}
                className="w-full py-2.5 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Executing Pipeline Diagnostics...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    <span>Trigger Automated Test Run</span>
                  </>
                )}
              </button>
            </div>

            {/* Diagnostic Log console Output */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Sandbox Log Stream</span>
                <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider">Live</span>
              </div>

              <div className="h-44 p-4 rounded-xl bg-gray-950 border border-gray-900 font-mono text-[10.5px] leading-relaxed text-gray-200 space-y-1.5 overflow-y-auto">
                {simulationLogs.length === 0 ? (
                  <p className="text-gray-500 italic text-center pt-12">Click "Trigger Automated Test Run" to output dynamic clinical event logs.</p>
                ) : (
                  simulationLogs.map((log, index) => (
                    <div key={index} className="flex gap-1.5 items-start">
                      <span className="text-teal-500 font-bold shrink-0">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Step visualization indicator */}
            {simulationStep > 0 && (
              <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-bold uppercase tracking-wide pt-1 animate-fadeIn">
                <div className={`py-1 rounded ${simulationStep >= 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                  Trigger
                </div>
                <div className={`py-1 rounded ${simulationStep >= 3 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                  Verify
                </div>
                <div className={`py-1 rounded ${simulationStep >= 5 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                  Action
                </div>
                <div className={`py-1 rounded ${simulationStep >= 6 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                  Sync
                </div>
                <div className={`py-1 rounded ${simulationStep >= 7 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                  Done
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* RULE BUILDER DRAWER/MODAL POPUP */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="create_automation_modal_overlay">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full shadow-2xl overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Zap size={16} />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-950 tracking-tight">Create Automation Pipeline</h3>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRule} className="p-6 space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rule Identifier Name</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Critical Renal Health Triage"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Specify clinical purpose and targeted coordinator networks..."
                  className="w-full h-16 p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold resize-none block"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">1. Event Trigger</label>
                  <select
                    value={newRuleTrigger}
                    onChange={(e) => setNewRuleTrigger(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="On Lab Observation Released">On Lab Observation Released</option>
                    <option value="On Patient Registered">On Patient Registered</option>
                    <option value="On Encounter Finished">On Encounter Finished</option>
                    <option value="On Medication Prescribed">On Medication Prescribed</option>
                    <option value="On Billing Ledger Added">On Billing Ledger Added</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">2. Logical Condition</label>
                  <input
                    type="text"
                    required
                    value={newRuleCondition}
                    onChange={(e) => setNewRuleCondition(e.target.value)}
                    placeholder="e.g. EGFR < 60 mL/min"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">3. Action Node Dispatch</label>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer"
                >
                  <option value="Queue Outpatient Wellness Outreach via Outreach Coordinator">Queue Outpatient Wellness Outreach</option>
                  <option value="Dispatch Audit Log to ICD-10 Billing Compliance Auditor">Dispatch Audit to Billing Auditor</option>
                  <option value="Send Welcome Intake SMS & Push FHIR to EHR cluster">Send Welcome SMS & Push FHIR</option>
                  <option value="Query EGFR lab tests & cross-verify safety tolerances">Query Renal safety tolerances</option>
                  <option value="Post FHIR Bundle to downstream Partner Referral Hospital">Post FHIR Bundle to Referral Network</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 bg-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Save Active Pipeline
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
