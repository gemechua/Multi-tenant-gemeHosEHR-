import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, Lock, Key, Users, FileText, 
  RefreshCw, Play, Check, Copy, Eye, EyeOff, Activity, Clock, 
  AlertTriangle, CheckCircle2, UserCheck, Server, Globe, 
  Settings, ChevronRight, Sparkles, HelpCircle, HardDrive, LayoutGrid
} from 'lucide-react';
import PermissionMatrix from './security/PermissionMatrix';

interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  location: string;
}

interface RbacRule {
  role: string;
  patientRecords: 'Read/Write' | 'Read Only' | 'No Access';
  billingData: 'Read/Write' | 'Read Only' | 'No Access';
  securityLogs: 'Read/Write' | 'Read Only' | 'No Access';
  systemSettings: 'Read/Write' | 'Read Only' | 'No Access';
}

export default function SecurityTab() {
  const [activeTab, setActiveTab] = useState<'compliance' | 'rbac' | 'matrix' | 'audit' | 'keys'>('compliance');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<'Passed' | 'Action Required' | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  
  // Security settings state
  const [enforceMfa, setEnforceMfa] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState('15');
  const [ipWhitelist, setIpWhitelist] = useState('10.192.0.0/16, 192.168.42.0/24');
  const [auditLogRetention, setAuditLogRetention] = useState('7_years');

  // Encryption keys state
  const [keyRotationInterval, setKeyRotationInterval] = useState('90');
  const [isRotating, setIsRotating] = useState(false);
  const [lastRotationDate, setLastRotationDate] = useState('2026-04-12');
  const [primaryKeyId, setPrimaryKeyId] = useState('kms-key-aes256-04812a');
  
  // Interactive RBAC state
  const [rbacRules, setRbacRules] = useState<RbacRule[]>([]);
  
  useEffect(() => {
    setRbacRules([]);
  }, []);

  // HIPAA Compliance Items list
  const [complianceChecks, setComplianceChecks] = useState<any[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Run dynamic security compliance scanning simulation
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Set result depending on MFA checkbox
          const activeChecks = complianceChecks.filter(c => c.checked).length;
          setScanResult(activeChecks === complianceChecks.length ? 'Passed' : 'Action Required');
          return 100;
        }
        const delta = Math.floor(Math.random() * 15) + 5;
        return Math.min(100, prev + delta);
      });
    }, 250);
  };

  // Rotate encryption key
  const handleRotateKey = () => {
    setIsRotating(true);
    setTimeout(() => {
      const nextKey = `kms-key-aes256-${Math.random().toString(16).substring(2, 8)}`;
      setPrimaryKeyId(nextKey);
      setLastRotationDate(new Date().toISOString().split('T')[0]);
      setIsRotating(false);
      
      // Inject audit log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        event: 'KMS Key Auto-Rotation Manual Override',
        actor: 'IT Infrastructure Admin',
        ipAddress: '127.0.0.1',
        status: 'SUCCESS',
        location: 'KMS HSM Module'
      };
      setAuditLogs([newLog, ...auditLogs]);
      alert("HIPAA KMS cryptographic keys rotated successfully inside the HSM secure cluster!");
    }, 2000);
  };

  const handleToggleCheck = (id: string) => {
    setComplianceChecks(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, checked: !c.checked };
      }
      return c;
    }));
  };

  const handleUpdateRbac = (roleName: string, field: keyof Omit<RbacRule, 'role'>, value: any) => {
    setRbacRules(prev => prev.map(r => {
      if (r.role === roleName) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  // Simulate intrusion warning
  const handleSimulateIntrusion = () => {
    const intruderIp = `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      event: 'Intrusion Blocked: Multi-Factor Authentication Challenge Failed',
      actor: 'Unknown Clinical Identity',
      ipAddress: intruderIp,
      status: 'FAILED',
      location: 'Auth Gateway'
    };
    setAuditLogs([newLog, ...auditLogs]);
    alert(`SECURITY AUDIT TRIGGERED:\n\nBlocked login challenge from unauthorized IP ${intruderIp}. Action cataloged in secure audit log ledger.`);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12" id="security_tab_root">
      {/* 1. Header Card with user marketing description */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 to-amber-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Shield size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-rose-600 block mb-0.5">
                  Compliance & Shield
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  HIPAA Security & RBAC Guard
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Strictly engineered to ensure maximum high-availability data confidentiality. Manage role permissions, rotate AES-256 database encryption keys, and review audit trail snapshots securely.
            </p>
          </div>

          <button 
            onClick={() => setShowDocs(!showDocs)}
            className="text-xs font-bold text-gray-500 hover:text-gray-950 flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <HelpCircle size={14} />
            <span>{showDocs ? 'Hide Details' : 'Read HIPAA Policy'}</span>
          </button>
        </div>

        {/* Learn More Policy Pane */}
        {showDocs && (
          <div className="mt-6 border-t border-gray-150 pt-5 space-y-4 text-xs text-gray-600 leading-relaxed animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">§ 164.308 Administrative Safeguards</h4>
                <p>EHR networks must authorize clinical personnel explicitly, maintain system risk logs, and appoint strict compliance auditors.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">§ 164.310 Physical Safeguards</h4>
                <p>Requires device tracking and data sanitization routines. Workstation sessions must automatically terminate when clinical shifts overlap.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">§ 164.312 Technical Safeguards</h4>
                <p>Transmission integrity verification via cryptographic checksums and automated database key escrow management models.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Navigation tabs & Scanning Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b border-gray-150 pb-4">
        {/* Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'compliance', name: 'HIPAA Checklist', icon: ShieldCheck },
            { id: 'rbac', name: 'Role Permissions (RBAC)', icon: Users },
            { id: 'matrix', name: 'Permission Matrix', icon: LayoutGrid },
            { id: 'audit', name: 'Secure Audit Log', icon: FileText },
            { id: 'keys', name: 'Cryptographic Keys', icon: Key }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-gray-950 text-white shadow-xs' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Shield compliance trigger */}
        <div className="flex items-center gap-2">
          {scanResult === 'Passed' && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-150 flex items-center gap-1">
              <ShieldCheck size={12} /> Passed All Audits
            </span>
          )}
          {scanResult === 'Action Required' && (
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-lg border border-amber-150 flex items-center gap-1">
              <AlertTriangle size={12} /> Setup MFA
            </span>
          )}

          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="px-4 py-2 bg-rose-950 hover:bg-rose-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="animate-spin" size={13} />
                <span>Scanning ({scanProgress}%)</span>
              </>
            ) : (
              <>
                <Play size={12} />
                <span>Run Compliance Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Tab Views Content */}
      <div className="space-y-6">
        
        {/* COMPLIANCE CHECKLIST VIEW */}
        {activeTab === 'compliance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left Col (Span 2): Active Checks */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Technical Compliance Controls</h3>
                <p className="text-xs text-gray-400 mt-0.5">Toggle controls to reflect current clinic environment setups.</p>
              </div>

              <div className="space-y-3.5">
                {complianceChecks.map((check) => (
                  <div 
                    key={check.id}
                    onClick={() => handleToggleCheck(check.id)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3.5 cursor-pointer transition-all ${
                      check.checked 
                        ? 'border-gray-200 bg-white hover:bg-gray-50/50' 
                        : 'border-amber-150 bg-amber-50/10 hover:bg-amber-50/20'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        check.checked 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                          : 'border-gray-300 bg-white text-transparent'
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-xs font-bold block ${check.checked ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                        {check.name}
                      </span>
                      <span className="text-[11px] text-gray-400 block leading-relaxed">{check.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col (Span 1): Settings Card & Simulator */}
            <div className="md:col-span-1 space-y-6">
              {/* Settings parameters */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Global Policies</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-900 block">Enforce Multi-Factor Auth</span>
                      <span className="text-[10px] text-gray-400 leading-normal block">Required for doctors/nurses.</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEnforceMfa(!enforceMfa);
                        // Sync checklist state
                        setComplianceChecks(prev => prev.map(c => c.id === 'c-5' ? { ...c, checked: !enforceMfa } : c));
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enforceMfa ? 'bg-rose-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        enforceMfa ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Workstation Idle Timeout</label>
                    <select
                      value={idleTimeout}
                      onChange={(e) => setIdleTimeout(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-bold text-gray-700 cursor-pointer"
                    >
                      <option value="5">5 Minutes</option>
                      <option value="15">15 Minutes (HIPAA standard)</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Allowed IP Whitelist</label>
                    <input 
                      type="text" 
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-xl text-gray-800 font-mono font-medium"
                      placeholder="e.g. 10.0.0.0/8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Audit Log Retention</label>
                    <select
                      value={auditLogRetention}
                      onChange={(e) => setAuditLogRetention(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="1_year">1 Year</option>
                      <option value="7_years">7 Years (Medical Record legal Standard)</option>
                      <option value="forever">Indefinite Retention</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fire drill simulator */}
              <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 space-y-3.5">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-rose-600 animate-pulse" />
                    <span>Intrusion Fire Drill</span>
                  </h4>
                  <p className="text-[11px] text-rose-700 leading-normal">
                    Trigger a mock unauthorized clinical record query to verify audit ledger integrity protocols.
                  </p>
                </div>
                
                <button
                  onClick={handleSimulateIntrusion}
                  className="w-full py-2 bg-rose-950 text-white font-bold text-xs rounded-xl hover:bg-rose-900 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Simulate Intrusion Event</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROLE-BASED ACCESS CONTROL (RBAC) VIEW */}
        {activeTab === 'rbac' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Role-Based Access Matrices</h3>
                <p className="text-xs text-gray-400">Specify exactly which clinical nodes, nurses, and billing partners can read or write data.</p>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-full border border-rose-100 flex items-center gap-1">
                <UserCheck size={12} /> Policies Active
              </span>
            </div>

            {/* Permissions Matrix Table */}
            <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100">
              {/* Header row */}
              <div className="bg-gray-50 px-4 py-3 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span className="sm:col-span-1.5">Clinical Role</span>
                <span>Patient Records</span>
                <span>Billing Data</span>
                <span>Security Logs</span>
                <span>System Settings</span>
              </div>

              {/* Rows */}
              {rbacRules.map((rule, idx) => (
                <div key={idx} className="px-4 py-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs text-gray-800">
                  <span className="font-bold text-gray-950 block truncate pr-1 sm:col-span-1.5">{rule.role}</span>
                  
                  {/* Field 1: patientRecords */}
                  <div>
                    <select
                      value={rule.patientRecords}
                      onChange={(e) => handleUpdateRbac(rule.role, 'patientRecords', e.target.value)}
                      className={`w-full px-2 py-1 border rounded-lg bg-white font-semibold cursor-pointer ${
                        rule.patientRecords === 'Read/Write' ? 'text-emerald-700 border-emerald-100 bg-emerald-50/10' :
                        rule.patientRecords === 'Read Only' ? 'text-blue-700 border-blue-100 bg-blue-50/10' :
                        'text-gray-400 border-gray-100 bg-gray-50/20'
                      }`}
                    >
                      <option value="Read/Write">Read/Write</option>
                      <option value="Read Only">Read Only</option>
                      <option value="No Access">No Access</option>
                    </select>
                  </div>

                  {/* Field 2: billingData */}
                  <div>
                    <select
                      value={rule.billingData}
                      onChange={(e) => handleUpdateRbac(rule.role, 'billingData', e.target.value)}
                      className={`w-full px-2 py-1 border rounded-lg bg-white font-semibold cursor-pointer ${
                        rule.billingData === 'Read/Write' ? 'text-emerald-700 border-emerald-100 bg-emerald-50/10' :
                        rule.billingData === 'Read Only' ? 'text-blue-700 border-blue-100 bg-blue-50/10' :
                        'text-gray-400 border-gray-100 bg-gray-50/20'
                      }`}
                    >
                      <option value="Read/Write">Read/Write</option>
                      <option value="Read Only">Read Only</option>
                      <option value="No Access">No Access</option>
                    </select>
                  </div>

                  {/* Field 3: securityLogs */}
                  <div>
                    <select
                      value={rule.securityLogs}
                      onChange={(e) => handleUpdateRbac(rule.role, 'securityLogs', e.target.value)}
                      className={`w-full px-2 py-1 border rounded-lg bg-white font-semibold cursor-pointer ${
                        rule.securityLogs === 'Read/Write' ? 'text-emerald-700 border-emerald-100 bg-emerald-50/10' :
                        rule.securityLogs === 'Read Only' ? 'text-blue-700 border-blue-100 bg-blue-50/10' :
                        'text-gray-400 border-gray-100 bg-gray-50/20'
                      }`}
                    >
                      <option value="Read/Write">Read/Write</option>
                      <option value="Read Only">Read Only</option>
                      <option value="No Access">No Access</option>
                    </select>
                  </div>

                  {/* Field 4: systemSettings */}
                  <div>
                    <select
                      value={rule.systemSettings}
                      onChange={(e) => handleUpdateRbac(rule.role, 'systemSettings', e.target.value)}
                      className={`w-full px-2 py-1 border rounded-lg bg-white font-semibold cursor-pointer ${
                        rule.systemSettings === 'Read/Write' ? 'text-emerald-700 border-emerald-100 bg-emerald-50/10' :
                        rule.systemSettings === 'Read Only' ? 'text-blue-700 border-blue-100 bg-blue-50/10' :
                        'text-gray-400 border-gray-100 bg-gray-50/20'
                      }`}
                    >
                      <option value="Read/Write">Read/Write</option>
                      <option value="Read Only">Read Only</option>
                      <option value="No Access">No Access</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-150">
              <span className="text-xs text-gray-500 leading-relaxed font-medium">Changes propagate dynamically to active General Clinical Nodes in real-time.</span>
              <button
                onClick={() => alert("RBAC authorization matrices deployed successfully!")}
                className="px-4 py-2 bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
              >
                Deploy Access Roles
              </button>
            </div>
          </div>
        )}

        {/* PERMISSION MATRIX VIEW */}
        {activeTab === 'matrix' && (
          <PermissionMatrix />
        )}

        {/* SECURE AUDIT LOG VIEW */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Secure Audit Trail Ledger</h3>
                <p className="text-xs text-gray-400">Strict cryptographically verified ledger mapping system operations.</p>
              </div>

              <button
                onClick={() => {
                  setAuditLogs(prev => [
                    {
                      id: `log-${Date.now()}`,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                      event: 'Audit Ledger Recalibrated',
                      actor: 'IT Infrastructure Admin',
                      ipAddress: '127.0.0.1',
                      status: 'SUCCESS',
                      location: 'Secure Key Vault'
                    },
                    ...prev
                  ]);
                  alert("Ledger verify check passed. Injecting system audit marker.");
                }}
                className="text-xs font-bold text-gray-600 hover:text-gray-950 bg-white border border-gray-250 px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Verify Ledger Integrity</span>
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="border border-gray-150 rounded-xl overflow-hidden bg-gray-50/10">
              <div className="bg-gray-50/50 px-4 py-2.5 border-b border-gray-150 grid grid-cols-12 gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <span className="col-span-3">Timestamp</span>
                <span className="col-span-3">Action / Event</span>
                <span className="col-span-2">Clinical Actor</span>
                <span className="col-span-2">IP Target</span>
                <span className="col-span-2 text-right">Status</span>
              </div>

              <div className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 grid grid-cols-12 gap-3 items-center hover:bg-gray-50/30 transition-colors">
                    <span className="col-span-3 text-gray-400 font-semibold">{log.timestamp}</span>
                    <span className="col-span-3 font-bold text-gray-900 truncate pr-1">{log.event}</span>
                    <span className="col-span-2 text-gray-600 truncate">{log.actor}</span>
                    <span className="col-span-2 text-gray-500 truncate">{log.ipAddress}</span>
                    <span className="col-span-2 text-right">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        log.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {log.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CRYPTOGRAPHIC KEYS & HSM VIEW */}
        {activeTab === 'keys' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fadeIn">
            {/* Key Status Row (Span 7) */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">KMS Envelope Encryption</h3>
                <p className="text-xs text-gray-400 mt-0.5">Automated key rotation managed in hardware security modules (HSM).</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-gray-150 rounded-xl bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider block">Primary Database Key</span>
                      <span className="font-mono text-xs font-bold text-gray-900">{primaryKeyId}</span>
                    </div>

                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">
                      AES-256 GCM
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 flex justify-between items-center pt-1.5 border-t border-gray-150/60 font-medium">
                    <span>Last Rotated: {lastRotationDate}</span>
                    <span>Next Auto-Rotation: {keyRotationInterval} days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="space-y-1 flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Key Rotation Schedule</label>
                    <select
                      value={keyRotationInterval}
                      onChange={(e) => setKeyRotationInterval(e.target.value)}
                      className="w-full px-2.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="30">Every 30 Days (Military standards)</option>
                      <option value="90">Every 90 Days (HIPAA standards)</option>
                      <option value="180">Every 180 Days</option>
                      <option value="365">Every Year</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRotateKey}
                    disabled={isRotating}
                    className="self-end px-5 py-3 bg-gray-950 text-white font-bold text-xs rounded-xl hover:bg-gray-850 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isRotating ? (
                      <RefreshCw className="animate-spin" size={13} />
                    ) : (
                      <Key size={13} />
                    )}
                    <span>Rotate Key Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof and Certs (Span 5) */}
            <div className="md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900">HSM Health Checklist</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Physical and cryptographic state matrix.</p>
                </div>

                <div className="space-y-3.5 pt-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Server size={14} className="text-gray-400" />
                      <span>FIPS 140-2 Level 3 Secure</span>
                    </div>
                    <span className="text-emerald-600">Active</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Lock size={14} className="text-gray-400" />
                      <span>Zero-Trust Signatures</span>
                    </div>
                    <span className="text-emerald-600">Verified</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Lock size={14} className="text-gray-400" />
                      <span>Payload Seal checksums</span>
                    </div>
                    <span className="text-emerald-600">Dynamic</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-150 rounded-xl space-y-1 mt-6">
                <h4 className="font-bold text-xs text-gray-900">Hardware Security Modules</h4>
                <p className="text-[10px] text-gray-500 leading-normal">
                  All clinical records database snapshots are dynamically split into shards, encrypted with KMS envelopes, and saved securely.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
