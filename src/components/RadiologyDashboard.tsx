import React from 'react';
import { Activity, Check, Clock, FileText, Database } from 'lucide-react';

interface RadiologyDashboardProps {
  requests: any[];
  reports: any[];
  paymentRequests: any[];
  cashierVerifications: any[];
  isPaymentPaid: (mrn: string) => boolean;
}

export function RadiologyDashboard({ requests, reports, paymentRequests, cashierVerifications, isPaymentPaid }: RadiologyDashboardProps) {
  // Aggregate stats
  const pendingRequests = requests.filter(r => !reports.some(rep => rep.patient_mrn?.toLowerCase() === r.patient_mrn?.toLowerCase())).length;
  const completedReports = reports.length;
  const pendingPayments = paymentRequests.filter(p => !isPaymentPaid(p.patient_mrn || '')).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Activity className="text-indigo-600" size={18} />
          Radiology Analytics Dashboard
        </h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Pending Scans</p>
              <h3 className="text-2xl font-bold text-amber-900">{pendingRequests}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Check size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Reports Generated</p>
              <h3 className="text-2xl font-bold text-emerald-900">{completedReports}</h3>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-800">Pending Payments</p>
              <h3 className="text-2xl font-bold text-indigo-900">{pendingPayments}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-slate-50 border-t border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Patient Journey Overview</h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {requests.map(req => {
            const mrn = req.patient_mrn;
            const hasReport = reports.some(r => r.patient_mrn?.toLowerCase() === mrn?.toLowerCase());
            const isPaid = isPaymentPaid(mrn || '');
            const hasPaymentReq = paymentRequests.some(p => p.patient_mrn?.toLowerCase() === mrn?.toLowerCase());

            return (
              <div key={req.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="w-24 shrink-0">
                  <span className="text-xs font-mono font-bold text-indigo-600">{mrn}</span>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div className="h-2 rounded bg-indigo-500" title="Request Received"></div>
                  <div className={`h-2 rounded ${hasReport ? 'bg-indigo-500' : 'bg-gray-200 animate-pulse'}`} title="Imaging in Progress"></div>
                  <div className={`h-2 rounded ${hasReport ? 'bg-indigo-500' : 'bg-gray-200'}`} title="Report Generated"></div>
                  <div className={`h-2 rounded ${isPaid ? 'bg-emerald-500' : (hasPaymentReq ? 'bg-amber-400' : 'bg-gray-200')}`} title={isPaid ? 'Paid' : 'Payment Pending'}></div>
                </div>
                <div className="w-32 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {isPaid ? 'Verified Complete' : (hasReport ? 'Awaiting Payment' : 'Scan Pending')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
