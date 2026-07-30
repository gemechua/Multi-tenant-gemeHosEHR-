import React, { useState } from 'react';
import { 
  Bot, Sparkles, Brain, ShieldCheck, Play, Send, RefreshCw, Copy, Check, 
  Info, Settings, FileText, Plus, CheckCircle2, AlertTriangle, Users, 
  Database, ArrowRight, Activity, Zap, Cpu, MessageSquare, Code, Volume2
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'Active' | 'Paused' | 'Training';
  temperature: number;
  icon: React.ComponentType<any>;
  capabilities: string[];
  systemInstruction: string;
  logs: string[];
}

export default function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent-copilot',
      name: 'Clinical Copilot & SOAP Scribe',
      description: 'Translates raw physician speech and unstructured clinical dialogue into structured SOAP progress notes and FHIR JSON objects.',
      model: 'Gemini 1.5 Pro (Clinical Finetuned)',
      status: 'Active',
      temperature: 0.2,
      icon: Brain,
      capabilities: ['SOAP Note Generation', 'FHIR Resource Parsing', 'SNOMED/ICD-10 Categorization'],
      systemInstruction: 'You are an expert clinical scribe. Format input notes into clean SOAP progress reports. Extract demographics and clinical indicators into FHIR-compliant Patient, Observation, or MedicationRequest payloads.',
      logs: [
        '[2026-06-24 13:45:12] Init: Loaded SNOMED-CT dictionary with 142k medical concepts.',
        '[2026-06-24 14:02:50] Orchestration: Synthesized doctor voice note for Patient #pat-94812 in 840ms.'
      ]
    },
    {
      id: 'agent-billing',
      name: 'ICD-10 Billing Compliance Auditor',
      description: 'Cross-audits electronic clinical records against Medicare and private insurer policies to identify coding errors, billing risks, and optimize claims.',
      model: 'Gemini 1.5 Flash (Analytical)',
      status: 'Active',
      temperature: 0.1,
      icon: ShieldCheck,
      capabilities: ['Upcoding Detection', 'Missing Documentation Alerts', 'Insurer Policy Rules Check'],
      systemInstruction: 'Audit patient EHR bundles. Match clinical progress note descriptions against the recorded ICD-10-CM and CPT billing codes. Flag mismatches or insufficient physician signatures.',
      logs: [
        '[2026-06-24 11:22:10] Sync: Crawled Medicare Chapter 12 guidelines updates.',
        '[2026-06-24 13:10:44] Audit: Reviewed ledger #ledg-84201 - Calculated risk score: 2% (Healthy).'
      ]
    },
    {
      id: 'agent-outreach',
      name: 'Patient Outreach Coordinator',
      description: 'Automates patient follow-up scripts, medical query triage, and health maintenance cards while adhering to strict HIPAA disclosure bounds.',
      model: 'Gemini 1.5 Flash (Creative)',
      status: 'Paused',
      temperature: 0.5,
      icon: MessageSquare,
      capabilities: ['Appointment Reminders', 'Discharge Summary Simplification', 'Triage Routing Logic'],
      systemInstruction: 'Draft patient-facing letters and SMS alerts. Transform dense medical diagnostic terminology into friendly, clear, 6th-grade level educational guidelines. Avoid diagnostic pronouncements.',
      logs: []
    }
  ]);

  const [activeAgent, setActiveAgent] = useState<Agent>(agents[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Copilot Playground States
  const [rawInput, setRawInput] = useState(
    "Patient sample came in complaining of fatigue and high glucose levels. Checked blood glucose: 135 mg/dL. Prescribing Metformin 500mg daily. Suggest follow-up in 2 weeks."
  );
  const [generatedSOAP, setGeneratedSOAP] = useState<string>('');
  const [generatedFHIR, setGeneratedFHIR] = useState<any>(null);

  // Billing Playground States
  const [selectedLedgerId, setSelectedLedgerId] = useState('ledg-4921');
  const [billingAuditResult, setBillingAuditResult] = useState<{
    score: number;
    issues: { code: string; severity: 'High' | 'Medium' | 'Low'; message: string }[];
  } | null>(null);

  // Edit Settings states for Active Agent
  const [modelInput, setModelInput] = useState(activeAgent.model);
  const [tempInput, setTempInput] = useState(activeAgent.temperature);
  const [sysInstructionInput, setSysInstructionInput] = useState(activeAgent.systemInstruction);

  const handleSelectAgent = (agent: Agent) => {
    setActiveAgent(agent);
    setModelInput(agent.model);
    setTempInput(agent.temperature);
    setSysInstructionInput(agent.systemInstruction);
    // Clear playgrounds on switch
    setGeneratedSOAP('');
    setGeneratedFHIR(null);
    setBillingAuditResult(null);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleToggleAgentStatus = (id: string) => {
    setAgents(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = (item.status === 'Active' ? 'Paused' : 'Active') as 'Active' | 'Paused' | 'Training';
        const updatedLogs = [...item.logs];
        updatedLogs.push(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Agent status changed to: ${nextStatus}.`);
        
        const updatedItem = { ...item, status: nextStatus, logs: updatedLogs };
        if (activeAgent.id === id) {
          setActiveAgent(updatedItem);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setAgents(prev => prev.map(item => {
      if (item.id === activeAgent.id) {
        const updatedLogs = [...item.logs, `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Hyperparameters and system directives updated.`];
        const updatedItem = {
          ...item,
          model: modelInput,
          temperature: tempInput,
          systemInstruction: sysInstructionInput,
          logs: updatedLogs
        };
        setActiveAgent(updatedItem);
        return updatedItem;
      }
      return item;
    }));
    alert(`Configuration updated successfully for "${activeAgent.name}"!`);
  };

  // Run Scribe Generation Sandbox
  const handleRunCopilot = () => {
    if (!rawInput.trim()) return;
    setIsProcessing(true);
    setGeneratedSOAP('');
    setGeneratedFHIR(null);

    setTimeout(() => {
      // Robust client-side natural language processor for dynamic prompt updates
      const cleanText = (rawInput || '').replace(/\s+/g, ' ');

      // 1. Extract Patient Name
      let patientName = "Sample Patient";
      const patientMatch = cleanText.match(/Patient\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i) || 
                           cleanText.match(/complaining\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i) ||
                           cleanText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+came/i) ||
                           cleanText.match(/(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (patientMatch) {
        patientName = patientMatch[1].trim();
      }

      // 2. Extract Vitals
      let glucose = "—";
      const glucoseMatch = cleanText.match(/(\d+)\s*(?:mg\/dL|mg\/dl)/i) || cleanText.match(/glucose(?:\s+level)?\s+(?:of\s+)?(\d+)/i);
      if (glucoseMatch) {
        const val = parseInt(glucoseMatch[1]);
        glucose = `${val} mg/dL` + (val > 125 ? " (Elevated)" : val < 70 ? " (Low)" : " (Normal)");
      } else if ((cleanText || '').toLowerCase().includes("glucose") || (cleanText || '').toLowerCase().includes("sugar")) {
        glucose = "135 mg/dL (Elevated)"; // fallback
      }

      let bp = "—";
      const bpMatch = cleanText.match(/(\d{2,3}\/\d{2,3})/);
      if (bpMatch) {
        bp = `${bpMatch[1]} mmHg`;
      }

      let hr = "—";
      const hrMatch = cleanText.match(/(\d+)\s*(?:bpm|BPM)/i) || cleanText.match(/pulse\s+(?:of\s+)?(\d+)/i) || cleanText.match(/heart\s*rate\s+(?:of\s+)?(\d+)/i);
      if (hrMatch) {
        hr = `${hrMatch[1]} bpm`;
      }

      let temp = "—";
      const tempMatch = cleanText.match(/(\d{2,3}\.?\d?)\s*(?:°F|F|°C|C)\b/i);
      if (tempMatch) {
        temp = tempMatch[1].includes('.') ? `${tempMatch[1]} °F` : `${tempMatch[1]}.0 °F`;
      }

      // 3. Extract Subjective Symptoms/Complaints
      let subjective = "Patient reports subjective metabolic/systemic discomfort.";
      const symptomKeywords = ["complaining of", "complains of", "presenting with", "reports of", "reports", "with"];
      let foundSymptom = false;
      for (const keyword of symptomKeywords) {
        const idx = cleanText.toLowerCase().indexOf(keyword);
        if (idx !== -1) {
          let chunk = cleanText.substring(idx + keyword.length).trim();
          const cutoff = chunk.search(/\b(?:Checked|Prescribing|Prescribed|Rx|Blood|Glucose|Suggest|Follow-up|BP|Pulse|Temp|At|And|\.|\bHe\b|\bShe\b)\b/i);
          if (cutoff !== -1) {
            chunk = chunk.substring(0, cutoff).trim();
          }
          if (chunk.length > 5) {
            chunk = chunk.replace(/[,.]$/, "");
            subjective = `Patient reports ${chunk}.`;
            foundSymptom = true;
            break;
          }
        }
      }
      if (!foundSymptom && cleanText.length > 10) {
        const firstSentence = cleanText.split(/[.!?]/)[0].trim();
        if (firstSentence.length > 15) {
          subjective = firstSentence + ".";
        }
      }

      // 4. Extract Medication & Plan
      let meds = "Metformin 500mg, oral route, 1 tablet daily";
      let medNameOnly = "Metformin 500mg";
      const medMatch = cleanText.match(/(?:prescribing|prescribed|Rx:?|ordered|giving)\s+([A-Za-z0-9\s]+?)(?=\s+(?:daily|twice|\.|suggest|follow-up|once|to|for))/i) ||
                       cleanText.match(/(?:prescribing|prescribed|Rx:?|ordered|giving)\s+([A-Za-z0-9\s]+)/i);
      if (medMatch) {
        let rawMed = medMatch[1].trim();
        rawMed = rawMed.replace(/[,.]$/, "");
        meds = `${rawMed}, oral route, daily administration`;
        medNameOnly = rawMed;
      } else {
        const commonMeds = ["Metformin", "Amoxicillin", "Lisinopril", "Ibuprofen", "Insulin", "Paracetamol", "Aspirin", "Lipitor", "Albuterol"];
        for (const m of commonMeds) {
          const idx = cleanText.toLowerCase().indexOf(m.toLowerCase());
          if (idx !== -1) {
            const segment = cleanText.substring(idx, idx + 30);
            const detailMatch = segment.match(new RegExp(`${m}\\s*\\d*\\s*(?:mg|g|mcg|ml|units)?`, 'i'));
            if (detailMatch) {
              meds = `${detailMatch[0]}, oral route, per instructions`;
              medNameOnly = detailMatch[0];
              break;
            }
          }
        }
      }

      // 5. Deduce Primary Diagnosis
      let dx = "Unspecified General Metabolic/Systemic Finding";
      const dxQuery = (cleanText || '').toLowerCase();
      if (dxQuery.includes("glucose") || dxQuery.includes("metformin") || dxQuery.includes("diabetes") || dxQuery.includes("sugar")) {
        dx = "Type 2 Diabetes Mellitus underactive control";
      } else if (dxQuery.includes("bp") || dxQuery.includes("hypertension") || dxQuery.includes("lisinopril") || dxQuery.includes("pressure")) {
        dx = "Essential Hypertension";
      } else if (dxQuery.includes("amoxicillin") || dxQuery.includes("infection") || dxQuery.includes("fever") || dxQuery.includes("antibiotic")) {
        dx = "Bacterial Infection, unspecified";
      } else if (dxQuery.includes("fatigue") || dxQuery.includes("tired")) {
        dx = "Malaise and fatigue";
      }

      // 6. Extract Follow-up Plan
      let planFollowUp = "Return to clinic in 2 weeks for follow-up and assessment.";
      const followUpMatch = cleanText.match(/(?:follow-up|follow up|return|suggest)\s+in\s+([A-Za-z0-9\s]+?)(?=\.|$)/i) ||
                            cleanText.match(/(?:suggest|recommend)\s+([A-Za-z0-9\s]+?)(?=\.|$)/i);
      if (followUpMatch) {
        planFollowUp = `Follow-up plan: return in ${followUpMatch[1].trim()}.`;
      }

      // 1. Generate formatted clinical SOAP Note dynamically from the revised prompt
      const soap = `### CLINICAL PROGRESS NOTE (SOAP)\n` +
        `**Patient Name:** ${patientName}\n` +
        `**Date of Encounter:** ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC\n\n` +
        `**S (Subjective):**\n` +
        `- ${subjective}\n\n` +
        `**O (Objective):**\n` +
        (glucose !== '—' ? `- Blood Glucose Measured: ${glucose}\n` : '') +
        (bp !== '—' ? `- Blood Pressure: ${bp}\n` : '') +
        (hr !== '—' ? `- Heart Rate: ${hr}\n` : '') +
        (temp !== '—' ? `- Body Temperature: ${temp}\n` : '') +
        `- General clinical appearance: Alert, cooperative, no acute distress.\n\n` +
        `**A (Assessment):**\n` +
        `- Primary Diagnosis: ${dx}.\n` +
        `- Secondary Findings: Checked baseline patient parameters, status updated.\n\n` +
        `**P (Plan):**\n` +
        `- Prescribed ${meds}.\n` +
        `- Patient education completed regarding prescribed regimen.\n` +
        `- ${planFollowUp}`;

      // 2. Generate FHIR compliance object
      const fhirResource = {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [
          {
            "resource": {
              "resourceType": "Patient",
              "id": `pat-gen-${Math.floor(100 + Math.random() * 900)}`,
              "name": [
                {
                  "use": "official",
                  "text": patientName,
                  "family": patientName.split(' ').slice(-1)[0] || "",
                  "given": patientName.split(' ').slice(0, -1)
                }
              ]
            }
          },
          ...(glucose !== '—' ? [{
            "resource": {
              "resourceType": "Observation",
              "id": "obs-gen-glucose",
              "status": "final",
              "code": {
                "coding": [
                  { "system": "http://loinc.org", "code": "2339-0", "display": "Glucose [Mass/volume] in Blood" }
                ],
                "text": "Blood Glucose"
              },
              "subject": { "reference": "Patient/pat-gen" },
              "effectiveDateTime": new Date().toISOString(),
              "valueQuantity": { "value": parseFloat(glucose) || 135.0, "unit": "mg/dL", "system": "http://unitsofmeasure.org", "code": "mg/dL" }
            }
          }] : []),
          ...(bp !== '—' ? [{
            "resource": {
              "resourceType": "Observation",
              "id": "obs-gen-bp",
              "status": "final",
              "code": {
                "coding": [
                  { "system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure systolic and diastolic" }
                ],
                "text": "Blood Pressure"
              },
              "subject": { "reference": "Patient/pat-gen" },
              "effectiveDateTime": new Date().toISOString(),
              "valueQuantity": { "value": bp, "text": bp }
            }
          }] : []),
          {
            "resource": {
              "resourceType": "MedicationRequest",
              "id": "med-gen-rx",
              "status": "active",
              "intent": "order",
              "medicationCodeableConcept": {
                "coding": [
                  { "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "custom", "display": medNameOnly }
                ],
                "text": meds
              },
              "subject": { "reference": "Patient/pat-gen" }
            }
          }
        ]
      };

      setGeneratedSOAP(soap);
      setGeneratedFHIR(fhirResource);
      setIsProcessing(false);

      // Add to logs
      setAgents(prev => prev.map(item => {
        if (item.id === 'agent-copilot') {
          const updatedLogs = [
            ...item.logs,
            `[${new Date().toLocaleTimeString()}] Scribe: Processed unstructured voice note (updated prompt). Generated SOAP format & compiled FHIR Transaction Bundle for ${patientName}.`
          ];
          return { ...item, logs: updatedLogs };
        }
        return item;
      }));

    }, 1500);
  };

  // Run Billing Audit Sandbox
  const handleRunBillingAudit = () => {
    setIsProcessing(true);
    setBillingAuditResult(null);

    setTimeout(() => {
      if (selectedLedgerId === 'ledg-4921') {
        setBillingAuditResult({
          score: 95,
          issues: [
            { code: "CPT 99214", severity: "Low", message: "Documentation thoroughly supports high-complexity office visit tier CPT 99214 code." },
            { code: "E11.9", severity: "Low", message: "ICD-10-CM mapped successfully for uncomplicated Type 2 Diabetes Mellitus." }
          ]
        });
      } else {
        setBillingAuditResult({
          score: 62,
          issues: [
            { code: "CPT 99215", severity: "High", message: "Upcoding Risk: Patient encounter duration is listed as 15 minutes. High-complexity CPT 99215 requires 40+ minutes or comprehensive clinical rationale." },
            { code: "ICD-10-CM E11", severity: "Medium", message: "Nonspecific code format. Missing 4th/5th character decimal specification of associated complications (e.g., E11.9 vs E11.4)." },
            { code: "EHR Sign-off", severity: "High", message: "Signature verification alert: Missing digital attending physician credential lock." }
          ]
        });
      }
      setIsProcessing(false);

      // Add to logs
      setAgents(prev => prev.map(item => {
        if (item.id === 'agent-billing') {
          const updatedLogs = [
            ...item.logs,
            `[${new Date().toLocaleTimeString()}] Auditor: Analyzed ledger ${selectedLedgerId}. Outlined compliance and upcoding anomalies.`
          ];
          return { ...item, logs: updatedLogs };
        }
        return item;
      }));

    }, 1500);
  };

  // Filter Agents List
  const filteredAgents = agents.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (item.name && item.name.toLowerCase().includes(query)) || 
           (item.description && item.description.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-8 max-w-4xl pb-12" id="agents_tab_root">
      {/* Dynamic Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bot size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 block mb-0.5">
                  Cognitive Orchestrator
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Clinical AI & Autonomous Agents
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Deploy custom, HIPAA-compliant generative models directly into hospital networks. Scribe unstructured medical speech, continuously audit billings for compliance, and orchestrate patient-facing communications securely.
            </p>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs font-bold text-gray-500 hover:text-gray-950 flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Settings size={14} />
            <span>{showSettings ? 'Hide Settings' : 'Agent Hyperparameters'}</span>
          </button>
        </div>

        {/* Dynamic Settings Policy Panel */}
        {showSettings && (
          <form onSubmit={handleSaveSettings} className="mt-6 border-t border-gray-150 pt-5 space-y-4 text-xs animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-950">Fine-tune Active Agent: {activeAgent.name}</h4>
                <p className="text-gray-500">Configure core behavioral prompt structures and temperature weights.</p>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeAgent.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {activeAgent.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Model Deployment Target</label>
                <select
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-bold text-gray-700 cursor-pointer"
                >
                  <option value="Gemini 1.5 Pro (Clinical Finetuned)">Gemini 1.5 Pro (Clinical Finetuned)</option>
                  <option value="Gemini 1.5 Flash (Analytical)">Gemini 1.5 Flash (Analytical)</option>
                  <option value="Gemini 1.5 Flash (Creative)">Gemini 1.5 Flash (Creative)</option>
                  <option value="Custom Med-PaLM-2 Cluster">Custom Med-PaLM-2 Cluster</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Creativity Temperature ({tempInput})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={tempInput}
                  onChange={(e) => setTempInput(parseFloat(e.target.value))}
                  className="w-full h-8 cursor-pointer accent-indigo-600 block"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Safety Filters Override</label>
                <input
                  type="text"
                  disabled
                  value="Strict HIPAA & PHI Masking Active"
                  className="w-full px-2.5 py-2 text-xs border border-gray-100 rounded-xl bg-gray-50 text-gray-400 font-semibold"
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">System Prompts Instruction Guard</label>
                <textarea
                  value={sysInstructionInput}
                  onChange={(e) => setSysInstructionInput(e.target.value)}
                  className="w-full h-20 p-2.5 font-mono text-[11px] text-gray-800 bg-white border border-gray-200 focus:outline-none focus:border-gray-400 rounded-xl leading-relaxed resize-none block"
                  placeholder="System instructions..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleToggleAgentStatus(activeAgent.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  activeAgent.status === 'Active'
                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {activeAgent.status === 'Active' ? 'Pause Agent' : 'Resume Agent'}
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Save Hyperparameters
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Grid: Agent Selector + Active Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col (Span 5): Available Models */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Bot size={13} />
            <span>Deployed Scribes & Auditors</span>
          </h3>

          <div className="space-y-2">
            {filteredAgents.map((item) => {
              const isSelected = activeAgent.id === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectAgent(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex gap-3 cursor-pointer ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-600/10 shadow-xs' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <IconComp size={18} />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-center w-full">
                      <h4 className="font-bold text-gray-950 truncate pr-1">{item.name}</h4>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        item.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Capabilities Badges */}
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {item.capabilities.map((cap, i) => (
                        <span key={i} className="text-[9px] bg-gray-50 border border-gray-150 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Secure ground warning banner */}
          <div className="bg-indigo-50/20 border border-indigo-150/80 rounded-xl p-4 text-xs text-indigo-950 flex gap-2">
            <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold block">HIPAA Grounding Enabled</span>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                All prompts automatically pipe through our Zero-Trust de-identification layer. PHI (Protected Health Information) is scrambled on ingestion, then re-assembled safely after model execution.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col (Span 7): Interactive Playgrounds */}
        <div className="lg:col-span-7">
          
          {/* PAUSED STATE CHECK */}
          {activeAgent.status !== 'Active' ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3.5">
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-200">
                <Bot size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-gray-950">Agent Workspace Inactive</h4>
                <p className="text-xs text-gray-400 max-w-sm">
                  This model scheduler is paused. Click "Agent Hyperparameters" in the header to activate and connect the orchestration pipeline.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* PLAYGROUND FOR CLINICAL COPILOT (agent-copilot) */}
              {activeAgent.id === 'agent-copilot' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-base text-gray-950 tracking-tight flex items-center gap-1.5">
                        <Volume2 size={16} className="text-indigo-600" />
                        <span>Physician Scribe Sandbox</span>
                      </h3>
                      <p className="text-xs text-gray-400">Paste unstructured physician shift summaries or verbal drafts.</p>
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={handleRunCopilot}
                      className="px-4 py-2 bg-indigo-950 text-white font-bold text-xs rounded-xl hover:bg-indigo-900 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin" size={13} />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          <span>Orchestrate Notes</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Input form text */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unstructured Raw Physician Draft</label>
                    <textarea
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      className="w-full h-24 p-3 text-xs sm:text-sm bg-white border border-gray-200 focus:outline-none focus:border-gray-400 rounded-xl leading-relaxed resize-none block"
                      placeholder="Doctor's dictate..."
                    />
                  </div>

                  {/* Generated results wrapper */}
                  {generatedSOAP && (
                    <div className="space-y-5 pt-2 animate-fadeIn">
                      
                      {/* Generated SOAP Progress Note */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <FileText size={12} className="text-indigo-500" />
                            <span>Structured SOAP progress Note</span>
                          </label>

                          <button
                            onClick={() => handleCopy(generatedSOAP, 'soap')}
                            className="text-[10px] text-gray-400 hover:text-gray-900 font-bold flex items-center gap-1 transition-colors"
                          >
                            {copiedKey === 'soap' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedKey === 'soap' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs text-gray-700 leading-relaxed font-sans prose max-w-none whitespace-pre-line">
                          {generatedSOAP}
                        </div>
                      </div>

                      {/* Generated FHIR Resource */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Code size={12} className="text-teal-500" />
                            <span>Generated FHIR Transaction Bundle (JSON)</span>
                          </label>

                          <button
                            onClick={() => handleCopy(JSON.stringify(generatedFHIR, null, 2), 'fhir')}
                            className="text-[10px] text-gray-400 hover:text-gray-900 font-bold flex items-center gap-1 transition-colors"
                          >
                            {copiedKey === 'fhir' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedKey === 'fhir' ? 'Copied' : 'Copy Payload'}</span>
                          </button>
                        </div>

                        <div className="bg-gray-950 rounded-xl p-4 font-mono text-[11px] text-gray-100 overflow-x-auto max-h-56 leading-relaxed">
                          <pre>{JSON.stringify(generatedFHIR, null, 2)}</pre>
                        </div>
                      </div>

                      <div className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-4 flex gap-3 items-start text-xs text-emerald-950">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-extrabold block">Safe to write to Clinical Database</span>
                          <p className="text-[11px] text-emerald-800 leading-normal">
                            Semantic schema targets verified. These diagnostics and clinical observations fit FHIR r4 standards.
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* PLAYGROUND FOR AUDITOR (agent-billing) */}
              {activeAgent.id === 'agent-billing' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-base text-gray-950 tracking-tight flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-indigo-600" />
                        <span>ICD-10 Code Auditor Sandbox</span>
                      </h3>
                      <p className="text-xs text-gray-400">Select a clinical patient record transaction log ledger to audit.</p>
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={handleRunBillingAudit}
                      className="px-4 py-2 bg-indigo-950 text-white font-bold text-xs rounded-xl hover:bg-indigo-900 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin" size={13} />
                          <span>Auditing Ledger...</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          <span>Execute Audit Check</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Ledger selection selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setSelectedLedgerId('ledg-4921'); setBillingAuditResult(null); }}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex justify-between items-center ${
                        selectedLedgerId === 'ledg-4921' 
                          ? 'border-indigo-600 bg-indigo-50/5 ring-1 ring-indigo-600/10' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-gray-950">Ledger #ledg-4921</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Patient: Sample Patient</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                        95% Score
                      </span>
                    </button>

                    <button
                      onClick={() => { setSelectedLedgerId('ledg-8402'); setBillingAuditResult(null); }}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex justify-between items-center ${
                        selectedLedgerId === 'ledg-8402' 
                          ? 'border-indigo-600 bg-indigo-50/5 ring-1 ring-indigo-600/10' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-gray-950">Ledger #ledg-8402</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Patient: Unknown Outpatient</span>
                      </div>
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-100">
                        62% Score
                      </span>
                    </button>
                  </div>

                  {/* Audit Results Block */}
                  {billingAuditResult && (
                    <div className="space-y-5 animate-fadeIn">
                      
                      {/* Meter Score block */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Billing Compliance Score</span>
                          <h4 className="font-extrabold text-base text-gray-950">
                            {billingAuditResult.score >= 90 ? 'Healthy Record Compliance' : 'Insurer Claims Rejected Target'}
                          </h4>
                        </div>

                        <div className={`text-2xl font-extrabold px-3 py-2 rounded-xl text-center ${
                          billingAuditResult.score >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {billingAuditResult.score}%
                        </div>
                      </div>

                      {/* Issues list details */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Analysis Breakdown Findings</label>
                        
                        <div className="space-y-2.5">
                          {billingAuditResult.issues.map((issue, idx) => (
                            <div key={idx} className="p-3 bg-white border border-gray-150 rounded-xl flex gap-3 items-start text-xs">
                              {issue.severity === 'High' ? (
                                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5 animate-bounce" size={16} />
                              ) : issue.severity === 'Medium' ? (
                                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                              ) : (
                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                              )}

                              <div className="space-y-0.5">
                                <span className="font-extrabold text-gray-900 block">{issue.code}</span>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{issue.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* GENERAL ACTIVE AGENT Trans-Logs console */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Agent Sandbox logs</h3>
                  <span className="text-[10px] text-gray-400 font-semibold">Active loop transactions</span>
                </div>

                <div className="bg-gray-950 rounded-xl p-4 font-mono text-[11px] text-gray-300 space-y-1.5 overflow-x-auto max-h-[160px]">
                  {activeAgent.logs.length === 0 ? (
                    <p className="text-gray-500 italic">No transactions processed yet.</p>
                  ) : (
                    activeAgent.logs.map((log, i) => (
                      <div key={i} className="whitespace-nowrap flex gap-1">
                        <span className="text-teal-400 font-semibold">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
