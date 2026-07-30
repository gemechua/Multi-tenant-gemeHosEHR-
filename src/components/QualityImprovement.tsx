import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  CheckSquare, FileSpreadsheet, TrendingUp, Sparkles, CheckCircle2, AlertTriangle, 
  Activity, Plus, Trash2, Filter, Clock, 
  HeartPulse, DollarSign, FlaskConical, Compass, Skull, UserCheck, Warehouse, 
  Coins, FileText, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Download, Eye,
  Pill, Sliders, Search, PackageX, Check, RotateCcw, ShieldAlert
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface QiAudit {
  id: string;
  department: string; // e.g. 'dispensary', 'finance', 'radiology', 'laboratory', 'liaison', 'outpatient', 'inpatient', 'death', 'performance', 'inventory', 'insurance', 'cashiers'
  auditDate: string;
  inspectorName: string;
  complianceScore: number; // 0 to 100
  status: 'Compliant' | 'Partial' | 'Non-Compliant';
  itemsAuditedCount: number;
  criticalIssuesCount: number;
  recommendations: string;
  checklist: { text: string; checked: boolean }[];
  notes?: string;
  hospital_id?: string;
}

export interface MedicationStock {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  minAlertLevel: number;
  dispensedCount: number;
  lastAuditedDate: string;
  status: 'In Stock' | 'Low Stock' | 'Stock Out';
}

export interface DispensationLog {
  id: string;
  prescriptionId: string;
  medicationName: string;
  qtyPrescribed: number;
  qtyDispensed: number;
  patientMrn: string;
  timestamp: string;
  auditStatus: 'Verified' | 'Pending Audit' | 'Discrepancy';
}

const DEPARTMENTS = [
  { id: 'health_service', label: 'Module 3: Health Service IS', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { id: 'quality_improvement', label: 'Module 4: Quality Improvement', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'environmental_health', label: 'Module 5: Environmental Health', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'human_resource', label: 'Module 7: Human Resource Management', icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'facility_equipment', label: 'Module 9: Facility Equipment', icon: Warehouse, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { id: 'bio_medical', label: 'Module 10: Bio Medical', icon: Sliders, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
  { id: 'pharmacy', label: 'Module 11: Pharmacy', icon: Pill, color: 'text-pink-600 bg-pink-50 border-pink-100' },
  { id: 'finance', label: 'Finance Department', icon: DollarSign, color: 'text-teal-600 bg-teal-50 border-teal-100' },
  { id: 'security_guard', label: 'Module 12: Security Guard', icon: ShieldAlert, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { id: 'planning', label: 'Planning Module (Strategic & Operational)', icon: Compass, color: 'text-violet-600 bg-violet-50 border-violet-100' },
  { id: 'register_logbook', label: 'Register Logbook (Editable)', icon: FileSpreadsheet, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
  { id: 'data_explorer', label: 'Data & Explorer', icon: Search, color: 'text-slate-600 bg-slate-50 border-slate-100' },
];

const DEPARTMENT_CHECKLISTS: Record<string, string[]> = {
  health_service: [
    "Diagnostic coding standards are fully verified per ICD-11 guideline.",
    "Clinical service logs reconciled with central health records database.",
    "Primary healthcare reports submitted to national health statistics registry.",
    "Patient referral registries verified and closed out on schedule.",
    "Maternal and child health service parameters matched with standard guidelines."
  ],
  quality_improvement: [
    "Weekly quality audits completed for all active hospital wards.",
    "Incident reports reviewed and corrective action plans assigned.",
    "Compliance scores analyzed for all 12 operational departments.",
    "Continuous improvement projects logged and tracked in the quality ledger.",
    "Audit report logs exported to regional clinical supervisory committee."
  ],
  environmental_health: [
    "Water safety quality tests performed and logged for all patient care areas.",
    "Hazardous chemical inventories and disposal sheets certified.",
    "Hospital waste classification and segregation protocols validated.",
    "Sanitation inspections of patient catering facilities certified.",
    "Air quality and ventilation metrics verified in negative pressure suites."
  ],
  human_resource: [
    "Staff licensing and professional practice credentials validated.",
    "On-duty shift registry reconciled with daily attendance logs.",
    "Employee files fully audited for mandatory safety training compliance.",
    "Performance evaluations completed and signed off by department heads.",
    "Leave and sick records verified against active floor schedules."
  ],
  facility_equipment: [
    "Backup electrical generators inspected and load-tested.",
    "Water storage tank capacity and pressure levels verified.",
    "Facility heating, ventilation, and HVAC systems checked.",
    "Fire detection systems and emergency extinguisher logs updated.",
    "Infrastructure maintenance and repair requests cataloged and routed."
  ],
  bio_medical: [
    "Patient monitoring systems calibrated and certified safe for use.",
    "Defibrillators and resuscitation carts functionally inspected.",
    "Anesthesia machines and oxygen delivery pipelines pressure-tested.",
    "Biomedical equipment preventive maintenance logs updated.",
    "Sterilization autoclaves temperature and pressure indicators verified."
  ],
  pharmacy: [
    "Pharmaceutical cold-chain refrigeration temperatures monitored.",
    "Controlled substance inventory registers verified and signed.",
    "Prescription dispensing labels matched with clinical provider orders.",
    "Near-expiry drug inventories flagged for prompt return or usage.",
    "Drug recall alerts cross-referenced with current store catalogs."
  ],
  finance: [
    "Daily patient billing cash collections reconciled with bank deposits.",
    "Accounts payable invoices matched with authorized purchase sheets.",
    "Insurance claim reimbursement forms verified for submission.",
    "Departmental budgets and variance limits verified within 5%.",
    "Financial audits conducted for institutional ledger integrity."
  ],
  security_guard: [
    "Security guard roster and active patrol shifts verified.",
    "Visitor entry registries and security badges accounted for.",
    "CCTV camera networks and alarm panels verified functional.",
    "Incident reports and physical asset protection logs completed.",
    "Emergency response drills performed and response times logged."
  ],
  planning: [
    "Strategic development goals for the current fiscal cycle audited.",
    "Departmental performance targets set and compared to baseline.",
    "Annual hospital operational plan approved by board of directors.",
    "Capital expenditure projections aligned with infrastructure plans.",
    "Community health needs assessment reports cataloged."
  ],
  register_logbook: [
    "Inpatient and outpatient register entries completely logged.",
    "Logbook fields showing no missing mandatory patient fields.",
    "Audit trail on modified log records verified by supervisor.",
    "Discharge and transfer register logs reconciled.",
    "Emergency department register volumes verified for accuracy."
  ],
  data_explorer: [
    "Data search latency and query performance metrics verified.",
    "Patient record filters showing correct operational indexes.",
    "Patient clinical summaries exported to authorized systems.",
    "Analytical trends charts matching physical register stats.",
    "Exported clinical data checked for strict patient anonymity."
  ]
};

const RANDOM_INSPECTORS = ["Dr. Helen Kassa", "Dir. Mark Addis", "Audit Head Thomas", "QA Lead Martha", "Dr. Yohannes Alula"];

export default function QualityImprovement() {
  const [activeDept, setActiveDept] = useState('pharmacy');
  const [audits, setAudits] = useState<QiAudit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  // Form states
  const [newInspector, setNewInspector] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newScore, setNewScore] = useState(90);
  const [customChecklist, setCustomChecklist] = useState<{ text: string; checked: boolean }[]>([]);

  // Dispensary custom system states
  const [dispensaryMeds, setDispensaryMeds] = useState<MedicationStock[]>([]);
  const [dispensations, setDispensations] = useState<DispensationLog[]>([]);

  const [medFilter, setMedFilter] = useState('');
  const [dispensaryFeedback, setDispensaryFeedback] = useState<{ type: 'success' | 'warning' | 'error', text: string } | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('dispensary_meds', JSON.stringify(dispensaryMeds));
  }, [dispensaryMeds]);

  useEffect(() => {
    localStorage.setItem('dispensary_dispensations', JSON.stringify(dispensations));
  }, [dispensations]);

  const activeTenantId = localStorage.getItem('active_hospital_tenant') || 'demo-global';

  // Load Audits from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'qi_audits'), (snapshot) => {
      const docsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QiAudit[];
      
      // Filter by hospital if needed
      const filtered = docsList.filter(a => !a.hospital_id || a.hospital_id === activeTenantId);
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime());
      setAudits(filtered);
    }, (error) => {
      console.warn("Firestore subscription error for QI audits:", error);
    });

    return unsubscribe;
  }, [activeTenantId]);

  // Set checklist items when department changes or modal opens
  useEffect(() => {
    const defaultChecks = DEPARTMENT_CHECKLISTS[activeDept] || [];
    setCustomChecklist(defaultChecks.map(text => ({ text, checked: true })));
    setShowOnlyAlerts(false);
  }, [activeDept]);

  // Handle auto-generation of 12 audits (one for each department)
  const handleAutoGenerateAudits = async () => {
    setIsGenerating(true);
    try {
      // Clear or seed new ones
      for (const dept of DEPARTMENTS) {
        const checks = DEPARTMENT_CHECKLISTS[dept.id] || [];
        const score = Math.floor(Math.random() * 30) + 71; // 71 - 100
        const checkedItems = checks.map((text, idx) => ({
          text,
          checked: idx === 0 ? true : Math.random() > 0.15 // mostly true
        }));
        
        const passedCount = checkedItems.filter(c => c.checked).length;
        const calculatedScore = Math.round((passedCount / checks.length) * 100);
        const status = calculatedScore >= 90 ? 'Compliant' : calculatedScore >= 75 ? 'Partial' : 'Non-Compliant';
        const criticalIssuesCount = checks.length - passedCount;

        const dateOffset = Math.floor(Math.random() * 10);
        const auditDate = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString();

        await addDoc(collection(db, 'qi_audits'), {
          department: dept.id,
          auditDate,
          inspectorName: RANDOM_INSPECTORS[Math.floor(Math.random() * RANDOM_INSPECTORS.length)],
          complianceScore: calculatedScore,
          status,
          itemsAuditedCount: checks.length,
          criticalIssuesCount,
          checklist: checkedItems,
          recommendations: criticalIssuesCount > 0 
            ? `Immediate team sign-off and correction required for ${criticalIssuesCount} outstanding safety items.`
            : "Continue routine diagnostic vigilance. Excellent operational conformity detected.",
          notes: `Automatic clinical evaluation generated on day sequence ${dateOffset}. Zero tolerance for workflow omissions.`,
          hospital_id: activeTenantId
        });
      }
    } catch (err) {
      console.error("Failed to auto generate audits:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Create custom audit
  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspector.trim()) {
      alert("Please specify inspector name.");
      return;
    }

    try {
      const totalChecks = customChecklist.length;
      const passedCount = customChecklist.filter(c => c.checked).length;
      const finalScore = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;
      const status = finalScore >= 90 ? 'Compliant' : finalScore >= 75 ? 'Partial' : 'Non-Compliant';
      const criticalIssuesCount = totalChecks - passedCount;

      await addDoc(collection(db, 'qi_audits'), {
        department: activeDept,
        auditDate: new Date().toISOString(),
        inspectorName: newInspector.trim(),
        complianceScore: finalScore,
        status,
        itemsAuditedCount: totalChecks,
        criticalIssuesCount,
        checklist: customChecklist,
        recommendations: criticalIssuesCount > 0
          ? `Corrective training and clinical monitoring ordered for failed audit indicators.`
          : `All parameters verified in full compliance with hospital bylaws.`,
        notes: newNotes.trim() || 'Manual clinical audit record logged.',
        hospital_id: activeTenantId
      });

      setIsModalOpen(false);
      setNewInspector('');
      setNewNotes('');
    } catch (err) {
      console.error("Failed to create manual audit:", err);
    }
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this quality improvement audit entry?")) return;
    try {
      await deleteDoc(doc(db, 'qi_audits', id));
    } catch (err) {
      console.error("Error deleting audit:", err);
    }
  };

  const handleExportAuditData = () => {
    if (activeDeptAudits.length === 0) {
      alert("No audits available to export for the current view.");
      return;
    }

    // Generate CSV content
    const headers = [
      "ID",
      "Department",
      "Audit Date",
      "Inspector Name",
      "Compliance Score (%)",
      "Status",
      "Items Audited Count",
      "Critical Issues Count",
      "Recommendations",
      "Notes"
    ];

    const rows = activeDeptAudits.map(audit => [
      audit.id,
      DEPARTMENTS.find(d => d.id === audit.department)?.label || audit.department,
      new Date(audit.auditDate).toLocaleString(),
      `"${audit.inspectorName.replace(/"/g, '""')}"`,
      audit.complianceScore,
      audit.status,
      audit.itemsAuditedCount,
      audit.criticalIssuesCount,
      `"${(audit.recommendations || "").replace(/"/g, '""')}"`,
      `"${(audit.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const deptFileName = selectedDeptMeta.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    link.setAttribute("download", `audit_report_${deptFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDFReport = () => {
    if (activeDeptAudits.length === 0) {
      alert("No audits available to export for the current view.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Header Banner
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 0, 210, 40, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text("QUALITY AUDIT & COMPLIANCE REPORT", 14, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Department: ${selectedDeptMeta?.label || activeDept}`, 14, 26);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
      
      // Summary Block
      doc.setTextColor(31, 41, 55); // gray-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("Executive Audit Summary", 14, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Recorded Audits: ${activeDeptAudits.length}`, 14, 62);
      doc.text(`Average Compliance Score: ${avgCompliance}%`, 14, 68);
      const criticalCount = activeDeptAudits.filter(a => a.status === 'Non-Compliant').length;
      doc.text(`Critical Non-Compliant Items: ${criticalCount}`, 14, 74);
      
      // Section title for inspection records
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("Inspection History Logs", 14, 90);
      
      // Table data
      const headers = [["Date", "Inspector", "Score", "Status", "Critical Issues"]];
      const body = activeDeptAudits.map(audit => [
        new Date(audit.auditDate).toLocaleDateString(),
        audit.inspectorName,
        `${audit.complianceScore}%`,
        audit.status,
        audit.criticalIssuesCount.toString()
      ]);
      
      (doc as any).autoTable({
        startY: 96,
        head: headers,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          2: { fontStyle: 'bold' },
          3: { fontStyle: 'bold' }
        }
      });
      
      const deptFileName = (selectedDeptMeta?.label || activeDept).toLowerCase().replace(/[^a-z0-9]+/g, "_");
      doc.save(`quality_audit_report_${deptFileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to export PDF report. Falling back to CSV export.");
      handleExportAuditData();
    }
  };

  // Toggle checklist checkbox in custom form
  const handleToggleCheck = (index: number) => {
    setCustomChecklist(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, checked: !item.checked };
      }
      return item;
    }));
  };

  // Calculate high-level stats
  const activeDeptAudits = audits.filter(a => a.department === activeDept);
  const displayedAudits = showOnlyAlerts 
    ? activeDeptAudits.filter(a => a.status === 'Non-Compliant') 
    : activeDeptAudits;

  const avgCompliance = activeDeptAudits.length > 0 
    ? Math.round(activeDeptAudits.reduce((acc, curr) => acc + curr.complianceScore, 0) / activeDeptAudits.length) 
    : 0;

  const totalAuditsAllDepts = audits.length;
  const criticalAlertsAllDepts = audits.filter(a => a.status === 'Non-Compliant').length;

  // Prepare chart data for compliance score history (all depts and selected dept)
  const chartData = activeDeptAudits
    .map(a => ({
      date: new Date(a.auditDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: a.complianceScore,
      issues: a.criticalIssuesCount,
      inspector: a.inspectorName,
      notes: a.notes || 'No notes compiled'
    }))
    .reverse();

  // Pie chart of compliance levels across all logged audits
  const compliantCount = audits.filter(a => a.status === 'Compliant').length;
  const partialCount = audits.filter(a => a.status === 'Partial').length;
  const nonCompliantCount = audits.filter(a => a.status === 'Non-Compliant').length;

  const pieData = [
    { name: 'Compliant (90%+)', value: compliantCount || 0, color: '#10b981' },
    { name: 'Partial (75%-89%)', value: partialCount || 0, color: '#f59e0b' },
    { name: 'Non-Compliant (<75%)', value: nonCompliantCount || 0, color: '#ef4444' }
  ].filter(p => p.value > 0);

  const selectedDeptMeta = DEPARTMENTS.find(d => d.id === activeDept) || DEPARTMENTS[0];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Audits Processed</span>
            <span className="text-2xl font-extrabold text-gray-950 font-mono">{totalAuditsAllDepts}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-indigo-600">
            <FileSpreadsheet size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Avg Department Score</span>
            <span className={`text-2xl font-extrabold font-mono ${avgCompliance >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {avgCompliance}%
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${avgCompliance >= 90 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Non-Compliant Alerts</span>
            <span className={`text-2xl font-extrabold font-mono ${criticalAlertsAllDepts > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {criticalAlertsAllDepts}
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${criticalAlertsAllDepts > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex flex-col justify-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>Manual Department Audit</span>
          </button>
        </div>

      </div>

      {/* Main Grid: left navigation tabs, right details & charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation grid for departments */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-xs border border-gray-150 p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} className="text-indigo-600" />
              <span>Audit Departments ({DEPARTMENTS.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {DEPARTMENTS.map((dept) => {
              const IconComp = dept.icon;
              const deptAudits = audits.filter(a => a.department === dept.id);
              const deptAvg = deptAudits.length > 0 
                ? Math.round(deptAudits.reduce((acc, curr) => acc + curr.complianceScore, 0) / deptAudits.length) 
                : null;
              const isSelected = activeDept === dept.id;

              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDept(dept.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' 
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-md border ${dept.color}`}>
                      <IconComp size={14} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 truncate">{dept.label}</span>
                  </div>
                  {deptAvg !== null && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${
                      deptAvg >= 90 ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' :
                      deptAvg >= 75 ? 'bg-amber-50 border border-amber-150 text-amber-700' :
                      'bg-rose-50 border border-rose-150 text-rose-700'
                    }`}>
                      {deptAvg}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audit charts and metrics container */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Department Overview & Line Chart */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg border ${selectedDeptMeta.color}`}>
                    <selectedDeptMeta.icon size={18} />
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-950">{selectedDeptMeta.label} Quality Dashboard</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active parameters and compliance score indicators derived from {activeDeptAudits.length} recorded inspections.
                </p>
              </div>

              {avgCompliance > 0 && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historical Average</div>
                  <div className={`text-2xl font-black font-mono ${avgCompliance >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {avgCompliance}%
                  </div>
                </div>
              )}
            </div>

            {chartData.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Historical Compliance Trend</div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Compliance Score (%)" 
                        stroke="#4f46e5" 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 1, fill: '#fff' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500 italic">
                No active audit history for this department. Use the trigger above to automatically generate high-fidelity history or register a manual clinical audit.
              </div>
            )}
          </div>

          {/* Table of specific department audits */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" />
                  <span>Inspection History Logs ({activeDeptAudits.length})</span>
                </h3>
                {activeDeptAudits.filter(a => a.status === 'Non-Compliant').length > 0 && (
                  <button
                    onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer border ${
                      showOnlyAlerts 
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs animate-pulse' 
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-150'
                    }`}
                    title={showOnlyAlerts ? "Click to view all audit entries" : "Click to view non-compliant audit alerts only"}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                    </span>
                    <span>{activeDeptAudits.filter(a => a.status === 'Non-Compliant').length} ALERTS ACTIVE {showOnlyAlerts ? "(FILTERED)" : ""}</span>
                  </button>
                )}
              </div>
              
              {activeDeptAudits.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportAuditData}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Export current filtered view audits to CSV formatted report"
                  >
                    <Download size={12} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleExportPDFReport}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Export beautiful PDF Audit and Compliance summary report"
                  >
                    <FileText size={12} />
                    <span>Export Formatted PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Real-time alert banner for non-compliant audits in the active view */}
            {activeDeptAudits.some(a => a.status === 'Non-Compliant') && (
              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 shrink-0">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">Non-Compliant Audits Detected</h4>
                    <p className="text-[10px] text-rose-700">Immediate corrective actions are required for low-scoring inspections below.</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-rose-600 text-white font-mono font-black text-[9px] rounded-full">
                  {activeDeptAudits.filter(a => a.status === 'Non-Compliant').length} ALERT(S)
                </span>
              </div>
            )}

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Auditor / Inspector</th>
                    <th className="px-4 py-2.5 text-center">Indicators Check</th>
                    <th className="px-4 py-2.5">Score</th>
                    <th className="px-4 py-2.5">Conformity</th>
                    <th className="px-4 py-2.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {displayedAudits.length > 0 ? (
                    displayedAudits.map((audit) => {
                      const isExpanded = expandedAuditId === audit.id;
                      const checksPassed = audit.checklist ? audit.checklist.filter(c => c.checked).length : 0;
                      const checksTotal = audit.checklist ? audit.checklist.length : 0;
                      const isNonCompliant = audit.status === 'Non-Compliant';

                      return (
                        <React.Fragment key={audit.id}>
                          <tr 
                            onClick={() => setExpandedAuditId(isExpanded ? null : audit.id)}
                            className={`hover:bg-rose-100/20 transition-all cursor-pointer ${
                              isNonCompliant ? 'bg-rose-50/70 border-l-4 border-l-rose-500 font-semibold' : ''
                            }`}
                          >
                            <td className={`px-4 py-3 font-mono flex items-center gap-1.5 ${isNonCompliant ? 'text-rose-700 font-extrabold' : 'text-gray-600'}`}>
                              {isNonCompliant && (
                                <span className="flex h-2 w-2 relative shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                                </span>
                              )}
                              <span>{new Date(audit.auditDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-950">
                              {audit.inspectorName}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-500">
                              {checksPassed} / {checksTotal}
                            </td>
                            <td className={`px-4 py-3 font-mono font-bold ${isNonCompliant ? 'text-rose-600 text-sm' : 'text-gray-900'}`}>
                              {audit.complianceScore}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  audit.status === 'Compliant' ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' :
                                  audit.status === 'Partial' ? 'bg-amber-50 border border-amber-150 text-amber-700' :
                                  'bg-rose-50 border border-rose-150 text-rose-700 animate-pulse'
                                }`}>
                                  {isNonCompliant && (
                                    <span className="flex h-1.5 w-1.5 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                                    </span>
                                  )}
                                  <span>{audit.status}</span>
                                </span>
                                
                                {isNonCompliant && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded border border-rose-200 animate-pulse">
                                    <ShieldAlert size={10} className="text-rose-600 shrink-0 animate-bounce" />
                                    <span>CRITICAL LIMIT 🚨</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => handleDeleteAudit(audit.id, e)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded details container showing checklists */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-gray-50/50 p-4 border-t border-b border-gray-100">
                                <div className="space-y-3 text-xs">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <span className="font-extrabold text-gray-700 block text-[10px] uppercase">Notes & Clinical Insights</span>
                                      <p className="text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-150 text-[11px] font-medium">
                                        {audit.notes || 'No notes compiled.'}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-extrabold text-gray-700 block text-[10px] uppercase">Actionable Recommendations</span>
                                      <p className="text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-150 text-[11px] font-medium">
                                        {audit.recommendations || 'No recommendations documented.'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="font-extrabold text-gray-700 block text-[10px] uppercase">Indicators checklist Status</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-gray-150">
                                      {audit.checklist && audit.checklist.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-[11px] font-medium text-gray-700">
                                          {item.checked ? (
                                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                          ) : (
                                            <AlertTriangle size={14} className="text-rose-500 shrink-0 animate-pulse" />
                                          )}
                                          <span className={item.checked ? '' : 'text-rose-700 line-through decoration-rose-200'}>
                                            {item.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                        No inspections recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>



          {/* Compliance Levels across entire facility (doughnut breakdown) */}
          {totalAuditsAllDepts > 0 && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4 space-y-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Facility Compliance Distribution</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Consolidated compliance status for all departments. Active directives prioritize resolving non-compliant areas immediately.
                </p>
              </div>

              <div className="md:col-span-4 h-32 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-4 space-y-2">
                {pieData.map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="text-gray-700">{data.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">{data.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Manual Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={18} />
                <span>Log Manual {selectedDeptMeta.label} Audit</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Inspector Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Martha Addis"
                    value={newInspector}
                    onChange={(e) => setNewInspector(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Audit Department
                  </label>
                  <select
                    value={activeDept}
                    onChange={(e) => setActiveDept(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist inputs */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Checklist Indicators Verification (Toggle to verify compliance)
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-150 rounded-lg p-3 bg-gray-50/50">
                  {customChecklist.map((item, idx) => (
                    <label 
                      key={idx} 
                      className="flex items-start gap-2.5 p-1.5 hover:bg-white rounded transition-colors cursor-pointer text-[11px] font-medium text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleCheck(idx)}
                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Audit Notes & Findings
                </label>
                <textarea
                  placeholder="Incorporate findings, clinical deviations, or procedural context..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Confirm & Save Audit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
