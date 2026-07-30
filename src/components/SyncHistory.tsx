import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, 
  Database, Zap, FileText, Trash2, Search, Filter, ShieldCheck 
} from 'lucide-react';
import { getSyncHistory, SyncLogEntry, getOfflineQueue, clearSyncHistory, syncOfflineQueue } from '../lib/offlineSync';

export const SyncHistory: React.FC = () => {
  const [history, setHistory] = useState<SyncLogEntry[]>([]);
  const [queueCount, setQueueCount] = useState(getOfflineQueue().length);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [syncing, setSyncing] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  const loadData = () => {
    const logs = getSyncHistory();
    setHistory(logs.sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime()));
    setQueueCount(getOfflineQueue().length);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('ehr-offline-queue-changed', loadData);
    return () => window.removeEventListener('ehr-offline-queue-changed', loadData);
  }, []);

  const totalSynced = history.filter(h => h.status === 'success').length;
  const totalVolume = totalSynced + queueCount;
  const syncProgress = totalVolume > 0 ? (totalSynced / totalVolume) * 100 : 100;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
      
      await syncOfflineQueue(hospital_id);
      loadData();
      setNotifyMsg("⚡ Online Cloud Synchronization Completed successfully!");
      setTimeout(() => setNotifyMsg(null), 3000);
    } catch (err) {
      console.error('Error in manual sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Filter history logs
  const filteredHistory = history.filter((log) => {
    const subName = log.subsectionName || 'Sync Action';
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      subName.toLowerCase().includes(q) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(q));
    
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Sync Status Toast */}
      {notifyMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>{notifyMsg}</span>
        </div>
      )}

      {/* Sync Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-white rounded-lg">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase">Cloud Synced</div>
            <div className="text-lg font-black text-emerald-900 leading-none">{totalSynced}</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-150 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-lg">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-[10px] text-amber-600 font-bold uppercase">Pending Queue</div>
            <div className="text-lg font-black text-amber-900 leading-none">{queueCount}</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-blue-500 text-white rounded-lg">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-[10px] text-blue-600 font-bold uppercase">Sync Reliability</div>
            <div className="text-lg font-black text-blue-900 leading-none">{Math.round(syncProgress)}%</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Actions</span>
            <button
              onClick={handleManualSync}
              disabled={syncing || queueCount === 0}
              className="mt-1 flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
            >
              <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
              <span>Sync Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar & Filter controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-3xs space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Synchronization Progress</span>
            <span className="text-[10px] font-mono font-bold text-indigo-600">{totalSynced} / {totalVolume} records</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text" 
              placeholder="Search sync logs..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-[11px] outline-none focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1">
            <Filter size={10} className="text-gray-400" />
            <select 
              className="bg-transparent text-[10px] font-bold text-gray-700 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List Section */}
      <div className="bg-white rounded-xl shadow-3xs border border-gray-200 overflow-hidden">
        <div className="bg-slate-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">Sync History Logs</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently clear the synchronization history audit trail?')) {
                  clearSyncHistory();
                  loadData();
                }
              }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear All Logs</span>
            </button>
            <div className="text-[10px] text-gray-500 font-mono">
              Audit Trail: Last 100 Transactions
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <RefreshCw size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 font-sans italic">No matching synchronization history found.</p>
            </div>
          ) : (
            filteredHistory.map((log) => (
              <div key={log.id} className="group">
                <div 
                  onClick={() => toggleExpand(log.id)}
                  className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {log.status === 'success' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-500" />
                    )}
                    
                    <div>
                      <div className="text-xs font-bold text-gray-900">{log.subsectionName || 'Sync Action'}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                          <Clock size={10} />
                          <span>Submitted: {new Date(log.submittedAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-mono font-medium">
                          <RefreshCw size={10} />
                          <span>Synced: {new Date(log.syncedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.status}
                    </span>
                    {expandedId === log.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {expandedId === log.id && (
                  <div className="px-5 pb-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 font-mono">Transaction Payload Data</div>
                      <pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                    {log.error && (
                      <div className="mt-2 bg-rose-50 border border-rose-100 rounded-lg p-3">
                        <div className="text-[10px] font-bold text-rose-600 uppercase mb-1 font-mono">Error Details</div>
                        <div className="text-[10px] text-rose-700 font-mono">{log.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-900 px-5 py-3 text-center">
          <p className="text-[10px] text-slate-400 font-sans italic">
            Verify cloud data integrity by cross-referencing MRNs and clinical entry timestamps.
          </p>
        </div>
      </div>
    </div>
  );
};
export default SyncHistory;
