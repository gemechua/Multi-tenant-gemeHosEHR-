import React from 'react';
import { Database, AlertCircle, CheckCircle2, Clock, Activity, RefreshCw, Wifi, WifiOff, AlertTriangle, Server } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const mockSparklineData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  success: Math.floor(Math.random() * 20) + 10,
  failed: Math.floor(Math.random() * 5),
}));

export default function OfflineStatus({ maxRetries, setMaxRetries, baseInterval, setBaseInterval }: { 
    maxRetries: number; 
    setMaxRetries: (v: number) => void;
    baseInterval: number;
    setBaseInterval: (v: number) => void;
}) {
  const pendingRecords = [
    { module: 'Clinical Records', count: 12, role: 'Doctor' },
    { module: 'Pharmacy', count: 8, role: 'Pharmacist' },
    { module: 'Finance', count: 3, role: 'Cashier' },
  ];

  const [diagnostics, setDiagnostics] = React.useState<any>(() => {
    try {
      const saved = localStorage.getItem('ehr_network_diagnostics');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [isPinging, setIsPinging] = React.useState(false);

  React.useEffect(() => {
    const handleDiagChange = () => {
      try {
        const saved = localStorage.getItem('ehr_network_diagnostics');
        if (saved) {
          setDiagnostics(JSON.parse(saved));
        }
      } catch (_) {}
      setIsPinging(false);
    };
    window.addEventListener('ehr-diagnostics-changed', handleDiagChange);
    return () => window.removeEventListener('ehr-diagnostics-changed', handleDiagChange);
  }, []);

  const triggerManualPing = () => {
    setIsPinging(true);
    window.dispatchEvent(new CustomEvent('ehr-trigger-heartbeat'));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            <Wifi size={13} className="text-emerald-500 animate-pulse" />
            Healthy & Online
          </span>
        );
      case 'server_unreachable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            <Server size={13} className="text-rose-500 animate-bounce" />
            Server Unreachable
          </span>
        );
      case 'no_network':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            <WifiOff size={13} className="text-amber-500 animate-pulse" />
            No Network Access
          </span>
        );
      case 'simulated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
            <Activity size={13} className="text-blue-500 animate-pulse" />
            Offline Simulation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-50 text-gray-700 border border-gray-200 uppercase tracking-wide">
            Unknown
          </span>
        );
    }
  };

  const getLatencyColor = (lat: number) => {
    if (lat <= 100) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (lat <= 500) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6">
      {/* Network Telemetry & Diagnostics Troubleshooting Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-400 animate-pulse" size={20} />
              <h3 className="font-extrabold text-lg tracking-tight font-mono uppercase text-slate-100">
                EHR Node Telemetry Diagnostics
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring and raw latency analysis for troubleshooting intermittent clinical connectivity.
            </p>
          </div>
          <button
            onClick={triggerManualPing}
            disabled={isPinging}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-900/20"
          >
            <RefreshCw size={14} className={isPinging ? "animate-spin" : ""} />
            <span>{isPinging ? "Testing..." : "Run Diagnostic Ping"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connection State</span>
            <div className="mt-2 flex">
              {getStatusBadge(diagnostics?.status || 'online')}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ping Latency</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-indigo-400">
                {diagnostics?.latency !== undefined ? `${diagnostics.latency}ms` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">roundtrip</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Response Code</span>
            <div className="mt-2">
              <code className="text-xs font-mono font-bold bg-slate-950 px-2 py-1 rounded text-amber-400 border border-slate-800 block truncate">
                {diagnostics?.rawResponseCode || '200_OK'}
              </code>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Sync Check</span>
            <div className="mt-2 flex items-center gap-1.5 text-slate-300">
              <Clock size={13} className="text-slate-500" />
              <span className="text-xs font-mono">
                {diagnostics?.lastChecked 
                  ? new Date(diagnostics.lastChecked).toLocaleTimeString() 
                  : new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {diagnostics?.error && (
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div>
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider font-mono">Diagnostic Error Logged</div>
              <p className="text-xs text-rose-300/80 mt-1 font-mono">{diagnostics.error}</p>
            </div>
          </div>
        )}

        {/* Real-time Ping Logs Table */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Heartbeat Event Logs (Last 10 Cycles)
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Interval: 15s checks</span>
          </div>
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="grid grid-cols-4 bg-slate-900/50 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <div>Time</div>
              <div>Type</div>
              <div className="text-right">Latency</div>
              <div className="text-right">Status Code</div>
            </div>
            <div className="divide-y divide-slate-900/80 max-h-[160px] overflow-y-auto">
              {diagnostics?.logs && diagnostics.logs.length > 0 ? (
                diagnostics.logs.map((log: any, i: number) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-2 text-xs font-mono items-center hover:bg-slate-900/30">
                    <div className="text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'online' ? 'bg-emerald-950/40 text-emerald-400' :
                        log.status === 'simulated' ? 'bg-blue-950/40 text-blue-400' :
                        log.status === 'server_unreachable' ? 'bg-rose-950/40 text-rose-400' :
                        'bg-amber-950/40 text-amber-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-right text-slate-300 font-bold">
                      {log.status === 'online' || log.status === 'server_unreachable' ? `${log.latency}ms` : '0ms'}
                    </div>
                    <div className="text-right text-amber-400 font-semibold text-[11px]">
                      {log.code}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 italic">
                  No telemetry logs captured yet. Running pings will populate real-time diagnostics.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-gray-900 uppercase tracking-wide font-mono">Sync Parameter Constraints</h3>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Max Retries</label>
                  <input type="number" value={maxRetries} onChange={e => setMaxRetries(Number(e.target.value))} className="w-full mt-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-indigo-500 font-mono" />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Base Interval (ms)</label>
                  <input type="number" value={baseInterval} onChange={e => setBaseInterval(Number(e.target.value))} className="w-full mt-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-indigo-500 font-mono" />
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 uppercase tracking-wide font-mono">Clinical Sync Metrics</h3>
              <p className="text-xs text-gray-400 mt-1">Average performance of offline synchronizations over the last 30 days.</p>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4">
            <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total Pending</div>
                <div className="text-xl font-black text-gray-950 font-mono">23</div>
            </div>
            <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Avg Sync Latency</div>
                <div className="text-xl font-black text-indigo-600 font-mono">420ms</div>
            </div>
            <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Success Rate</div>
                <div className="text-xl font-black text-emerald-600 font-mono">98.2%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
            <Database className="text-amber-600" />
            EHR Schema Queue Visualisation
        </h3>
        <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockSparklineData}>
                    <Area type="monotone" dataKey="success" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip />
                </AreaChart>
            </ResponsiveContainer>
        </div>
        <div className="space-y-3">
            {pendingRecords.map((r, i) => (
            <div key={i} className="flex justify-between items-center p-4 border border-gray-150 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className='flex gap-4 items-center'>
                    <AlertCircle className='text-amber-500' size={20}/>
                    <div>
                        <div className="font-bold text-sm text-gray-900">{r.module}</div>
                        <div className="text-xs text-gray-500">Highest Frequency Role: {r.role}</div>
                    </div>
                </div>
                <div className="font-black text-sm text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg font-mono">{r.count} pending</div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}
