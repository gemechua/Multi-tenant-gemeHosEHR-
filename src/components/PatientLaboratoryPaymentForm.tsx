
import React, { useState } from 'react';
import { DollarSign, User, FileText, CheckCircle2, X, Clock, Building2, CreditCard } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientLaboratoryPaymentFormProps {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onClose?: () => void;
}

export default function PatientLaboratoryPaymentForm({ activeHospital, addToast, onClose }: PatientLaboratoryPaymentFormProps) {
  const [formData, setFormData] = useState({
    hospital_id: activeHospital?.hospital_unique_number || '',
    patient_mrn: '',
    lab_bill_amount: '',
    payment_method: 'cash',
    approved_name: '',
    other_payment_details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_mrn || !formData.lab_bill_amount || !formData.approved_name) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'patient_laboratory_payments'), {
        ...formData,
        lab_bill_amount: parseFloat(formData.lab_bill_amount),
        payment_date: new Date().toISOString(),
        created_at: serverTimestamp(),
        hospital_id: activeHospital?.hospital_unique_number || 'TENANT-ID'
      });
      addToast('success', 'Laboratory payment request submitted successfully!');
      setFormData({
        hospital_id: activeHospital?.hospital_unique_number || '',
        patient_mrn: '',
        lab_bill_amount: '',
        payment_method: 'cash',
        approved_name: '',
        other_payment_details: ''
      });
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Error adding document: ", error);
      addToast('error', `Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto"
    >
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Lab Payment Request</h3>
            <p className="text-indigo-100 text-xs font-medium">Create a new laboratory billing entry</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={12} /> Hospital ID*
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.hospital_id}
              onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              placeholder="HSP-XXXX"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} /> Patient MRN*
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.patient_mrn}
              onChange={(e) => setFormData({ ...formData, patient_mrn: e.target.value })}
              placeholder="MRN-XXXXXX"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={12} /> Lab Bill Amount*
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                value={formData.lab_bill_amount}
                onChange={(e) => setFormData({ ...formData, lab_bill_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={12} /> Payment Method*
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="insurance">Insurance</option>
              <option value="prison">Prison</option>
              <option value="police">Police</option>
              <option value="low income">Low Income</option>
              <option value="exempted">Exempted</option>
              <option value="other specific">Other Specific</option>
            </select>
          </div>
        </div>

        {formData.payment_method === 'other specific' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Other Specific Payment Method*
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.other_payment_details}
              onChange={(e) => setFormData({ ...formData, other_payment_details: e.target.value })}
              placeholder="Describe other specific payment method..."
            />
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={12} /> Approved Name*
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={formData.approved_name}
            onChange={(e) => setFormData({ ...formData, approved_name: e.target.value })}
            placeholder="Name of approving officer"
          />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <Clock size={12} />
            Auto-Timestamp: {new Date().toLocaleTimeString()}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-indigo-200 hover:scale-105 transition-all flex items-center gap-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
            {!isSubmitting && <CheckCircle2 size={18} />}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
