import React from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';

export default function InventoryBatchImport({ onImport }: { onImport: (data: any[]) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          onImport(json);
        } catch (e) { alert('Invalid JSON'); }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        complete: (results) => onImport(results.data),
        error: (err) => alert(err.message),
      });
    }
  };

  return (
    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200 text-sm font-medium transition-colors">
      <Upload size={16} />
      <span>Import Batch</span>
      <input type="file" accept=".csv,.json" className="hidden" onChange={handleFileChange} />
    </label>
  );
}
