import React, { useState } from 'react';
import { 
  Plug, CheckCircle2, XCircle, RefreshCw, Play, Settings, Search, Filter, 
  ArrowRight, ShieldCheck, Database, MessageSquare, CreditCard, Cloud, 
  ExternalLink, FileText, Sparkles, Copy, Check, ChevronRight, HelpCircle,
  Activity, Radio
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'Clinical' | 'Billing' | 'Communication' | 'Cloud';
  status: 'Connected' | 'Inactive' | 'Pending';
  icon: React.ComponentType<any>;
  partnerName: string;
  docsUrl: string;
  config: {
    endpointUrl?: string;
    clientId?: string;
    webhookUrl?: string;
    authMethod?: string;
  };
  logs: string[];
}

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'int-fhir',
      name: 'HL7 FHIR Interoperability Gateway',
      description: 'Exchange HIPAA-compliant Electronic Health Records (EHR) with regional hospitals, labs, and clinics.',
      category: 'Clinical',
      status: 'Connected',
      icon: Activity,
      partnerName: 'HL7 International',
      docsUrl: 'https://hl7.org/fhir/',
      config: {
        endpointUrl: 'https://fhir.generalhospital.org/v4/api',
        clientId: 'g-hospital-ehr-prod',
        webhookUrl: 'https://fhir.generalhospital.org/webhooks/inbound',
        authMethod: 'OAuth2 Client Credentials'
      },
      logs: [
        '[2026-06-24 08:30:11] Sync: Exchanged 45 patient registries with regional health repository.',
        '[2026-06-24 11:15:22] Webhook: Received inbound diagnostic report for patient #10492.',
        '[2026-06-24 12:45:00] Handshake: FHIR v4 endpoint responded HTTP 200 OK.'
      ]
    },
    {
      id: 'int-stripe',
      name: 'Stripe Healthcare Billing',
      description: 'Process patient co-pays, insurance claims, and paperless card terminals securely on-site.',
      category: 'Billing',
      status: 'Connected',
      icon: CreditCard,
      partnerName: 'Stripe, Inc.',
      docsUrl: 'https://stripe.com/docs',
      config: {
        endpointUrl: 'https://api.stripe.com/v3',
        clientId: 'ca_stripe_hosp_9482910',
        webhookUrl: 'https://ehr.generalhospital.org/api/billing/stripe-webhook',
        authMethod: 'Bearer Secret Token'
      },
      logs: [
        '[2026-06-24 09:12:05] Invoice: Dispatched secure charge link for co-pay admission.',
        '[2026-06-24 10:44:30] Webhook: Stripe Terminal card event - Charge completed for 45.00 USD.'
      ]
    },
    {
      id: 'int-twilio',
      name: 'Twilio SMS & Alert Broadcast',
      description: 'Auto-dispatch patient appointment cards, diagnostic reminders, and emergency shift overrides.',
      category: 'Communication',
      status: 'Inactive',
      icon: MessageSquare,
      partnerName: 'Twilio Cloud',
      docsUrl: 'https://twilio.com/docs',
      config: {
        endpointUrl: 'https://api.twilio.com/2010-04-01',
        clientId: 'AC_twilio_hosp_47321',
        webhookUrl: '',
        authMethod: 'Account SID & Auth Token'
      },
      logs: []
    },
    {
      id: 'int-gcp',
      name: 'Google Cloud Healthcare API',
      description: 'HIPAA-compliant raw server snapshots, metadata, and BigQuery analytics synchronization.',
      category: 'Cloud',
      status: 'Pending',
      icon: Cloud,
      partnerName: 'Google Cloud Platform',
      docsUrl: 'https://cloud.google.com/healthcare-api',
      config: {
        endpointUrl: 'https://healthcare.googleapis.com/v1/projects/hosp-ehr',
        clientId: 'gcp-service-account-ehr@hospital.iam.gserviceaccount.com',
        webhookUrl: '',
        authMethod: 'JSON Service Account Key'
      },
      logs: [
        '[2026-06-24 12:00:10] Connection requested. SSL challenge verified.',
        '[2026-06-24 12:01:45] Warning: Waiting for IAM role "Healthcare Dataset Administrator" approval.'
      ]
    },
    {
      id: 'int-surescripts',
      name: 'Surescripts E-Prescription Node',
      description: 'Dispatch clinical pharmaceutical prescriptions directly to patient-preferred local pharmacy networks.',
      category: 'Clinical',
      status: 'Inactive',
      icon: Radio,
      partnerName: 'Surescripts Network',
      docsUrl: 'https://surescripts.com/get-started',
      config: {
        endpointUrl: 'https://api.surescripts.net/v12/prescribe',
        clientId: '',
        webhookUrl: '',
        authMethod: 'X.509 Client Certificate'
      },
      logs: []
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Clinical' | 'Billing' | 'Communication' | 'Cloud'>('All');
  const [activeIntegration, setActiveIntegration] = useState<Integration | null>(integrations[0]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [showDocsHelp, setShowDocsHelp] = useState(false);

  // Edit config fields state
  const [endpointInput, setEndpointInput] = useState(activeIntegration?.config.endpointUrl || '');
  const [clientIdInput, setClientIdInput] = useState(activeIntegration?.config.clientId || '');
  const [webhookInput, setWebhookInput] = useState(activeIntegration?.config.webhookUrl || '');

  // Keep edit state synced with active selection
  const handleSelectIntegration = (integ: Integration) => {
    setActiveIntegration(integ);
    setEndpointInput(integ.config.endpointUrl || '');
    setClientIdInput(integ.config.clientId || '');
    setWebhookInput(integ.config.webhookUrl || '');
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(key);
    setTimeout(() => setCopiedValue(null), 1500);
  };

  const handleToggleStatus = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = (item.status === 'Connected' ? 'Inactive' : 'Connected') as 'Inactive' | 'Pending' | 'Connected';
        const updatedLogs = [...item.logs];
        if (nextStatus === 'Connected') {
          updatedLogs.push(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Connection established by system admin.`);
        } else {
          updatedLogs.push(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Connection deactivated.`);
        }
        
        const updatedItem = { ...item, status: nextStatus, logs: updatedLogs };
        if (activeIntegration?.id === id) {
          setActiveIntegration(updatedItem);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntegration) return;

    setIntegrations(prev => prev.map(item => {
      if (item.id === activeIntegration.id) {
        const updatedLogs = [...item.logs, `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Configuration parameters modified.`];
        const updatedItem = {
          ...item,
          config: {
            ...item.config,
            endpointUrl: endpointInput,
            clientId: clientIdInput,
            webhookUrl: webhookInput
          },
          logs: updatedLogs
        };
        setActiveIntegration(updatedItem);
        return updatedItem;
      }
      return item;
    }));
    alert("Integration parameters updated successfully!");
  };

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setIntegrations(prev => prev.map(item => {
        if (item.id === id) {
          const success = Math.random() > 0.15; // 85% success simulation
          const updatedLogs = [...item.logs];
          
          if (success) {
            updatedLogs.push(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Test successful: Responded in 240ms with valid payload.`);
            alert(`"${item.name}" connection test successful!`);
            // Upgrade pending or inactive to connected on success test if they wish
            const nextStatus = item.status === 'Pending' ? 'Connected' : item.status;
            
            const updatedItem = { ...item, status: nextStatus, logs: updatedLogs };
            if (activeIntegration?.id === id) {
              setActiveIntegration(updatedItem);
            }
            return updatedItem;
          } else {
            updatedLogs.push(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Test error: Authentication handshake rejected (HTTP 401).`);
            alert(`"${item.name}" connection test failed: Check credentials key configurations.`);
            
            const updatedItem = { ...item, logs: updatedLogs };
            if (activeIntegration?.id === id) {
              setActiveIntegration(updatedItem);
            }
            return updatedItem;
          }
        }
        return item;
      }));
      setTestingId(null);
    }, 1500);
  };

  // Filter list
  const filteredIntegrations = integrations.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Dynamic Main Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Plug size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600 block mb-0.5">
                  Extensibility Hub
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Clinical & Partner Integrations
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Sync your electronic medical records with international laboratories, process real-time hospital copays via Stripe, and schedule custom Twilio SMS updates automatically. All channels are audited in strict compliance with HIPAA security frameworks.
            </p>
          </div>

          <button 
            onClick={() => setShowDocsHelp(!showDocsHelp)}
            className="text-xs font-bold text-gray-500 hover:text-gray-950 flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <HelpCircle size={14} />
            <span>{showDocsHelp ? 'Hide Info' : 'FHIR Standards'}</span>
          </button>
        </div>

        {/* Dynamic Expandable Info Panel */}
        {showDocsHelp && (
          <div className="mt-6 border-t border-gray-150 pt-5 space-y-4 text-xs text-gray-600 leading-relaxed animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">HL7 FHIR compliant</h4>
                <p>Fast Healthcare Interoperability Resources (FHIR) defines a set of rules for exchanging clinical records electronically using simple REST web APIs.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">TLS End-to-End</h4>
                <p>All integrations enforce dynamic cryptographic handshakes ensuring medical logs, patient queues, and invoices stay secure during transit.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">Audit Log Compliance</h4>
                <p>Every inbound trigger, parameter alteration, and handshake is continuously saved with millisecond time targets for audit validation.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter / Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'Clinical', 'Billing', 'Communication', 'Cloud'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-gray-950 text-white shadow-xs' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Main Grid: Lists and Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Integrations List (Span 5) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1">Available Services</h3>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredIntegrations.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-xs">
                No integrations match search criteria.
              </div>
            ) : (
              filteredIntegrations.map((item) => {
                const isSelected = activeIntegration?.id === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectIntegration(item)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex gap-3 cursor-pointer ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/10 ring-1 ring-blue-600/10 shadow-xs' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <IconComponent size={18} />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center w-full">
                        <h4 className="font-bold text-gray-950 truncate pr-1">{item.name}</h4>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          item.status === 'Connected' ? 'bg-emerald-50 text-emerald-700' :
                          item.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Configuration & Management Panel (Span 7) */}
        <div className="lg:col-span-7">
          {activeIntegration ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fadeIn">
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-gray-950 tracking-tight">{activeIntegration.name}</h3>
                    <a 
                      href={activeIntegration.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                      title="Read Docs"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">Provided by {activeIntegration.partnerName}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(activeIntegration.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      activeIntegration.status === 'Connected'
                        ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {activeIntegration.status === 'Connected' ? 'Disconnect' : 'Connect Gateway'}
                  </button>
                  
                  <button
                    disabled={testingId === activeIntegration.id}
                    onClick={() => handleTestConnection(activeIntegration.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-xs transition-colors"
                    title="Test health payload handshake"
                  >
                    {testingId === activeIntegration.id ? (
                      <RefreshCw className="animate-spin text-blue-600" size={14} />
                    ) : (
                      <Play size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Status Alert blocks */}
              {activeIntegration.status === 'Connected' && (
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex gap-3 text-left">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-emerald-950">Integration is fully established</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      API requests are fully routing and authorized. Sync channels are actively listening to local updates for secure state replication.
                    </p>
                  </div>
                </div>
              )}

              {activeIntegration.status === 'Pending' && (
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex gap-3 text-left">
                  <RefreshCw className="text-amber-500 animate-spin shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-amber-900">Waiting for clinical authorization</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      The service account lacks dataset approval roles. Ensure your provider project has mapped IAM permissions mapped as described under our configuration logs.
                    </p>
                  </div>
                </div>
              )}

              {activeIntegration.status === 'Inactive' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3 text-left">
                  <XCircle className="text-gray-400 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-gray-800">Connection Offline</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      No credentials or active tokens are authorized. Complete the parameter configuration form below and hit "Connect Gateway" to initialize.
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Settings Form */}
              <form onSubmit={handleSaveChanges} className="space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Configuration parameters</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target API Endpoint URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={endpointInput}
                        onChange={(e) => setEndpointInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl text-gray-800 font-mono"
                        placeholder="https://api.partner.com/v1"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(endpointInput, 'endpoint')}
                        className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"
                      >
                        {copiedValue === 'endpoint' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Identity ID / User Key</label>
                    <input 
                      type="text" 
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl text-gray-800 font-mono"
                      placeholder="e.g. client_9482910"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Authorization Protocol</label>
                    <input 
                      type="text" 
                      disabled
                      value={activeIntegration.config.authMethod || 'Bearer Secret Token'}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-400 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inbound Webhook Destination</label>
                    <input 
                      type="text" 
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl text-gray-800 font-mono"
                      placeholder="e.g. https://ehr.generalhospital.org/api/inbound"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Save Parameters
                  </button>
                </div>
              </form>

              {/* Audit Logs Block */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Recent Health Logs</h4>
                  <span className="text-[10px] text-gray-400 font-semibold">Last 10 payload cycles</span>
                </div>

                <div className="bg-gray-950 rounded-xl p-4 font-mono text-[11px] text-gray-300 space-y-1.5 overflow-x-auto max-h-[160px]">
                  {activeIntegration.logs.length === 0 ? (
                    <p className="text-gray-500 italic">No transactions processed yet.</p>
                  ) : (
                    activeIntegration.logs.map((log, i) => (
                      <div key={i} className="whitespace-nowrap flex gap-1">
                        <span className="text-teal-400 font-semibold">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-xs">
              <Plug size={40} className="text-gray-300 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-gray-500">Select an integration from the available services list to configure parameters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
