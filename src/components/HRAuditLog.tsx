import React, { useState } from 'react';
import NetworkLogs from './NetworkLogs';

export default function HRAuditLog({ logs, networkLogs }: { logs: any[], networkLogs: any[] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = logs.filter(log => {
    const timestamp = new Date(log.timestamp);
    return (!startDate || timestamp >= new Date(startDate)) &&
           (!endDate || timestamp <= new Date(endDate));
  });

  const exportToCSV = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Document Name'],
      ...filteredLogs.map(l => [l.timestamp, l.action, l.documentName])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
  };

  return (
    <div className="space-y-4 mt-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Audit Log</p>
      <div className="flex gap-2 text-xs">
        <input type="date" onChange={e => setStartDate(e.target.value)} className="p-1 border rounded" />
        <input type="date" onChange={e => setEndDate(e.target.value)} className="p-1 border rounded" />
        <button onClick={exportToCSV} className="bg-indigo-600 text-white px-2 py-1 rounded">Export CSV</button>
      </div>
      <div className="max-h-[200px] overflow-y-auto space-y-1">
        {filteredLogs.map((log, i) => (
          <div key={i} className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded">
            {new Date(log.timestamp).toLocaleString()} - {log.action} - {log.documentName}
          </div>
        ))}
      </div>
      <NetworkLogs logs={networkLogs} />
    </div>
  );
}
