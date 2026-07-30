import React, { useState, useRef, useEffect } from 'react';
import { Users, Search, Briefcase, ChevronRight, UserCheck, Upload, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HRActiveStaffFolderProps {
  staff?: any[];
}

export default function HRActiveStaffFolder({ staff = [] }: HRActiveStaffFolderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeStaff = staff.filter(s => s.status === 'Active' && 
    (s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.department.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleUpload = () => fileInputRef.current?.click();
  
  const emulateDocScan = () => {
    const mockDocSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="4" rx="8"/><rect x="20" y="20" width="100" height="130" fill="%23e2e8f0" rx="4"/><circle cx="70" cy="70" r="30" fill="%23cbd5e1"/><path d="M40,130 C40,110 100,110 100,130" fill="%23cbd5e1"/><rect x="140" y="30" width="220" height="20" fill="%230f172a" rx="4"/><rect x="140" y="65" width="180" height="12" fill="%23475569" rx="3"/><rect x="140" y="90" width="150" height="12" fill="%23475569" rx="3"/><rect x="140" y="115" width="200" height="12" fill="%2364748b" rx="3"/><rect x="20" y="170" width="360" height="60" fill="%23f1f5f9" rx="4" stroke="%23e2e8f0"/><text x="35" y="195" font-family="monospace" font-size="11" font-weight="bold" fill="%230f172a">STATUS: CLINICAL STAFF IDENTITY ACTIVE</text><text x="35" y="215" font-family="monospace" font-size="10" fill="%23475569">DOCUMENT TYPE: HIGH-SECURITY CREDENTIALS</text></svg>`;
    setCapturedImage(mockDocSvg);
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
          ctx.fillText('ACTIVE STAFF BIOMETRIC SCANNER', 180, 240);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
          <UserCheck size={18} className="text-emerald-600" />
          F-AS: Active Staff Folder
        </h3>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" />
      <div className="flex gap-2 mb-4">
        <button onClick={handleUpload} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs">
          <Upload size={14}/> Upload Doc
        </button>
        <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs">
          <Camera size={14}/> Capture Doc
        </button>
      </div>

      {capturedImage && (
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-xs font-bold text-slate-500 uppercase">Captured Document</h4>
             <button onClick={() => setCapturedImage(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
           </div>
           <img src={capturedImage} alt="Captured" className="w-full rounded border border-slate-200" />
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="Search active staff..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStaff.length > 0 ? activeStaff.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
              {member.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">{member.fullName}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Briefcase size={12} /> {member.jobTitle}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded">
                {member.department}
              </span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        )) : (
          <div className="col-span-full py-8 text-center text-slate-400 text-sm">
            No active staff found matching your search.
          </div>
        )}
      </div>

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
                      <div className="w-10 h-10 rounded-full bg-emerald-500" />
                    </button>
                    <button onClick={emulateDocScan} className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-xs shadow-sm transition-all">
                      Emulate Doc Scan
                    </button>
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
