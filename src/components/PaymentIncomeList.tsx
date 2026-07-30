import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Trash2, CheckCircle, Download, Calendar, Camera, QrCode } from 'lucide-react';
import { collection, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InvoiceScanner from './InvoiceScanner';
import QRScanner from './QRScanner';
import ReceiptGallery from './ReceiptGallery';
import { AnimatePresence, motion } from 'motion/react';
import AddPaymentModal from './AddPaymentModal';

interface Payment {
  id: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  category: string;
  date: string; // ISO date string
}

function categorizePayment(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('consult') || desc.includes('service')) return 'Medical Services';
  if (desc.includes('pharma') || desc.includes('drug')) return 'Pharmacy';
  if (desc.includes('suppl')) return 'Supplies';
  return 'Other';
}

export default function PaymentIncomeList({ searchTerm, filters, selectedLanguages }: { searchTerm: string, filters: { type: string, status: string, category: string }, selectedLanguages: string[] }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof Payment, direction: 'asc' | 'desc' } | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [showScanner, setShowScanner] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({});

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPayments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPayments.map(p => p.id)));
  };

  const handleBulkDelete = () => {
    // In a real app, delete from Firebase
    setSelectedIds(new Set());
  };

  const handleBulkMarkPaid = () => {
    // In a real app, update in Firebase
    setSelectedIds(new Set());
  };

  useEffect(() => {
    const fetchPayments = async () => {
      const snap = await getDocs(collection(db, 'payments'));
      // Removed hardcoded seed data to ensure 0 records on start
    };
    fetchPayments();

    const unsub = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(p);
    }, (error) => {
      console.error('Error fetching payments:', error);
    });

    return () => unsub();
  }, []);

  const handleSort = (key: keyof Payment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Payment Transaction Report', 14, 15);
    (autoTable as any)(doc, {
      head: [['Description', 'Date', 'Amount', 'Type', 'Status', 'Category']],
      body: filteredPayments.map(p => [p.description, p.date, `$${p.amount}`, p.type, p.status, p.category]),
      startY: 20,
    });
    doc.save('payment-report.pdf');
  };

  const downloadCSV = () => {
    const headers = ['Description', 'Date', 'Amount', 'Type', 'Status', 'Category'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => [p.description, p.date, p.amount, p.type, p.status, p.category].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment-report.csv';
    a.click();
  };

  let filteredPayments = payments.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filters.type === 'All' || p.type === filters.type) &&
    (filters.status === 'All' || p.status === filters.status) &&
    (filters.category === 'All' || p.category === filters.category) &&
    (!dateRange.start || p.date >= dateRange.start) &&
    (!dateRange.end || p.date <= dateRange.end)
  );

  if (sortConfig) {
    filteredPayments.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-indigo-50 p-2 rounded mb-4 flex items-center justify-between text-xs font-bold text-indigo-700">
            <span>{selectedIds.size} items selected</span>
            <div className="flex gap-2">
              <button onClick={handleBulkMarkPaid} className="bg-indigo-100 p-1 rounded">Mark as Paid</button>
              <button onClick={handleBulkDelete} className="bg-rose-100 text-rose-700 p-1 rounded">Delete Selected</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-bold">Payment & Income Registry</h2>
        <div className="flex items-center gap-2">
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="p-1 border rounded text-xs" />
            <span className="text-xs">to</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="p-1 border rounded text-xs" />
        </div>
        <div className='flex gap-2 relative'>
            <div className="relative group">
                <button className="flex items-center gap-2 bg-slate-600 text-white p-2 rounded text-xs">
                    <Download size={14} /> Export
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block bg-white border rounded shadow-lg p-1 w-24 z-10 text-xs">
                    <button onClick={downloadPDF} className="block w-full text-left p-1 hover:bg-slate-100">PDF</button>
                    <button onClick={downloadCSV} className="block w-full text-left p-1 hover:bg-slate-100">CSV</button>
                </div>
            </div>
            <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 bg-purple-600 text-white p-2 rounded text-xs">
                <QrCode size={14} /> Scan QR
            </button>
            <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 bg-emerald-600 text-white p-2 rounded text-xs">
            <Camera size={14} /> Scan Invoice
            </button>
            <button onClick={() => setShowGallery(true)} className="flex items-center gap-2 bg-slate-600 text-white p-2 rounded text-xs">
            <Camera size={14} /> Receipt Gallery
            </button>
            <button onClick={() => setNewPayment({})} className="flex items-center gap-2 bg-indigo-600 text-white p-2 rounded text-xs">
            <Plus size={14} /> Add Payment
            </button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-500 border-b pb-2 cursor-pointer items-center">
            <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === filteredPayments.length && filteredPayments.length > 0} className="mr-2" />
            <span className="flex-1" onClick={() => handleSort('description')}>Description</span>
            <span className="flex-1" onClick={() => handleSort('date')}>Date</span>
            <span className="flex-1" onClick={() => handleSort('amount')}>Amount</span>
            <span className="flex-1" onClick={() => handleSort('type')}>Type</span>
            <span className="flex-1" onClick={() => handleSort('status')}>Status</span>
        </div>
        {filteredPayments.map(p => (
          <div key={p.id} className="p-2 border-b flex justify-between text-xs items-center hover:bg-slate-50">
            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="mr-2" />
            <div className="flex-1 font-medium">{p.description} <span className="text-slate-400">({p.category})</span></div>
            <span className="flex-1 text-slate-500">{p.date}</span>
            <span className="flex-1 font-bold text-slate-700">${p.amount}</span>
            <span className="flex-1 text-slate-500">{p.type}</span>
            <span className={`flex-1 font-bold ${p.status === 'Verified Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{p.status}</span>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showQRScanner && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50">
                <div className="bg-white p-4 rounded-lg">
                    <QRScanner onScan={(data) => {
                        const parsed = JSON.parse(data);
                        setNewPayment({ description: parsed.description, amount: parsed.amount, date: parsed.date });
                        setShowQRScanner(false);
                    }} />
                    <button onClick={() => setShowQRScanner(false)} className="mt-2 text-xs text-rose-600">Close</button>
                </div>
            </motion.div>
        )}
        {showScanner && <InvoiceScanner onClose={() => setShowScanner(false)} onScan={(data) => {
            console.log('Scanned data:', data);
            setNewPayment({ description: data.merchant, amount: data.total, date: data.date });
            setReceipts(prev => [...prev, '/placeholder-receipt.png']); // Add dummy for gallery
            alert(`Scanned: ${data.merchant} - $${data.total} on ${data.date}`);
            setShowScanner(false);
        }} />}
        {showGallery && <ReceiptGallery receipts={receipts} onClose={() => setShowGallery(false)} />}
        {newPayment && Object.keys(newPayment).length > 0 && (
            <AddPaymentModal 
                existingPayments={payments} 
                onClose={() => setNewPayment({})} 
                onAdd={async (p) => {
                    await addDoc(collection(db, 'payments'), { ...p, status: 'Pending', category: p.category || 'Patient' });
                }} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}

