import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { name: 'MedTech', value: 4000 },
  { name: 'Utilities', value: 3000 },
  { name: 'Staffing', value: 2000 },
];

export default function VendorDashboard() {
  return (
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <h2 className="text-lg font-bold">Vendor Performance Overview</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
