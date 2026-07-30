import React from 'react';

export default function HRChecklistView() {
  const steps = ['Contract Signed', 'Background Check', 'Orientation Complete', 'ID Card Issued'];
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-black text-slate-800 mb-6">New Hire Checklist</h3>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3 mb-4">
          <input type="checkbox" className="w-5 h-5 accent-indigo-600" />
          <span className="text-sm font-bold text-slate-700">{step}</span>
        </div>
      ))}
    </div>
  );
}
