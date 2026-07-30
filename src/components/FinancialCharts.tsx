import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'motion/react';

export default function FinancialCharts() {
  const data = [
    { name: 'Jan', revenue: 4000, expenditure: 2400, profit: 1600, growth: 0 },
    { name: 'Feb', revenue: 3000, expenditure: 1398, profit: 1602, growth: -25 },
    { name: 'Mar', revenue: 3500, expenditure: 1500, profit: 2000, forecast: 3800, growth: 16.7 },
    { name: 'Apr', forecast: 4200, growth: 20 },
  ];

  const categoryData = [
    { name: 'Consultations', value: 4500, color: '#4f46e5' },
    { name: 'Insurance Claims', value: 3200, color: '#0ea5e9' },
    { name: 'Surgeries', value: 2800, color: '#10b981' },
    { name: 'Pharmacy', value: 1500, color: '#f59e0b' },
  ];

  const methodData = [
    { name: 'Cash', value: 3000, color: '#fbbf24' },
    { name: 'Insurance', value: 2500, color: '#3b82f6' },
    { name: 'Exempted', value: 1000, color: '#a78bfa' },
    { name: 'Low Income', value: 800, color: '#f472b6' },
    { name: 'Prison', value: 500, color: '#64748b' },
    { name: 'Police', value: 500, color: '#475569' },
    { name: 'Other', value: 200, color: '#94a3b8' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-2 h-64 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-lg transition-shadow">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Revenue vs Expenditure & Forecast</h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
              <YAxis yAxisId="left" fontSize={10} stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" fontSize={10} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px', borderRadius: '8px' }} />
              <Bar yAxisId="left" dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Revenue ($)" />
              <Bar yAxisId="left" dataKey="expenditure" fill="#e11d48" radius={[4, 4, 0, 0]} name="Expenditure ($)" />
              <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit ($)" />
              <Line yAxisId="left" type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} name="Forecast ($)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="h-64 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-lg transition-shadow">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Revenue by Category</h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px', borderRadius: '8px' }} 
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="h-64 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-lg transition-shadow">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Payment Method Distribution</h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={methodData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {methodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px', borderRadius: '8px' }} 
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
