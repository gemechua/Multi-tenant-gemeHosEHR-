import React, { useState } from 'react';
import { 
  Globe, ShieldCheck, Server, AlertTriangle, CheckCircle2, RefreshCw, 
  Plus, Trash2, ArrowRight, Copy, Check, ExternalLink, Settings, 
  HelpCircle, Lock, Info, Sparkles, Network, ArrowUpRight
} from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  status: 'Active' | 'Pending Verification' | 'Generating SSL' | 'Error';
  type: 'Primary' | 'Alias' | 'Redirect';
  sslStatus: 'Valid' | 'In Progress' | 'Failed' | 'None';
  sslExpires?: string;
  createdAt: string;
  target?: string;
}

interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  ttl: string;
  status: 'active' | 'missing' | 'mismatch';
}

export default function DomainsTab() {
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: 'dom-1',
      name: 'ehr.generalhospital.org',
      status: 'Active',
      type: 'Primary',
      sslStatus: 'Valid',
      sslExpires: '2026-12-24',
      createdAt: '2026-01-15',
    },
    {
      id: 'dom-2',
      name: 'sheek-umer-clinic.org',
      status: 'Generating SSL',
      type: 'Alias',
      sslStatus: 'In Progress',
      createdAt: '2026-06-20',
    },
    {
      id: 'dom-3',
      name: 'portal.Hospitalhealth.gov',
      status: 'Pending Verification',
      type: 'Alias',
      sslStatus: 'None',
      createdAt: '2026-06-24',
    }
  ]);

  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainType, setNewDomainType] = useState<'Primary' | 'Alias' | 'Redirect'>('Alias');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(domains[0]);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [enforceHttps, setEnforceHttps] = useState(true);
  const [redirectRootToWww, setRedirectRootToWww] = useState(true);

  // Ingress IP for A Records & Ingress Canonical name for CNAMEs
  const INGRESS_A_RECORD = import.meta.env.VITE_INGRESS_A_RECORD || '34.120.185.90';
  const INGRESS_CNAME_TARGET = import.meta.env.VITE_INGRESS_CNAME_TARGET || 'ingress.ais-pre-al2z7o2pm4qu5zdopssman.europe-west2.run.app';

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(key);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const getDnsRecordsForDomain = (domain: Domain): DnsRecord[] => {
    const isSubdomain = domain.name.split('.').length > 2;
    const txtValue = `ais-verification=7f39${domain.id}a29bc019f2`;

    if (domain.status === 'Active') {
      return [
        {
          type: isSubdomain ? 'CNAME' : 'A',
          name: isSubdomain ? domain.name.split('.')[0] : '@',
          value: isSubdomain ? INGRESS_CNAME_TARGET : INGRESS_A_RECORD,
          ttl: '3600 (1 hour)',
          status: 'active'
        },
        {
          type: 'TXT',
          name: '_ais-challenge',
          value: txtValue,
          ttl: '3600 (1 hour)',
          status: 'active'
        }
      ];
    } else if (domain.status === 'Generating SSL') {
      return [
        {
          type: isSubdomain ? 'CNAME' : 'A',
          name: isSubdomain ? domain.name.split('.')[0] : '@',
          value: isSubdomain ? INGRESS_CNAME_TARGET : INGRESS_A_RECORD,
          ttl: '3600 (1 hour)',
          status: 'active'
        },
        {
          type: 'TXT',
          name: '_ais-challenge',
          value: txtValue,
          ttl: '3600 (1 hour)',
          status: 'active'
        }
      ];
    } else {
      // Pending verification has mismatch or missing records
      return [
        {
          type: isSubdomain ? 'CNAME' : 'A',
          name: isSubdomain ? domain.name.split('.')[0] : '@',
          value: isSubdomain ? INGRESS_CNAME_TARGET : INGRESS_A_RECORD,
          ttl: '3600 (1 hour)',
          status: 'missing'
        },
        {
          type: 'TXT',
          name: '_ais-challenge',
          value: txtValue,
          ttl: '3600 (1 hour)',
          status: 'mismatch'
        }
      ];
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return;

    // Standard regex validation for domain names
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    const trimmedName = String(newDomainName || '').trim();
    if (!domainRegex.test(trimmedName)) {
      alert("Please enter a valid domain name structure (e.g. clinical.hospital.org).");
      return;
    }

    const cleanName = trimmedName.toLowerCase();
    if (domains.some(d => d.name === cleanName)) {
      alert("This domain is already registered in your cluster workspace.");
      return;
    }

    const newDom: Domain = {
      id: `dom-${Date.now()}`,
      name: cleanName,
      status: 'Pending Verification',
      type: newDomainType,
      sslStatus: 'None',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [...domains, newDom];
    setDomains(updated);
    setSelectedDomain(newDom);
    setNewDomainName('');
    alert(`"${cleanName}" added successfully! Configure your DNS settings below to verify ownership.`);
  };

  const handleDeleteDomain = (id: string) => {
    if (confirm("Are you sure you want to decouple this domain from your clinical EHR cluster? Doing so will stop secure routing to this endpoint.")) {
      const updated = domains.filter(d => d.id !== id);
      setDomains(updated);
      if (selectedDomain?.id === id) {
        setSelectedDomain(updated[0] || null);
      }
    }
  };

  const handleSetPrimary = (id: string) => {
    const updated = domains.map(d => {
      if (d.id === id) {
        return { ...d, type: 'Primary' as const };
      } else if (d.type === 'Primary') {
        return { ...d, type: 'Alias' as const };
      }
      return d;
    });
    setDomains(updated);
    const primary = updated.find(d => d.id === id);
    if (primary) setSelectedDomain(primary);
    alert("Primary EHR domain routed successfully!");
  };

  const handleVerifyDns = (id: string) => {
    setVerifyingId(id);
    setTimeout(() => {
      setDomains(prev => prev.map(d => {
        if (d.id === id) {
          return {
            ...d,
            status: 'Generating SSL',
            sslStatus: 'In Progress'
          };
        }
        return d;
      }));
      
      // Update selected domain context too
      setSelectedDomain(prev => prev?.id === id ? {
        ...prev,
        status: 'Generating SSL',
        sslStatus: 'In Progress'
      } : prev);

      setVerifyingId(null);
      
      // Secondary timeout to simulate SSL generation completing
      setTimeout(() => {
        setDomains(prev => prev.map(d => {
          if (d.id === id) {
            return {
              ...d,
              status: 'Active',
              sslStatus: 'Valid',
              sslExpires: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };
          }
          return d;
        }));
        setSelectedDomain(prev => prev?.id === id ? {
          ...prev,
          status: 'Active',
          sslStatus: 'Valid',
          sslExpires: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        } : prev);
      }, 3500);

    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header Area */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Globe size={24} className="animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-teal-600 block mb-0.5">
                  App Gateway
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Custom Domains
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Connect and verify your clinical white-label domains (e.g. <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono font-bold">ehr.hospital.org</code>) to route your patients securely. DNS changes propagate globally in minutes with automatic SSL certificate renewals.
            </p>
          </div>

          <button 
            onClick={() => setShowFaq(!showFaq)}
            className="text-xs font-bold text-gray-500 hover:text-gray-950 flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <HelpCircle size={14} />
            <span>{showFaq ? 'Hide FAQ' : 'DNS Guide'}</span>
          </button>
        </div>

        {/* DNS FAQ Section */}
        {showFaq && (
          <div className="mt-6 border-t border-gray-150 pt-5 space-y-4 text-xs text-gray-600 leading-relaxed animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">What is an A Record?</h4>
                <p>An A record maps your root domain (like <code className="font-mono text-gray-700 font-semibold">hospital.org</code>) to our high-availability global Cloud Run Ingress cluster IP address.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">What is a CNAME?</h4>
                <p>CNAME records are used for subdomains (like <code className="font-mono text-gray-700 font-semibold">ehr.hospital.org</code>) to point to our canonical server routing gateway seamlessly.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">Automatic SSL / TLS</h4>
                <p>Once DNS records are verified, our platform requests secure certificates automatically from Let's Encrypt, issuing HTTPS links in under 5 minutes.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered Domains List & Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add custom domain form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Plus size={16} className="text-teal-600" />
              <span>Connect Domain</span>
            </h3>
            
            <form onSubmit={handleAddDomain} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Domain Name</label>
                <input 
                  type="text"
                  placeholder="e.g. clinical.hospital.org"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-gray-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type / Intention</label>
                <select
                  value={newDomainType}
                  onChange={(e) => setNewDomainType(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="Alias">Alias (Serves app directly)</option>
                  <option value="Primary">Primary Domain (Canonical redirect)</option>
                  <option value="Redirect">Redirect (Forward to Primary)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newDomainName}
                className="w-full py-2.5 bg-gray-950 hover:bg-gray-850 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Domain</span>
              </button>
            </form>
          </div>

          {/* Registered Domains Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Registered Domains</h3>
            
            <div className="space-y-2">
              {domains.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No custom domains added yet.</p>
              ) : (
                domains.map((dom) => {
                  const isSelected = selectedDomain?.id === dom.id;
                  return (
                    <button
                      key={dom.id}
                      onClick={() => setSelectedDomain(dom)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all relative flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected 
                          ? 'border-teal-500 bg-teal-50/10 ring-1 ring-teal-500/10' 
                          : 'border-gray-100 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-gray-900 truncate pr-2 max-w-[150px]">{dom.name}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          dom.type === 'Primary' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {dom.type}
                        </span>
                      </div>

                      <div className="flex justify-between items-center w-full text-[10px]">
                        <span className={`font-semibold flex items-center gap-1 ${
                          dom.status === 'Active' ? 'text-emerald-600' :
                          dom.status === 'Generating SSL' ? 'text-blue-600' :
                          'text-amber-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            dom.status === 'Active' ? 'bg-emerald-500' :
                            dom.status === 'Generating SSL' ? 'bg-blue-500 animate-pulse' :
                            'bg-amber-500'
                          }`}></span>
                          {dom.status}
                        </span>
                        
                        <span className="text-gray-400 font-mono">{dom.createdAt}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Domain Configuration Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDomain ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fadeIn">
              
              {/* Domain Overview Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-950 tracking-tight">{selectedDomain.name}</span>
                    <a 
                      href={`https://${selectedDomain.name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs text-gray-400">Added on {selectedDomain.createdAt}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedDomain.type !== 'Primary' && (
                    <button
                      onClick={() => handleSetPrimary(selectedDomain.id)}
                      className="text-[11px] font-bold text-gray-600 hover:text-gray-950 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDomain(selectedDomain.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove domain"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Status and Verification Flow Cards */}
              {selectedDomain.status === 'Pending Verification' && (
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex gap-3 text-left">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-2 flex-1">
                    <h4 className="font-extrabold text-sm text-amber-900">Ownership verification required</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      To activate routing to <strong className="text-amber-950">{selectedDomain.name}</strong>, you must configure the DNS challenge and targets listed below with your registry provider.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => handleVerifyDns(selectedDomain.id)}
                        disabled={verifyingId === selectedDomain.id}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {verifyingId === selectedDomain.id ? (
                          <>
                            <RefreshCw className="animate-spin" size={12} />
                            <span>Resolving Records...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Verify DNS Records</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedDomain.status === 'Generating SSL' && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <RefreshCw className="text-blue-600 animate-spin shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-blue-900">Securing custom connection (SSL/TLS)</h4>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        DNS verification passed! Our applets load balancer is issuing a dynamic secure socket layer certificate. This typically completes in 2-3 minutes.
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar simulation */}
                  <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full animate-pulse" style={{ width: '65%' }}></div>
                  </div>
                </div>
              )}

              {selectedDomain.status === 'Active' && (
                <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-xl p-4 flex gap-3 text-left">
                  <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-emerald-900">EHR domain is fully secured and operational</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      SSL/TLS certificate is valid and mapped to our redundant ingress. HTTPS redirection is active with 100% routing SLA.
                    </p>
                    <div className="text-[10px] text-emerald-600 pt-1 font-mono">
                      Certificate expires: {selectedDomain.sslExpires} (Auto-renews)
                    </div>
                  </div>
                </div>
              )}

              {/* DNS Records Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Required DNS Records</h4>
                  <span className="text-[10px] text-gray-400 font-semibold">Copy records and paste into DNS editor</span>
                </div>

                <div className="border border-gray-150 rounded-xl overflow-hidden bg-gray-50/20 divide-y divide-gray-100">
                  {getDnsRecordsForDomain(selectedDomain).map((rec, i) => {
                    const key = `${rec.type}-${i}`;
                    return (
                      <div key={key} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 w-full">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Type</span>
                            <span className="font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 self-start text-[10px]">
                              {rec.type}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Host Name</span>
                            <span className="font-mono font-semibold text-gray-700 block truncate">{rec.name}</span>
                          </div>
                          <div className="space-y-0.5 sm:col-span-2">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Target / Value</span>
                            <div className="flex items-center gap-1 w-full min-w-0">
                              <span className="font-mono text-gray-600 block truncate flex-1">{rec.value}</span>
                              <button
                                onClick={() => handleCopy(rec.value, key)}
                                className="text-gray-400 hover:text-gray-900 p-1 shrink-0 rounded hover:bg-gray-100"
                              >
                                {copiedValue === key ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Record Status Badge */}
                        <div className="shrink-0 self-end sm:self-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                            rec.status === 'mismatch' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {rec.status === 'active' ? 'Active' :
                             rec.status === 'mismatch' ? 'Mismatch' : 'Missing'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Redirect and Global Rules */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-150 space-y-4">
                <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1">
                  <Settings size={14} className="text-gray-500" />
                  <span>Enforcement Rules</span>
                </h4>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-900 block">Force HTTPS redirection</span>
                      <span className="text-[11px] text-gray-400 leading-normal block">Automatically upgrade HTTP queries to secure TLS channels.</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEnforceHttps(!enforceHttps);
                        alert("Secure protocol options updated.");
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enforceHttps ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        enforceHttps ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-900 block">Redirect naked root to www subdomain</span>
                      <span className="text-[11px] text-gray-400 leading-normal block">Forward root domain inquiries to mapped canonical subdirectories.</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setRedirectRootToWww(!redirectRootToWww);
                        alert("Root forward parameters modified.");
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        redirectRootToWww ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        redirectRootToWww ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-xs">
              <Globe size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Select or add a domain to start routing setups.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
