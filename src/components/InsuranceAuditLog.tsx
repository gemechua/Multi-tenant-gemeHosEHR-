import React from 'react';

export default function InsuranceAuditLog() {
  const claims = [
    { id: 'C1', status: 'Approved', billed: 500, reimbursed: 500 },
    { id: 'C2', status: 'Denied', billed: 300, reimbursed: 0 },
  ];
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs">
            <thead>
                <tr className="border-b text-slate-500">
                    <th className="text-left p-1">Claim ID</th>
                    <th className="text-left p-1">Status</th>
                    <th className="text-right p-1">Billed</th>
                    <th className="text-right p-1">Reimb.</th>
                </tr>
            </thead>
            <tbody>
                {claims.map(c => (
                    <tr key={c.id} className="border-b dark:border-slate-700">
                        <td className="p-1">{c.id}</td>
                        <td className={`p-1 ${c.status === 'Denied' ? 'text-rose-600' : 'text-emerald-600'}`}>{c.status}</td>
                        <td className="p-1 text-right">${c.billed}</td>
                        <td className="p-1 text-right">${c.reimbursed}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}
