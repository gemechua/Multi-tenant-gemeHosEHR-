import React from 'react';

export default function NetworkLogs({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-2 mt-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Status Log</p>
      <div className="max-h-[200px] overflow-y-auto space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded">
            {new Date(log.timestamp).toLocaleString()} - {log.event} - Latency: {log.latency}ms - {log.status}
          </div>
        ))}
      </div>
    </div>
  );
}
