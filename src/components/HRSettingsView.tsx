import React from 'react';

export default function HRSettingsView() {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-black text-slate-800 mb-6">Automated Notifications</h3>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
        <span className="font-bold text-slate-700">Contract Renewals</span>
        <input type="checkbox" className="w-5 h-5 accent-indigo-600" defaultChecked />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <span className="font-bold text-slate-700">Performance Review Deadlines</span>
        <input type="checkbox" className="w-5 h-5 accent-indigo-600" />
      </div>
    </div>
  );
}
