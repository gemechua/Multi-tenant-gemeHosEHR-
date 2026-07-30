import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, AlertTriangle, Download, Clock, User, DownloadCloud } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PayrollManagementProps {
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

interface PendingApproval {
  id: string;
  staffName: string;
  role: string;
  type: 'Salary' | 'Overtime';
  baseAmount: number;
  proposedAmount: number;
  submittedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

const COLORS = ['#10b981', '#f59e0b', '#e11d48'];

export default function PayrollManagement({ addToast }: PayrollManagementProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([
    { id: '1', staffName: 'Dr. Sarah Chen', role: 'Surgeon', type: 'Overtime', baseAmount: 0, proposedAmount: 850, submittedAt: '2026-07-16 09:30' },
    { id: '2', staffName: 'Nurse John Davis', role: 'ICU Nurse', type: 'Salary', baseAmount: 4000, proposedAmount: 4600, submittedAt: '2026-07-15 14:20' }, // > 10% increase
    { id: '3', staffName: 'Tech Emily Wong', role: 'Lab Technician', type: 'Overtime', baseAmount: 0, proposedAmount: 120, submittedAt: '2026-07-16 11:15' },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'a1', action: 'Approved Overtime', user: 'Admin User', timestamp: '2026-07-16 08:45', details: 'Approved $300 overtime for Michael Chang' },
    { id: 'a2', action: 'Salary Adjusted', user: 'HR Manager', timestamp: '2026-07-15 16:30', details: 'Base salary adjusted from $5000 to $5200 for Dr. Alan Grant' },
  ]);

  const chartData = [
    { name: 'Verified Paid', value: 85000 },
    { name: 'Pending Review', value: 12400 },
  ];

  const handleApprove = (id: string, name: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
    addToast('success', `Approved payment for ${name}`);
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action: 'Approved Request',
      user: 'Current User',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details: `Approved pending request for ${name}`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleReject = (id: string, name: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
    addToast('info', `Rejected payment for ${name}`);
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action: 'Rejected Request',
      user: 'Current User',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details: `Rejected pending request for ${name}`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const simulateNewOvertime = () => {
    const newReq: PendingApproval = {
      id: Date.now().toString(),
      staffName: 'Dr. Emily Rose',
      role: 'Physician',
      type: 'Overtime',
      baseAmount: 0,
      proposedAmount: 450,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setApprovals([newReq, ...approvals]);
    addToast('info', 'New overtime request submitted by Dr. Emily Rose');
  };

  const downloadPayStub = (name: string) => {
    addToast('success', `Generating PDF Pay Stub for ${name}...`);
  };

  const exportSummary = (format: 'CSV' | 'PDF') => {
    addToast('success', `Exporting verified vs pending summary as ${format}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payroll & Overtime Management</h3>
          <p className="text-xs text-slate-500">Manage staff compensation, approve overtime, and generate pay stubs.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={simulateNewOvertime} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold rounded-lg transition-colors">
            Simulate Overtime Request
          </button>
          <button onClick={() => exportSummary('CSV')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
            <DownloadCloud size={14} /> Export CSV
          </button>
          <button onClick={() => exportSummary('PDF')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              Pending Approvals ({approvals.length})
            </h4>
            
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No pending approvals.</div>
            ) : (
              <div className="space-y-3">
                {approvals.map(req => {
                  const percentIncrease = req.baseAmount > 0 ? ((req.proposedAmount - req.baseAmount) / req.baseAmount) * 100 : 0;
                  const needsReview = percentIncrease > 10 || req.proposedAmount > 1000;

                  return (
                    <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {req.staffName} 
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{req.type}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{req.role} • Submitted: {req.submittedAt}</div>
                        
                        <div className="mt-2 flex items-center gap-4">
                          <span className="font-black text-indigo-600 dark:text-indigo-400">
                            ${req.proposedAmount.toLocaleString()}
                          </span>
                          {req.baseAmount > 0 && (
                            <span className="text-xs text-slate-400 line-through">
                              ${req.baseAmount.toLocaleString()} base
                            </span>
                          )}
                          {needsReview && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              <AlertTriangle size={12} /> High Adjustment (Secondary Review Needed)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(req.id, req.staffName)} className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors" title="Approve">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => handleReject(req.id, req.staffName)} className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-indigo-600" />
              Staff Pay Stubs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Dr. Sarah Chen', 'Nurse John Davis', 'Tech Emily Wong', 'Admin Sarah Connor'].map(name => (
                <div key={name} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
                  <button onClick={() => downloadPayStub(name)} className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-1.5 rounded transition-colors">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts and Audit Logs */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 h-64 flex flex-col">
            <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">Current Fiscal Month Ratio</h4>
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-[-10px]">
                <div className="text-center">
                  <div className="text-xl font-black text-slate-800 dark:text-white">87%</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Verified</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Payroll Auditing</h4>
            <div className="space-y-4">
              {auditLogs.map(log => (
                <div key={log.id} className="relative pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                  <div className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800"></div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.action}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{log.user} • {log.timestamp}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
