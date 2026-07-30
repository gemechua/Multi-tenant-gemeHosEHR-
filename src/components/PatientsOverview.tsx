import React from 'react';
import { Users, Search, Filter, ShieldCheck, MapPin } from 'lucide-react';

interface PatientsOverviewProps {
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  hospital_id: string;
}

export default function PatientsOverview({ addToast, hospital_id }: PatientsOverviewProps) {
  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
          <Users className="text-blue-600" /> Patients Overview Center
        </h2>
        <p className="text-slate-500 text-sm">Unified Electronic Health Record Registry. Comprehensive institutional directory of all registered patients, live inpatient status, CBHI insurance verification, and cryptographic QR identification badges.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center">
        <Users size={48} className="text-slate-300 mb-4" />
        <h3 className="text-slate-500 font-bold mb-2">Patient Records Module</h3>
        <p className="text-slate-400 text-sm max-w-md">The unified EHR registry allows you to manage patient records, view live inpatient statuses, and generate cryptographic QR identification badges.</p>
      </div>
    </div>
  );
}
