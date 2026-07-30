import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function HRFolderDashboard({ documents }: { documents: any[] }) {
  const completed = documents.filter(d => d.tags?.includes('Contract')).length;
  const incomplete = documents.length - completed;
  const data = [
    { name: 'Complete', value: completed },
    { name: 'Incomplete', value: incomplete },
  ];
  const COLORS = ['#4f46e5', '#e2e8f0'];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
