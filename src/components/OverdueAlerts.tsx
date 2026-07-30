import React from 'react';

export default function OverdueAlerts() {
  const overdue = [
      { id: 1, patient: 'John Doe', amount: 1200, days: 45 },
      { id: 2, patient: 'Jane Smith', amount: 800, days: 90 },
  ];
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 mb-2">Overdue Balances</h4>
        {overdue.map(o => (
            <div key={o.id} className="text-xs p-1 border-b dark:border-slate-700 flex justify-between">
                <span>{o.patient} ({o.days}d)</span>
                <span className="font-bold text-rose-600">${o.amount}</span>
            </div>
        ))}
    </div>
  );
}
