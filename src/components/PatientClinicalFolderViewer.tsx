import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FolderOpen, FileText, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface PatientClinicalFolderViewerProps {
  patientMrn: string;
  patientName?: string;
  sourceModule: 'Dispensary' | 'Laboratory' | 'Radiology' | 'Liaison' | 'Procedure Payment';
  onAppendLog?: (logText: string) => void;
  appendButtonLabel?: string;
  autoLogText?: string;
}

interface ClinicalFolder {
  id: string;
  patient_mrn: string;
  patient_name: string;
  clinical_notes: string;
  hub_status: string;
}

interface FinancialLedgerEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  tx_id: string;
  status: string;
}

export const PatientClinicalFolderViewer: React.FC<PatientClinicalFolderViewerProps> = ({
  patientMrn,
  patientName = 'Unknown Patient',
  sourceModule,
  onAppendLog,
  appendButtonLabel = 'Log Action to Folder',
  autoLogText = ''
}) => {
  const [folder, setFolder] = useState<ClinicalFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'Clinical' | 'Financial'>('Clinical');
  const [ledgerEntries, setLedgerEntries] = useState<FinancialLedgerEntry[]>([]);

  useEffect(() => {
    if (!patientMrn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Query for Clinical Folder
    const q1 = query(collection(db, 'form_1_1_1_2'), where('patient_mrn', '==', patientMrn));
    
    // Query for Financial Ledger
    const qLedger = query(collection(db, 'financial_ledger'), where('patient_mrn', '==', patientMrn));
    
    const unsubscribeFolder = onSnapshot(q1, async (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        const folderData: ClinicalFolder = {
          id: docSnap.id,
          patient_mrn: data.patient_mrn || patientMrn,
          patient_name: data.patient_name || patientName,
          clinical_notes: data.clinical_notes || '',
          hub_status: data.hub_status || 'Active Folder'
        };
        setFolder(folderData);
        setNotes(data.clinical_notes || '');
        setLoading(false);
      } else {
        // Fallback search with "mrn" instead of "patient_mrn"
        const q2 = query(collection(db, 'form_1_1_1_2'), where('mrn', '==', patientMrn));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const docSnap = snap2.docs[0];
          const data = docSnap.data();
          const folderData: ClinicalFolder = {
            id: docSnap.id,
            patient_mrn: data.mrn || patientMrn,
            patient_name: data.patient_name || data.full_name || patientName,
            clinical_notes: data.clinical_notes || '',
            hub_status: data.hub_status || 'Active Folder'
          };
          setFolder(folderData);
          setNotes(data.clinical_notes || '');
          setLoading(false);
        } else {
          // If folder doesn't exist, allow auto-creation of a clinical folder record
          setFolder(null);
          setNotes('');
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Error listening to clinical folder:", err);
      setError("Failed to stream patient folder notes from Master Directory.");
      setLoading(false);
    });

    const unsubscribeLedger = onSnapshot(qLedger, (snapshot) => {
      const entries: FinancialLedgerEntry[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          date: data.date,
          amount: data.amount,
          category: data.category,
          tx_id: data.tx_id,
          status: data.status || 'paid'
        });
      });
      setLedgerEntries(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => { unsubscribeFolder(); unsubscribeLedger(); };
  }, [patientMrn, patientName]);

  const handleCreateFolder = async () => {
    if (!patientMrn) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        patient_mrn: patientMrn,
        patient_name: patientName,
        clinical_notes: `[Folder initialized by ${sourceModule} on ${new Date().toLocaleDateString()}]`,
        hub_status: 'Active Folder',
        created_at: new Date().toISOString()
      };
      await addDoc(collection(db, 'form_1_1_1_2'), payload);
      setSuccess("Created new clinical folder successfully!");
    } catch (err: any) {
      console.error(err);
      setError("Error creating clinical folder: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async (updatedNotes: string) => {
    if (!folder) {
      setError("No folder selected or created yet.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const docRef = doc(db, 'form_1_1_1_2', folder.id);
      await updateDoc(docRef, {
        clinical_notes: updatedNotes,
        updated_at: serverTimestamp()
      });
      setSuccess("Overall Clinical Summary successfully synced back to Master Directory!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to sync clinical notes: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppendLogText = async () => {
    if (!folder) {
      setError("Please create or select clinical folder first.");
      return;
    }
    
    const timestamp = new Date().toLocaleString();
    const logHeader = `\n[${timestamp}] [${sourceModule.toUpperCase()}]: `;
    const appendedText = autoLogText || `Verified and processed workflow event.`;
    const newNotes = notes + logHeader + appendedText;
    
    setNotes(newNotes);
    await handleSaveChanges(newNotes);
    if (onAppendLog) {
      onAppendLog(appendedText);
    }
  };

  if (!patientMrn) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center text-slate-500 text-xs font-semibold">
        Select a patient record to view their Universal Patient Clinical Folder
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/80 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <FolderOpen size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Universal Clinical Folder</h4>
            <p className="text-[10px] text-indigo-600 font-bold">MRN: {patientMrn}</p>
          </div>
        </div>
        {folder && (
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-indigo-100/60 text-indigo-800 rounded">
            {folder.hub_status}
          </span>
        )}
      </div>

      <div className="flex gap-4 border-b border-indigo-100 mb-4">
        <button className={`pb-2 text-xs font-bold ${activeTab === 'Clinical' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`} onClick={() => setActiveTab('Clinical')}>Clinical Summary</button>
        <button className={`pb-2 text-xs font-bold ${activeTab === 'Financial' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`} onClick={() => setActiveTab('Financial')}>Financial History</button>
      </div>

      {activeTab === 'Financial' ? (
        <div className="space-y-2">
           {ledgerEntries.map(entry => (
             <div key={entry.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs">
                <div>
                   <div className="font-semibold">{new Date(entry.date).toLocaleDateString()} - {entry.category}</div>
                   <div className="text-[10px] text-slate-400">{entry.tx_id}</div>
                </div>
                <div className="flex items-center gap-2">
                   {entry.status === 'pending' && (
                     <button className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded text-[10px] cursor-pointer" onClick={() => alert(`Payment Link Generated for ${entry.tx_id}: https://pay.hospital-ehr.org/${entry.tx_id}`)}>Billing Pending</button>
                   )}
                   <span className="font-bold">{entry.amount.toFixed(2)} ETB</span>
                </div>
             </div>
           ))}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-6 font-semibold">
          <RefreshCw size={14} className="animate-spin" />
          Streaming folder record...
        </div>
      ) : !folder ? (
        <div className="text-center py-4">
          <p className="text-xs text-slate-500 font-semibold mb-3">No Clinical Folder found in Master Directory for this patient.</p>
          <button
            onClick={handleCreateFolder}
            disabled={isSaving}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {isSaving ? "Creating..." : "Initialize Patient Folder"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Overall Clinical Summary & Hub Intake Notes</span>
              <span className="text-[9px] text-slate-400 normal-case">Globally Synced</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter active clinical summaries, diagnosis codes, allergies, active prescriptions or vitals review..."
              className="w-full px-3 py-2 text-xs border border-indigo-100/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white transition-all text-slate-700 font-medium"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2 border border-rose-100 animate-fadeIn">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2 border border-emerald-100 animate-fadeIn">
              <CheckCircle size={14} />
              {success}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleAppendLogText}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="Automatically append workflow logs directly into patient file notes"
            >
              <FileText size={14} />
              {appendButtonLabel}
            </button>
            
            <button
              onClick={() => handleSaveChanges(notes)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save size={14} />
              {isSaving ? "Syncing..." : "Sync Summary"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
