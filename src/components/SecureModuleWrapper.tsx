import React, { useState, useEffect, createContext, useContext } from 'react';
import ModulePasscodeModal from './ModulePasscodeModal';
import { LogOut, ShieldCheck, User } from 'lucide-react';

export const SkippedContext = createContext({ isSkipped: false });
export const useSkippedContext = () => useContext(SkippedContext);

interface SecureModuleWrapperProps {
  moduleName: string;
  children: React.ReactNode;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onCancel: () => void;
}

export default function SecureModuleWrapper({ moduleName, children, addToast, onCancel }: SecureModuleWrapperProps) {
  const storageKey = `module_authenticated_${moduleName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const [moduleAuth, setModuleAuth] = useState<'authenticated' | 'skipped' | null>(() => {
    return localStorage.getItem(storageKey) === 'true' ? 'authenticated' : null;
  });

  useEffect(() => {
    if (localStorage.getItem(storageKey) === 'true') {
      setModuleAuth('authenticated');
    }
  }, [moduleName, storageKey]);

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_user`);
    setModuleAuth(null);
    addToast('info', `Logged out of ${moduleName}. Please sign in or sign up to re-enter.`);
  };

  if (!moduleAuth) {
    return (
      <div className="space-y-6">
        <ModulePasscodeModal
          moduleName={moduleName}
          onSuccess={() => setModuleAuth('authenticated')}
          onSkip={() => setModuleAuth('skipped')}
          onCancel={onCancel}
          addToast={addToast}
        />
      </div>
    );
  }

  const isSkipped = moduleAuth === 'skipped';
  const savedUser = localStorage.getItem(`${storageKey}_user`);

  return (
    <SkippedContext.Provider value={{ isSkipped }}>
      <div className="space-y-4">
        {/* Module Session Action Header with Logout button */}
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-slate-400 font-medium">Module Session:</span>
            <strong className="text-white font-extrabold uppercase tracking-wide">{moduleName}</strong>
            {savedUser && (
              <span className="text-[11px] text-indigo-300 font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50 flex items-center gap-1">
                <User size={11} /> {savedUser}
              </span>
            )}
            {isSkipped ? (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-amber-500/30">
                Preview Mode
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-emerald-500/30">
                Signed In
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            title={`Sign Out & Log Out of ${moduleName}`}
          >
            <LogOut size={13} />
            <span>Log Out {moduleName}</span>
          </button>
        </div>

        {children}
      </div>
    </SkippedContext.Provider>
  );
}

