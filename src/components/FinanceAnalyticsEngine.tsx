
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';

const LEAKAGE_DATA = [
  { department: 'Cardiology', leaked: 15000, billed: 85000 },
  { department: 'Laboratory', leaked: 5000, billed: 95000 },
  { department: 'Radiology', leaked: 8000, billed: 92000 },
  { department: 'Pharmacy', leaked: 2000, billed: 98000 },
];

const PAYER_DATA = [
  { name: 'Insure-A', denialRate: 15 },
  { name: 'Insure-B', denialRate: 5 },
  { name: 'Insure-C', denialRate: 25 },
  { name: 'Government', denialRate: 8 },
];

export default function FinanceAnalyticsEngine() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900">Revenue Integrity Dashboard</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Leakage */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="text-rose-500" size={20} />
            <h4 className="font-bold text-slate-900">Revenue Leakage Monitor</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LEAKAGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leaked" fill="#f43f5e" name="Leaked ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payer Performance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="text-amber-500" size={20} />
            <h4 className="font-bold text-slate-900">Payer Performance Matrix</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PAYER_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="denialRate" fill="#f59e0b" name="Denial Rate (%)">
                  {PAYER_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.denialRate > 20 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
