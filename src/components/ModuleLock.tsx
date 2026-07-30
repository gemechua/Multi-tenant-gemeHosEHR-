import React, { useState } from 'react';
import { SecurityManager } from '../lib/SecurityManager';
import { Lock, Shield, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface ModuleLockProps {
  moduleId: string;
  moduleName: string;
  onUnlock: () => void;
}

export default function ModuleLock({ moduleId, moduleName, onUnlock }: ModuleLockProps) {
  const isSet = SecurityManager.isPasswordSet(moduleId);
  
  const [mode, setMode] = useState<'create' | 'login' | 'forgot'>(isSet ? 'login' : 'create');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [question, setQuestion] = useState("What is your pet's name?");
  const [answer, setAnswer] = useState('');
  
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (!answer) {
      setError('Security answer is required');
      return;
    }
    SecurityManager.setPassword(moduleId, password);
    SecurityManager.saveSecurityQuestion(moduleId, question, answer);
    onUnlock();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (SecurityManager.validatePassword(moduleId, password)) {
      onUnlock();
    } else {
      setError('Incorrect password');
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (SecurityManager.validateSecurityAnswer(moduleId, answer)) {
      setMode('create');
      setPassword('');
      setConfirmPassword('');
      setAnswer('');
      setError('');
    } else {
      setError('Incorrect answer');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Shield size={120} />
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Secure Module Access</h2>
            <p className="text-xs text-slate-500 font-medium">{moduleName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 relative z-10">
            <div className="mb-2">
              <p className="text-sm font-semibold text-slate-700 mb-1">Create Password for {moduleName}</p>
              <p className="text-xs text-slate-500 mb-4">You need to set up a password to protect the data in this module.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Confirm password"
              />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Security Question (For Recovery)</label>
              <select
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm mb-3"
              >
                <option value="What is your pet's name?">What is your pet's name?</option>
                <option value="In what city were you born?">In what city were you born?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              </select>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Answer"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <Key size={16} /> Save & Unlock
            </button>
            {isSet && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors mt-2"
              >
                Cancel Reset
              </button>
            )}
          </form>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-4">Please enter the password to access {moduleName}.</p>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <Lock size={16} /> Unlock Module
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setAnswer(''); }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4 relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-4">Answer your security question to reset password.</p>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Question</label>
              <p className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium text-slate-800 mb-3 border border-slate-200">
                {SecurityManager.getSecurityQuestion(moduleId)}
              </p>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Answer</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter answer"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              Verify Answer
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
