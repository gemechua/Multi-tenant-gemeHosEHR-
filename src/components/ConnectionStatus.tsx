import React from 'react';
import { Wifi } from 'lucide-react';

export default function ConnectionStatus() {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
      <Wifi size={12} />
      CLOUD CONNECTED
    </div>
  );
}
