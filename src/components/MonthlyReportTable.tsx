
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Save, ArrowLeft, CheckCircle2, AlertCircle, User, Mic, MicOff, Download, Share2, Mail, MessageSquare, Upload, Sparkles } from 'lucide-react';
import { MONTHLY_REPORTS_SCHEMA } from '../data/monthlyReportSchema';
import { isFakeOrFalseRow, isFakeOrFalseValue } from '../utils/dataIntegrity';

interface MonthlyReportTableProps {
  formatId: number;
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onBack?: () => void;
}

export default function MonthlyReportTable({ formatId, activeHospital, addToast, onBack }: MonthlyReportTableProps) {
  const schema = MONTHLY_REPORTS_SCHEMA[formatId];
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [reportMetadata, setReportMetadata] = useState({
    reportedBy: '',
    department: '',
    month: '',
    year: '',
    phoneNumber: '',
    sign: ''
  });

  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [isListening, setIsListening] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    const csvRows = [['HMIS_CODE', 'Activity', 'Number']];
    schema.rows.forEach(row => {
      csvRows.push([row.code, row.activity, values[row.code] || '']);
    });
    const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.title}.csv`;
    a.click();
  };

  const importCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const newValues: Record<string, string> = {};
        rows.forEach((row, idx) => {
            if (idx === 0) return;
            const cols = row.split(',');
            if (cols.length >= 3) {
                newValues[cols[0]] = cols[2].trim();
            }
        });
        setValues(newValues);
        addToast('success', 'Report imported successfully');
    };
    reader.readAsText(file);
  };

  const shareText = `Monthly Report: ${schema.title}\n\n` + 
    schema.rows.map(row => `${row.code}: ${values[row.code] || 0}`).join('\n');

  const share = (method: 'whatsapp' | 'telegram' | 'email') => {
    if (method === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
    if (method === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`);
    if (method === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(schema.title)}&body=${encodeURIComponent(shareText)}`;
  };

  const toggleVoice = (code: string) => {

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(code);
    recognition.onend = () => setIsListening(null);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      const num = text.replace(/[^0-9]/g, '');
      if (num) {
        setValues(prev => ({ ...prev, [code]: num }));
      }
    };
    recognition.onerror = () => setIsListening(null);
    recognition.start();
  };

  const autoFillTable = () => {
    const newValues: Record<string, string> = {};
    schema.rows.forEach(row => {
      if (!row.isHeader) {
        let baseVal = 15;
        if (row.code.includes('NumOV') || row.code.includes('TOT') || row.code.includes('Total') || row.activity.toLowerCase().includes('total')) {
          baseVal = 100;
        } else if (row.code.includes('P.1') || row.code.includes('P.2') || row.activity.toLowerCase().includes('positive')) {
          baseVal = 3;
        } else if (row.code.includes('Death') || row.code.includes('MR') || row.activity.toLowerCase().includes('death')) {
          baseVal = 1;
        }
        const val = Math.floor(Math.random() * (baseVal * 1.5)) + Math.floor(baseVal / 2);
        newValues[row.code] = String(val);
      }
    });
    setValues(newValues);
    
    setReportMetadata({
      reportedBy: activeHospital?.reported_by || 'Clinical Administrator',
      department: schema.title,
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: String(new Date().getFullYear()),
      phoneNumber: '+000 000 000 000',
      sign: 'ADMIN'
    });
    
    addToast('success', `${schema.title} table populated with realistic simulated data`);
  };

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  useEffect(() => {
    fetchLastSubmission();
    
    // Global Auto-Save Listener
    const handleAutoSave = () => {
      if (Object.keys(values).length > 0 && !isSaving) {
        handleSave();
      }
    };
    window.addEventListener('healthflow-batch-auto-save', handleAutoSave);
    return () => window.removeEventListener('healthflow-batch-auto-save', handleAutoSave);
  }, [formatId, hospital_id, values, isSaving]);

  const fetchLastSubmission = async () => {
    try {
      const q = query(
        collection(db, 'monthly_reports_v2'),
        where('hospital_id', '==', hospital_id),
        where('formatId', '==', formatId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLastSubmission(snap.docs[0].data());
        setValues(snap.docs[0].data().values || {});
      } else {
        setValues({});
        setLastSubmission(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    // Validation: All entered values must be numbers
    const invalid = Object.entries(values).filter(([_, val]) => {
      if (val === '') return false;
      const num = Number(val);
      return isNaN(num) || num < 0;
    });

    if (invalid.length > 0) {
      addToast('error', 'Please enter valid positive numbers');
      return;
    }

    // Check for fake, mock, dummy, error, or invalid entries in reportMetadata or values
    const hasFakeValue = Object.values(values).some(val => isFakeOrFalseValue(val));
    const hasFakeMetadata = isFakeOrFalseRow(reportMetadata);

    if (hasFakeValue || hasFakeMetadata) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake information in the HMIS system to protect data integrity!');
      return;
    }

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'monthly_reports_v2'), {
        formatId,
        formatTitle: schema.title,
        values,
        hospital_id,
        createdAt: serverTimestamp(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        updatedBy: {
          uid: user?.uid || 'anonymous',
          email: user?.email || 'anonymous',
          displayName: user?.displayName || 'System User'
        }
      });

      addToast('success', `${schema.title} report saved successfully`);
      fetchLastSubmission();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  if (!schema) return <div>Format not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-gray-500">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">Format {formatId}: {schema.title}</h3>
            <p className="text-xs text-gray-500">HMIS Monthly Report Integration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button onClick={exportToCSV} className="p-2 text-gray-500 hover:bg-slate-100 rounded-lg" title="Export to CSV">
              <Download size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-slate-100 rounded-lg" title="Import from CSV">
              <Upload size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={importCSV} className="hidden" accept=".csv" />
            <button onClick={() => share('whatsapp')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Share on WhatsApp">
              <MessageSquare size={18} />
            </button>
            <button onClick={() => share('telegram')} className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg" title="Share on Telegram">
              <Share2 size={18} />
            </button>
            <button onClick={() => share('email')} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Share via Email">
              <Mail size={18} />
            </button>
          </div>
          <button
            onClick={autoFillTable}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all font-medium text-sm shadow-sm"
            title="Auto-Fill Table with Sample Data"
          >
            <Sparkles size={16} />
            Auto-Fill
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Report'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200">
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">HMIS_CODE</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-40 text-right">Number</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schema.rows.map((row, idx) => (
              <tr key={`${row.code}-${idx}`} className={row.isHeader ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50 transition-colors'}>
                <td className={`px-6 py-4 text-xs font-mono ${row.isHeader ? 'font-bold text-indigo-700' : 'text-gray-400'}`}>
                  {row.code}
                </td>
                <td className={`px-6 py-4 text-sm ${row.isHeader ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                  {row.activity}
                </td>
                <td className="px-6 py-4 text-right">
                  {!row.isHeader && (
                    <div className="relative inline-block w-full max-w-[140px]">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={values[row.code] || ''}
                        onChange={(e) => setValues(prev => ({ ...prev, [row.code]: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-right focus:ring-1 focus:ring-indigo-500 transition-all pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVoice(row.code)}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${isListening === row.code ? 'text-red-500 animate-pulse' : 'text-gray-300 hover:text-indigo-500'}`}
                      >
                        {isListening === row.code ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        {[
          { label: 'Reported by', key: 'reportedBy' },
          { label: 'Department', key: 'department' },
          { label: 'Month', key: 'month' },
          { label: 'Year', key: 'year' },
          { label: 'Phone number', key: 'phoneNumber' },
          { label: 'Sign', key: 'sign' }
        ].map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">{field.label}:</label>
            <input 
              type="text" 
              value={reportMetadata[field.key as keyof typeof reportMetadata]} 
              onChange={(e) => setReportMetadata(prev => ({...prev, [field.key]: e.target.value}))} 
              className="bg-transparent border-b border-gray-400 focus:outline-none focus:border-indigo-500 pb-1 text-sm" 
            />
          </div>
        ))}
      </div>
      
      {lastSubmission && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
          <CheckCircle2 size={14} />
          Last submission recorded on {new Date(lastSubmission.createdAt?.toDate?.() || '').toLocaleString()}
        </div>
      )}
    </div>
  );
}
