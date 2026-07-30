import React, { useState } from 'react';

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState<any[]>([]);

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalCurrent = budgets.reduce((sum, b) => sum + b.current, 0);

  return (
    <div className="bg-white p-6 rounded-lg border space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-xs text-indigo-600 font-bold uppercase">Total Budget</div>
            <div className="text-xl font-black">${totalLimit.toLocaleString()}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="text-xs text-emerald-600 font-bold uppercase">Total Spent</div>
            <div className="text-xl font-black">${totalCurrent.toLocaleString()}</div>
        </div>
      </div>
      <h2 className="text-lg font-bold mb-4">Budget Management by Department</h2>
      <div className="space-y-4">
        {budgets.map(b => (
          <div key={b.dept} className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>{b.dept}</span>
              <span className={b.current > b.limit ? 'text-rose-600' : 'text-slate-700'}>${b.current} / ${b.limit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${b.current > b.limit ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((b.current / b.limit) * 100, 100)}%` }} />
            </div>
            {b.current > b.limit && <div className="text-[10px] text-rose-600 font-bold">Warning: Budget Exceeded!</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
