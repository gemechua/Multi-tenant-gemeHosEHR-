import React from 'react';
import { Upload } from 'lucide-react';

export default function BankStatementMatcher() {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 mb-2">Auto-Match Bank Statements</h4>
        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded cursor-pointer text-xs font-bold">
            <Upload size={14} /> Upload Bank CSV
            <input type="file" className="hidden" />
        </label>
    </div>
  );
}
