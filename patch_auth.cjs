const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthGateway.tsx', 'utf-8');

const importReplacement = `import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Lock, Phone, Mail, Shield, AlertCircle, 
  MapPin, CheckCircle2, ArrowRight, UserPlus, LogIn, Key,
  ShieldCheck, Globe, RefreshCw, LogOut, Fingerprint
} from 'lucide-react';`;

content = content.replace(/import React, \{ useState, useEffect \} from 'react';[\s\S]*?\} from 'lucide-react';/, importReplacement);

const stateReplacement = `  const [confirmPasscode, setConfirmPasscode] = useState('');
  
  // Biometrics
  const [fingerprintScanned, setFingerprintScanned] = useState(false);
  const [scanningFingerprint, setScanningFingerprint] = useState(false);
`;

content = content.replace("  const [confirmPasscode, setConfirmPasscode] = useState('');", stateReplacement);

const handleScanFingerprint = `  const handleScanFingerprint = () => {
    setScanningFingerprint(true);
    setTimeout(() => {
      setScanningFingerprint(false);
      setFingerprintScanned(true);
      addToast('success', 'Biometric identity verified successfully.');
    }, 1500);
  };

  const handleSignIn = async (e: React.FormEvent) =>`;

content = content.replace("  const handleSignIn = async (e: React.FormEvent) =>", handleScanFingerprint);

const validationReplacementSignin = `    if (!locationVerified) {
      setError('Location verification is required for secure access.');
      return;
    }
    if (!fingerprintScanned) {
      setError('Biometric fingerprint scan is required to authenticate.');
      return;
    }`;

content = content.replace(/    if \(\!locationVerified\) \{[\s\S]*?return;\n    \}/, validationReplacementSignin);

const validationReplacementSignup = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationVerified) {
      setError('Location verification is required for secure access.');
      return;
    }
    if (!fingerprintScanned) {
      setError('Biometric fingerprint scan is required to register an account.');
      return;
    }`;

content = content.replace(/  const handleSignUp = async \(e: React.FormEvent\) => \{[\s\S]*?return;\n    \}/, validationReplacementSignup);

const fingerprintJSX = `          {(mode === 'signup' || mode === 'signin') && (
            <div className="space-y-1.5 mt-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Biometric Verification*
              </label>
              <button
                type="button"
                onClick={handleScanFingerprint}
                disabled={fingerprintScanned || scanningFingerprint}
                className={\`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all \${
                  fingerprintScanned
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-indigo-600/30 hover:border-indigo-500 bg-indigo-600/10 text-indigo-400 cursor-pointer'
                }\`}
              >
                {scanningFingerprint ? (
                  <>
                    <RefreshCw className="animate-spin" size={24} />
                    <span className="font-bold text-sm">Scanning Biometrics...</span>
                  </>
                ) : fingerprintScanned ? (
                  <>
                    <CheckCircle2 size={24} />
                    <span className="font-bold text-sm">Identity Verified</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={24} className="animate-pulse" />
                    <span className="font-bold text-sm">Tap to Scan Fingerprint</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (`;

content = content.replace(/          \{error && \(/, fingerprintJSX);

fs.writeFileSync('src/components/UserAuthGateway.tsx', content);
