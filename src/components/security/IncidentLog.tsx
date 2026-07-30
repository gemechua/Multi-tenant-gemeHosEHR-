import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Search, Trash2, Clock, CheckCircle, AlertTriangle, FileText, ArrowRight, Save, Wifi, WifiOff } from 'lucide-react';

interface IncidentLogProps {
  incidents: any[];
  reports: any[];
  onAddIncident: (data: any) => void;
  onAddReport: (data: any) => void;
  loading: boolean;
}

export default function IncidentLog({ incidents, reports, onAddIncident, onAddReport, loading }: IncidentLogProps) {
  const [activeForm, setActiveForm] = useState<'Incident' | 'DailyReport' | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Incident Form State
  const [incidentData, setIncidentData] = useState({
    type: 'Access Violation',
    severity: 'Medium',
    description: '',
    actionTaken: '',
    resolutionStatus: 'Open'
  });

  // Daily Report Form State
  const [reportData, setReportData] = useState({
    shiftReference: '',
    startTime: '',
    endTime: '',
    summary: '',
    occurrences: false,
    patrolCount: 0,
    handoverNotes: ''
  });

  const processQueue = (queue: any[]) => {
    queue.forEach(item => {
      if (item.formType === 'Incident') onAddIncident(item.data);
      else onAddReport(item.data);
    });
    localStorage.removeItem('security_offline_queue');
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const queue = JSON.parse(localStorage.getItem('security_offline_queue') || '[]');
      if (queue.length > 0) {
        processQueue(queue);
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for offline queue on mount
    const queue = JSON.parse(localStorage.getItem('security_offline_queue') || '[]');
    if (navigator.onLine && queue.length > 0) {
      processQueue(queue);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleQueue = (formType: 'Incident' | 'DailyReport', data: any) => {
    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('security_offline_queue') || '[]');
      queue.push({ formType, data, timestamp: new Date().toISOString() });
      localStorage.setItem('security_offline_queue', JSON.stringify(queue));
      alert('Offline: Entry queued for sync when signal returns.');
      setActiveForm(null);
    } else {
      if (formType === 'Incident') onAddIncident(data);
      else onAddReport(data);
      setActiveForm(null);
    }
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQueue('Incident', {
      ...incidentData,
      incidentId: `INC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQueue('DailyReport', {
      ...reportData,
      reportId: `REP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-500" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              {isOnline ? 'Cloud Sync Online' : 'Offline Mode Active'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveForm('Incident')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-rose-700 transition-all"
          >
            <ShieldAlert size={16} />
            Log Incident
          </button>
          <button 
            onClick={() => setActiveForm('DailyReport')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all"
          >
            <FileText size={16} />
            Daily Report
          </button>
        </div>
      </div>

      {activeForm === 'Incident' && (
        <div className="bg-white rounded-2xl border-2 border-rose-100 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h4 className="font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-rose-600" size={22} />
              Incident Log Documentation
            </h4>
            <button onClick={() => setActiveForm(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">CANCEL</button>
          </div>
          <form onSubmit={handleIncidentSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incident Type</label>
                <select 
                  value={incidentData.type}
                  onChange={e => setIncidentData({...incidentData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                >
                  <option>Theft</option>
                  <option>Access Violation</option>
                  <option>Medical Emergency</option>
                  <option>Equipment Failure</option>
                  <option>Unauthorized Intrusion</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severity</label>
                <select 
                  value={incidentData.severity}
                  onChange={e => setIncidentData({...incidentData, severity: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                required
                placeholder="Detailed account of incident..."
                rows={4}
                value={incidentData.description}
                onChange={e => setIncidentData({...incidentData, description: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Taken</label>
              <input 
                required
                type="text" 
                placeholder="Initial steps taken..."
                value={incidentData.actionTaken}
                onChange={e => setIncidentData({...incidentData, actionTaken: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all" 
              />
            </div>
            <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
              <Save size={16} /> Log Incident Entry
            </button>
          </form>
        </div>
      )}

      {activeForm === 'DailyReport' && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h4 className="font-black text-slate-900 flex items-center gap-2">
              <FileText className="text-indigo-600" size={22} />
              Daily Report Intake (Shift End)
            </h4>
            <button onClick={() => setActiveForm(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">CANCEL</button>
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white outline-none" onChange={e => setReportData({...reportData, startTime: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white outline-none" onChange={e => setReportData({...reportData, endTime: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Summary</label>
              <textarea 
                required
                placeholder="Brief overview of shift events..."
                rows={3}
                value={reportData.summary}
                onChange={e => setReportData({...reportData, summary: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Handover Checklist Notes</label>
              <textarea 
                required
                placeholder="What does the next guard need to know immediately?"
                rows={2}
                value={reportData.handoverNotes}
                onChange={e => setReportData({...reportData, handoverNotes: e.target.value})}
                className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-bold"
              />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <ArrowRight size={16} /> Finalize Shift & Handover
            </button>
          </form>
        </div>
      )}

      {/* Incident List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-xs flex items-center gap-2 uppercase tracking-widest">
            <ShieldAlert size={16} className="text-rose-500" />
            Incident Registry (Logged)
          </h4>
        </div>
        <div className="divide-y divide-slate-50">
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${inc.severity === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                    <h6 className="font-black text-slate-900 text-sm">{inc.type}</h6>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    {new Date(inc.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mb-2">{inc.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-indigo-500">Action: {inc.actionTaken}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded">{inc.resolutionStatus}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">No incidents logged.</div>
          )}
        </div>
      </div>
    </div>
  );
}
