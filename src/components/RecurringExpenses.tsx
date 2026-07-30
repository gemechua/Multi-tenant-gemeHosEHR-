import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import RecurringExpenseModal from './RecurringExpenseModal';

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  return (
    <div className="bg-white p-6 rounded-lg border space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Recurring Expenses</h2>
        <button onClick={() => setShowModal(true)} className="text-xs bg-indigo-600 text-white p-2 rounded flex items-center gap-1"><Plus size={14}/> Add Expense</button>
      </div>
      
      {showModal && <RecurringExpenseModal onClose={() => setShowModal(false)} onAdd={(e) => setExpenses([...expenses, { ...e, id: Date.now().toString(), dueDate: '2026-08-15', status: 'Upcoming' }])} />}
      
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}><ChevronLeft size={16}/></button>
            <span className="font-bold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}><ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="font-bold text-slate-500">{d}</div>)}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const hasExpense = expenses.find(e => e.dueDate === dateStr);
                return (
                    <div key={day} className={`p-2 rounded ${hasExpense ? 'bg-emerald-200 font-bold' : 'bg-white'}`}>
                        {day}
                    </div>
                );
            })}
        </div>
      </div>

      <div className="space-y-2">
        {expenses.map(e => (
          <div key={e.id} className="flex justify-between items-center p-3 border rounded text-xs">
            <div className='flex items-center gap-2'>
                <Calendar size={14} className="text-slate-400" />
                <div>
                    <div className="font-bold">{e.name}</div>
                    <div className="text-slate-500">Due: {e.dueDate}</div>
                </div>
            </div>
            <div className="font-bold text-slate-700">${e.amount}</div>
            <div className={`px-2 py-1 rounded font-bold ${e.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{e.status}</div>
            <button className="text-rose-600"><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
