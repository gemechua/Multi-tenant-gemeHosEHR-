import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, ShieldCheck, FileText, Download, CreditCard, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Claim {
  id: string;
  patientMrn: string;
  claimNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  date: string;
}

export const InsuranceDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [copayAmount, setCopayAmount] = useState<number | null>(null);
  const [patientMrn, setPatientMrn] = useState('');
  const [planType, setPlanType] = useState('Standard');

  useEffect(() => {
    const q = query(collection(db, 'insurance_claims'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));
      setClaims(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const calculateCopay = () => {
    const base = 500;
    const factor = planType === 'Premium' ? 0.1 : 0.3;
    setCopayAmount(base * factor);
  };

  const handleProcessPayment = async (amount: number) => {
    alert(`Processing payment of ${amount} ETB...`);
    // Add real payment integration here
  };

  const exportToCSV = () => {
    const headers = ['MRN', 'Claim #', 'Status', 'Amount', 'Date'];
    const csvContent = [headers, ...claims.map(c => [c.patientMrn, c.claimNumber, c.status, c.amount, c.date])].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claims_reconciliation.csv';
    a.click();
  };

  const chartData = [
    { name: 'Pending', value: claims.filter(c => c.status === 'pending').length },
    { name: 'Approved', value: claims.filter(c => c.status === 'approved').length },
    { name: 'Rejected', value: claims.filter(c => c.status === 'rejected').length },
  ];
  const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"><Download size={16}/> Export CSV</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-1">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><DollarSign size={20}/> Copayment Calculator</h3>
          <input type="text" placeholder="Patient MRN" className="w-full p-2 border rounded mb-2" value={patientMrn} onChange={e => setPatientMrn(e.target.value)} />
          <select className="w-full p-2 border rounded mb-2" value={planType} onChange={e => setPlanType(e.target.value)}>
            <option>Standard</option>
            <option>Premium</option>
          </select>
          <button onClick={calculateCopay} className="w-full p-2 bg-indigo-600 text-white rounded mb-2">Calculate Liability</button>
          {copayAmount !== null && (
            <>
              <p className="mt-2 font-bold">Estimated Copayment: {copayAmount} ETB</p>
              <button onClick={() => handleProcessPayment(copayAmount)} className="w-full p-2 bg-emerald-600 text-white rounded mt-2 flex items-center justify-center gap-2"><CreditCard size={16}/> Pay Now</button>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-1">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldCheck size={20}/> Claims Summary (30 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={60} fill="#8884d8">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-1">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity size={20}/> Financial Activity</h3>
          <div className="space-y-2 text-sm">
            {claims.filter(c => c.status === 'approved' && c.amount > 1000).slice(0, 3).map(c => (
              <div key={c.id} className="p-2 bg-gray-50 rounded flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16}/> Approved High-Value Claim: {c.amount} ETB
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold flex items-center gap-2"><FileText size={18}/> Billing Audit Log</div>
        <div className="divide-y">
          {claims.map(claim => (
            <div key={claim.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Claim #{claim.claimNumber} - MRN: {claim.patientMrn}</p>
                <p className="text-xs text-gray-500">{claim.date}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${claim.status === 'approved' ? 'bg-green-100 text-green-700' : claim.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {claim.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
