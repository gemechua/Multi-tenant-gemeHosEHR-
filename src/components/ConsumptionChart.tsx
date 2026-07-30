import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Day 1', consumption: 400 },
  { name: 'Day 5', consumption: 300 },
  { name: 'Day 10', consumption: 600 },
  { name: 'Day 15', consumption: 800 },
  { name: 'Day 20', consumption: 500 },
  { name: 'Day 25', consumption: 700 },
  { name: 'Day 30', consumption: 900 },
];

export default function ConsumptionChart() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
      <h4 className="font-bold text-slate-900 mb-6">Drug Consumption Trends (30 Days)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="consumption" stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
