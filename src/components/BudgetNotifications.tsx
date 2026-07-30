import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function BudgetNotifications({ budget, spent, showSuggestions }: { budget: number, spent: number, showSuggestions?: boolean }) {
  const percentage = (spent / budget) * 100;
  if (percentage < 80) return null;

  const getStyle = () => {
    if (percentage >= 95) return 'bg-red-50 border-red-500 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200';
    if (percentage >= 90) return 'bg-rose-50 border-rose-500 dark:bg-rose-900/30 dark:border-rose-700 text-rose-800 dark:text-rose-200';
    return 'bg-amber-50 border-amber-500 dark:bg-amber-900/30 dark:border-amber-700 text-amber-800 dark:text-amber-200';
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${getStyle()}`}>
      <div className="flex items-center gap-2 text-xs font-bold">
        <AlertCircle size={14} />
        Budget Alert: {percentage.toFixed(0)}% Utilized
        {percentage >= 95 && <span className="ml-auto text-[10px] font-black uppercase">Critical</span>}
      </div>
      {showSuggestions && percentage > 85 && (
        <button className="mt-2 w-full text-[10px] bg-white/50 p-1 rounded font-bold">Suggest Reallocation</button>
      )}
    </div>
  );
}
