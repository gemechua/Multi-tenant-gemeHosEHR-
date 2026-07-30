import React, { useState } from 'react';
import { X, Save, Settings, ShieldAlert, Sliders, Check } from 'lucide-react';

interface DepartmentRadiusConfigModalProps {
  onClose: () => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function DepartmentRadiusConfigModal({ onClose, addToast }: DepartmentRadiusConfigModalProps) {
  const [departmentRadii, setDepartmentRadii] = useState<any[]>([
    { department: 'Emergency & Triage', radius: 300, thresholdWarning: 250, alertEnabled: true },
    { department: 'Nursing & Ward', radius: 500, thresholdWarning: 420, alertEnabled: true },
    { department: 'Surgery & ICU', radius: 400, thresholdWarning: 350, alertEnabled: true },
    { department: 'Laboratory & Diagnostics', radius: 500, thresholdWarning: 450, alertEnabled: false },
    { department: 'Radiology', radius: 450, thresholdWarning: 380, alertEnabled: true },
    { department: 'Administration & HR', radius: 800, thresholdWarning: 700, alertEnabled: false },
  ]);

  const [saving, setSaving] = useState(false);

  const handleRadiusChange = (index: number, val: number) => {
    const updated = [...departmentRadii];
    updated[index].radius = val;
    // auto adjust warning threshold to 85%
    updated[index].thresholdWarning = Math.round(val * 0.85);
    setDepartmentRadii(updated);
  };

  const handleToggleAlert = (index: number) => {
    const updated = [...departmentRadii];
    updated[index].alertEnabled = !updated[index].alertEnabled;
    setDepartmentRadii(updated);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast('success', 'Department geofencing radius configurations saved successfully.');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base uppercase tracking-tight">Department Geofencing Radius Settings</h3>
              <p className="text-xs text-gray-500 font-medium">Configure allowed check-in perimeter distance and proximity threshold alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              HR Managers can adjust allowable check-in radii per department. When a staff member checks in near the threshold limit (85% of max radius), real-time alerts are sent to HR notifications.
            </p>
          </div>

          <div className="space-y-3">
            {departmentRadii.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{item.department}</h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Proximity Warning Alert at {item.thresholdWarning}m
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] font-black uppercase text-gray-500">Threshold Alert</span>
                    <input
                      type="checkbox"
                      checked={item.alertEnabled}
                      onChange={() => handleToggleAlert(idx)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Allowed Radius</span>
                    <span className="text-indigo-600 font-mono text-sm">{item.radius} meters</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={item.radius}
                    onChange={(e) => handleRadiusChange(idx, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                    <span>100m (Strict)</span>
                    <span>1000m</span>
                    <span>2000m (Extended)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 transition-all"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
