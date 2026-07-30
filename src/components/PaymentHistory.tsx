import React, { useState } from 'react';
import { Search, Download, CheckCircle, Clock } from 'lucide-react';

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [payments, setPayments] = useState<any[]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkAudit = () => {
    const note = prompt('Enter notes for audited transactions:');
    setPayments(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, audited: true, timestamp: new Date().toISOString(), reviewerId: 'Admin1', notes: note || '' } : p));
    setSelectedIds([]);
  };

  const voidTransaction = (id: number) => {
    const reason = prompt('Enter justification for voiding:');
    if (reason) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  const exportCSV = () => {
    const csv = ['Date,Description,Amount,Type,Audited,Category,Notes', ...filteredPayments.map(p => `${p.date},${p.description},${p.amount},${p.type},${p.audited},${p.category},${p.notes}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${new Date().getMonth()+1}.csv`;
    a.click();
  };

  const filteredPayments = payments.filter(p => 
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!startDate || p.date >= startDate) &&
      (!endDate || p.date <= endDate) &&
      (categoryFilter === 'All' || p.category === categoryFilter)
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
      <div className="flex gap-2 flex-wrap">
        <input type="text" placeholder="Search..." className="flex-1 p-2 border rounded text-xs dark:bg-slate-900 dark:text-slate-200" onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="p-2 border rounded text-xs dark:bg-slate-900 dark:text-slate-200" onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Supplies">Supplies</option>
            <option value="Payroll">Payroll</option>
            <option value="Utilities">Utilities</option>
        </select>
        <input type="date" className="p-2 border rounded text-xs dark:bg-slate-900 dark:text-slate-200" onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="p-2 border rounded text-xs dark:bg-slate-900 dark:text-slate-200" onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={exportCSV} className="p-2 bg-indigo-50 text-indigo-700 rounded dark:bg-indigo-900 dark:text-indigo-200"><Download size={14} /></button>
        {selectedIds.length > 0 && <button onClick={bulkAudit} className="p-2 bg-emerald-50 text-emerald-700 rounded dark:bg-emerald-900 dark:text-emerald-200 text-xs font-bold">Bulk Verify</button>}
      </div>
      {filteredPayments.map(p => (
        <div key={p.id} className="flex justify-between items-center text-xs p-2 border-b dark:border-slate-700">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
            <span className="dark:text-slate-200">{p.date} - {p.description} ({p.type}) [{p.category}]</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={p.type === 'Income' || p.type === 'Insurance' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>${p.amount}</span>
            {p.audited ? <CheckCircle size={14} className="text-emerald-600" /> : <Clock size={14} className="text-slate-400" />}
            {p.notes && <span className="text-[10px] text-slate-500">Note: {p.notes}</span>}
            <button onClick={() => voidTransaction(p.id)} className="text-rose-600 font-bold">Void</button>
          </div>
        </div>
      ))}
    </div>
  );
}
