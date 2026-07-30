import React, { useState } from 'react';
import { 
  X, CheckCircle2, ArrowRightLeft, PackageMinus, Clipboard, 
  HelpCircle, ShieldCheck, AlertCircle, TrendingDown 
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DispensaryQuickActionModalProps {
  prescription: any;
  isOpen: boolean;
  onClose: () => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  hospital_id: string;
  onSuccess: () => void; // Trigger list refresh
}

export default function DispensaryQuickActionModal({
  prescription,
  isOpen,
  onClose,
  addToast,
  hospital_id,
  onSuccess
}: DispensaryQuickActionModalProps) {
  const [activeAction, setActiveAction] = useState<'dispense' | 'usage' | 'return' | null>(null);
  const [usageQty, setUsageQty] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('Patient allergic');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !prescription) return null;

  const isDynamic = !!prescription.id && typeof prescription.id === 'string' && !prescription.id.startsWith('mock-');

  // 1. Action: Mark as Dispensed
  const handleMarkAsDispensed = async () => {
    setSubmitting(true);
    try {
      const drugName = prescription.medicationName || prescription.medicine;
      const patientId = prescription.patientId || prescription.patient;

      if (isDynamic) {
        // Update Firestore document status
        const docRef = doc(db, 'dispensary_prescribing', prescription.id);
        await updateDoc(docRef, {
          status: 'Dispensed',
          dispensedAt: serverTimestamp()
        });
      }

      // Log action to clinical audit log
      await addDoc(collection(db, 'dispensary_actions'), {
        actionType: 'Dispense',
        prescriptionId: prescription.id,
        medicationName: drugName,
        patientId: patientId,
        details: `Marked medication ${drugName} as dispensed.`,
        hospital_id,
        createdAt: serverTimestamp()
      });

      addToast('success', `SUCCESS: ${drugName} successfully DISPENSED to patient ${patientId}.`);
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Error dispensing: ", e);
      addToast('error', 'Failed to update dispense status in database.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Action: Log Stock Usage
  const handleLogStockUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(usageQty);
    if (!usageQty || isNaN(qty) || qty <= 0) {
      addToast('error', 'Please enter a valid positive quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const drugName = prescription.medicationName || prescription.medicine;
      const patientId = prescription.patientId || prescription.patient;

      // Create negative stock entry in inventory logs
      await addDoc(collection(db, 'inventory_stock_entries'), {
        drugName: drugName,
        quantityReceived: -qty, // Negative quantity represents usage
        batchNumber: 'SOP-DEDUCT',
        storageLocation: 'Dispensary Shelf',
        supplier: 'Internal Dispensary Deduct',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year expiry placeholder
        unitCost: 0,
        receivedBy: 'System Auto-Deduct',
        dateReceived: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        hospital_id
      });

      // Log actions
      await addDoc(collection(db, 'dispensary_actions'), {
        actionType: 'Stock Usage',
        prescriptionId: prescription.id,
        medicationName: drugName,
        patientId: patientId,
        details: `Logged stock usage of ${qty} units.`,
        hospital_id,
        createdAt: serverTimestamp()
      });

      addToast('success', `USAGE LOGGED: Deducted ${qty} units of ${drugName} from inventory.`);
      setUsageQty('');
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Error logging usage: ", e);
      addToast('error', 'Failed to deduct stock from database.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Action: Initiate Return
  const handleInitiateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(returnQty);
    if (!returnQty || isNaN(qty) || qty <= 0) {
      addToast('error', 'Please enter a valid positive quantity for return.');
      return;
    }

    setSubmitting(true);
    try {
      const drugName = prescription.medicationName || prescription.medicine;
      const patientId = prescription.patientId || prescription.patient;

      if (isDynamic) {
        // Update prescribing log status
        const docRef = doc(db, 'dispensary_prescribing', prescription.id);
        await updateDoc(docRef, {
          status: 'Returned',
          returnReason: returnReason,
          returnQty: qty
        });
      }

      // Add positive quantity back to stock
      await addDoc(collection(db, 'inventory_stock_entries'), {
        drugName: drugName,
        quantityReceived: qty, // Positive quantity adds stock back
        batchNumber: 'SOP-RETURN',
        storageLocation: 'Quarantine Return Bin',
        supplier: 'Patient Return',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        unitCost: 0,
        receivedBy: 'System Auto-Return',
        dateReceived: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        hospital_id
      });

      // Log action
      await addDoc(collection(db, 'dispensary_actions'), {
        actionType: 'Return',
        prescriptionId: prescription.id,
        medicationName: drugName,
        patientId: patientId,
        details: `Initiated return of ${qty} units. Reason: ${returnReason}`,
        hospital_id,
        createdAt: serverTimestamp()
      });

      addToast('success', `RETURN INITIATED: Logged return of ${qty} units of ${drugName} due to "${returnReason}".`);
      setReturnQty('');
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Error returning: ", e);
      addToast('error', 'Failed to save return log to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentMed = prescription.medicationName || prescription.medicine;
  const currentPat = prescription.patientId || prescription.patient;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="space-y-0.5">
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
              Dispensary Quick Actions
            </span>
            <h4 className="font-black text-slate-900 text-sm">
              Manage Order: {currentMed}
            </h4>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Patient Detail Summary */}
        <div className="px-6 py-3 bg-slate-100/50 border-b border-slate-100 text-xs text-slate-600 font-medium grid grid-cols-2 gap-2">
          <span>Patient: <strong className="text-slate-900">{currentPat}</strong></span>
          <span>Route: <strong className="text-slate-900">{prescription.routeOfAdmin || 'Oral'}</strong></span>
          <span>Dosage: <strong className="text-slate-900">{prescription.dosage || 'Standard'}</strong></span>
          <span>Status: <strong className="text-indigo-600 uppercase">{prescription.status || 'Pending'}</strong></span>
        </div>

        {/* Action Selector Menu */}
        <div className="p-6 space-y-4">
          {!activeAction ? (
            <div className="space-y-2.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Workflow</span>
              
              {/* Option 1: Mark as Dispensed */}
              <button
                type="button"
                onClick={() => setActiveAction('dispense')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-950 rounded-xl transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-emerald-600 shadow-sm group-hover:border-emerald-200">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Mark as Dispensed</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Officially fulfill and sign prescription dispense status.</p>
                  </div>
                </div>
              </button>

              {/* Option 2: Log Stock Usage */}
              <button
                type="button"
                onClick={() => setActiveAction('usage')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-950 rounded-xl transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm group-hover:border-indigo-200">
                    <PackageMinus size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Log Stock Usage</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Deduct standard drug stock counts directly from shelves.</p>
                  </div>
                </div>
              </button>

              {/* Option 3: Initiate Return */}
              <button
                type="button"
                onClick={() => setActiveAction('return')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-950 rounded-xl transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-rose-600 shadow-sm group-hover:border-rose-200">
                    <ArrowRightLeft size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Initiate Safety Return</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Return medication to quarantine and log patient allergies.</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back navigation */}
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                ← Choose different action
              </button>

              {/* ACTION: Dispense confirmation panel */}
              {activeAction === 'dispense' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-xs text-emerald-800 leading-relaxed">
                    <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
                    <div>
                      <strong className="block mb-0.5 font-bold">Standard Dispensary SOP Active</strong>
                      By proceeding, you verify patient allergy matches have been successfully checked and this medication dosage is correct for clinical handover.
                    </div>
                  </div>

                  <button
                    onClick={handleMarkAsDispensed}
                    disabled={submitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    {submitting ? 'Confirming...' : 'Confirm Patient Dispense'}
                  </button>
                </div>
              )}

              {/* ACTION: Log Stock Usage form */}
              {activeAction === 'usage' && (
                <form onSubmit={handleLogStockUsage} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Deducted Stock Quantity</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 30"
                      value={usageQty}
                      onChange={(e) => setUsageQty(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PackageMinus size={14} />
                    {submitting ? 'Logging...' : 'Log Stock Deduction'}
                  </button>
                </form>
              )}

              {/* ACTION: Initiate Return form */}
              {activeAction === 'return' && (
                <form onSubmit={handleInitiateReturn} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Return Quantity</label>
                      <input 
                        type="number"
                        required
                        placeholder="e.g. 10"
                        value={returnQty}
                        onChange={(e) => setReturnQty(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Reason for Return</label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-rose-500"
                      >
                        <option value="Patient allergic / adverse reaction">Patient allergic / adverse reaction</option>
                        <option value="Incorrect dosage prescribed">Incorrect dosage prescribed</option>
                        <option value="Patient refused medication">Patient refused medication</option>
                        <option value="Defective formulation / manufacturer notice">Defective formulation / manufacturer notice</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowRightLeft size={14} />
                    {submitting ? 'Logging Return...' : 'Authorize Safety Return'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
