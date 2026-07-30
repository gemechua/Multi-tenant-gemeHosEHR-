import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, X, Database } from 'lucide-react';

export interface SyncQueueItem {
  id: string;
  tableName: string;
  status: 'pending' | 'synced' | 'error';
  timestamp: string;
  errorMessage?: string;
  dataSummary?: string;
}

interface SyncHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue?: SyncQueueItem[];
}

export default function SyncHistoryModal({ isOpen, onClose, queue = [] }: SyncHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Offline Sync History & Queue
              </h3>
              <p className="text-xs text-gray-500 font-medium">Detailed list of data synchronization items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-2">
          {queue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
              <p className="font-bold text-gray-600">All data synced</p>
              <p className="text-xs">No pending items in the queue</p>
            </div>
          ) : (
            queue.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-start gap-4 shadow-sm"
              >
                <div className="shrink-0 mt-0.5">
                  {item.status === 'pending' && <Clock size={18} className="text-amber-500" />}
                  {item.status === 'synced' && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {item.status === 'error' && <AlertCircle size={18} className="text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">{item.tableName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  {item.dataSummary && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{item.dataSummary}</p>
                  )}
                  {item.errorMessage && item.status === 'error' && (
                    <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded mt-2 font-mono break-words">
                      {item.errorMessage}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {item.status === 'pending' && (
                    <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded">Pending</span>
                  )}
                  {item.status === 'synced' && (
                    <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded">Synced</span>
                  )}
                  {item.status === 'error' && (
                    <span className="inline-block px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded">Failed</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 shrink-0">
          <div className="text-[11px] text-gray-500">
            Items sync automatically when connectivity is restored.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
        
      </div>
    </div>
  );
}
