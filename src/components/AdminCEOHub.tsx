import React, { useState, useEffect } from 'react';
import { Users, Bed, CreditCard, BarChart3, ArrowLeft } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default function AdminCEOHub({ onBack }: { onBack?: () => void }) {
  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
  const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
  const hospital_id = activeHospital?.hospital_unique_number;

  const [stats, setStats] = useState({
    totalPatients: 0,
    currentAdmissions: 0,
    verifiedRevenue: 0,
    paymentStatus: { requested: 0, paid: 0, verified: 0, rejected: 0 }
  });

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const patientsQuery = hospital_id
      ? query(collection(db, 'patients'), where('hospital_id', '==', hospital_id))
      : collection(db, 'patients');

    const admissionsQuery = hospital_id
      ? query(collection(db, 'admissions'), where('hospital_id', '==', hospital_id))
      : collection(db, 'admissions');

    const paymentsQuery = hospital_id
      ? query(collection(db, 'financial_ledger'), where('hospital_id', '==', hospital_id))
      : collection(db, 'financial_ledger');

    const unsubPatients = onSnapshot(patientsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, totalPatients: snapshot.docs.length }));
    });
    unsubscribes.push(unsubPatients);

    const unsubAdmissions = onSnapshot(admissionsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, currentAdmissions: snapshot.docs.length }));
    });
    unsubscribes.push(unsubAdmissions);

    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
        let revenue = 0;
        const status = { requested: 0, paid: 0, verified: 0, rejected: 0 };
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'verified' && typeof data.amount === 'number') {
                revenue += data.amount;
            }
            if (data.status in status) {
                status[data.status as keyof typeof status]++;
            }
        });
        
        setStats(prev => ({ ...prev, verifiedRevenue: revenue, paymentStatus: status }));
    });
    unsubscribes.push(unsubPayments);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [hospital_id]);

  const kpis = [
    { category: 'Clinical', metric: 'Avg Length of Stay', benchmark: '< 4.2 Days', status: '0 Days', trend: '↔️ Baseline' },
    { category: 'Financial', metric: 'EBIDA Margin', benchmark: '> 12%', status: '0%', trend: '↔️ Baseline' },
    { category: 'Operations', metric: 'Bed Occupancy', benchmark: '85-90%', status: '0%', trend: '↔️ Baseline' },
    { category: 'Quality', metric: 'Readmission Rate', benchmark: '< 15%', status: '0%', trend: '↔️ Baseline' },
    { category: 'Patient', metric: 'Satisfaction (HCAHPS)', benchmark: '4.5/5.0', status: '0/5.0', trend: '↔️ Baseline' },
  ];

  const paymentData = Object.entries(stats.paymentStatus).map(([name, value]) => ({ name, value }));
  const COLORS = ['#94a3b8', '#22c55e', '#3b82f6', '#ef4444'];

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
      <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Admin & CEO Command Hub</h1>
      <p className="text-sm text-slate-500 mb-6">Strategic oversight, operational governance, and planning tools.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm text-slate-500">Total Patients</h3>
                <Users size={18} className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{stats.totalPatients}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm text-slate-500">Current Admissions</h3>
                <Bed size={18} className="text-purple-500" />
            </div>
            <p className="text-3xl font-bold">{stats.currentAdmissions}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm text-slate-500">Verified Revenue</h3>
                <CreditCard size={18} className="text-green-500" />
            </div>
            <p className="text-3xl font-bold">${stats.verifiedRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Payment Status Distribution</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={paymentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold mb-4">Weekly Executive KPI Monitor</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-left">
            <tr>
              <th className="p-4">Category</th>
              <th className="p-4">Metric</th>
              <th className="p-4">Benchmark</th>
              <th className="p-4">Status</th>
              <th className="p-4">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {kpis.map((kpi, index) => (
              <tr key={index}>
                <td className="p-4 font-semibold">{kpi.category}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{kpi.metric}</td>
                <td className="p-4">{kpi.benchmark}</td>
                <td className="p-4 font-medium">{kpi.status}</td>
                <td className="p-4">{kpi.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
