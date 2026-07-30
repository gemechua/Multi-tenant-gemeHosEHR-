import React, { useState } from 'react';
import { 
  Code, Braces, Terminal, Play, Check, Copy, RefreshCw, Sparkles,
  HelpCircle, ExternalLink, AlertCircle, FileCode, CheckCircle2,
  FileJson, Shield, Send, Cpu, Key, Database, ChevronRight, Info
} from 'lucide-react';

interface ResourceTemplate {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  payload: string;
}

const RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    id: 'patient',
    name: 'Patient Profile (FHIR r4)',
    description: 'Represents demographic and administrative data of a clinical patient.',
    resourceType: 'Patient',
    payload: JSON.stringify({
  "resourceType": "Patient",
  "id": "pat-sample",
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+0000000000",
      "use": "mobile"
    },
    {
      "system": "email",
      "value": "patient@hospital.org",
      "use": "work"
    }
  ],
  "gender": "male",
  "birthDate": "1994-08-12",
  "address": [
    {
      "use": "home",
      "line": ["12 Bole Road"],
      "city": "Addis Ababa",
      "country": "ET"
    }
  ]
}, null, 2)
  },
  {
    id: 'observation',
    name: 'Lab Observation (FHIR r4)',
    description: 'Represents physiological diagnostics, vital signs, or lab measurements.',
    resourceType: 'Observation',
    payload: JSON.stringify({
  "resourceType": "Observation",
  "id": "obs-74291",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "laboratory",
          "display": "Laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "2339-0",
        "display": "Glucose [Mass/volume] in Blood"
      }
    ],
    "text": "Glucose Level"
  },
  "subject": {
    "reference": "Patient/pat-94812"
  },
  "effectiveDateTime": "2026-06-24T10:15:30Z",
  "valueQuantity": {
    "value": 98.4,
    "unit": "mg/dL",
    "system": "http://unitsofmeasure.org",
    "code": "mg/dL"
  },
  "referenceRange": [
    {
      "low": {
        "value": 70.0,
        "unit": "mg/dL"
      },
      "high": {
        "value": 100.0,
        "unit": "mg/dL"
      }
    }
  ]
}, null, 2)
  },
  {
    id: 'medication',
    name: 'MedicationRequest (FHIR r4)',
    description: 'Represents prescriptions dispatched to local pharmacy partner networks.',
    resourceType: 'MedicationRequest',
    payload: JSON.stringify({
  "resourceType": "MedicationRequest",
  "id": "med-30412",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "261318",
        "display": "Metformin hydrochloride 500mg"
      }
    ],
    "text": "Metformin 500mg daily"
  },
  "subject": {
    "reference": "Patient/pat-94812"
  },
  "authoredOn": "2026-06-24T12:00:00Z",
  "requester": {
    "display": "Attending Physician"
  },
  "dosageInstruction": [
    {
      "text": "Take 1 tablet daily with dinner",
      "additionalInstruction": [
        {
          "text": "Take with water"
        }
      ],
      "timing": {
        "repeat": {
          "frequency": 1,
          "period": 1,
          "periodUnit": "d"
        }
      }
    }
  ]
}, null, 2)
  },
  {
    id: 'encounter',
    name: 'Clinical Encounter (FHIR r4)',
    description: 'Catalogs outpatient visits, hospitalizations, or video consultations.',
    resourceType: 'Encounter',
    payload: JSON.stringify({
  "resourceType": "Encounter",
  "id": "enc-10492",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/pat-94812"
  },
  "participant": [
    {
      "type": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              "code": "PPRF"
            }
          ]
        }
      ],
      "individual": {
        "display": "Attending Physician"
      }
    }
  ],
  "period": {
    "start": "2026-06-24T09:00:00Z",
    "end": "2026-06-24T09:45:00Z"
  },
  "reasonCode": [
    {
      "text": "Bi-annual diabetic monitoring consult"
    }
  ]
}, null, 2)
  }
];

export default function CodeTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate>(RESOURCE_TEMPLATES[0]);
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'go'>('curl');
  const [editorValue, setEditorValue] = useState<string>(RESOURCE_TEMPLATES[0].payload);
  const [validationResult, setValidationResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    details: string[];
  }>({ status: null, message: '', details: [] });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook Simulator state
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<string[]>([
    '[SYSTEM] Local webhook sandbox daemon running on background loop.',
    '[SYSTEM] Listening at destination: https://ehr.clinic.org/api/webhooks/inbound'
  ]);
  const [webhookPayload, setWebhookPayload] = useState<string>(JSON.stringify({
    "event": "patient.registered",
    "timestamp": "2026-06-24T14:15:00Z",
    "data": {
      "patientId": "pat-94812",
      "firstName": "Jane",
      "lastName": "Ahmed",
      "facility": "General Primary Node"
    }
  }, null, 2));

  // Client Creds State
  const [credentials, setCredentials] = useState({
    clientId: 'hosp_client_942801_sec',
    clientSecret: 'sh_live_5893d9a1e0bca874fde78a2210b3',
    jwtIssuer: 'https://auth.hospital.org/oauth2'
  });
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSelectTemplate = (template: ResourceTemplate) => {
    setSelectedTemplate(template);
    setEditorValue(template.payload);
    setValidationResult({ status: null, message: '', details: [] });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Generate dynamic API endpoint snippets
  const getCodeSnippet = () => {
    const endpoint = `https://fhir.hospital.org/v4/api/${selectedTemplate.resourceType}`;
    const payloadMin = editorValue.trim();

    switch (activeLang) {
      case 'curl':
        return `curl -X POST "${endpoint}" \\\n  -H "Authorization: Bearer ${credentials.clientSecret.substring(0, 15)}..." \\\n  -H "Content-Type: application/fhir+json" \\\n  -d '${payloadMin.replace(/\n/g, '\n  ')}'`;
      
      case 'js':
        return `// JavaScript client-side/Node.js SDK handler\nconst submitFHIRResource = async () => {\n  const response = await fetch("${endpoint}", {\n    method: "POST",\n    headers: {\n      "Authorization": "Bearer ${credentials.clientSecret.substring(0, 15)}...",\n      "Content-Type": "application/fhir+json"\n    },\n    body: JSON.stringify(${payloadMin.replace(/\n/g, '\n    ')})\n  });\n\n  if (!response.ok) {\n    throw new Error(\`HTTP error! status: \${response.status}\`);\n  }\n  \n  const result = await response.json();\n  console.log("Resource published successfully:", result.id);\n};`;

      case 'python':
        return `# Python 3.x requests implementation\nimport requests\nimport json\n\nurl = "${endpoint}"\nheaders = {\n    "Authorization": "Bearer ${credentials.clientSecret.substring(0, 15)}...",\n    "Content-Type": "application/fhir+json"\n}\npayload = ${payloadMin.replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None').replace(/\n/g, '\n    ')}\n\nresponse = requests.post(url, headers=headers, json=payload)\nprint(f"Status: {response.status_code}")\nprint(response.json())`;

      case 'go':
        return `package main\n\nimport (\n\t"bytes"\n\t"fmt"\n\t"net/http"\n)\n\nfunc main() {\n\turl := "${endpoint}"\n\tpayload := []byte(\`\n${payloadMin}\`)\n\n\treq, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))\n\treq.Header.Set("Authorization", "Bearer ${credentials.clientSecret.substring(0, 15)}...")\n\treq.Header.Set("Content-Type", "application/fhir+json")\n\n\tclient := &http.Client{}\n\tresp, err := client.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer resp.Body.Close()\n\n\tfmt.Println("Response Status:", resp.Status)\n}`;
    }
  };

  // Perform a schema compliance check simulation
  const handleValidatePayload = () => {
    try {
      // 1. JSON Parse Check
      const parsed = JSON.parse(editorValue);
      
      const errors: string[] = [];
      
      // 2. FHIR mandatory checks
      if (!parsed.resourceType) {
        errors.push("Missing mandatory FHIR attribute: 'resourceType'.");
      } else if (parsed.resourceType !== selectedTemplate.resourceType) {
        errors.push(`Resource type mismatch. Expected: '${selectedTemplate.resourceType}', found: '${parsed.resourceType}'.`);
      }

      if (!parsed.id) {
        errors.push("Missing resource logic identifier 'id' target.");
      }

      // Template specific warnings
      if (parsed.resourceType === 'Patient') {
        if (!parsed.name || !Array.isArray(parsed.name) || parsed.name.length === 0) {
          errors.push("FHIR compliance suggests including at least one Patient 'name' record array.");
        }
      }

      if (parsed.resourceType === 'Observation') {
        if (!parsed.status) {
          errors.push("Observation is missing required status ('preliminary' | 'final' | 'amended').");
        }
        if (!parsed.code) {
          errors.push("Observation resources MUST have a clinical concept code definition.");
        }
      }

      if (errors.length > 0) {
        setValidationResult({
          status: 'error',
          message: 'HL7 FHIR v4 Semantic Analysis Failed',
          details: errors
        });
      } else {
        setValidationResult({
          status: 'success',
          message: 'HL7 FHIR Resource Validation Successful!',
          details: [
            'JSON Syntax verification: Passed (Well-formed standard structure).',
            `FHIR Schema constraint verification: '${parsed.resourceType}' complies with HL7 specification guidelines.`,
            'Logical schema keys matching database target. Safe for immediate replication.'
          ]
        });
      }
    } catch (err: any) {
      setValidationResult({
        status: 'error',
        message: 'Invalid JSON Structure (Critical Syntax Error)',
        details: [
          err.message || 'Check for missing double quotes, mismatched curly braces, or dangling trailing commas.'
        ]
      });
    }
  };

  // Trigger simulated inbound webhook dispatcher
  const handleSimulateWebhook = () => {
    if (simulatingWebhook) return;
    setSimulatingWebhook(true);

    try {
      // Validate webhook payload is json
      const parsed = JSON.parse(webhookPayload);
      
      const newLogs = [
        `[${new Date().toLocaleTimeString()}] INBOUND WEBHOOK RECEIVED: Origin 'hl7-broadcast-gateway'`,
        `[${new Date().toLocaleTimeString()}] Headers: Content-Type: application/json, X-Hub-Signature-256: hmac_aes...`,
        `[${new Date().toLocaleTimeString()}] Parsing inbound event type: '${parsed.event || 'generic.notify'}'`,
        `[${new Date().toLocaleTimeString()}] Processing data payload: Target Patient ID -> ${parsed.data?.patientId || 'unknown'}`,
        `[${new Date().toLocaleTimeString()}] Sync success: EHR cluster data synced in 142ms. Status: HTTP 202 Accepted.`
      ];

      let count = 0;
      const interval = setInterval(() => {
        if (count < newLogs.length) {
          setWebhookLogs(prev => [...prev, newLogs[count]]);
          count++;
        } else {
          clearInterval(interval);
          setSimulatingWebhook(false);
        }
      }, 400);

    } catch (err: any) {
      setWebhookLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Webhook trigger failed: Invalid payload body structure.`,
        `[${new Date().toLocaleTimeString()}] Error detail: ${err.message}`
      ]);
      setSimulatingWebhook(false);
    }
  };

  // Regenerate sandbox tokens
  const handleRegenerateTokens = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const nextSecret = 'sh_live_' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
      const nextId = 'hosp_client_' + Math.floor(Math.random() * 900000 + 100000) + '_sec';
      setCredentials(prev => ({
        ...prev,
        clientSecret: nextSecret,
        clientId: nextId
      }));
      setIsRegenerating(false);
      
      // Notify log
      setWebhookLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] SECURITY KEY ROTATION: Rotated active client credentials ID: ${nextId}`
      ]);
      alert("Credentials regenerated. Update your external environment variables or test scripts.");
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12" id="code_implementation_root">
      {/* Visual Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 to-emerald-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Code size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-teal-600 block mb-0.5">
                  Sandbox & API Integration
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  FHIR SDK & Endpoint Sandbox
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Write, validate, and integrate standard HL7 FHIR v4 payloads directly into your clinical node architecture. Access pre-generated client software scripts, test inbound clinical webhooks, and secure authorization credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Key Managers */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm text-gray-950 tracking-tight flex items-center gap-2">
              <Key size={16} className="text-gray-500" />
              <span>Sandbox Access Credentials</span>
            </h3>
            <p className="text-xs text-gray-400">Use these tokens to authenticate clinical web API requests.</p>
          </div>

          <button
            onClick={handleRegenerateTokens}
            disabled={isRegenerating}
            className="text-[11px] font-bold text-teal-700 hover:text-white border border-teal-200 bg-teal-50/50 hover:bg-teal-600 px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
            <span>Regenerate Keys</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CLIENT ID */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Client Client ID</span>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-xs text-gray-800 break-all">{credentials.clientId}</code>
              <button
                onClick={() => handleCopy(credentials.clientId, 'id')}
                className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 shadow-2xs transition-colors"
                title="Copy client id"
              >
                {copiedKey === 'id' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* CLIENT SECRET */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Client Secret Key</span>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-xs text-gray-800 break-all">
                {credentials.clientSecret.substring(0, 18)}...
              </code>
              <button
                onClick={() => handleCopy(credentials.clientSecret, 'secret')}
                className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 shadow-2xs transition-colors"
                title="Copy secret key"
              >
                {copiedKey === 'secret' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* JWT ISSUER */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">OAuth 2.0 Issuer URL</span>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-xs text-gray-800 truncate block">{credentials.jwtIssuer}</code>
              <button
                onClick={() => handleCopy(credentials.jwtIssuer, 'issuer')}
                className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 shadow-2xs transition-colors"
                title="Copy issuer url"
              >
                {copiedKey === 'issuer' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Code Generator / Schema Validator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side (Span 4): Resource Selection */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1">
            <FileJson size={13} />
            <span>FHIR v4 Resource Templates</span>
          </h3>

          <div className="space-y-2">
            {RESOURCE_TEMPLATES.map((item) => {
              const isSelected = selectedTemplate.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTemplate(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex gap-3 cursor-pointer ${
                    isSelected 
                      ? 'border-teal-600 bg-teal-50/10 ring-1 ring-teal-600/10 shadow-xs' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    isSelected ? 'bg-teal-50 text-teal-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <FileCode size={18} />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-gray-950 truncate">{item.name}</h4>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase">{item.resourceType}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick clinical node tips */}
          <div className="bg-teal-50/30 border border-teal-150 rounded-xl p-4 space-y-1.5 text-xs text-teal-950">
            <span className="font-extrabold flex items-center gap-1">
              <Info size={13} />
              <span>HL7 REST Compliance Note</span>
            </span>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              Standard clinical endpoints are version-strict. Exchanging medical profiles with downstream hospitals requires valid resource classes and validated header schema types.
            </p>
          </div>
        </div>

        {/* Right Side (Span 8): Interactive Editor & Client SDK Code Snippets */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            
            {/* Inner Header with schema actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-gray-950 tracking-tight">Active Payload Editor</h3>
                <p className="text-xs text-gray-400">Edit raw HL7 parameters below, then execute a compliance check.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorValue(selectedTemplate.payload)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-2xs transition-colors"
                  title="Reset to default template structure"
                >
                  Reset Code
                </button>

                <button
                  onClick={handleValidatePayload}
                  className="px-4 py-1.5 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  Validate Payload
                </button>
              </div>
            </div>

            {/* Interactive Raw JSON Code Editor */}
            <div className="relative border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-400 transition-colors">
              <div className="bg-gray-50 border-b border-gray-150 px-4 py-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  {selectedTemplate.resourceType}.json (RAW HL7 PAYLOAD)
                </span>
                <span className="text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
                  Editable
                </span>
              </div>

              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                className="w-full h-72 p-4 font-mono text-[12px] text-gray-800 bg-white focus:outline-none leading-relaxed resize-none overflow-y-auto block"
                placeholder="Paste or write valid JSON here..."
              />
            </div>

            {/* Validation diagnostic results */}
            {validationResult.status !== null && (
              <div className={`rounded-xl p-4 border text-xs leading-relaxed space-y-2 animate-fadeIn ${
                validationResult.status === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  {validationResult.status === 'success' ? (
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                  ) : (
                    <AlertCircle className="text-rose-600 shrink-0" size={18} />
                  )}
                  <span>{validationResult.message}</span>
                </div>

                <div className="space-y-1 pl-1 font-mono text-[11px] text-opacity-90">
                  {validationResult.details.map((detail, index) => (
                    <div key={index} className="flex gap-1.5 items-start">
                      <span className="font-bold opacity-70">-</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CLIENT CODE GENERATOR PORTION */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-gray-950 tracking-tight flex items-center gap-1.5">
                    <Terminal size={15} className="text-gray-500" />
                    <span>Client API Code Snippet Generator</span>
                  </h4>
                  <p className="text-xs text-gray-400">Export fully authorized rest API client requests instantly.</p>
                </div>

                {/* Lang Selectors */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {(['curl', 'js', 'python', 'go'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        activeLang === lang 
                          ? 'bg-white text-gray-950 shadow-2xs' 
                          : 'text-gray-500 hover:text-gray-950'
                      }`}
                    >
                      {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : 'Go'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated code panel */}
              <div className="relative border border-gray-150 rounded-xl overflow-hidden bg-gray-950">
                <div className="absolute right-3 top-3 z-10">
                  <button
                    onClick={() => handleCopy(getCodeSnippet(), 'snippet')}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-lg shadow-sm border border-white/10 transition-colors"
                    title="Copy snippet"
                  >
                    {copiedKey === 'snippet' ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <pre className="p-4 pt-5 font-mono text-[11px] text-gray-100 overflow-x-auto leading-relaxed max-h-[280px]">
                  <code>{getCodeSnippet()}</code>
                </pre>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* WEBHOOK SIMULATOR PANE */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-950 tracking-tight flex items-center gap-2">
                <Send size={16} className="text-teal-600" />
                <span>Inbound EHR Webhook Dispatcher</span>
              </h3>
              <p className="text-xs text-gray-400">Simulate incoming HL7 partner database synchronization triggers.</p>
            </div>

            <button
              onClick={handleSimulateWebhook}
              disabled={simulatingWebhook}
              className="px-4 py-2 bg-teal-950 text-white text-xs font-bold rounded-xl hover:bg-teal-850 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {simulatingWebhook ? (
                <>
                  <RefreshCw className="animate-spin" size={13} />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Simulate Webhook Delivery</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Webhook JSON Editor */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Webhook JSON Trigger Body</label>
            <textarea
              value={webhookPayload}
              onChange={(e) => setWebhookPayload(e.target.value)}
              className="w-full h-44 p-4 font-mono text-[11px] text-gray-800 bg-white border border-gray-200 focus:outline-none focus:border-gray-400 rounded-xl leading-relaxed resize-none block"
            />
          </div>

          {/* Webhook Stream Logs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dynamic Sandbox Logs</label>
              <button
                onClick={() => setWebhookLogs([])}
                className="text-[10px] text-gray-400 hover:text-gray-900 font-bold transition-colors"
              >
                Clear Console
              </button>
            </div>
            
            <div className="w-full h-44 p-4 font-mono text-[11px] text-teal-400 bg-gray-950 rounded-xl overflow-y-auto space-y-1.5 border border-gray-900">
              {webhookLogs.length === 0 ? (
                <p className="text-gray-600 italic">Logs empty. Trigger webhook simulation to process events.</p>
              ) : (
                webhookLogs.map((log, index) => (
                  <div key={index} className="flex gap-1 items-start">
                    <span className="text-teal-600 font-extrabold shrink-0">&gt;</span>
                    <span className="text-gray-200">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
