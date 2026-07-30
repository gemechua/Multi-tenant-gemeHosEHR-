import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, User, UserCheck, Clipboard, Signature, CheckCircle2,
  Printer, History, AlertTriangle, Users, ArrowRight, RefreshCw, X
} from 'lucide-react';
import { collection, addDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PharmacyShiftHandoffProps {
  patientQueue?: any[];
  pendingStockAdjustments?: any[];
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  hospital_id: string;
}

export default function PharmacyShiftHandoff({
  patientQueue = [],
  pendingStockAdjustments = [],
  addToast,
  hospital_id
}: PharmacyShiftHandoffProps) {
  const [outgoingStaff, setOutgoingStaff] = useState('');
  const [incomingStaff, setIncomingStaff] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [submittedHandoffs, setSubmittedHandoffs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [signedDataUrl, setSignedDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Default patient queue if none passed
  const activeQueue = patientQueue;

  // Default pending adjustments if none passed
  const activeAdjustments = pendingStockAdjustments;

  // Initialize and clear canvas signature pad
  useEffect(() => {
    clearCanvas();
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // For touches vs mouse clicks
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b'; // Slate 800
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    saveSignatureUrl();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background placeholder text
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText('Sign with mouse or touch here', canvas.width / 2, canvas.height / 2);
    setSignedDataUrl(null);
  };

  const saveSignatureUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignedDataUrl(canvas.toDataURL());
  };

  // Fetch past shift handoffs from Firestore
  const fetchPastHandoffs = async () => {
    try {
      const q = query(collection(db, 'pharmacy_shift_handoffs'), where('hospital_id', '==', hospital_id));
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        
      
      // Sort desc
      list.sort((a: any, b: any) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return tB - tA;
      });
      setSubmittedHandoffs(list);
    } catch (e) {
      console.error("Error loading handoffs: ", e);
    }
  };

  useEffect(() => {
    fetchPastHandoffs();
  }, [hospital_id]);

  const handleSubmitHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingStaff.trim() || !incomingStaff.trim()) {
      addToast('error', 'Both Outgoing and Incoming pharmacist signatures/names are required.');
      return;
    }
    if (!signedDataUrl) {
      addToast('error', 'A digital signature on the signature pad is required for regulatory shift approval.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        outgoingPharmacist: outgoingStaff.trim(),
        incomingPharmacist: incomingStaff.trim(),
        notes: handoffNotes.trim() || 'Shift concluded. All safety limits, temperature checks, and queue states reconciled.',
        signatureData: signedDataUrl,
        timestamp: new Date().toISOString(),
        patientQueueSnapshot: activeQueue,
        pendingStockAdjustmentsSnapshot: activeAdjustments,
        hospital_id,
        status: 'Authorized & Closed'
      };

      await addDoc(collection(db, 'pharmacy_shift_handoffs'), {
        ...payload,
        createdAt: serverTimestamp()
      });

      addToast('success', 'Pharmacy Shift Handoff officially logged and signed in Firestore.');
      
      // Reset form
      setOutgoingStaff('');
      setIncomingStaff('');
      setHandoffNotes('');
      clearCanvas();
      
      // Reload list
      fetchPastHandoffs();
    } catch (error) {
      console.error("Error submitting handoff: ", error);
      addToast('error', 'Failed to save shift handoff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <Users className="text-emerald-600" size={20} />
            Pharmacy Shift Handoff System
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile clinical queues and pending stock audits with verification from incoming staff.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-xl font-bold">
          <Signature size={14} className="text-emerald-600" />
          <span>Active Session SOP Verification</span>
        </div>
      </div>

      <form onSubmit={handleSubmitHandoff} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hand Column: Handoff State Snapshots */}
        <div className="lg:col-span-2 space-y-5">
          {/* Snapshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Patient Queue Snapshot */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Active Patient Queue</span>
                <span className="bg-slate-200 text-slate-600 font-mono px-1.5 py-0.2 rounded-md">{activeQueue.length} Pending</span>
              </h5>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {activeQueue.map((q, i) => (
                  <div key={i} className="bg-white p-2 rounded border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-800">{q.patient || q.patientName}</strong>
                      <p className="text-[10px] text-slate-400">{q.medicine || q.medicationName}</p>
                    </div>
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-black uppercase px-1.5 py-0.2 rounded border border-amber-100">
                      {q.status || 'Awaiting'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Pending Stock Adjustments Snapshot */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Pending Stock Adjustments</span>
                <span className="bg-red-50 text-red-700 font-mono px-1.5 py-0.2 rounded-md">Spot Checks</span>
              </h5>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {activeAdjustments.map((a, i) => (
                  <div key={i} className="bg-white p-2 rounded border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-800">{a.itemScanned || a.itemName}</strong>
                      <p className="text-[10px] text-slate-400">System Balance: {a.systemBalance}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${a.discrepancy < 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                        {a.discrepancy > 0 ? `+${a.discrepancy}` : a.discrepancy}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">{a.resolutionStatus || 'Unresolved'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shift Handover Briefing Notes */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Shift handoff & Briefing notes</label>
            <textarea 
              rows={4}
              value={handoffNotes}
              onChange={(e) => setHandoffNotes(e.target.value)}
              placeholder="Describe any special concerns, power outages, temperature variance in the refrigerators, or outstanding urgent orders..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 h-[100px] resize-none"
            />
          </div>
        </div>

        {/* Right Hand Column: Staff & Signature Pad */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={14} className="text-emerald-600" />
            Verification & Signature
          </h5>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Outgoing Pharmacist Name</label>
              <input 
                type="text"
                required
                placeholder="License ID - Name"
                value={outgoingStaff}
                onChange={(e) => setOutgoingStaff(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Incoming Pharmacist Name</label>
              <input 
                type="text"
                required
                placeholder="License ID - Name"
                value={incomingStaff}
                onChange={(e) => setIncomingStaff(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>

            {/* Signature Drawing Canvas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Digital Authorization Signature</label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[9px] text-red-600 font-bold hover:underline"
                >
                  Clear Signature
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden h-28 relative">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={112}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair touch-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {submitting ? 'Authorizing handoff...' : 'Certify & Submit Handoff'}
          </button>
        </div>
      </form>

      {/* Submitted Shift Handoff Reports */}
      {submittedHandoffs.length > 0 && (
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <History size={14} className="text-emerald-600" />
            Immutable Shift Handoff logs (Stored in Database)
          </h5>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {submittedHandoffs.map((handoff) => (
              <div key={handoff.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      HANDOFF COMPLIANT
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(handoff.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span>{handoff.outgoingPharmacist}</span>
                    <ArrowRight size={12} className="text-emerald-500" />
                    <span>{handoff.incomingPharmacist}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong className="text-[10px] font-black text-slate-400 uppercase block mb-1">Pharmacist Handoff Notes:</strong>
                    <p className="text-slate-700 italic">" {handoff.notes} "</p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <strong className="text-[10px] font-black text-slate-400 uppercase block mb-1">State Snapshots captured:</strong>
                      <span className="text-[11px] font-semibold text-slate-600 block">Queue items: {handoff.patientQueueSnapshot?.length || 0}</span>
                      <span className="text-[11px] font-semibold text-slate-600 block">Stock audits: {handoff.pendingStockAdjustmentsSnapshot?.length || 0}</span>
                    </div>

                    {/* Signature preview */}
                    {handoff.signatureData && (
                      <div className="text-right">
                        <strong className="text-[10px] font-black text-slate-400 uppercase block mb-1">Approved Signature:</strong>
                        <div className="bg-white border border-slate-200 rounded-lg p-1 inline-block">
                          <img 
                            src={handoff.signatureData} 
                            alt="Handoff signature" 
                            className="h-8 max-w-[120px] object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
