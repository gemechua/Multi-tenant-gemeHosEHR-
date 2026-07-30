import React, { useState } from 'react';
import { LayoutGrid, BarChart3, Table } from 'lucide-react';

export default function CustomReportBuilder() {
  const [widgets, setWidgets] = useState(['Chart', 'Table']);
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 mb-2">Custom Report Builder</h4>
        <div className="flex gap-2">
            <button onClick={() => setWidgets([...widgets, 'Card'])} className="p-2 bg-indigo-100 rounded text-xs font-bold">Add Widget</button>
        </div>
        <div className="mt-2 space-y-1">
            {widgets.map((w, i) => <div key={i} className="p-2 bg-slate-50 dark:bg-slate-900 border rounded text-xs">{w}</div>)}
        </div>
    </div>
  );
}
