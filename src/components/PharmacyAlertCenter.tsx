import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  AlertTriangle, Bell, CheckCircle2, ShieldAlert, Zap, RefreshCw, Plus, X 
} from 'lucide-react';

interface PharmacyAlertCenterProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function PharmacyAlertCenter({ hospital_id, addToast }: PharmacyAlertCenterProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query active alerts for this tenant that are not acknowledged yet
    const q = query(
      collection(db, 'pharmacy_alerts'),
      where('hospital_id', '==', hospital_id),
      where('acknowledged', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort client-side by time
      list.sort((a: any, b: any) => {
        const tA = b.createdAt?.seconds || 0;
        const tB = a.createdAt?.seconds || 0;
        return tA - tB;
      });

      setAlerts(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to alerts: ", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [hospital_id]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const alertRef = doc(db, 'pharmacy_alerts', alertId);
      await updateDoc(alertRef, {
        acknowledged: true,
        acknowledgedAt: serverTimestamp()
      });
      addToast('success', 'Push alert acknowledged and cleared from dashboard.');
    } catch (e) {
      console.error("Error clearing alert: ", e);
      addToast('error', 'Failed to acknowledge alert.');
    }
  };


  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center text-xs text-slate-400 font-semibold gap-2">
        <RefreshCw size={14} className="animate-spin text-emerald-600" />
        Synchronizing real-time alert feed...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner alert summary count */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Bell size={20} className={alerts.length > 0 ? "animate-bounce" : ""} />
            </div>
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-slate-900">
                {alerts.length}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-black text-sm tracking-wide uppercase flex items-center gap-1.5 text-white">
              Pharmacy Real-time Alert Center
              {alerts.length > 0 && (
                <span className="text-[9px] bg-red-600 font-black px-2 py-0.5 rounded-full animate-pulse text-white">Live Alerts Active</span>
              )}
            </h4>
            <p className="text-[11px] text-slate-300 font-medium">
              Push notifications directly from ER and inventory threshold metrics. Separate from general system toasts.
            </p>
          </div>
        </div>
      </div>

      {/* Push alert list container */}
      {alerts.length === 0 ? (
        <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-1.5 animate-in fade-in duration-200">
          <div className="p-2 bg-emerald-100/60 rounded-full text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-xs font-bold text-slate-800">Clear Safe Operations</p>
          <p className="text-[10px] text-slate-400 font-medium">All clinical queues and cold-chain logs are operating inside baseline parameters. No live alerts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
          {alerts.map((alert) => {
            const isUrgent = alert.type === 'urgent_prescription';
            return (
              <div 
                key={alert.id} 
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:shadow-md animate-in zoom-in-95 duration-150 ${
                  isUrgent 
                    ? 'bg-rose-50/40 border-rose-100/80 shadow-sm shadow-rose-50' 
                    : 'bg-amber-50/40 border-amber-100/80 shadow-sm shadow-amber-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl text-white ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`}>
                    {isUrgent ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{alert.title}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                        isUrgent ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {alert.createdAt ? new Date(alert.createdAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
                  </span>
                  
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-[10px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    Acknowledge & Clear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
