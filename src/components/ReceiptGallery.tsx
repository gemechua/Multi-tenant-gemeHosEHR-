import React, { useState } from 'react';
import { X, ZoomIn, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptGalleryProps {
  receipts: string[];
  onClose: () => void;
}

export default function ReceiptGallery({ receipts, onClose }: ReceiptGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Receipt Gallery</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {receipts.map((src, index) => (
              <div key={index} className="aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-emerald-500" onClick={() => setSelectedImage(src)}>
                <img src={src} alt="Receipt" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      {selectedImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Expanded" className="max-w-full max-h-full" />
          <div className="absolute top-4 right-4 flex gap-4">
            <button className="text-white"><ZoomIn size={24} /></button>
            <button className="text-white" onClick={() => window.print()}><Printer size={24} /></button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
