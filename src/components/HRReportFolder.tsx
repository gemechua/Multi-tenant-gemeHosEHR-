import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, FileArchive, Share2, ClipboardList, Calendar, FileText, LayoutTemplate, X, Mail, MessageSquare, Send, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HRReportFolder() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const templates = [
    { id: 't1', name: 'Onboarding Report', layout: 'Header/List/Signature' },
    { id: 't2', name: 'Performance Review', layout: 'Header/Grid/Comments' },
  ];

  const handleUpload = () => fileInputRef.current?.click();
  
  const emulateDocScan = () => {
    const mockReportSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%23fffbeb" stroke="%23f59e0b" stroke-width="4" rx="8"/><rect x="20" y="20" width="100" height="130" fill="%23fef3c7" rx="4"/><circle cx="70" cy="70" r="30" fill="%23f59e0b" fill-opacity="0.3"/><path d="M40,130 C40,110 100,110 100,130" fill="%23f59e0b" fill-opacity="0.3"/><rect x="140" y="30" width="220" height="20" fill="%2378350f" rx="4"/><rect x="140" y="65" width="180" height="12" fill="%23b45309" rx="3"/><rect x="140" y="90" width="150" height="12" fill="%23b45309" rx="3"/><rect x="140" y="115" width="200" height="12" fill="%23d97706" rx="3"/><rect x="20" y="170" width="360" height="60" fill="%23fffbeb" rx="4" stroke="%23fcd34d"/><text x="35" y="195" font-family="monospace" font-size="11" font-weight="bold" fill="%2378350f">REPORT TYPE: MONTHLY HOSPITAL PERFORMANCE</text><text x="35" y="215" font-family="monospace" font-size="10" fill="%23b45309">VERIFIED CLINICAL ANALYTICS METRICS OK</text></svg>`;
    setCapturedImage(mockReportSvg);
    setIsCapturing(false);
  };
  
  const startCamera = async () => {
    setIsCapturing(true);
    setCapturedImage(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn(e));
      }
    } catch (err) {
      console.warn("Camera failed to start in sandbox, launching emulator stream:", err);
      // Create animated canvas stream for sandbox
      setTimeout(() => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('HR DOCUMENT LIVE SCANNER', 200, 240);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = canvas.captureStream(30);
          videoRef.current.play().catch(e => console.warn(e));
        }
      }, 100);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleShare = (platform: string) => alert(`Sharing via ${platform}`);

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} className="hidden" />
      <div className="flex gap-2">
        <button onClick={handleUpload} className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-50 text-amber-700 rounded-lg font-bold text-xs"><Upload size={14}/> Upload</button>
        <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-50 text-amber-700 rounded-lg font-bold text-xs"><Camera size={14}/> Capture</button>
        <button onClick={() => setShowShare(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-50 text-amber-700 rounded-lg font-bold text-xs"><Share2 size={14}/> Share</button>
      </div>

      {capturedImage && (
        <div className="bg-slate-50 p-4 rounded-lg">
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-xs font-bold text-slate-500 uppercase">Captured Image</h4>
             <button onClick={() => setCapturedImage(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
           </div>
           <img src={capturedImage} alt="Captured" className="w-full rounded border border-slate-200" />
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase">Report Templates</h4>
        {templates.map(t => (
          <div key={t.id} className="flex justify-between items-center text-xs p-2 bg-white rounded border border-slate-200">
            {t.name}
            <button onClick={() => setPreviewTemplate(t.layout)} className="text-indigo-600"><LayoutTemplate size={14} /></button>
          </div>
        ))}
      </div>

      <button onClick={() => alert('PDF Generated!')} className="w-full py-2 bg-amber-600 text-white rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2">
        <Download size={14} /> Generate PDF Summary
      </button>

      <button onClick={() => alert('Scheduled!')} className="w-full py-2 border border-slate-200 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2">
        <Calendar size={14}/> Schedule Monthly
      </button>

      <AnimatePresence>
        {isCapturing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white p-4 rounded-2xl w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Camera size={18} /> Camera Capture</h3>
                    <button onClick={stopCamera} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
                </div>
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover absolute inset-0" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex justify-center items-center gap-4">
                    <button onClick={takePhoto} className="w-14 h-14 rounded-full border-4 border-slate-300 bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors" title="Capture photo">
                      <div className="w-10 h-10 rounded-full bg-amber-500" />
                    </button>
                    <button onClick={emulateDocScan} className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-xs shadow-sm transition-all">
                      Emulate Doc Scan
                    </button>
                  </div>
                </div>
            </div>
          </motion.div>
        )}

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
