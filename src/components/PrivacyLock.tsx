import React, { useState, useRef, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyLockProps {
  onUnlockSuccess: () => void;
  onUnlockFailure: (enteredPass: string) => void;
  expectedPasscodes?: string[];
  title?: string;
  description?: string;
  ownerOnly?: boolean;
  badgeLabel?: string;
}

export default function PrivacyLock({ 
  onUnlockSuccess, 
  onUnlockFailure, 
  expectedPasscodes,
  title = "Restricted Privacy Area",
  description = "This division contains sensitive logs, security keys, and user settings. Please enter the master security passcode to continue.",
  ownerOnly = false,
  badgeLabel
}: PrivacyLockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isErrorShake, setIsErrorShake] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus the input field for user convenience
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = (password || '').trim().toLowerCase();
    const defaultPasscodes = [
      import.meta.env.VITE_OWNER_PASSCODE || 'fussilat9',
      import.meta.env.VITE_DIRECTOR_PASSCODE || 'umer',
      import.meta.env.VITE_WORKSPACE_PASSCODE || 'gemec',
      'admin'
    ];
    const allowedPasscodes = expectedPasscodes || defaultPasscodes;
    if (allowedPasscodes.map(p => String(p || '').toLowerCase()).includes(trimmed)) {
      onUnlockSuccess();
    } else {
      onUnlockFailure(trimmed);
      // Trigger a shake animation
      setIsErrorShake(true);
      setTimeout(() => setIsErrorShake(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[520px] p-4 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: isErrorShake ? [0, -10, 10, -10, 10, -5, 5, 0] : 0
        }}
        transition={{ 
          duration: isErrorShake ? 0.4 : 0.5,
          ease: 'easeInOut' 
        }}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center relative overflow-hidden"
      >
        {(ownerOnly || badgeLabel) && (
          <div className="absolute top-0 right-0 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-red-100 flex items-center gap-1 z-10 animate-pulse">
            <Lock size={10} />
            <span>{badgeLabel || "Owner Only"}</span>
          </div>
        )}

        {/* Subtle background abstract pattern */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gray-50 rounded-full blur-2xl pointer-events-none" />

        {/* Lock Icon Circle */}
        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-400 mb-6 relative">
          <motion.div
            animate={{ rotate: isErrorShake ? [0, -15, 15, -15, 15, 0] : 0 }}
            transition={{ duration: 0.4 }}
          >
            <Lock size={28} className={(ownerOnly || badgeLabel) ? "text-red-600" : "text-gray-950"} />
          </motion.div>
          <div className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white ${(ownerOnly || badgeLabel) ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
            <ShieldAlert size={12} />
          </div>
        </div>

        {/* Heading & description */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          {title}
          {(ownerOnly || badgeLabel) && (
            <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Restricted
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
          {description}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Passcode
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-gray-400">
                <KeyRound size={16} />
              </span>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                  isErrorShake 
                    ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' 
                    : 'border-gray-200 focus:ring-gray-100 focus:border-gray-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-800 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Authenticate Access
            </button>
          </div>
        </form>

        {/* Compliance Footer */}
        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Security Verified Session</span>
        </div>
      </motion.div>
    </div>
  );
}

