import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Bell, Mail, ShieldAlert, Smartphone } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function FinanceSettings() {
  const [settings, setSettings] = useState({
    autoNotifyPending: true,
    requireManagerApproval: true,
    emailReceipts: false,
    smsAlertsOverdue: true,
    autoVerifySmallPayments: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'finance');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as typeof settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      await setDoc(doc(db, 'settings', 'finance'), newSettings, { merge: true });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const settingItems = [
    { key: 'autoNotifyPending', label: 'Auto-Notify on Pending Review', description: 'Automatically send a notification to the assigned reviewer when a payment enters Pending Review.', icon: Bell },
    { key: 'requireManagerApproval', label: 'Require Manager Approval (>$5,000)', description: 'Flag high-value payments for mandatory secondary manager review before finalizing.', icon: ShieldAlert },
    { key: 'emailReceipts', label: 'Email Verified Receipts', description: 'Send automated email receipts to patients or staff once a payment is Verified Paid.', icon: Mail },
    { key: 'smsAlertsOverdue', label: 'SMS Alerts for Overdue Processing', description: 'Trigger an SMS alert to finance team if a payment stays In Processing for >48h.', icon: Smartphone },
    { key: 'autoVerifySmallPayments', label: 'Auto-Verify Small Payments (<$50)', description: 'Skip review queue and auto-verify low risk small payments.', icon: ToggleRight },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Workflow Automation Settings</h3>
        <p className="text-xs text-slate-500">Configure automated actions, notification triggers, and approval thresholds for finance modules.</p>
      </div>
      
      {loading ? (
        <div className="text-xs text-slate-400">Loading settings...</div>
      ) : (
        <div className="space-y-3">
          {settingItems.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-start justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition hover:border-indigo-200">
              <div className="flex gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</div>
                  <div className="text-xs text-slate-500 mt-1 max-w-md">{description}</div>
                </div>
              </div>
              <button 
                onClick={() => toggle(key as keyof typeof settings)}
                className="mt-1 transition-transform active:scale-95"
              >
                {settings[key as keyof typeof settings] ? (
                  <ToggleRight className="text-indigo-600" size={28} />
                ) : (
                  <ToggleLeft className="text-slate-300" size={28} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
