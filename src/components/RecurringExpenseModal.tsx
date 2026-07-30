import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
    onClose: () => void;
    onAdd: (expense: { name: string, amount: number, frequency: string }) => void;
}

export default function RecurringExpenseModal({ onClose, onAdd }: ModalProps) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('Monthly');

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">New Recurring Expense</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
                    </div>
                    <input type="text" placeholder="Expense Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" />
                    <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded" />
                    <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full p-2 border rounded">
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Annually</option>
                    </select>
                    <button onClick={() => { onAdd({ name, amount: Number(amount), frequency }); onClose(); }} className="w-full bg-indigo-600 text-white p-2 rounded font-bold">Add Expense</button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
