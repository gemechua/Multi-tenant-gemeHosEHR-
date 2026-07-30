import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KeyRound, ShieldCheck, Check, X, AlertCircle, Copy, ShieldAlert } from 'lucide-react';
import { userInviteSchema } from '../lib/schemas';
import { EHR_MODULES, EHR_ROLES, HOSPITAL_LAT, HOSPITAL_LON, ALLOWED_RADIUS_METERS, getDistance } from '../lib/constants';

interface InviteUserFormProps {
  onSuccess?: () => void;
}

export default function InviteUserForm({ onSuccess }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [hospitalId, setHospitalId] = useState('TENANT-ID');
  const [role, setRole] = useState<typeof EHR_ROLES[number]>('user');
  const [customRole, setCustomRole] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['register_logbook', 'consolidated_33_hub']);
  const [password, setPassword] = useState('');
  const [locationRestricted, setLocationRestricted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedBypassUrl, setGeneratedBypassUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    if (activeHospitalStr) {
      try {
        const activeHospital = JSON.parse(activeHospitalStr);
        if (activeHospital?.hospital_unique_number) {
          setHospitalId(activeHospital.hospital_unique_number);
        } else if (activeHospital?.hospital_id) {
          setHospitalId(activeHospital.hospital_id);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handlePermissionChange = (mod: string) => {
    setPermissions(prev => 
      prev.includes(mod) ? prev.filter(p => p !== mod) : [...prev, mod]
    );
  };

  // Strength Check Logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-200', text: 'text-gray-400', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) {
      return { score, label: 'Weak 🔴', color: 'bg-red-500', text: 'text-red-600', width: '33%' };
    } else if (score <= 4) {
      return { score, label: 'Moderate 🟡', color: 'bg-amber-500', text: 'text-amber-600', width: '66%' };
    } else {
      return { score, label: 'Strong 🟢', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
    }
  };

  const strength = getPasswordStrength(password);

  const executeSubmit = async () => {
    try {
      // Zod Front-end validation
      const validationResult = userInviteSchema.safeParse({
        fullName,
        email,
        role,
        customRole,
        permissions,
        password,
      });
      
      if (!fullName.trim() || !hospitalId.trim() || !email.trim()) {
        setErrorMessage('All fields (Name, Hospital ID, and Email) are required.');
        setIsSubmitting(false);
        return;
      }

      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospital_id = activeHospital?.hospital_unique_number || 'demo-global';

      await addDoc(collection(db, 'users'), {
        email: email.trim(),
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim() || null,
        role,
        customRole: role === 'other' ? customRole.trim() : null,
        permissions: permissions,
        password: password || null, // save password if provided
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        hospital_id: hospitalId.trim(),
        location_restricted: locationRestricted
      });
      
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const bypassUrl = `${origin}${pathname}?bypass_tenant=${hospital_id}&bypass_user=${encodeURIComponent(email.trim())}`;
      setGeneratedBypassUrl(bypassUrl);
      setCopiedLink(false);

      setEmail('');
      setFullName('');
      setMobileNumber('');
      setHospitalId('');
      setPassword('');
      setSuccessMessage('Staff colleague successfully invited and registered!');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 5000); // give more time to see and copy the link
      }
    } catch (error: any) {
      console.error('Error adding user: ', error);
      setErrorMessage(error.message || 'Error saving user to database. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('Location Access Required: Geolocation is not supported by this browser.');
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistance(latitude, longitude, HOSPITAL_LAT, HOSPITAL_LON);
        
        if (distance > ALLOWED_RADIUS_METERS) {
          setErrorMessage(`Security Breach: You are ${Math.round(distance)}m outside the hospital perimeter. Action denied.`);
          setIsSubmitting(false);
          return;
        }

        await executeSubmit();
      },
      (error) => {
        console.error("Location access error:", error);
        setErrorMessage('Security Protocol Failure: Could not verify location. Please enable GPS.');
        setIsSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-semibold">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-bold">{successMessage}</div>
          </div>

          {generatedBypassUrl && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2 animate-fadeIn text-xs">
              <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px] block">Direct Access Bypass URL</span>
              <p className="text-[10px] text-gray-500 leading-snug">
                Send this link to the registered admin/user. Opening it allows them to bypass the application gateway page entirely and enter your organization home page instantly:
              </p>
              <div className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-gray-250 select-text">
                <span className="font-mono text-[9px] text-gray-600 truncate flex-1 select-all">{generatedBypassUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedBypassUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy size={10} />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. John Doe"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Mobile Number
        </label>
        <input
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="+251 900 000 000"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Hospital ID *
        </label>
        <input
          type="text"
          value={hospitalId}
          onChange={(e) => setHospitalId(e.target.value)}
          placeholder="e.g. TENANT-ID"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white font-mono font-bold uppercase"
          required
        />
        <p className="text-[10px] text-gray-500 mt-1 italic">
          Hospital ID is auto-saved and pre-filled from your active hospital tenant session.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. john@example.com"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white"
          required
        />
      </div>



      <div className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
        <input
          type="checkbox"
          id="locationRestricted"
          checked={locationRestricted}
          onChange={(e) => setLocationRestricted(e.target.checked)}
          className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500 cursor-pointer"
        />
        <label htmlFor="locationRestricted" className="flex items-center gap-2 cursor-pointer">
          <ShieldAlert size={16} className="text-rose-600" />
          <div className="flex flex-col">
            <p className="text-xs font-bold text-rose-900 leading-none">Location Restriction</p>
            <p className="text-[10px] text-rose-600 mt-1">If enabled, this user will only be able to use direct bypass links within the hospital compound.</p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          App Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow cursor-pointer capitalize"
        >
          {EHR_ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {role === 'other' && (
        <div className="animate-in fade-in zoom-in duration-200">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Custom Role (Required)
          </label>
          <input
            type="text"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="e.g. Guest"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white"
            required={role === 'other'}
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Module & Ground Rule Permissions
        </label>
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-lg">
          {EHR_MODULES.map(mod => (
            <label key={mod.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 p-1.5 rounded-md">
              <input
                type="checkbox"
                checked={permissions.includes(mod.key)}
                onChange={() => handlePermissionChange(mod.key)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="truncate font-semibold">{mod.label}</span>
                <span className="text-[10px] text-gray-400 truncate">{mod.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Set Security Password
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secure initial password (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white font-mono"
          />
        </div>

        {/* Real-time Password Strength Meter */}
        {password && (
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 mt-2 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} className="text-gray-400" /> Security Strength
              </span>
              <span className={`text-[10px] font-bold ${strength.text}`}>
                {strength.label}
              </span>
            </div>
            
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${strength.color} transition-all duration-300`} 
                style={{ width: strength.width }}
              />
            </div>

            {/* Micro security checklists */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {password.length >= 8 ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>8+ characters</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>Upper & Lower</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {/[0-9]/.test(password) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>At least one number</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {/[^A-Za-z0-9]/.test(password) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>Special character</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gray-950 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-850 transition-colors disabled:opacity-50 mt-2 cursor-pointer"
      >
        {isSubmitting ? 'Sending Invite...' : 'Send Invite'}
      </button>
    </form>
  );
}
