import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Map, Plus, Camera, QrCode, ClipboardCheck, Smartphone } from 'lucide-react';

interface PatrolReportProps {
  patrols: any[];
  onAddPatrol: (data: any) => void;
  loading: boolean;
}

export default function PatrolReport({ patrols, onAddPatrol, loading }: PatrolReportProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    route: 'Perimeter Wall',
    checkpointId: 'Main Gate',
    observations: 'All clear',
    verificationCode: ''
  });

  const handleScan = () => {
    setIsScanning(true);
    // Simulate QR/NFC scan process
    setTimeout(() => {
      const mockCode = `VERIFIED-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setFormData(prev => ({ ...prev, verificationCode: mockCode }));
      setIsScanning(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.verificationCode) {
      alert('Verification required! Please scan the checkpoint tag.');
      return;
    }
    onAddPatrol({
      ...formData,
      patrolId: `PAT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString()
    });
    setFormData({ route: 'Perimeter Wall', checkpointId: 'Main Gate', observations: 'All clear', verificationCode: '' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Smartphone size={120} />
        </div>
        <div className="relative z-10">
          <h4 className="text-xl font-black uppercase tracking-tight mb-2">Patrol Verification Stage</h4>
          <p className="text-indigo-200 text-xs font-medium max-w-md">Scanning checkpoints verifies physical presence at designated facility zones using QR or NFC technology.</p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300 tracking-widest ml-1">Route</label>
                <select 
                  value={formData.route}
                  onChange={e => setFormData({...formData, route: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/20"
                >
                  <option className="text-slate-900">Perimeter Wall</option>
                  <option className="text-slate-900">Ward Wings</option>
                  <option className="text-slate-900">ICU & Labs</option>
                  <option className="text-slate-900">Staff Residence</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300 tracking-widest ml-1">Checkpoint ID</label>
                <select 
                  value={formData.checkpointId}
                  onChange={e => setFormData({...formData, checkpointId: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/20"
                >
                  <option className="text-slate-900">Main Gate</option>
                  <option className="text-slate-900">ER Dock</option>
                  <option className="text-slate-900">Pharmacy Rear</option>
                  <option className="text-slate-900">Oxygen Plant</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-l border-white/10 pl-6 gap-4">
              <button 
                onClick={handleScan}
                disabled={isScanning}
                className={`w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                  isScanning ? 'bg-indigo-500/50 cursor-wait' : 'bg-white text-indigo-900 hover:bg-indigo-50 cursor-pointer shadow-lg'
                }`}
              >
                {isScanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Scanning Tag...</span>
                  </div>
                ) : (
                  <>
                    <QrCode size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Initiate QR/NFC Scan</span>
                  </>
                )}
              </button>
              {formData.verificationCode && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span className="text-[9px] font-mono font-black">{formData.verificationCode}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <textarea 
              placeholder="Observations..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/10 resize-none h-20"
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
            />
            <button 
              onClick={handleSubmit}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all"
            >
              Verify Checkpoint & Submit
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Patrol Logs</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {patrols.length > 0 ? (
            patrols.map((patrol) => (
              <div key={patrol.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900">{patrol.checkpointId}</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{patrol.route}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{new Date(patrol.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Verified</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">No activity recorded today.</div>
          )}
        </div>
      </div>
    </div>
  );
}
