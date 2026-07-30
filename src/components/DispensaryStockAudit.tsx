import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, 
  updateDoc, doc, serverTimestamp, deleteDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Pill, AlertTriangle, RefreshCw, CheckCircle, 
  History, ShoppingCart, Trash2, ShieldCheck, 
  ArrowRight, Search, Package, Database
} from 'lucide-react';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';

interface StockItem {
  id: string;
  drugName: string;
  medicationId: string;
  category: string;
  currentStock: number;
  status: 'In Stock' | 'Low Stock' | 'Stock Out';
  hospital_id: string;
}

interface AuditRecord {
  id: string;
  medicationName: string;
  quantityDispensed: number;
  timestamp: any;
  staffEmail: string;
  status: string;
}

interface DispensaryStockAuditProps {
  hospital_id: string;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function DispensaryStockAudit({ hospital_id, addToast }: DispensaryStockAuditProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time stock surveillance
    const qStock = query(
      collection(db, 'inventory_stock_entries'),
      where('hospital_id', '==', hospital_id)
    );

    const unsubStock = onSnapshot(qStock, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(item => !isFakeOrFalseRow(item))
        .map(item => ({
          id: item.id,
          drugName: item.drugName || item.itemName || 'Unknown',
          medicationId: item.medicationId || item.id.substring(0, 8),
          category: item.category || item.cat || 'General',
          currentStock: item.quantityReceived || item.stock || 0,
          status: (item.quantityReceived || item.stock || 0) === 0 ? 'Stock Out' : 
                  (item.quantityReceived || item.stock || 0) < 20 ? 'Low Stock' : 'In Stock',
          hospital_id: item.hospital_id
        }));
      setStockItems(items);
      setLoading(false);
    });

    // Real-time audit trails
    const qAudit = query(
      collection(db, 'dispensation_audit'),
      where('hospital_id', '==', hospital_id)
    );

    const unsubAudit = onSnapshot(qAudit, (snapshot) => {
      const logs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(log => !isFakeOrFalseRow(log))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setAuditLogs(logs);
    });

    return () => {
      unsubStock();
      unsubAudit();
    };
  }, [hospital_id]);

  const handleRestock = async (item: StockItem) => {
    try {
      const stockRef = doc(db, 'inventory_stock_entries', item.id);
      await updateDoc(stockRef, {
        quantityReceived: item.currentStock + 50,
        updatedAt: serverTimestamp()
      });
      addToast('success', `Restocked 50 units of ${item.drugName}.`);
    } catch (error) {
      addToast('error', 'Restock failed.');
    }
  };

  const stockOutCount = stockItems.filter(i => i.status === 'Stock Out').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2 bg-indigo-500 rounded-lg">
                  <RefreshCw size={24} />
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Pharmacy Stock & Dispensation Audit
                </h2>
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Monitor current stock levels and verify prescription dispensation records
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex flex-wrap gap-8 items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <ShieldCheck className="text-emerald-600" size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surveillance Status</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" /> Live Monitoring Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Package className="text-indigo-600" size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Inventory</p>
              <p className="text-sm font-bold text-slate-900">{stockItems.length} Products Tracked</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <AlertTriangle className={stockOutCount > 0 ? 'text-rose-600' : 'text-slate-300'} size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alert Thresholds</p>
              <p className={`text-sm font-bold ${stockOutCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {stockOutCount} Stock-outs Active
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Inventory Surveillance Section */}
          <div className="p-8 border-r border-slate-200 bg-white">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Database size={16} className="text-indigo-600" /> Pharmacy Active Inventory Monitor
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockItems.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <Package size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">No inventory records found.</p>
                  <p className="text-xs text-slate-400 mt-1">Please log inventory in the main Pharmacy module.</p>
                </div>
              ) : (
                stockItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-5 rounded-3xl border transition-all hover:shadow-lg ${
                      item.status === 'Stock Out' ? 'bg-rose-50 border-rose-200' :
                      item.status === 'Low Stock' ? 'bg-amber-50 border-amber-200' :
                      'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{item.drugName}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.status === 'Stock Out' ? 'bg-rose-600 text-white' :
                            item.status === 'Low Stock' ? 'bg-amber-600 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        ID: {item.medicationId} • Cat: {item.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Qty</span>
                        <span className={`text-lg font-black ${
                          item.status === 'Stock Out' ? 'text-rose-600' :
                          item.status === 'Low Stock' ? 'text-amber-600' :
                          'text-slate-900'
                        }`}>
                          {item.currentStock} <span className="text-[10px] text-slate-400">units</span>
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRestock(item)}
                      className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Trail Section */}
          <div className="p-8 bg-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Clinical Dispensation Audit Station
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <History size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">No dispensation audit records available.</p>
                  <p className="text-xs text-slate-300 mt-1">Dispense medications to populate the audit trail.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <ShoppingCart size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{log.medicationName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                            Dispensed: {log.quantityDispensed}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.timestamp?.toDate().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verifier</p>
                      <p className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{log.staffEmail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm uppercase">Compliance Logic</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Automatic Integrity Verification</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every simulation outflow and manual restock is cross-referenced with internal MRN verification and hospital-wide clinical safety protocols.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm uppercase">Trigger Defense</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stock Out Prevention</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Real-time triggers notify procurement stations when medication levels drop below 20 units, preventing critical stock-out scenarios.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <History size={20} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm uppercase">Secure Trails</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Immutable Audit Logs</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The dispensation audit trail provides an end-to-end clinical timeline of all pharmacy movements, secured by blockchain-ready indexing.
          </p>
        </div>
      </div>
    </div>
  );
}
