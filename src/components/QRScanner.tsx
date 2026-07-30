import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, Stethoscope, FlaskConical, FileText, UserCheck, CheckCircle2, ShieldCheck, Zap, RefreshCw, X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export default function QRScanner({ onScan, title = "Clinical QR & Barcode Scanner Portal", subtitle = "Scan Patient Wristband, Lab Specimen, Prescription or Staff Badge", onClose }: QRScannerProps) {
  const [activeMode, setActiveMode] = useState<'wristband' | 'lab' | 'prescription' | 'staff' | 'receipt'>('wristband');
  const [isScanning, setIsScanning] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [lastScannedPayload, setLastScannedPayload] = useState<any | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Quick Preset Scans for high-speed simulation & testing
  const PRESET_SCANS = {
    wristband: JSON.stringify({
      type: 'PATIENT_WRISTBAND',
      mrn: 'MRN-EMERG-8092',
      patient_name: 'Aster Lemma',
      dob: '1988-04-12',
      blood_type: 'O+',
      allergies: ['Penicillin'],
      triage_level: 'Level 1 - Critical'
    }),
    lab: JSON.stringify({
      type: 'LAB_SPECIMEN',
      sample_id: 'LAB-2026-9041',
      patient_mrn: 'MRN-EMERG-8092',
      test_name: 'Full Blood Count & Serum Electrolytes',
      collector: 'Sister Meron Wolde',
      status: 'In Transit to Central Lab'
    }),
    prescription: JSON.stringify({
      type: 'PRESCRIPTION_ORDER',
      rx_id: 'RX-2026-4412',
      patient_mrn: 'MRN-EMERG-8092',
      medication: 'Ceftriaxone 1g IV Injection',
      dosage: 'Every 12 Hours',
      prescriber: 'Dr. Solomon Tadesse'
    }),
    staff: JSON.stringify({
      type: 'STAFF_BADGE',
      staff_id: 'EMP-9081',
      staff_name: 'Dr. Solomon Tadesse',
      department: 'Emergency & Triage',
      access_level: 'Level 4 - Full Clinical Admin'
    }),
    receipt: JSON.stringify({
      type: 'RECEIPT_PAYMENT',
      invoice_no: 'INV-2026-8801',
      amount: 450,
      cashier: 'Abebe Cashier #2',
      status: 'VERIFIED_PAID'
    })
  };

  const handleTriggerScan = (payloadStr: string) => {
    setIsScanning(false);
    try {
      const parsed = JSON.parse(payloadStr);
      setLastScannedPayload(parsed);
      setScanStatus('success');
    } catch (e) {
      setLastScannedPayload({ raw: payloadStr });
      setScanStatus('success');
    }

    onScan(payloadStr);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleTriggerScan(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 max-w-2xl mx-auto relative overflow-hidden">
      {/* Portal Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Camera size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wide text-white flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-500/40">
                Camera & Hardware Scanner Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Target Mode Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveMode('wristband')}
          className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeMode === 'wristband' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope size={13} /> Wristband
        </button>

        <button
          onClick={() => setActiveMode('lab')}
          className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeMode === 'lab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FlaskConical size={13} /> Lab Sample
        </button>

        <button
          onClick={() => setActiveMode('prescription')}
          className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeMode === 'prescription' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={13} /> Prescription
        </button>

        <button
          onClick={() => setActiveMode('staff')}
          className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeMode === 'staff' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck size={13} /> Staff Badge
        </button>

        <button
          onClick={() => setActiveMode('receipt')}
          className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeMode === 'receipt' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode size={13} /> Invoice/Receipt
        </button>
      </div>

      {/* Simulated Live Camera Viewport */}
      <div className="relative h-52 bg-slate-950 rounded-2xl border-2 border-indigo-500/40 flex items-center justify-center overflow-hidden group shadow-inner">
        {/* Animated Laser Reticle */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-36 border-2 border-dashed border-indigo-400/80 rounded-2xl relative flex items-center justify-center">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

              {/* Scanning Red/Indigo Beam */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-bounce" />
            </div>
          </div>
        )}

        <div className="text-center space-y-2 z-10 px-4">
          <QrCode size={36} className="mx-auto text-indigo-400/60 animate-pulse" />
          <div className="text-xs font-bold text-slate-300">
            {isScanning ? `Align ${activeMode.toUpperCase()} QR/Barcode inside reticle...` : 'QR Code Successfully Scanned & Decoded'}
          </div>
          <div className="text-[11px] text-slate-500">
            Supports hardware USB scanners, device camera input, and instant auto-fill.
          </div>

          <button
            onClick={() => handleTriggerScan(PRESET_SCANS[activeMode])}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <Zap size={14} className="text-amber-300" /> Simulate Quick Scan ({activeMode.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Manual Code Entry & USB Hardware Scanner Input */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Or paste/scan raw barcode or payload string..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="flex-1 bg-slate-950 text-white text-xs font-mono py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
        >
          Process Input
        </button>
      </form>

      {/* Decoded Output Summary */}
      {lastScannedPayload && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 size={16} /> QR Decoded & Auto-Filled
            </span>
            <span className="text-[10px] font-mono text-slate-400">Status: 200 OK</span>
          </div>

          <pre className="text-[11px] font-mono bg-slate-900/90 text-indigo-300 p-3 rounded-xl overflow-x-auto max-h-32 border border-slate-800">
            {JSON.stringify(lastScannedPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
