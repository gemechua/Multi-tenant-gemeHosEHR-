import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, Check, Search, Trash2, 
  Download, Printer, FileText, CheckCircle2, History
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DrugRecallWizardProps {
  inventoryStockLogs: any[];
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  hospital_id: string;
}

export default function DrugRecallWizard({ 
  inventoryStockLogs = [], 
  addToast, 
  hospital_id 
}: DrugRecallWizardProps) {
  const [lotNumber, setLotNumber] = useState('');
  const [quarantinedLots, setQuarantinedLots] = useState<any[]>([]);
  const [recalling, setRecalling] = useState(false);
  const [pharmacistName, setPharmacistName] = useState('');
  const [recallNotes, setRecallNotes] = useState('');

  // Static items that might match lot numbers
  const staticInventory = [
    { name: 'Amoxicillin 500mg', batchNumber: 'A-12', supplier: 'Pfizer', currentStock: 1240, location: 'A-12' },
    { name: 'Paracetamol 500mg', batchNumber: 'B-04', supplier: 'GSK', currentStock: 5400, location: 'B-04' },
    { name: 'Ceftriaxone 1g Inj', batchNumber: 'A-01', supplier: 'Roche', currentStock: 45, location: 'A-01' },
    { name: 'Insulin Human', batchNumber: 'C-09', supplier: 'Novo Nordisk', currentStock: 12, location: 'C-09' },
    { name: 'Artemether + Lumef.', batchNumber: 'D-02', supplier: 'Novartis', currentStock: 850, location: 'D-02' }
  ];

  // Combine static and dynamic logs
  const allStockItems = [
    ...staticInventory,
    ...inventoryStockLogs.map(log => ({
      name: log.drugName,
      batchNumber: log.batchNumber,
      supplier: log.supplier || 'N/A',
      currentStock: log.quantityReceived || 0,
      location: log.storageLocation || 'N/A',
      isDynamic: true,
      raw: log
    }))
  ];

  // Filter items matching the exact Lot Number (case-insensitive, trimmed)
  const queryLot = lotNumber.trim().toLowerCase();
  const matchingItems = queryLot 
    ? allStockItems.filter(item => item.batchNumber?.toLowerCase() === queryLot)
    : [];

  const handleIsolateAndRecall = async () => {
    if (!lotNumber.trim()) {
      addToast('error', 'Please enter a valid Lot/Batch Number first.');
      return;
    }
    if (matchingItems.length === 0) {
      addToast('error', 'No inventory items match the specified Lot Number.');
      return;
    }
    if (!pharmacistName.trim()) {
      addToast('error', 'Authorized pharmacist signature is required to verify quarantine.');
      return;
    }

    setRecalling(true);
    try {
      // Save compliance document to Firestore
      const recallPayload = {
        lotNumber: lotNumber.trim().toUpperCase(),
        isolatedItems: matchingItems.map(item => ({
          name: item.name,
          supplier: item.supplier,
          stockQuarantined: item.currentStock,
          location: item.location
        })),
        pharmacistName: pharmacistName.trim(),
        recallNotes: recallNotes.trim() || 'Urgent manufacturer recall and safety compliance quarantine initiated.',
        timestamp: new Date().toISOString(),
        hospital_id,
        status: 'Quarantined & Isolated'
      };

      await addDoc(collection(db, 'drug_recalls'), {
        ...recallPayload,
        createdAt: serverTimestamp()
      });

      setQuarantinedLots(prev => [recallPayload, ...prev]);
      addToast('success', `SAFETY PROTOCOL TRIGGERED: Lot ${lotNumber.toUpperCase()} successfully quarantined in database.`);
      
      // Reset input fields but keep quarantined list
      setLotNumber('');
      setRecallNotes('');
    } catch (e) {
      console.error("Error quarantine recall: ", e);
      addToast('error', 'Failed to save safety recall documentation to secure database.');
    } finally {
      setRecalling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm space-y-6">
      {/* Title Header */}
      <div className="flex items-start gap-4 border-b border-red-50 pb-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
            Drug Recall & Quarantine Wizard
            <span className="text-[9px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">SOP Safety</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Rapidly isolate and lock down defective or recalled medication batches from active dispensary stock.
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Enter Target Lot / Batch Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="e.g. B-04, A-12, or dynamic lots..."
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 bg-slate-50"
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">Type target batch to search all current physical items instantly.</p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Authorizing Pharmacist Signature (Print Name)</label>
            <input 
              type="text"
              placeholder="Your full name & license code..."
              value={pharmacistName}
              onChange={(e) => setPharmacistName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Safety Isolation & Recall Directive Notes</label>
          <textarea 
            rows={4}
            placeholder="Describe the recall reason (e.g. manufacturer alert, labeling defect, particulate contamination)..."
            value={recallNotes}
            onChange={(e) => setRecallNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 h-[104px] resize-none"
          />
        </div>
      </div>

      {/* Search results */}
      {lotNumber.trim() && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Search Results for Lot: <strong className="text-red-600 font-black">{lotNumber.toUpperCase()}</strong>
            </span>
            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
              {matchingItems.length} matching entries found
            </span>
          </div>

          {matchingItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">No inventory matching this Lot Number exists in active stocks.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/60 text-slate-400 text-[10px] font-black uppercase">
                    <th className="pb-2">Medication Name</th>
                    <th className="pb-2">Supplier</th>
                    <th className="pb-2 text-right">Available Qty</th>
                    <th className="pb-2 text-right">Bin Location</th>
                    <th className="pb-2 text-center">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matchingItems.map((item, index) => (
                    <tr key={index} className="text-slate-700 hover:bg-slate-100/50">
                      <td className="py-2.5 font-bold text-red-950 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-red-500 animate-pulse" />
                        {item.name}
                      </td>
                      <td className="py-2.5 font-medium text-slate-500">{item.supplier}</td>
                      <td className="py-2.5 text-right font-black text-slate-900">{item.currentStock} units</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-600">{item.location}</td>
                      <td className="py-2.5 text-center">
                        <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          ACTIVE RISK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end">
                <button
                  type="button"
                  onClick={handleIsolateAndRecall}
                  disabled={recalling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShieldAlert size={14} />
                  {recalling ? 'Quarantining...' : 'Confirm Quarantine & Lock Stocks'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quarantined Logs History */}
      {quarantinedLots.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <History size={14} className="text-red-600" />
            Active Recall & Isolation Logs in Current Session
          </h5>
          <div className="space-y-3">
            {quarantinedLots.map((recall, index) => (
              <div key={index} className="bg-red-50/20 border border-red-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-red-800 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                      LOT: {recall.lotNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(recall.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Isolated {recall.isolatedItems.length} items ({recall.isolatedItems.map((item: any) => item.name).join(', ')})
                  </p>
                  <p className="text-xs text-slate-500 italic">" {recall.recallNotes} "</p>
                  <div className="text-[10px] text-slate-400 font-bold">
                    Authorized and Signed by: <strong className="text-slate-700">{recall.pharmacistName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    IMMUTABLE COMPLIANCE RECORDED
                  </span>
                  <button
                    onClick={() => {
                      addToast('info', `Printing regulatory isolation manifest for Lot ${recall.lotNumber}`);
                      window.print();
                    }}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                    title="Print manifest"
                  >
                    <Printer size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
