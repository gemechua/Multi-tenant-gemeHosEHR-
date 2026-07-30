import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Database, Cloud } from 'lucide-react';

interface Conflict {
  id: string;
  recordName: string;
  localValue: any;
  cloudValue: any;
}

interface Props {
  conflict: Conflict;
  onResolve: (decision: 'KeepLocal' | 'KeepCloud') => void;
  onClose: () => void;
}

export default function SyncConflictModal({ conflict, onResolve, onClose }: Props) {
  const keys = Object.keys(conflict.localValue || {});
  
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle />
            <h3 className="font-bold text-lg">Sync Conflict Detected</h3>
          </div>
          <p className="text-xs text-slate-600">Conflict for: <span className="font-bold">{conflict.recordName}</span></p>
          
          <div className="border rounded-lg overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-gray-50 font-bold p-2 border-b">
                <div>Field</div>
                <div>Local</div>
                <div>Cloud</div>
            </div>
            {keys.map(key => (
                <div key={key} className={`grid grid-cols-3 p-2 border-b ${conflict.localValue[key] !== conflict.cloudValue[key] ? 'bg-rose-50' : ''}`}>
                    <div className="font-bold">{key}</div>
                    <div>{JSON.stringify(conflict.localValue[key])}</div>
                    <div>{JSON.stringify(conflict.cloudValue[key])}</div>
                </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => onResolve('KeepLocal')} className="flex-1 bg-indigo-600 text-white p-2 rounded text-xs font-bold">Keep Local</button>
            <button onClick={() => onResolve('KeepCloud')} className="flex-1 bg-slate-200 text-slate-700 p-2 rounded text-xs font-bold">Keep Cloud</button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
