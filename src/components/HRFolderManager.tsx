import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FolderPlus, Folder, AlertCircle, Loader2, Upload, Camera, X, Tag, FileArchive as Zip, Calendar, FileText, Image as ImageIcon, BarChart3, PenTool, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HRFolderDashboard from './HRFolderDashboard';
import HRSignatureTool from './HRSignatureTool';
import HRAuditLog from './HRAuditLog';
import HRReportFolder from './HRReportFolder';
import ConnectionStatus from './ConnectionStatus';

interface HRFolder {
  id: string;
  folderId: string;
  folderName: string;
}


interface Document {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  expiryDate?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export default function HRFolderManager({ hospital_id }: { hospital_id: string }) {
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folders, setFolders] = useState<HRFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showActiveStaffActions, setShowActiveStaffActions] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'dashboard' | 'signature' | 'logs'>('list');
  
  // Simulated document data
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Contract_JD.pdf', type: 'PDF', createdAt: '2026-07-01', expiryDate: '2026-08-10', tags: ['Contract'], thumbnailUrl: '' },
    { id: '2', name: 'Cert_Nursing.jpg', type: 'Image', createdAt: '2026-07-15', expiryDate: '2027-01-01', tags: ['Certification'], thumbnailUrl: '' },
  ]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([{ timestamp: new Date().toISOString(), action: 'Viewed', documentName: 'Contract_JD.pdf' }]);

  const addLog = (action: string, documentName: string) => {
    setLogs(prev => [...prev, { timestamp: new Date().toISOString(), action, documentName }]);
  };

  const toggleSelectDoc = (docId: string) => {
    setSelectedDocs(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
  };

  const deleteSelected = () => {
    setDocuments(prev => prev.filter(d => !selectedDocs.includes(d.id)));
    setSelectedDocs([]);
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'type') return (a.type || '').localeCompare(b.type || '');
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate).getTime();
    const today = new Date().getTime();
    const diff = (expiry - today) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  };

  useEffect(() => {
    const q = query(collection(db, 'hr_folders'), where('hospital_id', '==', hospital_id));
    const unsub = onSnapshot(q, (snap) => {
      const list: HRFolder[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as HRFolder));
      setFolders(list);
    });
    return unsub;
  }, [hospital_id]);

  const handleCreateFolder = async () => {
    if (!folderId.trim() || !folderName.trim()) {
      setError('Folder ID and Name are required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addDoc(collection(db, 'hr_folders'), {
        folderId,
        folderName,
        hospital_id,
        createdAt: new Date().toISOString()
      });
      setFolderId('');
      setFolderName('');
    } catch (e) {
      setError('Failed to create folder.');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (err) {
      console.warn('Could not access camera hardware, creating canvas feed:', err);
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('CAMERA LIVE PREVIEW', 210, 240);
      }
      setCameraStream(canvas.captureStream(30));
    }
  };

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn(e));
    }
  }, [cameraStream]);

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
          <FolderPlus size={18} className="text-indigo-600" />
          Advanced HR Storage
        </h3>
        <ConnectionStatus />
      </div>
      
      <div className="space-y-3">
        <input 
          placeholder="Folder ID (e.g., F-001)"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold"
        />
        <input 
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold"
        />
        <button 
          onClick={handleCreateFolder}
          disabled={loading}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create Container'}
        </button>
      </div>

      {error && <p className="text-[10px] font-bold text-rose-500">{error}</p>}

      <div className="space-y-2 mt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Existing Containers</p>
        {folders.map(f => (
          <div key={f.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 p-2 bg-slate-50 rounded-lg">
            <Folder size={14} className="text-indigo-500" />
            {f.folderId} - {f.folderName}
          </div>
        ))}
        {!folders.some(f => f.folderName === 'Report Folder') && (
          <div 
            className={`flex items-center gap-2 text-xs font-bold text-slate-700 p-2 bg-slate-50 rounded-lg border-l-2 cursor-pointer ${selectedFolderId === 'report-folder' ? 'border-amber-500' : 'border-slate-300'}`}
            onClick={() => setSelectedFolderId('report-folder')}
          >
            <Folder size={14} className="text-amber-500" />
            F-RP - Report Folder
          </div>
        )}
        {selectedFolderId === 'report-folder' && <HRReportFolder />}


        {!folders.some(f => f.folderName === 'Active Staff Folder') && (
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 p-2 bg-slate-50 rounded-lg border-l-2 border-indigo-500 cursor-pointer"
              onClick={() => setShowActiveStaffActions(!showActiveStaffActions)}
            >
              <div className='flex items-center gap-2'>
                <Folder size={14} className="text-indigo-500" />
                F-AS - Active Staff Folder
              </div>
              <div className="flex gap-2">
                <Upload size={14} className="text-indigo-600 hover:text-indigo-800" />
                <Camera size={14} className="text-indigo-600 hover:text-indigo-800" onClick={(e) => { e.stopPropagation(); startCamera(); }}/>
              </div>
            </div>
            
            {showActiveStaffActions && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="pl-4 space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100' : ''}`}><Folder size={14} /></button>
                  <button onClick={() => setViewMode('dashboard')} className={`p-2 rounded ${viewMode === 'dashboard' ? 'bg-indigo-100' : ''}`}><BarChart3 size={14} /></button>
                  <button onClick={() => setViewMode('signature')} className={`p-2 rounded ${viewMode === 'signature' ? 'bg-indigo-100' : ''}`}><PenTool size={14} /></button>
                  <button onClick={() => setViewMode('logs')} className={`p-2 rounded ${viewMode === 'logs' ? 'bg-indigo-100' : ''}`}><ClipboardList size={14} /></button>
                </div>

                {viewMode === 'list' && (
                  <>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent uppercase">
                        <option value="date">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="type">Sort by Type</option>
                      </select>
                      {selectedDocs.length > 0 && (
                        <button onClick={deleteSelected} className="text-rose-500 uppercase hover:underline">Delete Selected ({selectedDocs.length})</button>
                      )}
                    </div>
                    {sortedDocuments.map((doc) => (
                      <div key={doc.id} className={`flex items-center gap-3 text-xs font-bold text-slate-700 p-2 bg-slate-50 rounded-lg ${isExpiringSoon(doc.expiryDate) ? 'border-l-4 border-rose-500' : ''}`}>
                        <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => toggleSelectDoc(doc.id)} />
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                          {doc.type === 'Image' ? <ImageIcon size={16} className="text-slate-500" /> : <FileText size={16} className="text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{doc.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {doc.tags?.map(tag => <span key={tag} className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded">{tag}</span>)}
                          </div>
                        </div>
                        {isExpiringSoon(doc.expiryDate) && <AlertCircle size={14} className="text-rose-500" />}
                      </div>
                    ))}
                    <button className="w-full py-2 mt-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-bold text-xs">
                      <Zip size={14} /> Export All as ZIP
                    </button>
                  </>
                )}
                {viewMode === 'dashboard' && <HRFolderDashboard documents={documents} />}
                {viewMode === 'signature' && <HRSignatureTool onSave={(data) => console.log('Signature saved', data)} />}
                {viewMode === 'logs' && <HRAuditLog logs={logs} networkLogs={[{ timestamp: new Date().toISOString(), event: 'Sync Attempt', latency: 45, status: 'Success' }]} />}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {cameraStream && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-lg" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={stopCamera} className="px-4 py-2 bg-slate-200 rounded-lg font-bold text-xs">Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
