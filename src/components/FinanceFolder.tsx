import React, { useState, useRef } from 'react';
import { Upload, Camera, Share2, LayoutTemplate, X, Mail, MessageSquare, Send, Download, Calendar, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FinanceFolder() {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const templates = [
    { id: 'f1', name: 'Monthly Financial Statement', layout: 'Header/Table/Signature' },
    { id: 'f2', name: 'Expense Report', layout: 'Header/List/Comments' },
  ];

  const handleUpload = () => fileInputRef.current?.click();
  const handleCapture = () => alert('Camera access required.');
  const handleShare = (platform: string) => alert(`Sharing via ${platform}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Folder className="text-emerald-600" size={20} />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">F-FN: Finance Folder</h3>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" />
      <div className="flex gap-2">
        <button onClick={handleUpload} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs"><Upload size={14}/> Upload</button>
        <button onClick={handleCapture} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs"><Camera size={14}/> Capture</button>
        <button onClick={() => setShowShare(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs"><Share2 size={14}/> Share</button>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase">Financial Templates</h4>
        {templates.map(t => (
          <div key={t.id} className="flex justify-between items-center text-xs p-2 bg-white rounded border border-slate-200">
            {t.name}
            <button onClick={() => setPreviewTemplate(t.layout)} className="text-indigo-600"><LayoutTemplate size={14} /></button>
          </div>
        ))}
      </div>
      
      <button onClick={() => alert('PDF Generated!')} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2">
        <Download size={14} /> Generate PDF Summary
      </button>
      
      <button onClick={() => alert('Scheduled!')} className="w-full py-2 border border-slate-200 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2"><Calendar size={14}/> Schedule Monthly</button>
      
      <AnimatePresence>
        {previewTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold">Template Preview</h3>
                    <button onClick={() => setPreviewTemplate(null)}><X /></button>
                </div>
                <div className="border-2 border-dashed p-10 text-center text-slate-400">{previewTemplate}</div>
            </div>
          </motion.div>
        )}
        {showShare && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold">Share Report</h3>
                    <button onClick={() => setShowShare(false)}><X /></button>
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => handleShare('Telegram')} className="p-4 bg-sky-100 rounded-full text-sky-600"><Send size={24} /></button>
                    <button onClick={() => handleShare('WhatsApp')} className="p-4 bg-emerald-100 rounded-full text-emerald-600"><MessageSquare size={24} /></button>
                    <button onClick={() => handleShare('Email')} className="p-4 bg-rose-100 rounded-full text-rose-600"><Mail size={24} /></button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
