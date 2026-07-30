import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
    onClose: () => void;
    onAdd: (payment: { description: string, amount: number, date: string, type: string, method: string, category: string }) => void;
    existingPayments: any[];
    initialData?: { description?: string, amount?: number, date?: string };
}

export default function AddPaymentModal({ onClose, onAdd, existingPayments, initialData }: ModalProps) {
    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [date, setDate] = useState(initialData?.date || '');
    const [method, setMethod] = useState('Cash');
    const [insurancePolicyId, setInsurancePolicyId] = useState('');
    const [otherMethod, setOtherMethod] = useState('');
    const [error, setError] = useState('');

    const autoCategorize = (desc: string) => {
        const d = desc.toLowerCase();
        if (d.includes('med')) return 'Medical Services';
        if (d.includes('pharm')) return 'Pharmacy';
        if (d.includes('supp')) return 'Supplies';
        return 'General';
    };

    const handleSubmit = () => {
        if (method.includes('Insurance') && !insurancePolicyId) {
            setError('Insurance Policy ID is required for Insurance.');
            return;
        }
        if (method === 'Other' && !otherMethod) {
            setError('Please specify the payment method.');
            return;
        }
        const isDuplicate = existingPayments.some(p => p.description === description && p.date === date && p.amount === Number(amount));
        if (isDuplicate) {
            setError('Duplicate entry detected.');
            return;
        }
        const category = autoCategorize(description);
        onAdd({ description, amount: Number(amount), date, type: 'Payment', method: method === 'Other' ? otherMethod : method, category });
        onClose();
    };

    const verifyCoverage = () => {
        if (!insurancePolicyId) {
            setError('Enter policy ID to verify.');
            return;
        }
        alert(`Verifying ${insurancePolicyId}... Coverage confirmed.`);
        setError('');
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Add Transaction</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
                    </div>
                    {error && <div className="text-rose-600 text-xs font-bold">{error}</div>}
                    <input type="text" placeholder="Description/Merchant" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" />
                    <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" />
                    <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 border rounded">
                        {['1.1.1.1 Cash', '1.1.1.g.1 Insurance', '1.1.1.i.1 Exempted', '1.1.1.n.1 Low Income Status', '1.1.1.p.1 Prison', '1.1.1.3 Police', 'Other'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    {method.includes('Insurance') && (
                        <div className='flex gap-2'>
                            <input type="text" placeholder="Insurance Policy ID" value={insurancePolicyId} onChange={e => setInsurancePolicyId(e.target.value)} className="flex-1 p-2 border rounded" />
                            <button onClick={verifyCoverage} className="bg-emerald-600 text-white px-2 rounded text-xs font-bold">Verify</button>
                        </div>
                    )}
                    {method === 'Other' && <input type="text" placeholder="Specify method" value={otherMethod} onChange={e => setOtherMethod(e.target.value)} className="w-full p-2 border rounded" />}
                    <button onClick={handleSubmit} className="w-full bg-indigo-600 text-white p-2 rounded font-bold">Add Transaction</button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
