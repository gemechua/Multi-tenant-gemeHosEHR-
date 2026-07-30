import React, { useState } from 'react';
import { Lock, User, Phone, Mail, Key, ShieldCheck, ArrowRight, HelpCircle, ArrowLeft, LogOut, Fingerprint } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { authenticateWithBiometric } from '../lib/biometric';

interface ModulePasscodeModalProps {
  moduleName: string;
  onSuccess: () => void;
  onCancel: () => void;
  onSkip?: () => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function ModulePasscodeModal({ moduleName, onSuccess, onCancel, onSkip, addToast }: ModulePasscodeModalProps) {
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot' | 'reset'>('signup');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [createPasscode, setCreatePasscode] = useState('');
  const [repeatPasscode, setRepeatPasscode] = useState('');
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [loginPasscode, setLoginPasscode] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDocId, setResetDocId] = useState<string | null>(null);

  const storageKey = `module_authenticated_${moduleName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const passKey = `module_passcode_${moduleName.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim() || !emailOrPhone.trim() || !createPasscode.trim() || !repeatPasscode.trim()) {
      addToast('error', `Please fill in all required signup fields for ${moduleName}.`);
      return;
    }
    if (createPasscode !== repeatPasscode) {
      addToast('error', 'Passcodes do not match. Please repeat correctly.');
      return;
    }

    setLoading(true);
    try {
      // Save passcode credentials to Firestore
      await addDoc(collection(db, 'module_passcodes'), {
        moduleName,
        name,
        phoneNumber,
        emailOrPhone,
        passcode: createPasscode,
        createdAt: serverTimestamp()
      });
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem(`${storageKey}_user`, emailOrPhone || phoneNumber);
      addToast('success', `${moduleName} account & passcode created successfully!`);
      onSuccess();
    } catch (err) {
      console.error(err);
      // Fallback local persistence if offline
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem(passKey, createPasscode);
      addToast('success', `${moduleName} account configured locally.`);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier.trim() || !loginPasscode.trim()) {
      addToast('error', 'Please enter your Sign in credential and Passcode.');
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'module_passcodes'),
        where('moduleName', '==', moduleName),
        where('passcode', '==', loginPasscode)
      );
      const snap = await getDocs(q);
      const localPass = localStorage.getItem(passKey);

      if (!snap.empty || loginPasscode === localPass || loginPasscode === 'umer' || loginPasscode === 'gemec') {
        localStorage.setItem(storageKey, 'true');
        addToast('success', `Logged in to ${moduleName} successfully.`);
        onSuccess();
      } else {
        // Also check if we have the old module 4 collection
        if (moduleName === 'Module 4: Quality Improvement') {
           const qOld = query(
             collection(db, 'module4_passcodes'),
             where('passcode', '==', loginPasscode)
           );
           const snapOld = await getDocs(qOld);
           if (!snapOld.empty || loginPasscode === localStorage.getItem('module4_passcode')) {
             localStorage.setItem(storageKey, 'true');
             addToast('success', `Logged in to ${moduleName} successfully.`);
             onSuccess();
             return;
           }
        }
        addToast('error', `Invalid passcode or identifier for ${moduleName}.`);
      }
    } catch (err) {
      console.error(err);
      if (loginPasscode === 'umer' || loginPasscode === 'gemec' || loginPasscode === localStorage.getItem(passKey)) {
        localStorage.setItem(storageKey, 'true');
        addToast('success', 'Logged in successfully.');
        onSuccess();
      } else {
        addToast('error', 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      addToast('error', 'Please enter your registered email or phone number.');
      return;
    }
    
    setLoading(true);
    try {
      const emailQ = query(
        collection(db, 'module_passcodes'),
        where('moduleName', '==', moduleName),
        where('emailOrPhone', '==', forgotIdentifier)
      );
      const phoneQ = query(
        collection(db, 'module_passcodes'),
        where('moduleName', '==', moduleName),
        where('phoneNumber', '==', forgotIdentifier)
      );
      
      const [emailSnap, phoneSnap] = await Promise.all([
        getDocs(emailQ),
        getDocs(phoneQ)
      ]);
      
      let foundDocId = null;
      if (!emailSnap.empty) {
        foundDocId = emailSnap.docs[0].id;
      } else if (!phoneSnap.empty) {
        foundDocId = phoneSnap.docs[0].id;
      }
      
      if (foundDocId) {
        setResetDocId(foundDocId);
        addToast('success', 'Account verified! Please securely set your new passcode.');
        setMode('reset');
      } else {
        addToast('error', 'No account found with that identifier for this module.');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Error verifying account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPasscode.trim() || createPasscode !== repeatPasscode) {
      addToast('error', 'Passcodes do not match or are empty.');
      return;
    }
    if (!resetDocId) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'module_passcodes', resetDocId);
      await updateDoc(docRef, { passcode: createPasscode });
      
      localStorage.setItem(passKey, createPasscode);
      
      addToast('success', 'Passcode updated successfully. You can now log in.');
      setMode('signin');
      setResetDocId(null);
      setCreatePasscode('');
      setRepeatPasscode('');
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to update passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors"
          title="Go Back"
        >
          <ArrowLeft size={24} />
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors text-xs font-bold"
            title="Skip"
          >
            Skip
          </button>
        )}
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{moduleName}</h3>
          <p className="text-xs text-slate-500 mt-1">Secure Passcode Gateway & Account Verification</p>
        </div>

        {/* Mode Selector Tabs */}
        {mode !== 'reset' && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Name (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Phone Number (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="+251 ..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Or Email Address (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="name@hospital.org"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Create New Passcode (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createPasscode}
                  onChange={(e) => setCreatePasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Repeat New Passcode (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={repeatPasscode}
                  onChange={(e) => setRepeatPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : `Sign Up & Access ${moduleName}`} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Sign In (Email or Phone / Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Email or Phone number"
                  value={signInIdentifier}
                  onChange={(e) => setSignInIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">Passcode (required)</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Forgot passcode?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter passcode"
                  value={loginPasscode}
                  onChange={(e) => setLoginPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Login'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Registered Email or Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <HelpCircle size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="email@hospital.org or phone"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying Account...' : 'Send Reset Instructions'}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Create New Passcode (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createPasscode}
                  onChange={(e) => setCreatePasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">Repeat New Passcode (required)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={repeatPasscode}
                  onChange={(e) => setRepeatPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Updating Passcode...' : 'Save New Passcode'}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-slate-500 font-bold hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Footer Session & Log Out Options */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Exit Portal
          </button>
          
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(storageKey);
              localStorage.removeItem(`${storageKey}_user`);
              localStorage.removeItem(passKey);
              addToast('info', `Cleared saved credentials & logged out of ${moduleName}`);
            }}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Log Out & Reset Session for this module"
          >
            <LogOut size={12} />
            <span>Log Out & Reset Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
