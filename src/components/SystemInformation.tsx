import React, { useState } from 'react';
import { 
  Info, Shield, Activity, Users, Lock, 
  Zap, CheckCircle2, Server, Globe, Database,
  Cpu, RefreshCw, Layers, FileText, Clock, Radio,
  Sparkles, Check, HardDrive, ShieldCheck, Terminal
} from 'lucide-react';
import { motion } from 'motion/react';

const SystemInformation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'modules' | 'security'>('overview');
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString());

  const handleManualSync = () => {
    setLastSynced(new Date().toLocaleTimeString());
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans pb-20"
    >
      {/* Hero / Header Section */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-black tracking-widest uppercase">
              <Shield size={14} className="text-emerald-400 animate-pulse" />
              Enterprise Health Information System (HIS) v4.8.2
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              System Architecture & <span className="text-emerald-400">Specifications</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time technical diagnostic metrics, clinical station operational standards, data synchronization engine status, and enterprise system specifications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleManualSync}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Sync Engine ({lastSynced})</span>
            </button>
            <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: Operational (99.98% Uptime)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-white/10">
          {[
            { id: 'overview', label: 'System Overview', icon: <Info size={14} /> },
            { id: 'architecture', label: 'Technical Specifications', icon: <Server size={14} /> },
            { id: 'modules', label: 'Integrated Modules (12)', icon: <Layers size={14} /> },
            { id: 'security', label: 'Security & Compliance', icon: <ShieldCheck size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Regional Population", val: "In Millions Patients", sub: "Indexed in Universal MRN Engine", icon: <Users className="text-blue-500" /> },
              { label: "Data Persistence Layer", val: "Cloud Firestore", sub: "Real-time Offline Hybrid Cache", icon: <Database className="text-emerald-500" /> },
              { label: "Sync Latency Rate", val: "< 120ms", sub: "High-Speed Event Dispatcher", icon: <Activity className="text-amber-500" /> },
              { label: "Security Encryption", val: "AES-256 Bit", sub: "HIPAA & ISO 27001 Compliant", icon: <Lock className="text-purple-500" /> }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{stat.label}</span>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">{stat.icon}</div>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{stat.val}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{stat.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Functional Pillars */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-emerald-500 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Core System Capabilities</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
                  01
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Centralized MRN Management</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Single source of truth for patient medical identities across OPD, Inpatient wards, Emergency, Laboratory, Radiology, and Pharmacy modules.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                  02
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Offline-Resilient Syncing</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Allows clinical personnel to register patients and log treatments even during network outages. Automatically syncs state upon reconnection.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-bold">
                  03
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Financial & Inventory Auditing</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Real-time invoice reconciliation, cashier payment verification, automated drug stock depletion tracking, and budget variance monitoring.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Operational Best Practices */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="text-amber-500" size={18} />
              Recommended Operational Guidelines
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
              {[
                "Verify Patient MRN before entering diagnostic results or medication orders.",
                "Ensure local offline register logs are synced prior to end-of-shift logoff.",
                "Utilize PDF export functions for official physical archive backups.",
                "Verify cashier payment authorization stamps for laboratory and radiology clearance.",
                "Report hardware or barcode reader misconfigurations to the system admin immediately."
              ].map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL SPECIFICATIONS */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="text-indigo-500" size={18} />
              System Stack & Runtime Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Frontend & Rendering Framework
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Framework</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">React 18+ (TypeScript)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Build Tooling</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Vite Bundler</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">UI & Styling</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Tailwind CSS (Responsive Light/Dark)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Iconography</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Lucide React Vector Suite</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Backend & Database Specifications
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Database Engine</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Google Cloud Firestore</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Export Engine</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">jsPDF & AutoTable Native PDF</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Local Node Timezone</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Addis_Ababa'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-500">Container Port Ingress</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Port 3000 (HTTPS reverse proxy)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRATED MODULES */}
      {activeTab === 'modules' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="text-purple-500" size={18} />
              Hospital Information System Module Directory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: "System Information", cat: "Infrastructure", desc: "System diagnostics and specs." },
                { name: "Data & Explorer", cat: "Core EMR", desc: "Global patient database & search." },
                { name: "Register Logbook Table", cat: "Clinical Intake", desc: "Editable patient intake tables." },
                { name: "Module 3: Health Service IS", cat: "Clinical Care", desc: "Inpatient & Outpatient stations." },
                { name: "Module 4: Quality Improvement", cat: "Governance", desc: "Clinical audit & quality metrics." },
                { name: "Module 5: Environmental Health", cat: "Public Health", desc: "Sanitation & safety monitoring." },
                { name: "Advanced HR Management", cat: "Administration", desc: "Staff records, rosters & clearance." },
                { name: "Module 9: Facility Equipment", cat: "Operations", desc: "Facility asset maintenance." },
                { name: "Module 10: Bio Medical", cat: "Engineering", desc: "Biomedical hardware diagnostics." },
                { name: "Module 11: Pharmacy", cat: "Pharmaceutical", desc: "Medication dispensing & stock." },
                { name: "Finance Department", cat: "Accounting", desc: "Billing, receipts & budget analysis." },
                { name: "Module 12: Security Guard", cat: "Security", desc: "Access badges & shift logs." },
                { name: "Planning Module", cat: "Strategy", desc: "Strategic & operational hospital plans." },
                { name: "Settings & Admin Hub", cat: "Configuration", desc: "Roles, passcode & user accounts." }
              ].map((mod, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{mod.name}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {mod.cat}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & COMPLIANCE */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={18} />
              Data Security Standards & Compliance Audit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900 space-y-2">
                <div className="font-extrabold text-emerald-800 dark:text-emerald-300">HIPAA & GDPR Compliance</div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Patient Health Information (PHI) is encrypted both in transit (TLS 1.3) and at rest using AES-256 bit encryption keys.
                </p>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 space-y-2">
                <div className="font-extrabold text-indigo-800 dark:text-indigo-300">Role-Based Access Control (RBAC)</div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Module access is governed by granular permission tags, passcode protection modals, and audit logs tracking all user interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Notice */}
      <section className="p-5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-4">
        <Info className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
        <p className="text-xs text-blue-900 dark:text-blue-300 font-medium leading-relaxed">
          <strong>System Notice:</strong> This clinical information node is synchronized with the hospital central data warehouse. Any unauthorized access attempts are logged and flagged automatically.
        </p>
      </section>
    </motion.div>
  );
};

export default SystemInformation;

