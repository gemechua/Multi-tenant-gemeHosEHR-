import React from 'react';

export default function PaymentReconciliation() {
  const cashReceipts = [{ id: 1, desc: 'Consultation Fee', amount: 200, verified: true }];
  const insurancePayments = [{ id: 1, desc: 'Claim #987', amount: 180, verified: false }];
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold mb-2">Cash Receipts</h4>
        {cashReceipts.map(c => <div key={c.id} className="text-xs p-1 border-b">${c.amount} - {c.desc} {c.verified ? '✅' : '❌'}</div>)}
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold mb-2">Insurance Payments</h4>
        {insurancePayments.map(i => <div key={i.id} className="text-xs p-1 border-b">${i.amount} - {i.desc} {i.verified ? '✅' : <button className="text-indigo-600">Verify</button>}</div>)}
      </div>
    </div>
  );
}
