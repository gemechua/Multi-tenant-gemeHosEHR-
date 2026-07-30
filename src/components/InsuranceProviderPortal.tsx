import React, { useState } from 'react';

export default function InsuranceProviderPortal() {
  const [claimId, setClaimId] = useState('');
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
        <h4 className="text-xs font-bold text-slate-500">Insurance Portal</h4>
        <input type="text" placeholder="Claim ID" className="w-full p-2 border rounded text-xs dark:bg-slate-900" onChange={e => setClaimId(e.target.value)} />
        <button onClick={() => alert(`Claim ${claimId} submitted!`)} className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold">Submit Claim</button>
    </div>
  );
}
