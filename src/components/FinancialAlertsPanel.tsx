import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function FinancialAlertsPanel() {
  const alerts = [
      { id: 1, text: 'Eligibility Request #102: Indigency Verification needed' },
      { id: 2, text: 'Insurance Reconciliation: Claim #987 mismatch' },
  ];
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase">Critical Alerts</h4>
        {alerts.map(a => (
            <div key={a.id} className="flex gap-2 p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 rounded text-[10px]">
                <AlertTriangle size={12} />
                {a.text}
            </div>
        ))}
    </div>
  );
}
