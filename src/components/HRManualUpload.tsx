import React, { useState } from 'react';
import { Upload, FileText, X, Loader2, FileCheck, CheckCircle2, Eye } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function HRManualUpload() {
  const [fileName, setFileName] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiPlans, setAiPlans] = useState<any[]>([]);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      setIsAiProcessing(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          const mimeType = file.type || (ext === 'pdf' ? 'application/pdf' : 'application/msword');
          
          setFileDataUrl(base64Data);
          setFileType(mimeType);

          try {
            const response = await fetch('/api/hr/parse-action-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileData: base64Data, mimeType, fileName: file.name }),
            });
            
            const data = await response.json();
            if (data.success && data.plans) {
              setAiPlans(data.plans);
            } else {
              setError(data.error || 'Failed to parse document.');
            }
          } catch (err: any) {
            setError(err.message || 'Error communicating with server.');
          } finally {
            setIsAiProcessing(false);
          }
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setIsAiProcessing(false);
        }
        reader.readAsDataURL(file);
      } catch (err) {
        setIsAiProcessing(false);
        setError("Error processing file.");
      }
    } else {
      setError("Unsupported file format. Please upload PDF or DOC/DOCX documents.");
    }
  };

  const importAiPlans = async () => {
    setIsAiProcessing(true);
    try {
      const collRef = collection(db, 'hr_action_plans');
      for (const plan of aiPlans) {
        await addDoc(collRef, {
          ...plan,
          hospital_id: 'system-default',
          timestamp: new Date().toISOString()
        });
      }
      setAiSuccess(true);
      setTimeout(() => {
        reset();
      }, 3000);
    } catch (err: any) {
      setError('Failed to save plans to database.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const reset = () => {
    setFileName('');
    setFileDataUrl(null);
    setFileType('');
    setAiPlans([]);
    setIsAiProcessing(false);
    setAiSuccess(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
          <Upload size={18} className="text-indigo-600" />
          External Action Plan Upload
        </h3>
        {fileName && (
          <button onClick={reset} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {!fileName ? (
        <div className="relative group">
          <input 
            type="file" 
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          />
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-slate-50 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all">
            <div className="p-4 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
              <FileText size={32} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
              Click or drag PDF or DOC file to extract
            </p>
            <span className="text-[10px] text-slate-400">Supported formats: .pdf, .doc, .docx</span>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
            <FileText size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-indigo-900">{fileName}</p>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
              {aiPlans.length > 0 ? `${aiPlans.length} objectives extracted` : 'Processing file...'}
            </p>
          </div>
          {fileDataUrl && (
            <button 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 text-xs font-bold bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-colors"
            >
              <Eye size={14} />
              Preview
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100">
          {error}
        </div>
      )}

      {isAiProcessing && !aiPlans.length && !aiSuccess && (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 size={24} className="text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Agent analyzing document...</p>
        </div>
      )}

      {aiPlans.length > 0 && !aiSuccess && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar space-y-3">
            {aiPlans.map((plan, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <p className="text-xs font-black text-slate-800 mb-1">{plan.title}</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span>{plan.department}</span>&bull;
                  <span>{plan.responsiblePerson}</span>&bull;
                  <span>{plan.targetDate}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={importAiPlans}
            disabled={isAiProcessing}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isAiProcessing ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
            Import {aiPlans.length} Action Plans
          </button>
        </div>
      )}

      {aiSuccess && (
         <motion.div 
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4"
       >
         <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
           <CheckCircle2 size={32} />
         </div>
         <div>
           <h4 className="font-black text-emerald-900 text-lg">Import Complete!</h4>
           <p className="text-emerald-700 text-sm font-medium">Successfully processed and synchronized AI-extracted records.</p>
         </div>
       </motion.div>
      )}

      <AnimatePresence>
        {showPreview && fileDataUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
                  <FileText size={18} className="text-indigo-600" />
                  Document Preview: {fileName}
                </h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 bg-slate-100 overflow-hidden relative">
                {fileType === 'application/pdf' ? (
                  <iframe 
                    src={fileDataUrl} 
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <FileText size={64} className="mb-4 text-slate-300" />
                    <p className="font-bold">Preview not available for this file type.</p>
                    <p className="text-sm mt-2">Only PDF files can be previewed directly in the browser.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
