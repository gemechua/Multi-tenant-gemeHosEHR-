import React, { useState } from 'react';
import { 
  Building, Key, Shield, AlertCircle, HelpCircle, CheckCircle2,
  Lock, ArrowRight, Activity, Users, FileText, LayoutGrid, Sparkles
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { PRE_SEEDED_TENANTS } from './LicenseManager';

interface HospitalPortalGatewayProps {
  onLoginSuccess: (hospital: {
    id: string;
    name: string;
    hospital_unique_number: string;
    license_key: string;
  }) => void;
  onBypassToOwner: () => void;
}

export default function HospitalPortalGateway({ onLoginSuccess, onBypassToOwner }: HospitalPortalGatewayProps) {
  const [hospitalId, setHospitalId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasscodeLock, setShowPasscodeLock] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Checks the licenses collection
  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId.trim() || !licenseKey.trim()) {
      setError('Both Hospital Unique Number and License Key are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const inputHospId = hospitalId.trim().toUpperCase();
    const inputKey = licenseKey.trim();

    try {
      // 1. Query Firestore for this license key & hospital
      const licensesRef = collection(db, 'licenses');
      const q = query(
        licensesRef, 
        where('hospital_id', '==', inputHospId),
        where('license_key', '==', inputKey)
      );
      
      const snapshot = await getDocs(q);
      
      let validLicense: any = null;

      if (!snapshot.empty) {
        // Found matching key in Firestore
        const docData = snapshot.docs[0].data();
        validLicense = { id: snapshot.docs[0].id, ...docData };
      } else {
        // Fallback: Check in our default pre-seeded local array
        const localMatch = PRE_SEEDED_TENANTS.find(
          t => t.hospital_unique_number === inputHospId && t.license_key === inputKey
        );
        if (localMatch) {
          validLicense = localMatch;
        }
      }

      if (!validLicense) {
        setError('Invalid verification: No license key matches this Hospital Unique Number.');
        setLoading(false);
        return;
      }

      // 2. Verify activation status
      if (validLicense.is_active === false) {
        setError(`Access Denied: The software license key for ${inputHospId} has been revoked or deactivated. 🔒 Safe Preservation Notice: All hospital records, patient files, and clinical histories remain 100% intact and preserved in secure database storage. Once reactivated by the workspace owner in the License Manager, full access will immediately resume.`);
        setLoading(false);
        return;
      }

      // 3. Verify expiry date
      const today = new Date().toISOString().split('T')[0];
      if (validLicense.expiry_date && validLicense.expiry_date < today) {
        setError(`Access Denied: The license key for ${inputHospId} expired on ${validLicense.expiry_date}. 🔒 Zero Data Loss Guarantee: All hospital records and patient files are 100% safely preserved in database storage. Once the license key is renewed in the License Manager, logging in will immediately unlock access to all existing records.`);
        setLoading(false);
        return;
      }

      // 4. Retrieve hospital details
      let hospitalName = `Hospital tenant ${inputHospId}`;
      const hospitalsRef = collection(db, 'hospitals');
      const hospQ = query(hospitalsRef, where('hospital_unique_number', '==', inputHospId));
      const hospSnapshot = await getDocs(hospQ);
      
      if (!hospSnapshot.empty) {
        hospitalName = hospSnapshot.docs[0].data().name;
      } else {
        // Check default name from local array
        const localMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === inputHospId);
        if (localMatch) {
          hospitalName = localMatch.name;
        }
      }

      // Log success and log in
      const sessionObj = {
        id: validLicense.id || inputHospId,
        name: hospitalName,
        hospital_unique_number: inputHospId,
        license_key: inputKey
      };

      localStorage.setItem('active_hospital_tenant', JSON.stringify(sessionObj));
      onLoginSuccess(sessionObj);

    } catch (err: any) {
      console.error(err);
      setError(`Database verification failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Immediate fill helper
  const handleAutoFillAndLogin = (tenant: typeof PRE_SEEDED_TENANTS[0]) => {
    setHospitalId(tenant.hospital_unique_number);
    setLicenseKey(tenant.license_key);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Decorative ambient background lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        {/* Left column: Visual details & clinical branding */}
        <div className="md:col-span-5 flex flex-col justify-between text-white space-y-8 md:py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Shield size={22} className="stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider">Clinical Guard Portal</span>
            </div>
            
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              EHR Multi-Tenant Environment
            </h1>
            
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Welcome to the central health records database. Access is strictly compartmentalized. Each clinical institution is isolated under specific licensed cryptographic credentials.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-900 pb-2">
              Compartmentalization Benefits
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="p-1 bg-slate-900 rounded-lg text-indigo-400 mt-0.5">
                  <Lock size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Tenant Level Isolation</h4>
                  <p className="text-[10px] text-slate-400">Strict database segregation limits patient chart accesses to authorized hospitals only.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-1 bg-slate-900 rounded-lg text-indigo-400 mt-0.5">
                  <Key size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Active License Control</h4>
                  <p className="text-[10px] text-slate-400">Owner-managed key bindings can toggle permissions, expiration limits, or revoke access instantly.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <HelpCircle size={12} className="text-indigo-400" />
              <span>Licensing Support</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              For license renewal, key activation delays, or tenant deployment issues, contact:
            </p>
            <a 
              href="mailto:gemechuahmed0@gmail.com" 
              className="inline-block text-xs font-black text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-mono"
            >
              gemechuahmed0@gmail.com
            </a>
          </div>

          <button 
            onClick={() => {
              setShowPasscodeLock(true);
              setPasscode('');
              setPasscodeError('');
            }}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase flex items-center gap-1 self-start cursor-pointer border-b border-dashed border-indigo-400/50 pb-0.5"
          >
            <span>Enter Workspace Owner Console</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Right column: Interactive login form */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Institutional Entrance</h2>
              <p className="text-xs text-slate-400 font-semibold">Enter your Hospital Unique ID and active Software License Key</p>
            </div>

            <form onSubmit={handlePortalLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Hospital Unique ID (Tenant ID)</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-3.5 text-slate-500" />
                  <input 
                    type="text"
                    required
                    placeholder="e.g. HOSP-BL01"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono font-bold text-white uppercase transition-all placeholder:font-sans placeholder:font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Software License Key</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-3.5 text-slate-500" />
                  <input 
                    type="password"
                    required
                    placeholder="e.g. LIC-BL01-XXXX-XXXX-2026"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono font-bold text-white transition-all placeholder:font-sans placeholder:font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-medium leading-relaxed flex gap-2.5 items-start animate-shake">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  {loading ? 'Verifying...' : 'Authorize Institutional Session'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Preconfigured demonstration accounts */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Sparkles size={12} className="text-yellow-500" />
              <span>One-Click Verification (EHR Demo Gateways)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRE_SEEDED_TENANTS.map((tenant, idx) => {
                const today = new Date().toISOString().split('T')[0];
                const isExpired = tenant.is_active === false || (tenant.expiry_date && tenant.expiry_date < today);
                
                return (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => handleAutoFillAndLogin(tenant)}
                    className="p-2.5 bg-slate-950/60 hover:bg-slate-950 hover:border-indigo-500/55 rounded-xl border border-slate-800 transition-all text-left flex flex-col justify-between h-[85px] cursor-pointer group shadow-2xs"
                  >
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {tenant.hospital_unique_number}
                      </h4>
                      <p className="text-[8px] text-slate-500 font-semibold truncate leading-tight mt-0.5">
                        {tenant.name.split(' ')[0]} Hospital
                      </p>
                    </div>

                    <div className="flex justify-between items-center w-full mt-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        isExpired ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {isExpired ? 'Expired/Revoked' : 'Active Key'}
                      </span>
                      <span className="text-[8px] font-extrabold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Fill
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Passcode Lock Modal */}
      {showPasscodeLock && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="flex items-center gap-3 text-indigo-400 mb-4">
              <Shield size={24} />
              <h2 className="text-lg font-extrabold text-white tracking-tight">Owner Verification Required</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
              Please enter the authorized gateway passcode to unlock the Workspace Owner Console.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const expectedPass = import.meta.env.VITE_WORKSPACE_PASSCODE || 'gemec';
                if (passcode.trim().toLowerCase() === expectedPass.toLowerCase()) {
                  setShowPasscodeLock(false);
                  onBypassToOwner();
                } else {
                  setPasscodeError('Invalid gateway passcode. Access denied.');
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Gateway Passcode</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-3.5 text-slate-500" />
                  <input 
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter owner passcode"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (passcodeError) setPasscodeError('');
                    }}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono font-bold text-white transition-all placeholder:font-sans placeholder:font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>

              {passcodeError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-medium leading-relaxed flex gap-2.5 items-center">
                  <AlertCircle size={14} className="shrink-0 text-rose-500" />
                  <span>{passcodeError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasscodeLock(false)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-extrabold uppercase hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase transition-colors cursor-pointer"
                >
                  Unlock Owner Console
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
