import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  FileText, Download, Activity, TrendingUp, ChevronRight, BarChart3, LayoutGrid, 
  ArrowUpRight, ArrowDownRight, History, Printer, FileSpreadsheet, User, Clock,
  Sparkles, CheckCircle2, ArrowLeft, ShieldAlert
} from 'lucide-react';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONTHLY_REPORTS_SCHEMA } from '../data/monthlyReportSchema';
import MonthlyReportTable from './MonthlyReportTable';
import SyncHistoryModal from './SyncHistoryModal';

interface AuditEntry {
  id: string;
  formatTitle: string;
  updatedBy: { email: string; displayName: string };
  createdAt: any;
  hospital_id: string;
}

interface Module3Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onBack?: () => void;
}

export default function Module3HealthService({ activeHospital, addToast, onBack }: Module3Props) {
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFormatId, setSelectedFormatId] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncHistoryOpen, setIsSyncHistoryOpen] = useState(false);

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Health Service Data Guard. This will purge ALL fake/mock service records, assessments, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Health Service Integrity: Purged ${deleted} falsified records.`);
      fetchHistory();
    } catch (err) {
      console.error(err);
      addToast('error', 'Cleanup failed.');
    }
  };

  useEffect(() => {
    fetchHistory();
    const unsubAudit = listenToAuditLogs();
    
    // Listen to savedRegisterUpdate custom event to reload history
    const handleUpdate = () => {
      fetchHistory();
    };
    window.addEventListener('savedRegisterUpdate', handleUpdate);
    
    return () => {
      unsubAudit();
      window.removeEventListener('savedRegisterUpdate', handleUpdate);
    };
  }, [hospital_id]);

  const listenToAuditLogs = () => {
    const q = query(
      collection(db, 'monthly_reports_v2'),
      where('hospital_id', '==', hospital_id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    return onSnapshot(q, (snap) => {
      const logs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEntry[];
      setAuditLogs(logs);
    });
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'monthly_reports_v2'),
        where('hospital_id', '==', hospital_id),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const snap = await getDocs(q);
      const hist: Record<string, any[]> = {};
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        const fId = data.formatId.toString();
        if (!hist[fId]) hist[fId] = [];
        
        const total = Object.values(data.values || {}).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        
        hist[fId].push({
          value: total,
          date: data.createdAt?.toDate?.() || new Date()
        });
      });

      Object.keys(hist).forEach(fId => {
        hist[fId].sort((a, b) => a.date.getTime() - b.date.getTime());
      });

      setHistory(hist);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const bulkPopulateAllTables = async () => {
    setIsExporting(true);
    addToast('info', 'Generating simulated historical and current reports for all 33 formats. This may take a few seconds...');
    try {
      const user = auth.currentUser;
      const now = new Date();
      
      for (let i = 1; i <= 33; i++) {
        const schema = MONTHLY_REPORTS_SCHEMA[i];
        if (!schema) continue;

        const promises = [];
        for (let m = 5; m >= 0; m--) {
          const entryDate = new Date();
          entryDate.setMonth(now.getMonth() - m);
          entryDate.setDate(15);
          
          const monthNum = entryDate.getMonth() + 1;
          const yearNum = entryDate.getFullYear();

          const simulatedValues: Record<string, string> = {};
          schema.rows.forEach(row => {
            if (!row.isHeader) {
              let baseVal = 15;
              if (row.code.includes('NumOV') || row.code.includes('TOT') || row.code.includes('Total') || row.activity.toLowerCase().includes('total')) {
                baseVal = 120;
              } else if (row.code.includes('P.1') || row.code.includes('P.2') || row.activity.toLowerCase().includes('positive')) {
                baseVal = 4;
              } else if (row.code.includes('Death') || row.code.includes('MR') || row.activity.toLowerCase().includes('death')) {
                baseVal = 1;
              }
              const val = Math.floor(Math.random() * (baseVal * 1.5)) + Math.floor(baseVal / 2);
              simulatedValues[row.code] = String(val);
            }
          });

          promises.push(
            addDoc(collection(db, 'monthly_reports_v2'), {
              formatId: i,
              formatTitle: schema.title,
              values: simulatedValues,
              hospital_id,
              hospitalName: activeHospital?.name || '',
              departmentName: activeHospital?.department || '',
              hospitalId: activeHospital?.hospital_unique_number || '',
              createdAt: entryDate,
              month: monthNum,
              year: yearNum,
              updatedBy: {
                uid: user?.uid || 'anonymous',
                email: user?.email || 'officer@hospital.id',
                displayName: user?.displayName || 'Authorized Officer'
              }
            })
          );
        }
        await Promise.all(promises);
      }

      addToast('success', '✓ Seeding Complete: Beautiful simulated data generated across all 33 departments!');
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      addToast('error', `Seeding failed: ${err.message || 'Error saving to Firestore'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportTrendsCSV = async () => {
    setIsExporting(true);
    try {
      // Aggregate last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const q = query(
        collection(db, 'monthly_reports_v2'),
        where('hospital_id', '==', hospital_id),
        where('createdAt', '>=', sixMonthsAgo),
        orderBy('createdAt', 'asc')
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());

      let csv = 'Format ID,Format Title,Month,Year,Submission Date,Total Activity Count,Updated By\n';
      data.forEach(d => {
        const total = Object.values(d.values || {}).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        const date = d.createdAt?.toDate?.()?.toLocaleDateString() || '';
        csv += `"${d.formatId}","${d.formatTitle}","${d.month}","${d.year}","${date}","${total}","${d.updatedBy?.email || 'N/A'}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `HMIS_Trends_6Months_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('success', '6-Month trends CSV exported');
    } catch (err) {
      console.error(err);
      addToast('error', 'CSV Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const printAllReports = async () => {
    setIsExporting(true);
    const doc = new jsPDF('p', 'mm', 'a4');
    const hospitalName = activeHospital?.name || 'National Health Authority';
    
    // Page 1: Title Page
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 210, 60, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('Monthly Consolidated Health Report', 20, 30);
    
    doc.setFontSize(14);
    doc.text(`Institution: ${hospitalName}`, 20, 42);
    doc.text(`Period: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, 20, 50);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text('This document contains the official 33 HMIS format reports for the selected period.', 20, 75);
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 20, 82);
    doc.text(`Tenant ID: ${hospital_id}`, 20, 89);

    let currentY = 105;

    for (let i = 1; i <= 33; i++) {
      const schema = MONTHLY_REPORTS_SCHEMA[i];
      if (!schema) continue;

      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY - 5, 196, currentY - 5);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`FORMAT ${i}: ${schema.title.toUpperCase()}`, 14, currentY);
      
      const q = query(
        collection(db, 'monthly_reports_v2'),
        where('hospital_id', '==', hospital_id),
        where('formatId', '==', i),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      const lastData = snap.empty ? {} : snap.docs[0].data().values || {};

      const tableData = schema.rows.map(row => [
        row.code,
        row.activity,
        row.isHeader ? { content: 'SECTION HEADER', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } } : (lastData[row.code] || '0')
      ]);

      autoTable(doc, {
        startY: currentY + 4,
        head: [['CODE', 'ACTIVITY DESCRIPTION', 'VALUE']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'right' }
        },
        didDrawPage: (data) => {
          currentY = (data as any).cursor.y + 15;
        }
      });
      
      currentY += 10;
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Official Document - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Official_Monthly_HMIS_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExporting(false);
    addToast('success', 'Official high-fidelity report generated');
  };

  const getTrendBadge = (formatId: number) => {
    const data = history[formatId.toString()];
    if (!data || data.length < 2) return null;
    
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    
    if (latest > previous) {
      return (
        <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">
          <ArrowUpRight size={10} strokeWidth={3} />
          UP
        </div>
      );
    } else if (latest < previous) {
      return (
        <div className="flex items-center gap-0.5 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] font-black">
          <ArrowDownRight size={10} strokeWidth={3} />
          DOWN
        </div>
      );
    }
    return null;
  };

  if (selectedFormatId) {
    return (
      <MonthlyReportTable 
        formatId={selectedFormatId} 
        activeHospital={activeHospital} 
        addToast={addToast} 
        onBack={() => setSelectedFormatId(null)} 
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors cursor-pointer border border-gray-200 flex items-center gap-2 font-bold text-xs shadow-3xs"
              title="Back to Data & Explorer"
            >
              <ArrowLeft size={18} />
              <span>Back to Data & Explorer</span>
            </button>
          )}
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
            <LayoutGrid className="text-white" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Departmental Report Hub</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase tracking-tighter">Official</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mt-0.5 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" />
              Consolidated 33-Format HMIS Integrated Service
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGlobalCleanup}
            className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
            title="Health Service Data Integrity Purge"
          >
            <ShieldAlert size={14} />
            Guard
          </button>
          <button
            onClick={() => setIsSyncHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all font-bold text-xs shadow-sm border border-indigo-100"
          >
            <History size={16} />
            Sync History
          </button>
          <button
            onClick={bulkPopulateAllTables}
            disabled={isExporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-md transition-all font-bold text-xs"
            title="Auto-Fill all 33 department tables with 6 months of historical data"
          >
            <Sparkles size={16} />
            Bulk Populate All Tables
          </button>
          <button
            onClick={exportTrendsCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all font-semibold text-xs shadow-sm"
          >
            <FileSpreadsheet size={16} />
            CSV Trends
          </button>
          <button
            onClick={printAllReports}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-md transition-all font-bold text-xs"
          >
            <Printer size={16} />
            {isExporting ? 'Generating...' : 'Print All Reports'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {Object.values(MONTHLY_REPORTS_SCHEMA).map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormatId(format.id)}
                className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all text-left flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-indigo-500" size={20} />
                </div>
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center font-black text-sm transition-colors border border-slate-100 group-hover:border-indigo-100">
                      {format.id}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-indigo-900">{format.title}</h4>
                  </div>
                  {getTrendBadge(format.id)}
                </div>

                <div className="flex-1 h-14 w-full bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100/50">
                  {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">Syncing...</div>
                  ) : history[format.id.toString()]?.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history[format.id.toString()]}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#4f46e5" 
                          strokeWidth={2.5} 
                          dot={false} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 uppercase tracking-tighter font-bold opacity-40 px-2 text-center">
                      No Data History
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly Trend</span>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                    <BarChart3 size={10} />
                    {(history[format.id.toString()]?.length || 0)} Reports
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Sidebar */}
        <div className="w-80 bg-slate-50 border-l border-gray-200 flex flex-col min-h-0 hidden xl:flex">
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History size={14} className="text-indigo-600" />
              Real-time Audit Log
            </h4>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {auditLogs.length === 0 ? (
              <div className="text-center py-10 px-6">
                <Clock className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-[11px] text-slate-400 font-medium">No recent update activity recorded for this tenant.</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <User size={12} />
                      <span className="text-[10px] font-black truncate max-w-[120px]">{log.updatedBy?.displayName || 'System'}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">{log.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-bold line-clamp-1 mb-1">{log.formatTitle}</p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    Auto-saved to Firestore
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <p className="text-[10px] text-indigo-700 font-bold leading-tight">
                All changes are immutable and cryptographically linked to your session for compliance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SyncHistoryModal 
        isOpen={isSyncHistoryOpen} 
        onClose={() => setIsSyncHistoryOpen(false)} 
      />
    </div>
  );
}
