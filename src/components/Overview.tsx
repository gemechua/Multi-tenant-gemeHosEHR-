import React, { useState } from 'react';
import ActivityFeed from './ActivityFeed';
import { 
  Award, ExternalLink, Share2, Globe, Send, Copy, ArrowRightLeft, 
  Activity, Shield, Lock, Users, Sparkles, Check, ChevronRight, BarChart2,
  Database, Wifi, RefreshCw, Cpu, HardDrive
} from 'lucide-react';

export default function Overview() {
  const [copied, setCopied] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  
  // System Health States
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Initialized');
  const [lastSyncTime, setLastSyncTime] = useState('Waiting for sync...');
  const [syncLatency, setSyncLatency] = useState(0);
  const [equipmentStatus, setEquipmentStatus] = useState({
    ventilators: { uptime: '0.00%', status: 'Standby', logs: 'Node Baseline: Waiting for connection' },
    cardiacMonitors: { uptime: '0.00%', status: 'Standby', logs: 'Node Baseline: Waiting for connection' },
    labAnalyzers: { uptime: '0.00%', status: 'Standby', logs: 'Node Baseline: Waiting for connection' },
    pharmacyDispenser: { uptime: '0.00%', status: 'Standby', logs: 'Node Baseline: Waiting for connection' }
  });

  const handleSystemDiagnostic = () => {
    setIsTestingSync(true);
    setSyncStatus('Running Integrity Self-Test...');
    
    setTimeout(() => {
      setIsTestingSync(false);
      setSyncStatus('Synchronized');
      setLastSyncTime('Just now');
      setSyncLatency(Math.floor(Math.random() * 6) + 8); // 8ms to 13ms
      
      // Slightly alter equipment statuses to simulate live diagnostic pings
      setEquipmentStatus({
        ventilators: { uptime: '99.98%', status: 'Operational', logs: `ICU Block A-F Checked: Ping ${Math.floor(Math.random() * 4) + 2}ms` },
        cardiacMonitors: { uptime: '100.00%', status: 'Operational', logs: `Emergency Bed 1-20 Checked: Ping ${Math.floor(Math.random() * 4) + 2}ms` },
        labAnalyzers: { uptime: '99.91%', status: 'Operational', logs: `Diagnostic Chemistry Checked: Ping ${Math.floor(Math.random() * 5) + 3}ms` },
        pharmacyDispenser: { uptime: '99.99%', status: 'Operational', logs: `Automated Formulary Checked: Ping ${Math.floor(Math.random() * 3) + 2}ms` }
      });
    }, 1500);
  };
  
  const appUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (invitedEmail) {
      alert(`Invitation successfully sent to ${invitedEmail}!`);
      setInvitedEmail('');
    } else {
      alert('Please enter a valid email address.');
    }
  };

  const handleAppUsageClick = () => {
    alert("Task checklist loaded! Complete daily patient records to earn +15 credits.");
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <ActivityFeed />
      {/* 1. Title Banner Card (Hospital EHR) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        {/* Subtle decorative top border accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-100">
                <Activity size={28} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600 block mb-1">
                  Active Platform
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Hospital EHR
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              The Hospital EHR is a comprehensive, secure, and paperless digital health platform designed for end-to-end patient care, from admission to billing and supply chain management. It offers high-availability offline stability and a multi-lingual interface, ensuring efficient healthcare delivery for millions of residents. The application is fully responsive and optimized to work seamlessly across all devices (including smartphones and tablets). Especially in clinics facing shortages of desktop computers, this multi-device compatibility facilitates the administrative and clinical processes, enabling staff to access EHR services easily from any handheld device.
            </p>
          </div>

          <div className="flex flex-row sm:flex-col gap-3 w-full md:w-auto shrink-0 pt-2">
            <a 
              href={appUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gray-950 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-850 transition-colors shadow-sm"
            >
              <span>Open App</span>
              <ExternalLink size={14} />
            </a>
            
            <button 
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border border-gray-200 text-gray-700 bg-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Share2 size={14} />
              <span>{copied ? 'Copied Link' : 'Share App'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. win free credits! Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-gray-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-6 border border-indigo-900/40">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <Award className="text-yellow-400 shrink-0" size={22} />
            </div>
            <h3 className="font-extrabold text-lg tracking-tight">win free credits!</h3>
          </div>
          <p className="text-indigo-200/90 text-xs sm:text-sm max-w-xl leading-relaxed">
            Invite colleagues, complete system compliance tasks, and keep patient logs updated to earn continuous hosting and cloud-sync compute credits for the clinic.
          </p>
        </div>
        <button 
          onClick={handleAppUsageClick}
          className="bg-white text-indigo-950 hover:bg-indigo-50 transition-colors px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shrink-0 shadow-sm active:scale-98"
        >
          App usage
        </button>
      </div>

      {/* Global System Health & Equipment Status Widget */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5 text-left relative overflow-hidden">
        {/* Border header indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Database size={20} className={isTestingSync ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-tight flex items-center gap-2">
                <span>System Health & Node Telemetry</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isTestingSync
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isTestingSync ? "bg-amber-500 animate-ping" : "bg-emerald-500 animate-pulse"}`}></span>
                  {syncStatus}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time telemetry of clinical database nodes and critical ward instruments.</p>
            </div>
          </div>

          <button
            onClick={handleSystemDiagnostic}
            disabled={isTestingSync}
            className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer select-none"
          >
            <RefreshCw size={12} className={isTestingSync ? "animate-spin" : ""} />
            <span>{isTestingSync ? "Running Diagnostic..." : "Self-Test Diagnostic"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Cloud Database Sync Telemetry */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive size={14} className="text-indigo-500" />
              <span>EHR Firestore Database Sync</span>
            </h4>

            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-150 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Active Database Connection:</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Wifi size={12} className="text-emerald-500" />
                  <span>Google Cloud Firestore</span>
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Sync Latency:</span>
                <span className={`font-mono font-bold ${syncLatency < 12 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  {syncLatency}ms (Ultra Low)
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Last Node Sync:</span>
                <span className="text-gray-800 font-semibold">{lastSyncTime}</span>
              </div>

              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                  <span>Replica Integrity</span>
                  <span className="text-emerald-600">99.999% Verified</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Connected Equipment Status */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-blue-500" />
              <span>Hospital Connected Equipment</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ventilators */}
              <div className="p-3 bg-gray-50/50 border border-gray-150 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-700">ICU Ventilators</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 font-extrabold px-1.5 py-0.2 rounded-md">
                    {equipmentStatus.ventilators.uptime}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{equipmentStatus.ventilators.logs}</p>
              </div>

              {/* Cardiac Monitors */}
              <div className="p-3 bg-gray-50/50 border border-gray-150 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-700">Cardiac Monitors</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 font-extrabold px-1.5 py-0.2 rounded-md">
                    {equipmentStatus.cardiacMonitors.uptime}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{equipmentStatus.cardiacMonitors.logs}</p>
              </div>

              {/* Lab Analyzers */}
              <div className="p-3 bg-gray-50/50 border border-gray-150 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-700">Lab Analyzers</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 font-extrabold px-1.5 py-0.2 rounded-md">
                    {equipmentStatus.labAnalyzers.uptime}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{equipmentStatus.labAnalyzers.logs}</p>
              </div>

              {/* Pharmacy Dispenser */}
              <div className="p-3 bg-gray-50/50 border border-gray-150 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-700">Automated Pharmacy</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 font-extrabold px-1.5 py-0.2 rounded-md">
                    {equipmentStatus.pharmacyDispenser.uptime}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{equipmentStatus.pharmacyDispenser.logs}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Invite Users */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Invite Users</h3>
                <p className="text-xs text-gray-400 mt-0.5">Grow your user base by inviting others</p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-2 pt-1">
              <input 
                type="email" 
                placeholder="colleague@hospital.org" 
                value={invitedEmail}
                onChange={(e) => setInvitedEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all text-gray-800"
              />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg text-xs font-bold shadow-xs"
                >
                  <Copy size={12} />
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-950 hover:bg-gray-850 text-white transition-colors py-2 px-3 rounded-lg text-xs font-bold shadow-xs"
                >
                  <Send size={12} />
                  <span>Send Invites</span>
                </button>
              </div>
            </form>
          </div>
          
          <div className="border-t border-gray-50 mt-4 pt-3.5">
            <p className="text-[11px] text-gray-400 leading-normal">
              Invited members will receive an email notification to register.
            </p>
          </div>
        </div>

        {/* 5. Analytics */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <BarChart2 size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Analytics</h3>
                <p className="text-xs text-gray-400 mt-0.5">Application traffic and statistics</p>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-gray-950 tracking-tight">0</span>
                <span className="text-sm font-semibold text-gray-500">Live visitors</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-50 mt-6 pt-4">
            <p className="text-[11px] text-gray-400 leading-normal">
              Publish your app to start collecting data.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}
