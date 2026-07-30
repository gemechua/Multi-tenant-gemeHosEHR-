import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Bell, CheckCircle, Trash2, Clock } from 'lucide-react';

interface HRNotificationSettingsProps {
  hospital_id?: string;
  addToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function HRNotificationSettings({ hospital_id = 'TENANT-ID', addToast }: HRNotificationSettingsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'hr_notifications'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        if (d.data().hospital_id === hospital_id) {
          list.push({ id: d.id, ...d.data() });
        }
      });
      // Sort by timestamp descending
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(list);
    });
    return () => unsub();
  }, [hospital_id]);

  const handleApprove = async (notif: any) => {
    try {
      await updateDoc(doc(db, 'hr_notifications', notif.id), { status: 'approved' });
      
      if (notif.logId) {
        await updateDoc(doc(db, 'hr_attendance_registry', notif.logId), { 
          verified: true,
          status: 'verified',
          verifiedAt: new Date().toISOString()
        });
      }
      
      if (addToast) addToast('success', 'Verification request approved.');
    } catch (e) {
      if (addToast) addToast('error', 'Failed to approve request.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'hr_notifications', id));
      if (addToast) addToast('success', 'Notification deleted.');
    } catch (e) {
      if (addToast) addToast('error', 'Failed to delete notification.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-indigo-600" />
        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter">Advanced Human Resource Management Attendance Request Table</h3>
      </div>
      
      <div className="space-y-4 mb-8">
        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Attendance Verification Requests</h4>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle className="mx-auto mb-2 text-slate-300" size={32} />
            <p>No pending verification requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Request / Message</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-bold">{notif.message}</span>
                        {notif.staffName && (
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">Staff: {notif.staffName}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 flex items-center gap-1">
                      <Clock size={12} className="shrink-0" />
                      {new Date(notif.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                        notif.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {notif.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {notif.status === 'pending' && (
                          <button 
                            onClick={() => handleApprove(notif)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                            title="Verify Request"
                          >
                            <CheckCircle size={12} /> Verify
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(notif.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                          title="Delete Notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 mt-8">System Configuration</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <span className="font-bold text-slate-700">Contract Expiration Alert</span>
          <input type="checkbox" className="w-5 h-5 accent-indigo-600" defaultChecked />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <span className="font-bold text-slate-700">Credential Renewal Alert</span>
          <input type="checkbox" className="w-5 h-5 accent-indigo-600" defaultChecked />
        </div>
      </div>
    </div>
  );
}
