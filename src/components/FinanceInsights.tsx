import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function FinanceInsights() {
  const [totalPayments, setTotalPayments] = useState(0);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ status: string, count: number }[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'payments'), (snapshot) => {
      setTotalPayments(snapshot.size);
      
      const counts: Record<string, number> = {};
      let vol = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        counts[data.status] = (counts[data.status] || 0) + 1;
        if (data.amount && typeof data.amount === 'number') {
          vol += data.amount;
        }
      });
      
      setTotalVolume(vol);
      setPaymentBreakdown(Object.entries(counts).map(([status, count]) => ({ status, count })));
    });
    return () => unsub();
  }, []);

  const maxCount = Math.max(1, ...paymentBreakdown.map(a => a.count));

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-6">
      <div className="border-r border-gray-100 dark:border-slate-700 pr-6">
        <div className="text-xs text-slate-500 font-bold uppercase">Total Volume</div>
        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${totalVolume.toLocaleString()}</div>
      </div>
      <div className="border-r border-gray-100 dark:border-slate-700 pr-6">
        <div className="text-xs text-slate-500 font-bold uppercase">Transactions</div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalPayments}</div>
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 font-bold uppercase mb-2">Status Breakdown</div>
        <div className="flex items-end gap-2 h-12">
          {paymentBreakdown.map(a => (
            <div key={a.status} className="flex flex-col items-center gap-1 group relative">
              <div 
                className="w-8 bg-indigo-500 dark:bg-indigo-600 rounded-t transition-all"
                style={{ height: `${(a.count / maxCount) * 100}%` }}
              />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[60px] text-center">{a.status}</span>
              <div className="absolute -top-8 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {a.status}: {a.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
