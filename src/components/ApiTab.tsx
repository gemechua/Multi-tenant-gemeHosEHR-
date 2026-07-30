import React, { useState, useMemo } from 'react';
import { 
  Key, Copy, Check, RefreshCw, Play, Send, Terminal, Settings, 
  Code, ExternalLink, ShieldAlert, Globe, Plus, Trash2, Eye, EyeOff, 
  CheckCircle2, HelpCircle, Lock, Server, ArrowRight, Braces, Layers,
  Activity, AlertCircle, FileCode, CheckSquare
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  headers: { key: string; value: string }[];
  requestBody?: string;
  responseExample: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'Active' | 'Inactive';
  created: string;
}

const FHIR_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/v4/api/Patient/pat-sample',
    description: 'Retrieve full HL7 FHIR demographic record for patient Sample Patient.',
    headers: [
      { key: 'Authorization', value: 'Bearer sh_live_842a...9d' },
      { key: 'Accept', value: 'application/fhir+json' }
    ],
    responseExample: JSON.stringify({
      resourceType: "Patient",
      id: "pat-94812",
      active: true,
      name: [
        {
          use: "official",
          family: "Ahmed",
          given: ["Jane"]
        }
      ],
      gender: "male",
      birthDate: "1988-11-23",
      telecom: [
        { system: "phone", value: "+0000000000", use: "mobile" },
        { system: "email", value: "patient@hospital.org" }
      ],
      address: [
        {
          use: "home",
          line: ["Bole District, Road 12"],
          city: "Addis Ababa",
          country: "Local"
        }
      ],
      managingOrganization: {
        reference: "Organization/org-general-hosp",
        display: "ehr.generalhospital.org cluster"
      }
    }, null, 2)
  },
  {
    method: 'POST',
    path: '/v4/api/Observation',
    description: 'Release a new diagnostic measurement, lab observation, or vitals node.',
    headers: [
      { key: 'Authorization', value: 'Bearer sh_live_842a...9d' },
      { key: 'Content-Type', value: 'application/fhir+json' }
    ],
    requestBody: JSON.stringify({
      resourceType: "Observation",
      status: "final",
      category: [
        {
          coding: [
            { system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }
          ]
        }
      ],
      code: {
        coding: [
          { system: "http://loinc.org", code: "1558-6", display: "Fasting glucose [Mass/volume] in Blood" }
        ]
      },
      subject: {
        reference: "Patient/pat-94812",
        display: "Jane Doe"
      },
      valueQuantity: {
        value: 135,
        unit: "mg/dL",
        system: "http://unitsofmeasure.org",
        code: "mg/dL"
      }
    }, null, 2),
    responseExample: JSON.stringify({
      resourceType: "Observation",
      id: "obs-94829",
      status: "final",
      code: {
        coding: [{ system: "http://loinc.org", code: "1558-6", display: "Fasting glucose [Mass/volume] in Blood" }]
      },
      subject: { reference: "Patient/pat-94812" },
      valueQuantity: { value: 135, unit: "mg/dL" },
      effectiveDateTime: "2026-06-24T14:41:00Z",
      issued: "2026-06-24T14:41:05Z",
      meta: {
        versionId: "1",
        lastUpdated: "2026-06-24T14:41:05Z"
      }
    }, null, 2)
  },
  {
    method: 'POST',
    path: '/v4/api/MedicationRequest',
    description: 'Order or register a prescription authorization tied to an active clinician signature.',
    headers: [
      { key: 'Authorization', value: 'Bearer sh_live_842a...9d' },
      { key: 'Content-Type', value: 'application/fhir+json' }
    ],
    requestBody: JSON.stringify({
      resourceType: "MedicationRequest",
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        coding: [
          { system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "861634", display: "Metformin Hydrochloride 500mg Oral Tablet" }
        ]
      },
      subject: {
        reference: "Patient/pat-94812",
        display: "Jane Doe"
      },
      authoredOn: "2026-06-24",
      dosageInstruction: [
        {
          text: "One tablet orally twice daily with meals",
          timing: {
            repeat: { frequency: 2, period: 1, periodUnit: "d" }
          }
        }
      ]
    }, null, 2),
    responseExample: JSON.stringify({
      resourceType: "MedicationRequest",
      id: "med-94833",
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "861634", display: "Metformin Hydrochloride 500mg" }]
      },
      subject: { reference: "Patient/pat-94812" },
      authoredOn: "2026-06-24T14:41:10Z",
      meta: {
        lastUpdated: "2026-06-24T14:41:12Z"
      }
    }, null, 2)
  },
  {
    method: 'GET',
    path: '/v4/api/Encounter',
    description: 'Fetch the encounter lists and diagnostic contexts recorded for active clinicians.',
    headers: [
      { key: 'Authorization', value: 'Bearer sh_live_842a...9d' },
      { key: 'Accept', value: 'application/fhir+json' }
    ],
    responseExample: JSON.stringify({
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [
        {
          fullUrl: "https://fhir.generalhospital.org/v4/api/Encounter/enc-20412",
          resource: {
            resourceType: "Encounter",
            id: "enc-20412",
            status: "finished",
            class: {
              system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
              code: "AMB",
              display: "ambulatory"
            },
            subject: {
              reference: "Patient/pat-94812"
            },
            period: {
              start: "2026-06-24T13:00:00Z",
              end: "2026-06-24T13:45:00Z"
            }
          }
        }
      ]
    }, null, 2)
  }
];

export default function ApiTab() {
  // Authentication credentials states
  const [clientId, setClientId] = useState('hosp_client_942801_sec');
  const [clientSecret, setClientSecret] = useState('sh_sec_8f9c104a3bb291076b6d5102a1142e01');
  const [showSecret, setShowSecret] = useState(false);
  const [webhookSecret] = useState('wh_sec_a39b20d82fa0029b');

  // Key regeneration indicators
  const [isRotating, setIsRotating] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Playground Sandbox states
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(FHIR_ENDPOINTS[0]);
  const [playgroundToken, setPlaygroundToken] = useState('sh_live_842a1290bb3918077cbf9d');
  const [playgroundBody, setPlaygroundBody] = useState<string>(FHIR_ENDPOINTS[0].requestBody || '');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<{ status: number; text: string; data: string } | null>(null);
  const [sandboxTab, setSandboxTab] = useState<'response' | 'curl'>('response');

  // Webhook states
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: 'wh-1',
      url: 'https://outreach.partnerhospital.org/incoming-events',
      events: ['Patient Registered', 'Observation Released'],
      status: 'Active',
      created: '2026-06-22 09:15'
    },
    {
      id: 'wh-2',
      url: 'https://billing.auditcloud.com/v1/webhook',
      events: ['Encounter Finished'],
      status: 'Active',
      created: '2026-06-23 11:42'
    }
  ]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedHookEvents, setSelectedHookEvents] = useState<string[]>(['Patient Registered']);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestLog, setWebhookTestLog] = useState<string | null>(null);

  const availableEvents = ['Patient Registered', 'Observation Released', 'Encounter Finished', 'Medication Request Created'];

  // Handle secret rotation
  const handleRotateSecret = () => {
    if (confirm("Are you sure you want to rotate your Client Secret? Immediate rotation will render the previous credentials inactive and any existing external scripts must be updated.")) {
      setIsRotating(true);
      setTimeout(() => {
        const randHex = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
        setClientSecret(`sh_sec_${randHex}`);
        setIsRotating(false);
        alert("Client Secret successfully rotated. Downstream healthcare orchestrator nodes updated.");
      }, 700);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 1500);
  };

  // Switch sandbox endpoint trigger
  const handleSelectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setPlaygroundBody(endpoint.requestBody || '');
    setSandboxResult(null);
  };

  // Run the API sandbox test
  const handleExecuteSandbox = () => {
    if (isSendingRequest) return;
    setIsSendingRequest(true);
    setSandboxResult(null);

    setTimeout(() => {
      // Validate Authorization header Simulation
      if (!playgroundToken || playgroundToken.trim() === '') {
        setSandboxResult({
          status: 401,
          text: 'Unauthorized',
          data: JSON.stringify({
            resourceType: "OperationOutcome",
            issue: [{
              severity: "fatal",
              code: "security",
              diagnostics: "Missing or invalid bearer token credentials. Access Denied."
            }]
          }, null, 2)
        });
        setIsSendingRequest(false);
        return;
      }

      // Check Body validity for POST actions
      if (selectedEndpoint.method === 'POST') {
        try {
          JSON.parse(playgroundBody);
        } catch (e: any) {
          setSandboxResult({
            status: 400,
            text: 'Bad Request',
            data: JSON.stringify({
              resourceType: "OperationOutcome",
              issue: [{
                severity: "error",
                code: "invalid",
                diagnostics: `JSON Parsing failure: ${e.message}`
              }]
            }, null, 2)
          });
          setIsSendingRequest(false);
          return;
        }
      }

      // Successful simulated responses
      setSandboxResult({
        status: selectedEndpoint.method === 'POST' ? 201 : 200,
        text: selectedEndpoint.method === 'POST' ? 'Created' : 'OK',
        data: selectedEndpoint.responseExample
      });
      setIsSendingRequest(false);
    }, 900);
  };

  // Generate dynamic cURL command
  const generatedCurlCommand = useMemo(() => {
    const url = `https://ehr.generalhospital.org${selectedEndpoint.path}`;
    const headersStr = selectedEndpoint.headers
      .map(h => `-H "${h.key}: ${h.key === 'Authorization' ? `Bearer ${playgroundToken}` : h.value}"`)
      .join(' \\\n  ');

    if (selectedEndpoint.method === 'POST') {
      const cleanBody = playgroundBody.replace(/"/g, '\\"').replace(/\n/g, '');
      return `curl -X POST "${url}" \\\n  ${headersStr} \\\n  -d "${cleanBody}"`;
    }
    return `curl -X GET "${url}" \\\n  ${headersStr}`;
  }, [selectedEndpoint, playgroundToken, playgroundBody]);

  // Handle Webhook Toggle
  const toggleWebhookStatus = (id: string) => {
    setWebhooks(prev => prev.map(wh => {
      if (wh.id === id) {
        const nextStatus = wh.status === 'Active' ? 'Inactive' : 'Active';
        return { ...wh, status: nextStatus };
      }
      return wh;
    }));
  };

  // Handle Delete Webhook
  const handleDeleteWebhook = (id: string) => {
    if (confirm("Are you sure you want to delete this HTTPS Webhook subscription?")) {
      setWebhooks(prev => prev.filter(wh => wh.id !== id));
    }
  };

  // Handle Event selection for creation
  const handleToggleEventSelection = (ev: string) => {
    setSelectedHookEvents(prev => 
      prev.includes(ev) ? prev.filter(item => item !== ev) : [...prev, ev]
    );
  };

  // Add webhook action
  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) {
      alert("Please specify a valid destination URL.");
      return;
    }
    if (selectedHookEvents.length === 0) {
      alert("Please select at least one event subscription topic.");
      return;
    }

    const newHook: Webhook = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl,
      events: selectedHookEvents,
      status: 'Active',
      created: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setWebhooks(prev => [...prev, newHook]);
    setNewWebhookUrl('');
    setSelectedHookEvents(['Patient Registered']);
    alert("New HTTPS Webhook registered successfully.");
  };

  // Test webhook ping
  const handleTestWebhook = (url: string) => {
    setIsTestingWebhook(true);
    setWebhookTestLog(null);

    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookTestLog(JSON.stringify({
        ping_timestamp: new Date().toISOString(),
        target_url: url,
        event_sent: "ping_connection_test",
        delivery_status: "DELIVERED",
        response_code: 200,
        latency_ms: 184,
        response_body: {
          success: true,
          agent: "clinical-webhook-dispatcher/v1"
        }
      }, null, 2));
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12 animate-fadeIn" id="api_page_root">
      
      {/* Banner / Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Braces size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 block mb-0.5">
                  Developer Interface
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  FHIR Integrations & Clinical API
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Integrate external hospital networks with your clinical workspace using secure HL7 FHIR APIs. Access credentials, test real-time endpoints inside the interactive playground, and hook into persistent HTTPS webhooks.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Authentication Credentials Block */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-150 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-950 tracking-tight">OAuth 2.0 Credentials</h3>
              <p className="text-xs text-gray-400">Secure credentials to sign external inbound FHIR HTTP clients.</p>
            </div>
          </div>

          <button
            onClick={handleRotateSecret}
            disabled={isRotating}
            className="px-3.5 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-950 hover:bg-gray-50 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isRotating ? 'animate-spin' : ''} />
            <span>{isRotating ? 'Rotating Keys...' : 'Rotate Client Secret'}</span>
          </button>
        </div>

        {/* Credentials Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Client ID */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client ID</label>
              <button
                onClick={() => handleCopyToClipboard(clientId, 'clientId')}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                {copiedLabel === 'clientId' ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={11} />}
                <span>{copiedLabel === 'clientId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex items-center px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 font-mono text-[11px] text-gray-700 select-all overflow-x-auto">
              {clientId}
            </div>
          </div>

          {/* Client Secret */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Secret</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1"
                >
                  {showSecret ? <EyeOff size={11} /> : <Eye size={11} />}
                  <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                </button>

                <button
                  onClick={() => handleCopyToClipboard(clientSecret, 'clientSecret')}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  {copiedLabel === 'clientSecret' ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedLabel === 'clientSecret' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 font-mono text-[11px] text-gray-700 select-all overflow-x-auto">
              <span>{showSecret ? clientSecret : '••••••••••••••••••••••••••••••••••••••••••••••••'}</span>
            </div>
          </div>

        </div>

        {/* Info banner HIPAA compliance */}
        <div className="bg-indigo-50/40 border border-indigo-150 p-3.5 rounded-xl text-xs text-indigo-950 flex gap-2.5">
          <ShieldAlert size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed text-indigo-900">
            <strong>Security Warning:</strong> These sandbox credentials represent authorized admin privileges. Never share Client Secrets in public code repositories or client-side application scripts. Access tokens expire after 60 minutes.
          </p>
        </div>
      </div>

      {/* Main Grid: Endpoints Explorer on Left & Live Interactive Sandbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Endpoints List (Left Side Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Layers size={13} />
            <span>FHIR v4 Endpoint Registry</span>
          </h3>

          <div className="space-y-3">
            {FHIR_ENDPOINTS.map((endpoint, index) => {
              const isSelected = selectedEndpoint.path === endpoint.path;
              const methodColors = {
                GET: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                POST: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                PUT: 'bg-amber-50 text-amber-700 border-amber-100',
                DELETE: 'bg-rose-50 text-rose-700 border-rose-100'
              }[endpoint.method];

              return (
                <div
                  key={index}
                  onClick={() => handleSelectEndpoint(endpoint)}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${methodColors}`}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-xs text-gray-800 font-bold block truncate max-w-[190px]" title={endpoint.path}>
                      {endpoint.path}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {endpoint.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Playground Sandbox (Right Side Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Play size={13} />
            <span>Live Interactive API Sandbox</span>
          </h3>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-gray-950">Active Test Canvas</h4>
                <p className="text-xs text-gray-400">Inspect payload structures and simulate HTTP calls.</p>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                selectedEndpoint.method === 'GET' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}>
                {selectedEndpoint.method} Node Selected
              </span>
            </div>

            {/* Simulated request setup fields */}
            <div className="space-y-4 text-xs">
              
              {/* Token bearer field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bearer Auth Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playgroundToken}
                    onChange={(e) => setPlaygroundToken(e.target.value)}
                    placeholder="Enter sandbox bearer token..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-mono text-[11px] text-gray-700"
                  />
                  <button 
                    onClick={() => setPlaygroundToken('sh_live_842a1290bb3918077cbf9d')}
                    className="px-3 border border-gray-200 hover:border-gray-300 rounded-xl text-gray-500 font-semibold shrink-0 cursor-pointer text-[10px]"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Editable request body (only for POST requests) */}
              {selectedEndpoint.method === 'POST' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Request Payload (JSON Body)</label>
                  <textarea
                    value={playgroundBody}
                    onChange={(e) => setPlaygroundBody(e.target.value)}
                    className="w-full h-40 p-3 rounded-xl bg-gray-950 text-gray-100 font-mono text-[11px] leading-relaxed border border-gray-900 focus:outline-none focus:border-indigo-500 resize-y"
                    placeholder="{}"
                  />
                </div>
              )}

              {/* Submit Trigger */}
              <button
                onClick={handleExecuteSandbox}
                disabled={isSendingRequest}
                className="w-full py-2.5 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingRequest ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Transmitting HTTP Request...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    <span>Send Request to Simulated Server</span>
                  </>
                )}
              </button>

            </div>

            {/* Tab navigation for response outputs */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-150 pb-1">
                <div className="flex gap-4">
                  <button
                    onClick={() => setSandboxTab('response')}
                    className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                      sandboxTab === 'response' ? 'text-gray-950 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-950'
                    }`}
                  >
                    Response Output
                  </button>

                  <button
                    onClick={() => setSandboxTab('curl')}
                    className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                      sandboxTab === 'curl' ? 'text-gray-950 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-950'
                    }`}
                  >
                    cURL Command
                  </button>
                </div>

                {sandboxTab === 'curl' && (
                  <button
                    onClick={() => handleCopyToClipboard(generatedCurlCommand, 'curl')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedLabel === 'curl' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedLabel === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                )}

                {sandboxTab === 'response' && sandboxResult && (
                  <button
                    onClick={() => handleCopyToClipboard(sandboxResult.data, 'resBody')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedLabel === 'resBody' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedLabel === 'resBody' ? 'Copied' : 'Copy Response'}</span>
                  </button>
                )}
              </div>

              {/* Sandbox terminal display */}
              {sandboxTab === 'response' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Simulated Response Stream</span>
                    {sandboxResult && (
                      <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        sandboxResult.status < 300 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        HTTP {sandboxResult.status} {sandboxResult.text}
                      </span>
                    )}
                  </div>

                  <div className="h-48 p-4 rounded-xl bg-gray-950 border border-gray-900 font-mono text-[10.5px] leading-relaxed text-gray-200 overflow-y-auto">
                    {sandboxResult ? (
                      <pre className="whitespace-pre-wrap">{sandboxResult.data}</pre>
                    ) : (
                      <div className="text-gray-500 italic text-center pt-14 space-y-1">
                        <p>No transactions initialized yet.</p>
                        <p className="text-[9px] font-normal not-italic text-gray-600">Click "Send Request to Simulated Server" to view output.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">cURL CLI Request</span>
                  <div className="h-48 p-4 rounded-xl bg-gray-950 border border-gray-900 font-mono text-[11px] leading-relaxed text-gray-300 overflow-y-auto">
                    <pre className="whitespace-pre">{generatedCurlCommand}</pre>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

      {/* Webhook Configuration Hub */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-150 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Globe size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-950 tracking-tight">Active HTTPS Webhooks</h3>
              <p className="text-xs text-gray-400">Configure outbound event broadcast endpoints for other hospital clusters.</p>
            </div>
          </div>
        </div>

        {/* Form to Register Webhook */}
        <form onSubmit={handleAddWebhook} className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs bg-gray-50/50 p-4 border border-gray-150 rounded-xl">
          
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payload Delivery URL</label>
            <input
              type="url"
              required
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="e.g. https://clinical.partnerhospital.org/events"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Event Subscription Trigger</label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {availableEvents.map(ev => {
                const isSelected = selectedHookEvents.includes(ev);
                return (
                  <button
                    type="button"
                    key={ev}
                    onClick={() => handleToggleEventSelection(ev)}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 text-white font-semibold' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {ev}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus size={12} />
              <span>Add Hook</span>
            </button>
          </div>

        </form>

        {/* List of active webhooks */}
        <div className="space-y-3">
          {webhooks.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-6">No webhooks registered.</p>
          ) : (
            webhooks.map((wh) => {
              const isActive = wh.status === 'Active';
              return (
                <div 
                  key={wh.id} 
                  className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                    isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-150 opacity-75'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-900 font-bold max-w-sm truncate block" title={wh.url}>
                        {wh.url}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {wh.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(ev => (
                        <span key={ev} className="bg-gray-100 border border-gray-200 text-gray-600 text-[9px] font-bold px-1.5 py-0.2 rounded">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTestWebhook(wh.url)}
                      className="px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:text-gray-950 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Ping Diagnostic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWebhookStatus(wh.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        isActive 
                          ? 'text-gray-600 hover:text-gray-950 border border-gray-200 bg-white hover:bg-gray-50' 
                          : 'text-white bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isActive ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 hover:bg-rose-50 hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Webhook Connection Test Logger */}
        {webhookTestLog && (
          <div className="border border-gray-150 rounded-xl p-4 bg-gray-50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Webhook Delivery Diagnostic Result</span>
              <button 
                onClick={() => setWebhookTestLog(null)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                Clear Log
              </button>
            </div>
            <div className="bg-gray-950 border border-gray-900 rounded-lg p-3 font-mono text-[10.5px] text-gray-200 overflow-x-auto max-h-48 leading-relaxed">
              <pre>{webhookTestLog}</pre>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
