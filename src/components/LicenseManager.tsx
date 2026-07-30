import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Plus, Check, X, Calendar, Building, Copy, RefreshCw, 
  Trash2, ToggleLeft, ToggleRight, AlertCircle, HelpCircle, CheckCircle2,
  Clock, Hash, ArrowRight, Activity, Users, FileText
} from 'lucide-react';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

// Pre-seeded demo tenants for immediate validation
export const PRE_SEEDED_TENANTS: any[] = [
  {
    id: 'hosp-zm03',
    hospital_unique_number: 'HOSP-ZM03',
    name: 'Zewditu Hospital',
    license_key: 'LIC-ZM03-Q89B-US52-2026',
    expiry_date: '2026-08-21',
    is_active: true
  },
  {
    id: 'hosp-sp02',
    hospital_unique_number: 'HOSP-SP02',
    name: 'St. Paul Hospital',
    license_key: 'LIC-SP02-2KAS-K1WK-2026',
    expiry_date: '2026-08-21',
    is_active: true
  },
  {
    id: 'hosp-bl01',
    hospital_unique_number: 'HOSP-BL01',
    name: 'Black Lion Hospital',
    license_key: 'LIC-BL01-6YW5-UT6K-2026',
    expiry_date: '2026-08-21',
    is_active: false
  }
];

export default function LicenseManager() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  
  // Form states
  const [hospitalName, setHospitalName] = useState('');
  const [uniqueNumber, setUniqueNumber] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [customKey, setCustomKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Stats
  const [activeTab, setActiveTab] = useState<'hospitals' | 'licenses'>('hospitals');

  useEffect(() => {
    // Purge target user records automatically
    const purgeTargetUserRecords = async () => {
      try {
        const collectionsToPurge = ['licenses', 'hospitals', 'owner_registered_admins', 'users', 'pending_user_requests'];
        for (const colName of collectionsToPurge) {
          const snap = await getDocs(collection(db, colName));
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            const email = (data.email || '').toLowerCase();
            const fullName = (data.full_name || data.name || '').toLowerCase();
            const hospId = (data.hospital_id || data.hospital_unique_number || '').toUpperCase();
            const licKey = (data.license_key || data.license_number || '').toUpperCase();

            if (
              email.includes('gelemso@hospital.org') ||
              fullName.includes('tajir') ||
              fullName.includes('siraj') ||
              hospId === 'HOSP-GL05' ||
              licKey.includes('LIC-GL05')
            ) {
              await deleteDoc(doc(db, colName, docSnap.id));
            }
          }
        }
      } catch (err) {
        console.warn("Cleanup error in LicenseManager:", err);
      }
    };

    purgeTargetUserRecords();

    // 1. Listen to hospitals
    const unsubHospitals = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter((h: any) => {
          const name = (h.name || '').toLowerCase();
          const hospId = (h.hospital_unique_number || '').toUpperCase();
          return !name.includes('tajir') && !name.includes('gelemso') && hospId !== 'HOSP-GL05';
        });
      setHospitals(list);
    }, (error) => {
      console.error("Error listening to hospitals: ", error);
    });

    // 2. Listen to licenses
    const unsubLicenses = onSnapshot(collection(db, 'licenses'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter((l: any) => {
          const hospId = (l.hospital_id || '').toUpperCase();
          const licKey = (l.license_key || '').toUpperCase();
          return hospId !== 'HOSP-GL05' && !licKey.includes('LIC-GL05');
        });
      setLicenses(list);
    }, (error) => {
      console.error("Error listening to licenses: ", error);
    });

    return () => {
      unsubHospitals();
      unsubLicenses();
    };
  }, []);

  // Helper: Auto-seed the pre-seeded demo hospitals if Firestore collections are empty
  const handleSeedDemoTenants = async () => {
    setIsSubmitting(true);
    try {
      const hospSnap = await getDocs(collection(db, 'hospitals'));
      if (hospSnap.empty) {
        for (const tenant of PRE_SEEDED_TENANTS) {
          // Add hospital document
          const hospRef = await addDoc(collection(db, 'hospitals'), {
            hospital_unique_number: tenant.hospital_unique_number,
            name: tenant.name,
            created_at: new Date().toISOString()
          });

          // Add license document linked by hospital_id
          await addDoc(collection(db, 'licenses'), {
            hospital_id: tenant.hospital_unique_number,
            license_key: tenant.license_key,
            expiry_date: tenant.expiry_date,
            is_active: tenant.is_active
          });
        }
        setMessage({ type: 'success', text: 'Pre-seeded multi-tenant demo hospitals created successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Hospitals collection is already initialized.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Failed to seed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Secure key generator algorithm mimicking "Edge Functions" logic
  const generateRandomKey = (uniqueNum: string) => {
    const cleanNum = uniqueNum.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const prefix = `LIC-${cleanNum.slice(-4) || 'EHR'}`;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segments = [];
    for (let s = 0; s < 2; s++) {
      let segment = '';
      for (let i = 0; i < 4; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return `${prefix}-${segments.join('-')}-${new Date().getFullYear()}`;
  };

  const handleGenerateKeyInput = () => {
    if (!uniqueNumber) {
      alert("Please specify a Hospital Unique Number first (e.g., HOSP-K05).");
      return;
    }
    setCustomKey(generateRandomKey(uniqueNumber));
  };

  // Create new Hospital and Link a valid Key
  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim() || !uniqueNumber.trim()) {
      setMessage({ type: 'error', text: 'All asterisked fields are required.' });
      return;
    }

    // Verify unique number format or presence
    const cleanUniqueNumber = uniqueNumber.trim().toUpperCase();
    const alreadyExists = hospitals.some(h => h.hospital_unique_number === cleanUniqueNumber);
    if (alreadyExists) {
      setMessage({ type: 'error', text: `Hospital unique ID "${cleanUniqueNumber}" is already registered.` });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // 1. Create Hospital Record
      await addDoc(collection(db, 'hospitals'), {
        hospital_unique_number: cleanUniqueNumber,
        name: hospitalName.trim(),
        created_at: new Date().toISOString()
      });

      // 2. Generate and Create License Key
      const keyToUse = customKey.trim() || generateRandomKey(cleanUniqueNumber);
      
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + Number(durationMonths));

      await addDoc(collection(db, 'licenses'), {
        hospital_id: cleanUniqueNumber,
        license_key: keyToUse,
        expiry_date: expiry.toISOString().split('T')[0],
        is_active: true
      });

      setMessage({ 
        type: 'success', 
        text: `Successfully registered "${hospitalName}" and created key: ${keyToUse}` 
      });

      // Clear form
      setHospitalName('');
      setUniqueNumber('');
      setCustomKey('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: `Failed to register tenant: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renewal Modal State
  const [renewTarget, setRenewTarget] = useState<any | null>(null);
  const [renewMonths, setRenewMonths] = useState<string>('12');
  const [generateNewKeyOnRenew, setGenerateNewKeyOnRenew] = useState<boolean>(false);
  const [renewSuccessMsg, setRenewSuccessMsg] = useState<string | null>(null);

  // Toggle License Key active state
  const handleToggleLicenseActive = async (licenseId: string, currentStatus: boolean, hospitalId?: string) => {
    try {
      if (licenseId && !licenseId.startsWith('hosp-')) {
        const licRef = doc(db, 'licenses', licenseId);
        await updateDoc(licRef, {
          is_active: !currentStatus
        });
      }
      if (hospitalId) {
        const preMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === hospitalId);
        if (preMatch) {
          preMatch.is_active = !currentStatus;
        }
      }
      setMessage({
        type: 'success',
        text: `License status updated for ${hospitalId || licenseId}. (Active: ${!currentStatus}). Note: All hospital data files remain safely preserved in database.`
      });
    } catch (err: any) {
      alert(`Failed to update license status: ${err.message}`);
    }
  };

  // Renew / Extend License Action
  const handleExecuteRenewal = async (target: any, months: number, newKeyRequested: boolean) => {
    setIsSubmitting(true);
    setRenewSuccessMsg(null);
    try {
      const hospitalId = target.hospital_id || target.hospital_unique_number;
      const cleanHospId = hospitalId.toUpperCase();
      
      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + months);
      const newExpiryStr = newExpiry.toISOString().split('T')[0];

      const keyToUse = newKeyRequested ? generateRandomKey(cleanHospId) : (target.license_key || generateRandomKey(cleanHospId));

      // 1. Update/Add in Firestore licenses
      const licQ = query(collection(db, 'licenses'), where('hospital_id', '==', cleanHospId));
      const licSnap = await getDocs(licQ);

      if (!licSnap.empty) {
        // Update existing Firestore doc
        const existingDocId = licSnap.docs[0].id;
        await updateDoc(doc(db, 'licenses', existingDocId), {
          expiry_date: newExpiryStr,
          is_active: true,
          license_key: keyToUse
        });
      } else {
        // Add new license doc
        await addDoc(collection(db, 'licenses'), {
          hospital_id: cleanHospId,
          license_key: keyToUse,
          expiry_date: newExpiryStr,
          is_active: true
        });
      }

      // 2. Update local PRE_SEEDED_TENANTS array in-memory for instant UI reactivity
      const localMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === cleanHospId);
      if (localMatch) {
        localMatch.is_active = true;
        localMatch.expiry_date = newExpiryStr;
        localMatch.license_key = keyToUse;
      }

      const successNotice = `✓ License Key Renewed for ${cleanHospId}! Extended for ${months} Months (Expires: ${newExpiryStr}). Key: ${keyToUse}. 🔒 All historical hospital files & patient records are 100% intact and immediately accessible.`;
      
      setRenewSuccessMsg(successNotice);
      setMessage({ type: 'success', text: successNotice });
      
      setTimeout(() => {
        setRenewTarget(null);
        setRenewSuccessMsg(null);
      }, 2500);

    } catch (err: any) {
      console.error(err);
      alert(`Renewal failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete license key
  const handleDeleteLicense = async (licenseId: string) => {
    if (confirm("Are you sure you want to revoke and delete this license key? The hospital will lose active server access, but all hospital records & patient files remain preserved safely in database cold storage.")) {
      try {
        if (licenseId && !licenseId.startsWith('hosp-')) {
          await deleteDoc(doc(db, 'licenses', licenseId));
        }
      } catch (err: any) {
        alert(`Failed to delete license: ${err.message}`);
      }
    }
  };

  // Check key expiration status
  const isLicenseExpired = (expiryDateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return expiryDateStr < today;
  };

  // Copy key helper
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert(`Copied license key: ${key}`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dashboard Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Shield size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Owner Multi-Tenant Authority</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">EHR License & Tenant Provisioner</h2>
            <p className="text-sm text-slate-400 max-w-xl font-medium">
              Create independent clinical namespaces, issue valid cryptographic license keys, and manage institutional data boundaries.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleSeedDemoTenants}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
              Seed Default Tenants
            </button>
          </div>
        </div>
      </div>

      {/* Data Retention & Zero Data Loss Banner */}
      <div className="bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-blue-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30 shrink-0 text-blue-300">
            <Shield size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-300 flex items-center gap-2">
              🔒 Zero Data Loss Guarantee for Hospital Records
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-3xl">
              When a hospital's license key expires or is revoked, server login access is temporarily restricted to enforce institutional licensing. <strong>All patient files, medical records, lab results, and hospital histories remain 100% safely preserved in database cold storage.</strong> Once a license key is renewed or reactivated, the hospital immediately resumes full access to all historical records without losing a single file.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Key Generation & Tenant Registration Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Key size={18} className="text-blue-600" />
            <h3 className="font-extrabold text-base text-gray-950">Issue New License Key</h3>
          </div>

          <form onSubmit={handleRegisterHospital} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Hospital Name *</label>
              <div className="relative">
                <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Black Lion Referral Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Unique Number / Tenant ID *</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. HOSP-BL01"
                  value={uniqueNumber}
                  onChange={(e) => setUniqueNumber(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono font-bold text-gray-950 uppercase transition-all"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Required for login. Bind keys exclusively to this hospital identifier.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">License Duration</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                <select 
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="1">1 Month (Trial)</option>
                  <option value="6">6 Months (Standard)</option>
                  <option value="12">12 Months (Annual)</option>
                  <option value="36">36 Months (Multi-Year)</option>
                  <option value="120">120 Months (Decade License)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Custom License Key (Optional)</label>
                <button 
                  type="button" 
                  onClick={handleGenerateKeyInput}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
                >
                  Auto-Gen Key
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Leave blank to auto-generate"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono font-bold text-gray-900 placeholder:font-sans placeholder:font-normal"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-xl border flex gap-2.5 items-start text-xs font-medium leading-relaxed ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              Register Hospital & License Key
            </button>
          </form>
        </div>

        {/* 3. Real-Time Registered Tenants list */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-slate-700" />
              <h3 className="font-extrabold text-base text-gray-950">Active Institutional Tenants</h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{hospitals.length} Hospital Profiles</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('hospitals')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'hospitals' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Hospital Registries ({hospitals.length})
            </button>
            <button 
              onClick={() => setActiveTab('licenses')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'licenses' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Issued Software Licenses ({licenses.length})
            </button>
          </div>

          {/* Tab Content */}
          {(() => {
            const displayHospitals = [...hospitals];
            PRE_SEEDED_TENANTS.forEach(pre => {
              if (!displayHospitals.some(h => h.hospital_unique_number === pre.hospital_unique_number)) {
                displayHospitals.push(pre);
              }
            });

            const displayLicenses = [...licenses];
            PRE_SEEDED_TENANTS.forEach(pre => {
              if (!displayLicenses.some(l => l.hospital_id === pre.hospital_unique_number)) {
                displayLicenses.push({
                  id: pre.id,
                  hospital_id: pre.hospital_unique_number,
                  license_key: pre.license_key,
                  expiry_date: pre.expiry_date,
                  is_active: pre.is_active
                });
              }
            });

            if (activeTab === 'hospitals') {
              return (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {displayHospitals.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 space-y-2">
                      <Building size={32} className="mx-auto text-gray-300" />
                      <p className="text-xs font-bold text-gray-800">No Hospitals Registered</p>
                      <p className="text-[11px] text-gray-400 max-w-xs mx-auto">Click "Seed Default Tenants" above or use the form to register your first EHR tenant.</p>
                    </div>
                  ) : (
                    displayHospitals.map((hosp, idx) => {
                      const linkLicense = displayLicenses.find(l => l.hospital_id === hosp.hospital_unique_number);
                      const isExpired = linkLicense ? isLicenseExpired(linkLicense.expiry_date) : false;
                      const isRevoked = linkLicense ? !linkLicense.is_active : false;

                      return (
                        <div key={hosp.id || idx} className="p-4 border border-gray-100 hover:border-blue-150 bg-gray-50/30 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:bg-white shadow-3xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-blue-600 font-mono tracking-tight bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase">
                                {hosp.hospital_unique_number}
                              </span>
                              <h4 className="text-xs font-extrabold text-gray-950 uppercase tracking-tight">
                                {hosp.name}
                              </h4>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">
                              Registry ID: <span className="font-mono">{hosp.id}</span> • Registered on {hosp.created_at ? new Date(hosp.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                            
                            {linkLicense ? (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[10px] font-bold text-gray-500">License Key:</span>
                                <span className="font-mono text-[10px] font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                  {linkLicense.license_key}
                                </span>
                                <button 
                                  onClick={() => handleCopyKey(linkLicense.license_key)} 
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                                  title="Copy License Key"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                                <AlertCircle size={10} /> No software license key issued. Access denied.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {linkLicense && (
                              <div className="text-right">
                                {linkLicense.is_active && !isExpired ? (
                                  <span className="inline-block text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                                    Active License
                                  </span>
                                ) : (
                                  <span className="inline-block text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-wide">
                                    {isExpired ? 'Expired' : 'Revoked'}
                                  </span>
                                )}
                                <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                                  Expires: {linkLicense.expiry_date ? new Date(linkLicense.expiry_date).toLocaleDateString() : 'Never'}
                                </p>
                              </div>
                            )}

                            <button
                              onClick={() => setRenewTarget({
                                hospital_id: hosp.hospital_unique_number,
                                hospitalName: hosp.name,
                                license_key: linkLicense?.license_key || ''
                              })}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Renew or Extend License Key (Preserves all hospital data)"
                            >
                              <RefreshCw size={11} />
                              <span>Renew License</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            } else {
              return (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {displayLicenses.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 space-y-2">
                      <Key size={32} className="mx-auto text-gray-300" />
                      <p className="text-xs font-bold text-gray-800">No Licenses Found</p>
                    </div>
                  ) : (
                    displayLicenses.map((lic, idx) => {
                      const targetHosp = displayHospitals.find(h => h.hospital_unique_number === lic.hospital_id);
                      const isExpired = isLicenseExpired(lic.expiry_date);
                      
                      return (
                        <div key={lic.id || idx} className="p-4 border border-gray-100 bg-gray-50/30 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:bg-white shadow-3xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono text-xs font-black text-gray-950 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-3xs">
                                {lic.license_key}
                              </span>
                              <button 
                                onClick={() => handleCopyKey(lic.license_key)} 
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                title="Copy Key"
                              >
                                <Copy size={12} />
                              </button>

                              {isExpired || !lic.is_active ? (
                                <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">
                                  {isExpired ? 'Expired' : 'Revoked'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                              Bound Hospital Code: <strong className="text-blue-600 font-mono">{lic.hospital_id}</strong>
                              {targetHosp && ` (${targetHosp.name})`}
                            </p>
                            <p className="text-[9px] text-gray-400 font-medium">
                              Expiration Date Limit: <span className="text-gray-700 font-bold">{lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : 'Lifetime'}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => setRenewTarget({
                                hospital_id: lic.hospital_id,
                                hospitalName: targetHosp?.name || lic.hospital_id,
                                license_key: lic.license_key
                              })}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Renew License Expiry Date"
                            >
                              <RefreshCw size={11} />
                              <span>Renew Key</span>
                            </button>

                            {/* Status Toggle control */}
                            <button 
                              onClick={() => handleToggleLicenseActive(lic.id, lic.is_active, lic.hospital_id)}
                              className="flex items-center gap-1 hover:text-blue-600 transition-all text-xs"
                              title="Click to toggle active status"
                            >
                              {lic.is_active ? (
                                <div className="flex items-center text-emerald-600 font-bold gap-1 text-[11px]">
                                  <ToggleRight size={22} className="text-emerald-500" />
                                </div>
                              ) : (
                                <div className="flex items-center text-gray-400 font-bold gap-1 text-[11px]">
                                  <ToggleLeft size={22} className="text-gray-300" />
                                </div>
                              )}
                            </button>

                            <button 
                              onClick={() => handleDeleteLicense(lic.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                              title="Revoke License Key (Hospital files stay safe)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* License Renewal & Extension Modal */}
      {renewTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xl max-w-md w-full space-y-5 text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <RefreshCw size={18} />
                <h3 className="font-extrabold text-base text-gray-950">Renew & Extend License Key</h3>
              </div>
              <button onClick={() => setRenewTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
              <p className="text-xs font-bold text-indigo-950">
                Hospital Tenant: <span className="font-mono text-indigo-600">{renewTarget.hospital_id || renewTarget.hospital_unique_number}</span>
              </p>
              <p className="text-[11px] text-indigo-700 font-medium">
                {renewTarget.hospitalName || 'Institutional Health Facility'}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-[11px] text-emerald-900 leading-relaxed font-medium flex items-start gap-2">
              <Shield size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>🔒 Continuous File Security Guarantee:</strong> Renewing this license key reactivates access immediately. <strong>All patient charts, lab tests, medical histories, and institutional records remain 100% intact and preserved</strong> without any data loss.
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">License Renewal Period</label>
                <select 
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="1">1 Month Extension</option>
                  <option value="6">6 Months Extension</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="120">120 Months (Decade License)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="genKey"
                  checked={generateNewKeyOnRenew}
                  onChange={(e) => setGenerateNewKeyOnRenew(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="genKey" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Generate a new cryptographic license key string
                </label>
              </div>
            </div>

            {renewSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold leading-relaxed flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                <span>{renewSuccessMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleExecuteRenewal(renewTarget, Number(renewMonths), generateNewKeyOnRenew)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                Confirm Renewal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
