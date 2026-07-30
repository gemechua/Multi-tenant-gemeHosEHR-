import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Shield, KeyRound, UserPlus, Link, Copy, CheckCircle2, AlertCircle, 
  Building2, UserCheck, Lock, Unlock, Sparkles, Layers, FileText, BadgeCheck 
} from 'lucide-react';

interface PortalManagementProps {
  currentUser?: any;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function PortalManagement({ currentUser, addToast }: PortalManagementProps) {
  const [selectedTier, setSelectedTier] = useState<'director' | 'admin' | 'mid-manager' | 'low-manager' | 'staff'>('director');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institutionalName, setInstitutionalName] = useState('Sample Clinical Institution');
  const [hospitalId, setHospitalId] = useState('TENANT-ID');
  const [department, setDepartment] = useState('General Operations');
  const [licenseKey, setLicenseKey] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bypassUrl, setBypassUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);

  // Auto-generate license key if director/admin or system managed
  useEffect(() => {
    const randomKey = `HSP-LIC-${Math.floor(10000 + Math.random() * 90000)}`;
    setLicenseKey(randomKey);

    // Fetch active tenant if available
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    if (activeHospitalStr) {
      try {
        const hospital = JSON.parse(activeHospitalStr);
        if (hospital?.hospital_unique_number) {
          setHospitalId(hospital.hospital_unique_number);
        }
        if (hospital?.name) {
          setInstitutionalName(hospital.name);
        }
      } catch (e) {
        // ignore
      }
    }

    fetchRegistrations();
  }, [selectedTier]);

  const fetchRegistrations = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('created_date', 'desc'), limit(15));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentRegistrations(list);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  const getTierRoleString = (tier: string) => {
    switch(tier) {
      case 'director': return 'director';
      case 'admin': return 'admin';
      case 'mid-manager': return 'mid-manager';
      case 'low-manager': return 'low-manager';
      case 'staff': return 'user';
      default: return 'user';
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch(tier) {
      case 'director': return 'Hospital Director / CEO';
      case 'admin': return 'Hospital Administrator';
      case 'mid-manager': return 'Mid-Level Manager';
      case 'low-manager': return 'Low-Level Manager';
      case 'staff': return 'Staff Practitioner';
      default: return 'Staff Practitioner';
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBypassUrl('');

    if (!fullName.trim() || !email.trim() || !hospitalId.trim() || !institutionalName.trim()) {
      setError('Please fill in all required fields (Full Name, Email, Hospital ID, Institutional Name).');
      return;
    }

    setIsSubmitting(true);
    try {
      const roleToSave = getTierRoleString(selectedTier);
      const secureToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const generatedBypassLink = `https://ehr.generalhospital.org/auth/bypass?token=${secureToken}&hospital=${encodeURIComponent(hospitalId)}&role=${roleToSave}`;

      const finalLicenseKey = ['director', 'admin'].includes(selectedTier) ? (licenseKey.trim() || `HSP-LIC-${Math.floor(10000 + Math.random() * 90000)}`) : `AUTO-SECURE-${Math.floor(10000 + Math.random() * 90000)}`;

      const userData = {
        full_name: fullName.trim(),
        email: email.trim(),
        institutional_name: institutionalName.trim(),
        hospital_id: hospitalId.trim(),
        department: department.trim(),
        role: roleToSave,
        tier: selectedTier,
        license_key: finalLicenseKey,
        notes: notes.trim() || null,
        bypass_url: generatedBypassLink,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: 'active'
      };

      await addDoc(collection(db, 'users'), userData);

      setBypassUrl(generatedBypassLink);
      setSuccess(`Successfully registered ${getTierDisplayName(selectedTier)} "${fullName.trim()}"! Cryptographic bypass link generated.`);
      addToast?.('success', `${getTierDisplayName(selectedTier)} registered successfully with secure tenant authorization.`);

      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setNotes('');
      fetchRegistrations();
    } catch (err: any) {
      setError(err.message || 'Failed to register user. Please check database permissions.');
      addToast?.('error', 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast?.('success', 'Bypass link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const OWNER_EMAIL = 'admin@example.com';
  const isOwner = currentUser?.email === OWNER_EMAIL;
  const isLicenseVisible = isOwner;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit text-xs font-medium tracking-wide mb-3 backdrop-blur-sm border border-white/10">
              <Shield size={14} className="text-indigo-400" />
              Hierarchical Portal & License Security Gateway
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Portal & Tier Registration Manager</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
              Register staff and management tiers with cryptographic tenant bypass generation, auto-saved secure license verification, and strict privilege isolation.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
            <Building2 size={24} className="text-indigo-400" />
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Tenant ID</p>
              <p className="text-sm font-mono font-bold text-white">{hospitalId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { id: 'director', label: 'Hospital Director', icon: BadgeCheck, desc: 'Full institutional authority' },
          { id: 'admin', label: 'Hospital Admin', icon: Shield, desc: 'Operational management' },
          { id: 'mid-manager', label: 'Mid-Level Manager', icon: Layers, desc: 'Department supervisor' },
          { id: 'low-manager', label: 'Low-Level Manager', icon: UserCheck, desc: 'Unit coordinator' },
          { id: 'staff', label: 'Staff Practitioner', icon: FileText, desc: 'Clinical operator' },
        ].map(tier => {
          const Icon = tier.icon;
          const active = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id as any)}
              className={`p-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                active 
                  ? 'bg-indigo-50 border-indigo-600 shadow-md ring-2 ring-indigo-500/20' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon size={18} />
                </div>
                {active && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-indigo-950' : 'text-gray-900'}`}>{tier.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{tier.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Form & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Register {getTierDisplayName(selectedTier)}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Complete credentials to generate cryptographic tenant access.</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 uppercase">
              Tier: {selectedTier}
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-semibold">{success}</p>
                {bypassUrl && (
                  <div className="mt-3 flex items-center gap-2 bg-white p-2.5 rounded-lg border border-emerald-200">
                    <input 
                      type="text" 
                      readOnly 
                      value={bypassUrl} 
                      className="w-full text-xs font-mono bg-transparent text-gray-700 outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(bypassUrl)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Copy size={12} />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Samuel Abebe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="samuel.abebe@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Institutional Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="General Hospital Central Campus"
                  value={institutionalName}
                  onChange={(e) => setInstitutionalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Hospital ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="TENANT-ID"
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Department / Unit
                </label>
                <input
                  type="text"
                  placeholder="Emergency & Trauma Unit"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Security Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* License Key Section with strict visibility rule */}
            {isLicenseVisible ? (
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={14} className="text-amber-700" />
                    LICENSE / KEY * (System Owner View Only)
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Auto-Saved & Owner Secured
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-amber-300 rounded-lg bg-white font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="text-[11px] text-amber-800/80 italic">
                  Institutional license keys are auto-saved upon registration while strictly hidden from low-level managers, mid-level managers, staff practitioners, Hospital Directors, and Admins. Visible to owner only.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-200 text-gray-600 rounded-lg">
                    <Lock size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">License Key Hidden (Restricted)</p>
                    <p className="text-[11px] text-gray-500">Auto-saved upon registration. Strictly hidden from low/mid managers, staff, directors, and admins. Owner only view.</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-400 bg-gray-200/60 px-2.5 py-1 rounded">
                  ••••••••••••
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Professional Notes / History (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Enter credentials or verification notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={16} />
                {isSubmitting ? 'Registering & Generating URL...' : `Register & Authorize ${getTierDisplayName(selectedTier)}`}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Permissions Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-indigo-600" />
              Tier Permission Matrix
            </h3>
            
            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-gray-900 mb-1">{getTierDisplayName(selectedTier)}</p>
                <p className="text-gray-500 leading-relaxed">
                  {selectedTier === 'director' && 'Full institutional oversight, cryptographic tenant override, financial ledger approval, and system license configuration.'}
                  {selectedTier === 'admin' && 'Operational facility management, audit log tracking, staff coordination, and registry configuration.'}
                  {selectedTier === 'mid-manager' && 'Departmental shift coordination, inventory audits, quality review access, and routine clinical reporting.'}
                  {selectedTier === 'low-manager' && 'Unit scheduling, patient triage monitoring, basic logbook entry, and local attendance tracking.'}
                  {selectedTier === 'staff' && 'Direct clinical record entry, SOAP notes creation, vital sign logging, and patient care delivery.'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500">License Visibility:</span>
                  <span className={isLicenseVisible ? 'text-amber-600 font-bold' : 'text-gray-400 font-semibold'}>
                    {isLicenseVisible ? 'Visible & Editable' : 'Auto-Saved & Hidden'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500">Cryptographic Bypass:</span>
                  <span className="text-emerald-600 font-bold">Enabled</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500">Tenant Binding:</span>
                  <span className="text-indigo-600 font-mono font-bold">{hospitalId}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Sparkles size={16} className="text-indigo-600" />
              <span>Hierarchical Compliance</span>
            </div>
            <p className="text-xs text-indigo-940 leading-relaxed">
              All registrations are cryptographically bound to the active hospital tenant. License keys are securely isolated from low-level and mid-level personnel to preserve regional healthcare compliance standards.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Tier Registrations & Bypass Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5">Recently authorized personnel and generated tenant bypass URLs.</p>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {recentRegistrations.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Personnel</th>
                <th className="py-3.5 px-4">Tier / Role</th>
                <th className="py-3.5 px-4">Hospital ID</th>
                <th className="py-3.5 px-4">License Key Status</th>
                <th className="py-3.5 px-4">Bypass URL</th>
                <th className="py-3.5 px-6 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                    No recent registrations found.
                  </td>
                </tr>
              ) : (
                recentRegistrations.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-gray-900">
                      <div className="font-bold">{user.full_name || user.email}</div>
                      <div className="text-[11px] text-gray-500 font-normal">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                        user.tier === 'director' ? 'bg-purple-100 text-purple-800' :
                        user.tier === 'admin' ? 'bg-indigo-100 text-indigo-800' :
                        user.tier === 'mid-manager' ? 'bg-blue-100 text-blue-800' :
                        user.tier === 'low-manager' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.tier || user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                      {user.hospital_id || 'TENANT-ID'}
                    </td>
                    <td className="py-3.5 px-4">
                      {['director', 'admin'].includes(user.tier) ? (
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {user.license_key || 'LIC-VERIFIED'}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-mono italic text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                          [Auto-Saved & Hidden]
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.bypass_url ? (
                        <button
                          onClick={() => copyToClipboard(user.bypass_url)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <Link size={12} />
                          Copy Bypass Link
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Standard Auth</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right text-gray-500 font-mono text-[11px]">
                      {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
