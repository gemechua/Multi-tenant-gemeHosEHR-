import React from 'react';

export default function CSRMonitor() {
  const budget = 50000;
  const spent = 35000;
  const percentage = (spent / budget) * 100;
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
        <h4 className="text-xs font-bold text-slate-500">Charity/Indigency Monitor</h4>
        <div className="flex justify-between text-xs">
            <span>Spent: ${spent.toLocaleString()}</span>
            <span>Budget: ${budget.toLocaleString()}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
  );
}
