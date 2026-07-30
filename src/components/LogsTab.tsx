import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Filter, Trash2, Download, RefreshCw, Play, 
  Terminal, CheckCircle2, AlertTriangle, XCircle, Lock, Database, 
  Cpu, Zap, Sparkles, Clock, Eye, Info, ExternalLink, Calendar, Check
} from 'lucide-react';

interface ClinicalLog {
  id: string;
  timestamp: string;
  severity: 'Info' | 'Success' | 'Warning' | 'Error' | 'Security';
  origin: 'FHIR Engine' | 'Auth Gateway' | 'Database Sync' | 'Billing Agent' | 'Orchestrator' | 'Outreach Dev';
  message: string;
  details: string; // JSON string or multiline log trace
  patientId?: string;
  traceId: string;
}

const INITIAL_LOGS: ClinicalLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-06-24 14:44:12',
    severity: 'Success',
    origin: 'FHIR Engine',
    message: 'Successfully parsed and committed Patient FHIR r4 resource for pat-94812.',
    traceId: 'tr-84091a9d-11',
    patientId: 'pat-94812',
    details: JSON.stringify({
      event: "FHIR_RESOURCE_CREATED",
      resourceType: "Patient",
      id: "pat-94812",
      active: true,
      metadata: {
        lastUpdated: "2026-06-24T14:44:11Z",
        source: "#hosp-import-client"
      },
      validation: {
        status: "Compliant",
        schema: "HL7 v4.0.1",
        diagnostic_score: 100
      }
    }, null, 2)
  },
  {
    id: 'log-102',
    timestamp: '2026-06-24 14:38:50',
    severity: 'Info',
    origin: 'Orchestrator',
    message: 'Dispatched automated SOAP synthesis request for Sample Patient.',
    traceId: 'tr-99201f8a-92',
    patientId: 'pat-94812',
    details: JSON.stringify({
      orchestration_id: "orch-soap-491",
      agent_id: "agent-copilot",
      parameters: {
        temperature: 0.2,
        model_tier: "Gemini 1.5 Pro (Clinical)"
      },
      tokens: {
        prompt: 1420,
        completion: 395
      }
    }, null, 2)
  },
  {
    id: 'log-103',
    timestamp: '2026-06-24 14:35:10',
    severity: 'Security',
    origin: 'Auth Gateway',
    message: 'Client credentials verified. Auth token issued for client_id hosp_client_942801_sec.',
    traceId: 'tr-55421a1b-01',
    details: JSON.stringify({
      auth_event: "CLIENT_CREDENTIALS_GRANT",
      client_id: "hosp_client_942801_sec",
      scopes: ["patient/*.read", "observation/*.write", "medrequest/*.write"],
      ip_address: "192.168.12.104",
      user_agent: "Mozilla/5.0 (Node.js REST-client)",
      token_expiry: "2026-06-24T15:35:10Z"
    }, null, 2)
  },
  {
    id: 'log-104',
    timestamp: '2026-06-24 14:28:11',
    severity: 'Success',
    origin: 'Database Sync',
    message: 'Inbound EHR Webhook synchronized. Merged 3 discrete observation nodes into patient records.',
    traceId: 'tr-72911d3c-44',
    patientId: 'pat-94812',
    details: JSON.stringify({
      sync_direction: "INBOUND",
      source_cluster: "hl7-broadcast-gateway",
      transaction_id: "tx-84291",
      records_inserted: {
        Observation: 1,
        MedicationRequest: 1,
        Encounter: 1
      },
      performance_ms: 142
    }, null, 2)
  },
  {
    id: 'log-105',
    timestamp: '2026-06-24 14:15:00',
    severity: 'Warning',
    origin: 'Billing Agent',
    message: 'Detected billing compliance warning: Potential upcoding risk detected on Ledger #ledg-8402.',
    traceId: 'tr-10492e88-66',
    details: JSON.stringify({
      audit_target: "ledger-8402",
      warnings: [
        {
          code: "CPT 99215",
          severity: "High",
          message: "Encounter listed as 15 minutes, which does not support maximum complexity CPT 99215 tier without extra rationale."
        },
        {
          code: "E11",
          severity: "Medium",
          message: "Nonspecific code format. Missing decimal extension parameters for diabetes mellitus classifications."
        }
      ]
    }, null, 2)
  },
  {
    id: 'log-106',
    timestamp: '2026-06-24 13:58:22',
    severity: 'Error',
    origin: 'FHIR Engine',
    message: 'Failed to process Observation payload: Missing required resourceType identifier.',
    traceId: 'tr-20491b92-55',
    details: JSON.stringify({
      error_class: "FHIR_SCHEMA_VALIDATION_ERROR",
      line_number: 2,
      raw_received_body: {
        "id": "obs-bad-100",
        "status": "preliminary",
        "value": 110.2
      },
      suggested_fix: "Ensure 'resourceType' is specified as a top-level JSON key and matches a standard HL7 profile."
    }, null, 2)
  },
  {
    id: 'log-107',
    timestamp: '2026-06-24 13:12:44',
    severity: 'Security',
    origin: 'Auth Gateway',
    message: 'Security Alert: Failed JWT token signature validation on POST /v4/api/Observation.',
    traceId: 'tr-39401f11-02',
    details: JSON.stringify({
      auth_failure: "INVALID_SIGNATURE",
      http_method: "POST",
      endpoint: "/v4/api/Observation",
      headers: {
        host: "fhir.generalhospital.org",
        authorization: "Bearer sh_live_invalid_signature_mock_key..."
      },
      client_ip: "103.88.22.14",
      action_taken: "Request rejected with HTTP 401 Unauthorized."
    }, null, 2)
  },
  {
    id: 'log-108',
    timestamp: '2026-06-24 12:45:00',
    severity: 'Info',
    origin: 'Outreach Dev',
    message: 'Dispatched SMS campaign trigger to Patient outreach system for pat-94812.',
    traceId: 'tr-44101e92-91',
    patientId: 'pat-94812',
    details: JSON.stringify({
      campaign_id: "welcome-intake-flow",
      channel: "SMS",
      destination: "+251912345678",
      template_mapped: "discharge-easy-reading-v1",
      body: "Hello, your intake is complete. Please read your discharge details."
    }, null, 2)
  }
];

export default function LogsTab() {
  const [logs, setLogs] = useState<ClinicalLog[]>(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<ClinicalLog | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter Categories
  const severities = ['All', 'Success', 'Info', 'Warning', 'Error', 'Security'];
  const origins = ['All', 'FHIR Engine', 'Auth Gateway', 'Database Sync', 'Billing Agent', 'Orchestrator', 'Outreach Dev'];

  // Handle Dynamic Log Simulator
  const handleSimulateEvent = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const eventPool: Omit<ClinicalLog, 'id' | 'timestamp' | 'traceId'>[] = [
        {
          severity: 'Success',
          origin: 'FHIR Engine',
          message: 'HL7 semantic check passed. Uploaded MedicationRequest prescription: Metformin 500mg.',
          patientId: 'pat-94812',
          details: JSON.stringify({
            resourceType: "MedicationRequest",
            id: "med-94801",
            status: "active",
            intent: "order",
            agent: "agent-copilot-scribe",
            medication: "Metformin Hydrochloride 500mg Oral Tablet"
          }, null, 2)
        },
        {
          severity: 'Error',
          origin: 'Auth Gateway',
          message: 'Client authorization rejected. HMAC authentication signature mismatch.',
          details: JSON.stringify({
            request_uri: "/v4/api/Patient/pat-94812",
            remote_ip: "203.0.113.195",
            error: "HMAC_VALIDATION_FAILED",
            auth_header_sent: "X-Hub-Signature-256=abcdef123456"
          }, null, 2)
        },
        {
          severity: 'Info',
          origin: 'Orchestrator',
          message: 'Evaluating logical automation condition for: High-Risk Diabetic Outreach pipeline.',
          patientId: 'pat-94812',
          details: JSON.stringify({
            pipeline: "High-Risk Diabetic Outreach",
            eval_variable: "Glucose Level",
            eval_value: "135 mg/dL",
            operator: ">",
            threshold: "125 mg/dL",
            outcome: "TRUE - Condition Matched"
          }, null, 2)
        },
        {
          severity: 'Security',
          origin: 'Auth Gateway',
          message: 'Emergency Token Rotation executed. Regenerated active Client Secret live key.',
          details: JSON.stringify({
            rotation_trigger: "MANUAL_REGENERATION_REQUEST",
            user_auth_email: "officer@hospital.id",
            rotated_client_id: "hosp_client_942801_sec",
            active_from: new Date().toISOString()
          }, null, 2)
        },
        {
          severity: 'Warning',
          origin: 'Billing Agent',
          message: 'Billing review completed with moderate warnings. Missing practitioner digital stamp.',
          details: JSON.stringify({
            ledger_id: "ledg-4921",
            audit_score: 95,
            warnings: [
              {
                code: "SIGN-OFF-REQUIRED",
                severity: "Medium",
                message: "Awaiting attending physician credentials validation check."
              }
            ]
          }, null, 2)
        },
        {
          severity: 'Success',
          origin: 'Database Sync',
          message: 'Synchronized live FHIR resources with main secure Cloud Firestore instance.',
          details: JSON.stringify({
            database_id: "ai-studio-edd8b8c1-fb00-42fa-8f93",
            target_collection: "fhir_resources",
            records_updated: 1,
            operation_latency: "112ms"
          }, null, 2)
        }
      ];

      const chosenEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
      const randTraceId = 'tr-' + Math.random().toString(16).substring(2, 10) + '-' + Math.floor(Math.random() * 90 + 10);
      const now = new Date();
      const formatTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newLog: ClinicalLog = {
        id: `log-${Date.now()}`,
        timestamp: formatTime,
        traceId: randTraceId,
        ...chosenEvent
      };

      setLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.traceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.patientId && log.patientId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeverity = selectedSeverity === 'All' || log.severity === selectedSeverity;
      const matchesOrigin = selectedOrigin === 'All' || log.origin === selectedOrigin;

      return matchesSearch && matchesSeverity && matchesOrigin;
    });
  }, [logs, searchQuery, selectedSeverity, selectedOrigin]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter(l => l.severity === 'Error').length;
    const warnings = logs.filter(l => l.severity === 'Warning').length;
    const security = logs.filter(l => l.severity === 'Security').length;
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) : '0.0';
    const healthScore = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : '100.0';

    return {
      total,
      errors,
      warnings,
      security,
      errorRate,
      healthScore
    };
  }, [logs]);

  // Handle Export to JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `clinical_sandbox_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Clear all logs helper
  const handleClearLogs = () => {
    if (confirm("Are you sure you want to flush the system log buffer? Unsaved sandbox event streams will be permanently cleared.")) {
      setLogs([]);
      setSelectedLog(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12 animate-fadeIn" id="clinical_logs_root">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <FileText size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-rose-600 block mb-0.5">
                  Diagnostic Telemetry
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Real-time Auditing & System Logs
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Inspect clinical transactions, authentication grant cycles, pipeline executions, and semantic validation anomalies. Stream live sandbox diagnostic events and audit trace payloads for HIPAA compliance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleSimulateEvent}
              disabled={isSimulating}
              className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="animate-spin" size={13} />
                  <span>Emitting Event...</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>Simulate Clinical Event</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-950 hover:bg-gray-50 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-gray-50 text-gray-500 rounded-xl">
            <Terminal size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Total Logs Buffer</span>
            <span className="text-xl font-extrabold text-gray-950 block">{stats.total}</span>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">System Health</span>
            <span className="text-xl font-extrabold text-emerald-700 block">{stats.healthScore}%</span>
          </div>
        </div>

        {/* Security Events */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Lock size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Security Grants</span>
            <span className="text-xl font-extrabold text-indigo-600 block">{stats.security}</span>
          </div>
        </div>

        {/* Diagnostic Errors */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Anomalies / Errors</span>
            <span className="text-xl font-extrabold text-rose-600 block">{stats.errors}</span>
          </div>
        </div>
      </div>

      {/* Main Logs Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        
        {/* Filters and Search Bar Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
          
          {/* Search */}
          <div className="relative w-full md:max-w-xs text-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trace IDs, message, or patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 focus:border-gray-450 rounded-xl bg-white focus:outline-none font-medium"
            />
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto text-[11px]">
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Severity:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/40">
                {severities.map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2 py-1 font-bold rounded-md transition-all ${
                      selectedSeverity === sev 
                        ? 'bg-white text-gray-950 shadow-2xs' 
                        : 'text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 pt-1 md:pt-0">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Origin:</span>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-gray-400"
              >
                {origins.map(origin => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleClearLogs}
              className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 hover:border-rose-100 hover:bg-rose-50 rounded-lg ml-auto md:ml-2 transition-colors cursor-pointer"
              title="Flush Log Cache"
            >
              <Trash2 size={13} />
            </button>
          </div>

        </div>

        {/* Logs Table / List */}
        <div className="overflow-hidden border border-gray-150 rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150 text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Severity</th>
                  <th scope="col" className="px-4 py-3">Origin</th>
                  <th scope="col" className="px-4 py-3">Message</th>
                  <th scope="col" className="px-4 py-3">Trace ID</th>
                  <th scope="col" className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-150 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 italic">
                      No system transaction logs found matching active filter configurations.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badgeStyles = {
                      Success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                      Info: 'bg-blue-50 border-blue-100 text-blue-700',
                      Warning: 'bg-amber-50 border-amber-100 text-amber-700',
                      Error: 'bg-rose-50 border-rose-100 text-rose-700',
                      Security: 'bg-indigo-50 border-indigo-100 text-indigo-700'
                    }[log.severity];

                    return (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gray-50/50 transition-colors ${selectedLog?.id === log.id ? 'bg-indigo-50/20' : ''}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="opacity-60" />
                            <span>{log.timestamp}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${badgeStyles}`}>
                            {log.severity}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-700 text-[11px]">
                          {log.origin}
                        </td>

                        <td className="px-4 py-3 text-[11.5px] text-gray-900 font-medium max-w-[280px] truncate" title={log.message}>
                          {log.message}
                          {log.patientId && (
                            <span className="ml-1.5 inline-block text-[9px] bg-gray-100 border border-gray-200 text-gray-500 font-bold px-1 py-0.2 rounded">
                              {log.patientId}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-[10.5px] font-mono text-gray-400">
                          {log.traceId}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-white border border-indigo-200 hover:border-transparent hover:bg-indigo-600 bg-indigo-50/20 rounded-md transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={11} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DETAILED LOG INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="log_inspect_modal_overlay">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full shadow-2xl overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Terminal size={16} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-950 tracking-tight">Clinical Log Inspector</h3>
                  <p className="text-[10px] text-gray-400">Trace: <code className="font-mono">{selectedLog.traceId}</code></p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Timestamp</span>
                  <span className="font-mono text-gray-800 text-[11px] block">{selectedLog.timestamp}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Sub-system Origin</span>
                  <span className="font-bold text-gray-800 text-[11px] block">{selectedLog.origin}</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Log Message Directive</span>
                <p className="text-[12px] text-gray-900 bg-indigo-50/25 border border-indigo-100 p-3 rounded-xl leading-relaxed font-semibold">
                  {selectedLog.message}
                </p>
              </div>

              {/* JSON Trace / Metadata Details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Structured JSON Telemetry Metadata</span>
                  <button
                    onClick={() => handleCopyToClipboard(selectedLog.details, 'details')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedText === 'details' ? <Check size={11} className="text-emerald-600" /> : <RefreshCw size={11} />}
                    <span>{copiedText === 'details' ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>

                <div className="bg-gray-950 rounded-xl p-4 font-mono text-[11px] text-gray-200 overflow-y-auto max-h-64 leading-relaxed border border-gray-900">
                  <pre>{selectedLog.details}</pre>
                </div>
              </div>

              {/* HIPAA Statement */}
              <div className="bg-emerald-50/40 border border-emerald-150 p-3.5 rounded-xl text-xs text-emerald-950 flex gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold block">Zero PHI Disclosed Security Lock</span>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    This trace telemetry is compiled inside the sandboxed node. Standard decryption certificates are required for production database exports.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Close Diagnostic View
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
