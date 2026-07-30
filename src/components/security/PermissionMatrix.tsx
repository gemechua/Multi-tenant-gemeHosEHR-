import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Save, RefreshCw, Info, Lock } from 'lucide-react';
import { collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EHR_MODULES, EHR_ROLES } from '../../lib/constants';

const ACTIONS = ['read', 'write', 'edit', 'delete'];

export default function PermissionMatrix() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, string[]>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Load permissions from Firestore
  useEffect(() => {
    const q = query(collection(db, 'role_permissions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, Record<string, string[]>> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data() as Record<string, string[]>;
      });
      setMatrix(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading permissions matrix:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleToggle = (role: string, module: string, action: string) => {
    const roleData = matrix[role] || {};
    const currentActions = roleData[module] || [];
    const newActions = currentActions.includes(action)
      ? currentActions.filter(a => a !== action)
      : [...currentActions, action];

    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [module]: newActions
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback('');
    try {
      for (const role of EHR_ROLES) {
        const roleData = matrix[role] || {};
        await setDoc(doc(db, 'role_permissions', role), roleData);
      }
      setFeedback('✓ Permissions saved successfully.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      setFeedback('Error saving permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-indigo-600" size={28} />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Clinical Scopes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" id="permission_matrix_root">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="text-indigo-600" size={18} />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Global Permission Matrix</h2>
          </div>
          <p className="text-sm text-gray-500">Configure baseline R/W/E/D clinical scopes for each staff role across EHR modules.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {feedback && <span className="text-sm font-semibold text-emerald-600 animate-pulse">{feedback}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-950 hover:bg-gray-900 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer text-sm whitespace-nowrap"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden border-separate">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-64 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                  Module / EHR Node
                </th>
                {EHR_ROLES.map(role => (
                  <th key={role} className="px-6 py-5 text-center min-w-[200px]">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
                      role === 'director' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      role === 'mid-manager' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {role}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {EHR_MODULES.map((module, mIdx) => (
                <tr key={module.key} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.03)] group-hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors"></div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 block">{module.label}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{module.desc.substring(0, 40)}...</span>
                      </div>
                    </div>
                  </td>
                  {EHR_ROLES.map(role => (
                    <td key={`${role}-${module.key}`} className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {ACTIONS.map(action => {
                          const isChecked = matrix[role]?.[module.key]?.includes(action);
                          return (
                            <button 
                              key={action}
                              type="button"
                              title={`${action.toUpperCase()} Access for ${role}`}
                              onClick={() => handleToggle(role, module.key, action)}
                              className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer relative group/item ${
                                isChecked 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                  : 'bg-white border-gray-200 text-gray-300 hover:border-indigo-200 hover:text-indigo-400'
                              }`}
                            >
                              <span className="text-[10px] font-black uppercase leading-none">{action[0]}</span>
                              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center transition-transform ${isChecked ? 'scale-100' : 'scale-0'}`}>
                                <Check size={8} className="text-white" strokeWidth={4} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-2xl flex items-start gap-3">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Dynamic Inheritance Rules</h4>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Baseline permissions updated here will propagate instantly to all staff assigned to the respective role. Individual user overrides in the directory remain preserved unless explicitly reset.
            </p>
          </div>
        </div>
        <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl flex items-start gap-3">
          <Shield className="text-blue-600 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">EHR Security Enforcement</h4>
            <p className="text-xs text-blue-800/80 leading-relaxed">
              <span className="font-bold">R</span>ead, <span className="font-bold">W</span>rite, <span className="font-bold">E</span>dit, and <span className="font-bold">D</span>elete scopes are validated at the Firestore Rule level and within clinical routing middlewares.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
