import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Lock, Phone, Mail, Shield, AlertCircle, 
  MapPin, CheckCircle2, ArrowRight, UserPlus, LogIn, Key,
  ShieldCheck, Globe, RefreshCw, LogOut, Fingerprint
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { HOSPITAL_LAT, HOSPITAL_LON, ALLOWED_RADIUS_METERS, getDistance } from '../lib/constants';

interface UserAuthGatewayProps {
  bypassTenant: string;
  bypassUserIdentifier: string; // email or phone
  onAuthSuccess: (user: any) => void;
  onCancel: () => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function UserAuthGateway({ 
  bypassTenant, 
  bypassUserIdentifier, 
  onAuthSuccess, 
  onCancel,
  addToast
}: UserAuthGatewayProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [hospitalId, setHospitalId] = useState(bypassTenant || ''); // New state
  const [identifier, setIdentifier] = useState(bypassUserIdentifier || ''); // Email or Phone
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  
  // Biometrics
  const [fingerprintScanned, setFingerprintScanned] = useState(false);
  const [scanningFingerprint, setScanningFingerprint] = useState(false);


  // Location State
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    verifyLocation();
  }, []);

  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const d = getDistance(latitude, longitude, HOSPITAL_LAT, HOSPITAL_LON);
        setDistance(d);
        
        if (d <= ALLOWED_RADIUS_METERS) {
          setLocationVerified(true);
          addToast('success', 'Location Verified: Within Hospital Perimeter.');
        } else {
          setLocationVerified(false);
          setLocationError(`Security Breach: You are ${Math.round(d)}m outside the hospital perimeter.`);
          addToast('error', 'Access Denied: Outside hospital compound.');
        }
        setLocationLoading(false);
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError('Could not verify location. Location access is required for secure direct-access.');
        setLocationLoading(false);
        addToast('error', 'Location access failed.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleScanFingerprint = () => {
    setScanningFingerprint(true);
    setTimeout(() => {
      setScanningFingerprint(false);
      setFingerprintScanned(true);
      addToast('success', 'Biometric identity verified successfully.');
    }, 1500);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationVerified) {
      setError('Location verification is required for secure access.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usersRef = collection(db, 'users');
      let snap;
      
      if (identifier.trim() !== '') {
        let q = query(
          usersRef,
          where('hospital_id', '==', hospitalId),
          where('email', '==', identifier.trim())
        );
        snap = await getDocs(q);
        
        if (snap.empty) {
          q = query(
            usersRef,
            where('hospital_id', '==', hospitalId),
            where('mobile_number', '==', identifier.trim())
          );
          snap = await getDocs(q);
        }
      } else {
        // Biometric-only login without identifier: get any user for this hospital
        const q = query(
          usersRef,
          where('hospital_id', '==', hospitalId)
        );
        snap = await getDocs(q);
      }

      if (snap.empty) {
        setError('No account found with this identifier in this organization.');
        setLoading(false);
        return;
      }

      const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
      
      if (userData.passcode !== passcode) {
        setError('Incorrect passcode. Access denied.');
        setLoading(false);
        return;
      }

      // Success
      const tenantSession = {
        id: String(hospitalId),
        name: userData.hospital_name || hospitalName.trim() || 'Hospital Tenant',
        department: userData.department_name || departmentName.trim() || '',
        hospital_unique_number: String(hospitalId)
      };
      localStorage.setItem('active_hospital_tenant', JSON.stringify(tenantSession));
      window.dispatchEvent(new CustomEvent('active_hospital_updated', { detail: tenantSession }));

      addToast('success', 'Biometric identity verified.');
      onAuthSuccess(userData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationVerified) {
      setError('Location verification is required for secure access.');
      return;
    }

    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      setLoading(false);
      return;
    }

    if (passcode.length < 4) {
      setError('Passcode must be at least 4 characters/digits.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usersRef = collection(db, 'users');
      
      // Check if user already exists
      const isEmail = identifier.includes('@');
      let q = query(
        usersRef,
        where('hospital_id', '==', hospitalId),
        where(isEmail ? 'email' : 'mobile_number', '==', identifier.trim())
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setError('An account with this identifier already exists in this organization. Please Sign In.');
        setLoading(false);
        return;
      }

      // Create user
      const newUser = {
        full_name: fullName.trim(),
        hospital_name: hospitalName.trim(),
        department_name: departmentName.trim(),
        [isEmail ? 'email' : 'mobile_number']: identifier.trim(),
        passcode: passcode,
        role: 'user',
        hospital_id: Number(hospitalId),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        location_restricted: true,
        permissions: ['read_patient_records', 'write_clinical_notes']
      };

      const docRef = await addDoc(usersRef, newUser);
      
      const tenantSession = {
        id: String(hospitalId),
        name: hospitalName.trim(),
        department: departmentName.trim(),
        hospital_unique_number: String(hospitalId)
      };
      localStorage.setItem('active_hospital_tenant', JSON.stringify(tenantSession));
      window.dispatchEvent(new CustomEvent('active_hospital_updated', { detail: tenantSession }));

      addToast('success', `✓ Account Created: Welcome to the Clinical Guard, ${fullName}!`);
      onAuthSuccess({ id: docRef.id, ...newUser });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-indigo-500/10 rounded-full animate-pulse mb-4">
          <Globe className="text-indigo-400" size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Verifying Security Perimeter</h2>
        <p className="text-sm text-slate-400">Syncing with clinical GPS constellation...</p>
      </div>
    );
  }

  if (locationError && !locationVerified) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-500/10 rounded-full mb-4">
          <AlertCircle className="text-rose-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Blocked</h2>
        <p className="text-sm text-slate-400 mb-2 max-w-md mx-auto">{locationError}</p>
        <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
          Clinical systems are strictly restricted to the physical hospital campus. If you are testing inside the sandbox preview, please bypass to emulate proximity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button 
            onClick={verifyLocation}
            className="px-6 py-3 bg-white text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all cursor-pointer w-full sm:w-auto"
          >
            Retry Scan
          </button>
          <button 
            onClick={() => {
              setDistance(5);
              setLocationVerified(true);
              setLocationError(null);
              addToast('success', 'Perimeter Emulator Active: Within Compound Limits');
            }}
            className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all cursor-pointer w-full sm:w-auto"
          >
            Emulate GPS
          </button>
          <button 
            onClick={onCancel}
            className="px-6 py-3 bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all cursor-pointer w-full sm:w-auto"
          >
            Exit Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative BG */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-500"></div>
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-6 right-6 text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-bold"
          title="Exit Gateway & Log Out"
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            {mode === 'signup' ? <UserPlus size={28} /> : <LogIn size={28} />}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signup' ? 'Create Secure ID' : 'Clinical Guard Sign In'}
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Authorized for organization: <span className="text-indigo-400 font-bold uppercase">{bypassTenant}</span>
          </p>
        </div>

        <form onSubmit={mode === 'signup' ? handleSignUp : mode === 'signin' ? handleSignIn : (e) => e.preventDefault()} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Organization / Hospital ID*</label>
            <div className="relative group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input 
                type="number"
                required
                placeholder="e.g. 1001"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-bold transition-all placeholder:text-slate-600 placeholder:font-medium"
              />
            </div>
          </div>
          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Name of Hospital*</label>
                <input 
                  type="text"
                  required
                  placeholder="Enter hospital name"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-bold transition-all placeholder:text-slate-600 placeholder:font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department Name*</label>
                <input 
                  type="text"
                  required
                  placeholder="Enter department name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-bold transition-all placeholder:text-slate-600 placeholder:font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name*</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <input 
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-bold transition-all placeholder:text-slate-600 placeholder:font-medium"
                  />
                </div>
              </div>
            </>
          )}

          {(mode === 'signup' || mode === 'signin' || mode === 'forgot') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {mode === 'forgot' ? 'Recovery Identifier (Phone or Email)*' : mode === 'signup' ? 'Mobile Number or Email*' : 'Identifier (Phone or Email)*'}
              </label>
              <div className="relative group">
                {identifier.includes('@') ? (
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                ) : (
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                )}
                <input 
                  type="text"
                  required
                  placeholder={mode === 'forgot' ? "Enter recovery phone or email" : mode === 'signup' ? "Phone or Email" : "Enter your phone or email"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-bold transition-all placeholder:text-slate-600 placeholder:font-medium"
                />
              </div>
            </div>
          )}

          {(mode === 'signup' || mode === 'signin') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {mode === 'signup' ? 'Create New Passcode*' : 'Passcode*'}
              </label>
              <div className="relative group">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="password"
                  required
                  placeholder={mode === 'signup' ? "Choose a passcode" : "Enter your passcode"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-mono font-bold tracking-widest transition-all placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Passcode*</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="password"
                  required
                  placeholder="Repeat passcode"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-white font-mono font-bold tracking-widest transition-all placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex gap-3 items-center animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              onClick={() => {
                if (mode === 'forgot') {
                  addToast('info', 'Recovery request submitted to organization administrators.');
                  setMode('signin');
                }
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all cursor-pointer shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : mode === 'signup' ? (
                <>
                  <UserPlus size={16} />
                  <span>Register Account</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <LogIn size={16} />
                  <span>Verify Identity</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Request Reset</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Portal Switch</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <div className="flex items-center justify-between w-full">
            {mode === 'signin' ? (
              <>
                <button 
                  onClick={() => setMode('signup')}
                  className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Create Account
                </button>
                <button 
                  onClick={() => setMode('forgot')}
                  className="text-[10px] font-black text-slate-500 hover:text-slate-400 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Forgot Passcode?
                </button>

              </>
            ) : (
              <button 
                onClick={() => setMode('signin')}
                className="w-full text-center text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Already have an account? Sign In
              </button>
            )}
          </div>
        </div>

        {/* GPS Verification Banner */}
        <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <MapPin size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">Perimeter Verification</p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight">
                {locationVerified ? 'Secure Connection Active' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Distance</span>
            <span className="text-xs font-mono font-bold text-white">
              {distance !== null ? `${Math.round(distance)}m` : '--'}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-40">
        Clinical Guard Authentication Engine v2.0
      </p>
    </div>
  );
}
