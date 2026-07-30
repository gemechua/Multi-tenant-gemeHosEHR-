import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, TrendingUp, Plus, ArrowLeft } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function FinanceHub({ onBack }: { onBack?: () => void }) {
  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
  const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
  const hospital_id = activeHospital?.hospital_unique_number;

  const [stats, setStats] = useState({
    totalInsuranceRecords: 0,
    totalInsuranceIncome: 0,
    pendingInsuranceApprovals: 0,
    deniedClaims: [] as any[]
  });

  const [chartData, setChartData] = useState({
      monthlyTrends: [] as any[],
      statusDistribution: [] as any[],
      cleanVsDenied: [] as any[]
  });

  useEffect(() => {
    const paymentsQuery = hospital_id
      ? query(collection(db, 'financial_ledger'), where('hospital_id', '==', hospital_id))
      : collection(db, 'financial_ledger');

    const unsub = onSnapshot(paymentsQuery, (snapshot) => {
        let income = 0;
        let pending = 0;
        let count = 0;
        
        const monthlyMap = new Map();
        const statusMap = { paid: 0, requested: 0, rejected: 0 };
        const allRejected: any[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (isFakeOrFalseRow(data)) return;
            if (data.type === 'insurance') {
                if (data.status === 'paid' && typeof data.amount === 'number') {
                    income += data.amount;
                }
                if (data.status === 'requested') {
                    pending++;
                }
                count++;

                // Process chart data
                const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                monthlyMap.set(monthYear, (monthlyMap.get(monthYear) || 0) + (data.amount || 0));
                
                if (data.status in statusMap) statusMap[data.status as keyof typeof statusMap]++;
                
                if (data.status === 'rejected') {
                    allRejected.push({ id: doc.id, ...data });
                }
            }
        });
        
        setStats({ 
            totalInsuranceRecords: count,
            totalInsuranceIncome: income,
            pendingInsuranceApprovals: pending,
            deniedClaims: allRejected.slice(0, 5)
        });

        setChartData({
            monthlyTrends: Array.from(monthlyMap.entries()).map(([month, income]) => ({ month, income })),
            statusDistribution: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
            cleanVsDenied: [
                { name: 'Clean', value: count - statusMap.rejected },
                { name: 'Denied', value: statusMap.rejected }
            ]
        });
    });
    return () => unsub();
  }, [hospital_id]);

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-3xs"
        >
          <ArrowLeft size={16} />
          <span>Back to Data & Explorer</span>
        </button>
      )}
      <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Advanced Hospital Finance Hub</h1>
      <p className="text-sm text-slate-500 mb-6">Finance Department: Income tracking, purchases, audits, and insurance monitoring</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm text-slate-500">Total Records (Insurance Payment)</h3>
                <FileText size={18} className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{stats.totalInsuranceRecords}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm text-slate-500">Total Income (Insurance Payment)</h3>
                <TrendingUp size={18} className="text-green-500" />
            </div>
            <p className="text-3xl font-bold">${stats.totalInsuranceIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm text-slate-500">Pending Approvals (Insurance Payment)</h3>
                <CheckCircle size={18} className="text-orange-500" />
            </div>
            <p className="text-3xl font-bold">{stats.pendingInsuranceApprovals}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Action Plans</h3>
            <div className="text-center p-8 text-slate-500">No action plans.</div>
            <button className="flex items-center gap-2 w-full p-3 bg-blue-50 text-blue-700 rounded-xl justify-center font-semibold text-sm">
                <Plus size={16} /> New Plan
            </button>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Finance Records (Monthly)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="income" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <h3 className="text-lg font-bold mb-4 mt-8">Clean vs Denial Rate</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData.cleanVsDenied} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#82ca9d" label>
                            {chartData.cleanVsDenied.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : '#FF8042'} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <h3 className="text-lg font-bold mb-4 mt-8">Top 5 Denied Claims</h3>
            <div className="space-y-2">
                {stats.deniedClaims.map((claim) => (
                    <div key={claim.id} className="p-3 bg-red-50 text-red-800 rounded-lg text-sm font-mono">
                        {claim.id}
                    </div>
                ))}
                {stats.deniedClaims.length === 0 && <div className="text-sm text-slate-500">No denied claims.</div>}
            </div>
        </div>
      </div>
    </div>
  );
}
