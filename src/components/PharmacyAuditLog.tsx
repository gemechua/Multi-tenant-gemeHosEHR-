import React, { useState } from 'react';
import { 
  Pill, Activity, ShoppingCart, AlertTriangle, Package, Search, 
  CheckCircle2, AlertCircle, Clock, Calendar, ShieldAlert, FileText, User
} from 'lucide-react';

interface PharmacyAuditLogProps {
  prescribingLogs?: any[];
  monitoringLogs?: any[];
  inventoryStockLogs?: any[];
  drugStockOutLogs?: any[];
  purchasedStockOutLogs?: any[];
  auditoryStockOutLogs?: any[];
}

export default function PharmacyAuditLog({
  prescribingLogs = [],
  monitoringLogs = [],
  inventoryStockLogs = [],
  drugStockOutLogs = [],
  purchasedStockOutLogs = [],
  auditoryStockOutLogs = []
}: PharmacyAuditLogProps) {
  const [activeSubTab, setActiveSubTab] = useState<'prescribing' | 'monitoring' | 'inventory' | 'stockout' | 'purchased' | 'audits'>('prescribing');
  const [localSearch, setLocalSearch] = useState('');

  const formatTimestamp = (ts: any) => {
    if (!ts) return new Date().toLocaleDateString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <ShieldAlert className="text-emerald-600" size={20} />
            Secure Dispensary Database & SOP Audit
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Official immutable logs representing clinical entries, environmental logs, and stock tracking.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter audit records..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full md:w-60 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Tab selectors */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
        {[
          { id: 'prescribing', label: 'Prescribing SOP', icon: Pill, count: prescribingLogs.length },
          { id: 'monitoring', label: 'Cold-Chain Logs', icon: Activity, count: monitoringLogs.length },
          { id: 'inventory', label: 'Stock Receipts', icon: ShoppingCart, count: inventoryStockLogs.length },
          { id: 'stockout', label: 'SOP Stock-outs', icon: AlertTriangle, count: drugStockOutLogs.length },
          { id: 'purchased', label: 'PO Delays', icon: Package, count: purchasedStockOutLogs.length },
          { id: 'audits', label: 'Spot Audits', icon: Search, count: auditoryStockOutLogs.length }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => {
              setActiveSubTab(sub.id as any);
              setLocalSearch('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === sub.id 
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            <sub.icon size={13} className={activeSubTab === sub.id ? 'text-emerald-600' : 'text-slate-400'} />
            <span>{sub.label}</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-black ${
              activeSubTab === sub.id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-500'
            }`}>
              {sub.count}
            </span>
          </button>
        ))}
      </div>

      {/* Database Explorer Grid */}
      <div className="overflow-x-auto">
        {/* TAB 1: Clinical Prescribing Log */}
        {activeSubTab === 'prescribing' && (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black">
                <th className="pb-3 pl-2">Logged At</th>
                <th className="pb-3">Patient ID</th>
                <th className="pb-3">Prescriber ID</th>
                <th className="pb-3">Medication</th>
                <th className="pb-3">Dosage / Route</th>
                <th className="pb-3 text-right">Qty / Duration</th>
                <th className="pb-3 text-center">Allergy Chk</th>
                <th className="pb-3 pr-2 text-right">Dispensed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {prescribingLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No clinical prescribing records saved in database yet.
                  </td>
                </tr>
              ) : (
                prescribingLogs
                  .filter(log => 
                    log.patientId?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.medicationName?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.prescriberId?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.dispensedBy?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[10px] text-slate-400">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="py-3 font-bold text-slate-900">{log.patientId}</td>
                      <td className="py-3 font-mono font-medium">{log.prescriberId}</td>
                      <td className="py-3 font-bold text-emerald-950">{log.medicationName}</td>
                      <td className="py-3">
                        <span className="font-semibold">{log.dosage || 'N/A'}</span>
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{log.routeOfAdmin}</span>
                      </td>
                      <td className="py-3 text-right">
                        <strong className="text-slate-900">{log.totalQuantity || '0'}</strong>
                        <span className="text-[10px] text-slate-400 ml-1">({log.duration || '0'} days)</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          log.allergiesCheck === 'Yes' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {log.allergiesCheck}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right font-medium text-slate-500 max-w-[150px] truncate" title={log.dispensedBy}>
                        {log.dispensedBy}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 2: Cold Chain Environmental Checks */}
        {activeSubTab === 'monitoring' && (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black">
                <th className="pb-3 pl-2">Monitor Date/Time</th>
                <th className="pb-3">Storage Area</th>
                <th className="pb-3 text-center">Temp (°C)</th>
                <th className="pb-3 text-center">Humidity (%)</th>
                <th className="pb-3 text-center">Integrity Chk</th>
                <th className="pb-3">Corrective Action Taken</th>
                <th className="pb-3 pr-2 text-right">Staff Initials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {monitoringLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No cold-chain monitoring logs recorded.
                  </td>
                </tr>
              ) : (
                monitoringLogs
                  .filter(log => 
                    log.storageArea?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.correctiveAction?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  .map((log) => {
                    const temp = parseFloat(log.temperature);
                    const hum = parseFloat(log.humidity);
                    const isTempBad = log.storageArea.includes('Fridge') ? (temp < 2 || temp > 8) : (temp < 15 || temp > 25);
                    const isHumBad = hum < 30 || hum > 60;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-2 font-mono text-[10px] text-slate-400">
                          {formatTimestamp(log.createdAt || log.monitorDateTime)}
                        </td>
                        <td className="py-3 font-bold text-slate-800">{log.storageArea}</td>
                        <td className="py-3 text-center font-black">
                          <span className={`px-2 py-0.5 rounded-md ${isTempBad ? 'bg-red-100 text-red-800 animate-pulse' : 'text-slate-800'}`}>
                            {temp.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="py-3 text-center font-black">
                          <span className={`px-2 py-0.5 rounded-md ${isHumBad ? 'bg-amber-100 text-amber-800' : 'text-slate-800'}`}>
                            {hum.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            log.integrityCheck === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.integrityCheck}
                          </span>
                        </td>
                        <td className="py-3 max-w-xs truncate font-medium text-slate-600">
                          {log.correctiveAction ? (
                            <span className="text-red-700 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100 block">
                              {log.correctiveAction}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Normal range — check passed.</span>
                          )}
                        </td>
                        <td className="py-3 pr-2 text-right font-mono font-black text-emerald-800">
                          {log.staffInitials || 'GEM'}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        )}

        {/* TAB 3: Inventory Arrivals and Stock Receipts */}
        {activeSubTab === 'inventory' && (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black">
                <th className="pb-3 pl-2">Receipt Date</th>
                <th className="pb-3">Drug Name</th>
                <th className="pb-3">Batch/Lot Number</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3 text-center">Expiry Date</th>
                <th className="pb-3 text-right">Qty Received</th>
                <th className="pb-3 text-right">Unit Cost</th>
                <th className="pb-3 text-right">Bin Location</th>
                <th className="pb-3 pr-2 text-right">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {inventoryStockLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No manual stock receipts saved in database.
                  </td>
                </tr>
              ) : (
                inventoryStockLogs
                  .filter(log => 
                    log.drugName?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.batchNumber?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.supplier?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[10px] text-slate-400">
                        {log.dateReceived || formatTimestamp(log.createdAt)}
                      </td>
                      <td className="py-3 font-bold text-slate-900">{log.drugName}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-mono font-black text-[10px] rounded border border-emerald-300">
                          {log.batchNumber}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{log.supplier || 'N/A'}</td>
                      <td className="py-3 text-center font-bold text-slate-800">
                        {log.expiryDate}
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        {log.quantityReceived}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-500">
                        ${(log.unitCost || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-600">
                        {log.storageLocation || 'N/A'}
                      </td>
                      <td className="py-3 pr-2 text-right font-medium text-slate-500 max-w-[120px] truncate">
                        {log.receivedBy}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 4: SOP Drug Stock-outs */}
        {activeSubTab === 'stockout' && (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black">
                <th className="pb-3 pl-2">Logged Date</th>
                <th className="pb-3">Medication</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Current Stock</th>
                <th className="pb-3 text-right">Safety Threshold</th>
                <th className="pb-3">Reason for Shortage</th>
                <th className="pb-3 pr-2">Action Taken Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {drugStockOutLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No SOP drug stock-out alerts registered in log.
                  </td>
                </tr>
              ) : (
                drugStockOutLogs
                  .filter(log => 
                    log.drugName?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.reasonForOut?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[10px] text-slate-400">
                        {log.monitoringDate || formatTimestamp(log.createdAt)}
                      </td>
                      <td className="py-3 font-bold text-slate-900">{log.drugName}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          log.status === 'Critical' ? 'bg-red-100 text-red-800' :
                          log.status === 'Depleted' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-rose-600">{log.currentStock}</td>
                      <td className="py-3 text-right font-medium text-slate-500">{log.minThreshold}</td>
                      <td className="py-3 text-slate-600 font-medium">{log.reasonForOut}</td>
                      <td className="py-3 pr-2 font-bold text-emerald-800 bg-emerald-50/50 px-2 rounded-lg">
                        {log.actionTaken}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 5: PO Procurement Delays */}
        {activeSubTab === 'purchased' && (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black">
                <th className="pb-3 pl-2">Logged At</th>
                <th className="pb-3">Purchase Order (PO)</th>
                <th className="pb-3">Item Name</th>
                <th className="pb-3">Vendor</th>
                <th className="pb-3 text-center">Expected Arrival</th>
                <th className="pb-3">Delay Reason</th>
                <th className="pb-3 text-center">Impact</th>
                <th className="pb-3 pr-2">Expedite Comms Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {purchasedStockOutLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No procurement delay tracking entries in database.
                  </td>
                </tr>
              ) : (
                purchasedStockOutLogs
                  .filter(log => 
                    log.itemName?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.purchaseOrder?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.vendorName?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[10px] text-slate-400">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900">{log.purchaseOrder}</td>
                      <td className="py-3 font-bold text-emerald-950">{log.itemName}</td>
                      <td className="py-3 text-slate-600 font-medium">{log.vendorName}</td>
                      <td className="py-3 text-center font-bold text-slate-800">{log.expectedArrival || 'TBD'}</td>
                      <td className="py-3 text-slate-600">{log.delayReason}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          log.impactAssessment === 'High' ? 'bg-red-100 text-red-800' :
                          log.impactAssessment === 'Med' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.impactAssessment}
                        </span>
                      </td>
                      <td className="py-3 pr-2 italic text-slate-500 font-medium">
                        {log.vendorComms || 'No communication logged yet'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 6: Spot Audits & Reconciliation */}
        {activeSubTab === 'audits' && (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black">
                <th className="pb-3 pl-2">Audit Date</th>
                <th className="pb-3">Item Audited</th>
                <th className="pb-3 text-right">System Balance</th>
                <th className="pb-3 text-right">Physical Count</th>
                <th className="pb-3 text-center">Discrepancy</th>
                <th className="pb-3 text-center">Resolution Status</th>
                <th className="pb-3">Auditor Notes / Findings</th>
                <th className="pb-3 pr-2 text-right">Auditor Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {auditoryStockOutLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No spot audit reports registered.
                  </td>
                </tr>
              ) : (
                auditoryStockOutLogs
                  .filter(log => 
                    log.itemScanned?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    log.auditorName?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[10px] text-slate-400">
                        {log.auditDate || formatTimestamp(log.createdAt)}
                      </td>
                      <td className="py-3 font-bold text-slate-900">{log.itemScanned}</td>
                      <td className="py-3 text-right font-medium">{log.systemBalance}</td>
                      <td className="py-3 text-right font-medium text-slate-900">{log.actualCount}</td>
                      <td className="py-3 text-center font-black">
                        <span className={`px-2 py-0.5 rounded-md ${log.discrepancy !== 0 ? 'bg-red-50 text-red-700 font-bold border border-red-100' : 'text-slate-500'}`}>
                          {log.discrepancy > 0 ? `+${log.discrepancy}` : log.discrepancy}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          log.resolutionStatus === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          log.resolutionStatus === 'Escalated' ? 'bg-red-100 text-red-800 animate-pulse' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {log.resolutionStatus}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-600 max-w-xs truncate" title={log.auditNotes}>
                        {log.auditNotes || <span className="text-slate-400">Perfect balance - no notes.</span>}
                      </td>
                      <td className="py-3 pr-2 text-right font-semibold text-slate-500">
                        {log.auditorName}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
