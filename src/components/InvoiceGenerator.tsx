import React, { useState } from 'react';
import { Printer } from 'lucide-react';

export default function InvoiceGenerator() {
  const [showPrint, setShowPrint] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);

  const toggleSelect = (id: number) => {
      setInvoices(prev => prev.map(i => i.id === id ? {...i, selected: !i.selected} : i));
  };
  
  const batchAction = (action: string) => alert(`${action} for ${invoices.filter(i => i.selected).length} invoices`);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
      <h4 className="text-xs font-bold dark:text-slate-200">Generate Invoice</h4>
      <input type="text" placeholder="Patient Name" className="w-full p-2 border rounded text-xs dark:bg-slate-900" onChange={e => setName(e.target.value)} />
      <input type="number" placeholder="Amount" className="w-full p-2 border rounded text-xs dark:bg-slate-900" onChange={e => setAmount(e.target.value)} />
      <button onClick={() => setShowPrint(true)} className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold">Generate PDF</button>

      <div className="mt-4 border-t pt-2 space-y-1">
          <p className="text-xs font-bold dark:text-slate-200">Pending Invoices</p>
          {invoices.map(inv => (
              <div key={inv.id} className="flex gap-2 items-center text-xs dark:text-slate-300">
                  <input type="checkbox" checked={inv.selected} onChange={() => toggleSelect(inv.id)} />
                  {inv.name} - ${inv.amount}
              </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button onClick={() => batchAction('Printing')} className="flex-1 py-1 bg-slate-200 rounded text-xs font-bold">Print All</button>
            <button onClick={() => batchAction('Emailing')} className="flex-1 py-1 bg-slate-200 rounded text-xs font-bold">Email All</button>
          </div>
      </div>

      {showPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white p-8 w-full max-w-xl shadow-lg border border-slate-300">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-indigo-900">Hospital Invoice</h2>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded"><Printer size={14}/> Print</button>
                </div>
                <p>Patient: {name}</p>
                <p className="font-black text-lg">Total Due: ${amount}</p>
                <button onClick={() => setShowPrint(false)} className="mt-4 text-xs text-slate-500">Close</button>
            </div>
        </div>
      )}
    </div>
  );
}
