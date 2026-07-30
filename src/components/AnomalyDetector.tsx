import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AnomalyDetector() {
  const anomalies = [{ id: 1, desc: 'Duplicate Payment Detected' }];
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 mb-2">AI Anomaly Detector</h4>
        {anomalies.map(a => (
            <div key={a.id} className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded text-xs flex gap-2">
                <AlertTriangle size={14} />
                {a.desc}
            </div>
        ))}
    </div>
  );
}
