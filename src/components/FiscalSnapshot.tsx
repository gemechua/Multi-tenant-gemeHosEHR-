import React from 'react';
import { AlertCircle, Target } from 'lucide-react';

export default function FiscalSnapshot() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
        <p className="text-[10px] text-rose-800 dark:text-rose-200 uppercase font-bold">Unreconciled Insurance</p>
        <p className="text-xl font-black text-rose-900 dark:text-rose-100">$12,450</p>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <p className="text-[10px] text-emerald-800 dark:text-emerald-200 uppercase font-bold">Budget Remaining</p>
        <p className="text-xl font-black text-emerald-900 dark:text-emerald-100">4%</p>
      </div>
    </div>
  );
}
