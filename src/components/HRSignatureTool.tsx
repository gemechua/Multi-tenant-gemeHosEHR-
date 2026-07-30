import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function HRSignatureTool({ onSave }: { onSave: (data: string) => void }) {
  const sigCanvas = useRef<any>(null);

  const clear = () => sigCanvas.current?.clear();
  const save = () => onSave(sigCanvas.current?.toDataURL());

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{width: 300, height: 150, className: 'border border-slate-200 rounded-lg'}} />
      <div className="flex gap-2 mt-2">
        <button onClick={clear} className="text-xs font-bold text-slate-500">Clear</button>
        <button onClick={save} className="text-xs font-bold text-indigo-600">Save Signature</button>
      </div>
    </div>
  );
}
