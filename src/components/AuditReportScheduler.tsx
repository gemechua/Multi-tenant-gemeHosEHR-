import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function AuditReportScheduler() {
  const [schedule, setSchedule] = useState('Monthly');
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 mb-2">Schedule Audit Reports</h4>
        <select value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full p-2 border rounded text-xs dark:bg-slate-900 mb-2">
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Quarterly</option>
        </select>
        <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold flex items-center justify-center gap-2">
            <Calendar size={14}/> Save Schedule
        </button>
    </div>
  );
}
