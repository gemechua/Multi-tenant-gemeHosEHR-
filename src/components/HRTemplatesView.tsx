import React from 'react';

export default function HRTemplatesView() {
  const templates = ['Offer Letter', 'Warning Notice', 'Resignation Acknowledgement'];
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-black text-slate-800 mb-6">Template Library</h3>
      {templates.map((t, i) => (
        <div key={i} className="p-4 bg-slate-50 rounded-xl mb-3 flex justify-between items-center">
          <span className="font-bold text-slate-700">{t}</span>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">Load</button>
        </div>
      ))}
    </div>
  );
}
