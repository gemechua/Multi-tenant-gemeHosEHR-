import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Printer, Download, Save, RefreshCw, 
  FileSpreadsheet, Check, Info, FileText, ArrowLeft, Table, ChevronDown, Building
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logSecurityEvent } from '../lib/auditLogger';

export interface OpdRegisterRow {
  id: string;
  sNo: string; // (1)
  serviceDate: string; // (2)
  mrn: string; // (3)
  age: string; // (4)
  sex: 'M' | 'F' | ''; // (5)
  address: string; // (6)
  icd11DiagnosisName: string; // (7) Name
  icd11DiagnosisCode: string; // (7) Code
  isNew: boolean; // (8)
  isRepeat: boolean; // (9)
  roadTrafficAccident: '' | '1' | '2' | '3'; // (10)
  hivTestOffered: boolean; // (11)
  hivTestPerformed: boolean; // (12)
  targetedPopulationCategory: string; // (13)
  hivTestResult: '' | 'P' | 'N'; // (14)
  travelHistoryMalaria: boolean; // (15)
  screenedForTB: boolean; // (16)
  tbScreeningResult: '' | 'P' | 'N'; // (17)
  typeOfDiagnosticEval: '' | '1' | '2' | '3' | '4' | '5' | '6'; // (18)
  resultOfTbScreening: '' | 'TB' | 'No TB' | 'ND'; // (19)
  referredTo: '' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'; // (20)
  died: boolean; // (21)
  deathNotified: boolean; // (22)
  remark: string; // (23)
}

export interface OpdRegisterMetadata {
  region: string;
  zoneSubcityWoreda: string;
  healthFacilityName: string;
  beginDate: string;
  endDate: string;
}

interface OpdRegisterTableProps {
  hospital_id: string;
  staffName: string;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onBackToLogbook?: () => void;
}

export default function OpdRegisterTable({ hospital_id, staffName, addToast, onBackToLogbook }: OpdRegisterTableProps) {
  const [metadata, setMetadata] = useState<OpdRegisterMetadata>({
    region: '',
    zoneSubcityWoreda: '',
    healthFacilityName: hospital_id || 'OPD Clinic',
    beginDate: '',
    endDate: ''
  });

  const [rows, setRows] = useState<OpdRegisterRow[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Load table from Firestore on mount
  useEffect(() => {
    async function loadTable() {
      setIsFetching(true);
      try {
        const docRef = doc(db, 'opd_register_tables', hospital_id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.metadata) setMetadata(data.metadata);
          if (Array.isArray(data.rows)) setRows(data.rows);
        }
      } catch (err) {
        console.warn('Could not fetch OPD register table:', err);
      } finally {
        setIsFetching(false);
      }
    }
    loadTable();
  }, [hospital_id]);

  // Handle Save
  const handleSaveTable = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'opd_register_tables', hospital_id);
      await setDoc(docRef, {
        metadata,
        rows,
        updatedBy: staffName,
        updatedAt: serverTimestamp()
      });

      await logSecurityEvent('OPD_REGISTER_TABLE_SAVED', '/register-logbook/opd-template', `Saved ${rows.length} OPD register rows for hospital ${hospital_id}`);

      addToast?.('success', 'OPD Register Table template saved to database!');
    } catch (err: any) {
      console.error('Failed to save OPD table:', err);
      addToast?.('error', err?.message || 'Failed to save table.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cell Change Handler
  const handleCellChange = (index: number, field: keyof OpdRegisterRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Add New Row
  const handleAddRow = () => {
    const nextSNo = (rows.length + 1).toString();
    const newRow: OpdRegisterRow = {
      id: `opd-row-${Date.now()}`,
      sNo: nextSNo,
      serviceDate: '',
      mrn: '',
      age: '',
      sex: '',
      address: '',
      icd11DiagnosisName: '',
      icd11DiagnosisCode: '',
      isNew: true,
      isRepeat: false,
      roadTrafficAccident: '',
      hivTestOffered: false,
      hivTestPerformed: false,
      targetedPopulationCategory: '',
      hivTestResult: '',
      travelHistoryMalaria: false,
      screenedForTB: false,
      tbScreeningResult: '',
      typeOfDiagnosticEval: '',
      resultOfTbScreening: '',
      referredTo: '',
      died: false,
      deathNotified: false,
      remark: ''
    };
    setRows(prev => [...prev, newRow]);
  };

  // Remove Row
  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Clear All Rows
  const handleClearAllRows = async () => {
    if (rows.length === 0) {
      addToast?.('info', 'There are no records in the table to delete.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete all ${rows.length} records from this OPD Abstract Register table?`)) {
      setRows([]);
      addToast?.('info', 'All records cleared from table. Click "Save Table" to persist changes.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'S/No', 'Service Date', 'MRN', 'Age', 'Sex', 'Address (Woreda/Kebele)',
      'ESV-ICD11 Diagnosis Name', 'ESV-ICD11 Diagnosis Code', 'New', 'Repeat',
      'Road Traffic Accident Code', 'HIV Test Offered', 'HIV Test Performed',
      'Targeted Population Category', 'HIV Test Result', 'Travel History Malaria',
      'Screened for TB', 'TB Screening Result', 'Type Diagnostic Eval',
      'Result TB Screening', 'Referred To Code', 'Died', 'Death Notified', 'Remark'
    ];

    const csvLines = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.sNo}"`, `"${r.serviceDate}"`, `"${r.mrn}"`, `"${r.age}"`, `"${r.sex}"`, `"${r.address}"`,
        `"${r.icd11DiagnosisName}"`, `"${r.icd11DiagnosisCode}"`, `"${r.isNew ? '√' : ''}"`, `"${r.isRepeat ? '√' : ''}"`,
        `"${r.roadTrafficAccident}"`, `"${r.hivTestOffered ? '√' : ''}"`, `"${r.hivTestPerformed ? '√' : ''}"`,
        `"${r.targetedPopulationCategory}"`, `"${r.hivTestResult}"`, `"${r.travelHistoryMalaria ? '√' : ''}"`,
        `"${r.screenedForTB ? '√' : ''}"`, `"${r.tbScreeningResult}"`, `"${r.typeOfDiagnosticEval}"`,
        `"${r.resultOfTbScreening}"`, `"${r.referredTo}"`, `"${r.died ? '√' : ''}"`, `"${r.deathNotified ? '√' : ''}"`,
        `"${r.remark}"`
      ].join(','))
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OPD_Register_Abstract_${hospital_id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute summary counts
  const pedestrianCount = rows.filter(r => r.roadTrafficAccident === '1').length;
  const motorcyclistCount = rows.filter(r => r.roadTrafficAccident === '2').length;
  const vehicleOccupantCount = rows.filter(r => r.roadTrafficAccident === '3').length;
  const travelHistoryCount = rows.filter(r => r.travelHistoryMalaria).length;
  const deathCount = rows.filter(r => r.died).length;

  return (
    <div className="space-y-6 bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:bg-white print:p-0 print:border-none">
      
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          {onBackToLogbook && (
            <button
              onClick={onBackToLogbook}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Back to Register Logbook List"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-600/20">
                Official OPD Standard
              </span>
              <span className="text-slate-500 text-xs font-mono">OPD Abstract Register</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Health Center / Clinic / Hospital Out Patient Department Register
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Editable digital OPD Abstract Register (23-Column Standard format).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddRow}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Row</span>
          </button>

          <button
            onClick={handleSaveTable}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Save Table</span>
          </button>

          <button
            onClick={handleClearAllRows}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-900/50"
            title="Delete all records in this table"
          >
            <Trash2 size={15} />
            <span>Delete All Records</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Export Table to CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Print OPD Register"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE FRONT PAGE / LOGBOOK METADATA BANNER */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:shadow-none print:border-slate-400">
        
        {/* Official Symbol Header */}
        <div className="text-center border-b pb-6 mb-6 border-slate-200 dark:border-slate-800">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-2xl border border-blue-600/20 shadow-inner">
              <Building size={26} />
            </div>
          </div>
          <div className="inline-block bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[11px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-2">
            OFFICIAL OPD STANDARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Health Center / Clinic / Hospital OPD Abstract Register
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
            Outpatient Department (OPD) Standard Abstract Register
          </p>
        </div>

        {/* Editable Front Page Header Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">Region</label>
            <input
              type="text"
              value={metadata.region}
              onChange={(e) => setMetadata({ ...metadata, region: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg text-slate-900 dark:text-slate-100 font-semibold text-xs focus:border-blue-600 outline-none transition-all"
              placeholder="e.g. Region"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">Zone / Subcity / Woreda</label>
            <input
              type="text"
              value={metadata.zoneSubcityWoreda}
              onChange={(e) => setMetadata({ ...metadata, zoneSubcityWoreda: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg text-slate-900 dark:text-slate-100 font-semibold text-xs focus:border-blue-600 outline-none transition-all"
              placeholder="Zone / Woreda"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">Health Facility Name</label>
            <input
              type="text"
              value={metadata.healthFacilityName}
              onChange={(e) => setMetadata({ ...metadata, healthFacilityName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg text-slate-900 dark:text-slate-100 font-semibold text-xs focus:border-blue-600 outline-none transition-all"
              placeholder="Facility Name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">Begin Date</label>
            <input
              type="text"
              value={metadata.beginDate}
              onChange={(e) => setMetadata({ ...metadata, beginDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg text-slate-900 dark:text-slate-100 font-semibold text-xs focus:border-blue-600 outline-none transition-all"
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">End Date</label>
            <input
              type="text"
              value={metadata.endDate}
              onChange={(e) => setMetadata({ ...metadata, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg text-slate-900 dark:text-slate-100 font-semibold text-xs focus:border-blue-600 outline-none transition-all"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>
      </div>

      {/* EDITABLE 23-COLUMN OPD ABSTRACT REGISTER MATRIX */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-slate-900">
        
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-[11px] text-slate-800 dark:text-slate-200 min-w-[1900px]">
            <thead>
              {/* Main Super Headers */}
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-extrabold border-b border-slate-300 dark:border-slate-700 text-center uppercase tracking-tight">
                <th colSpan={6} className="p-2 border-r border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800">
                  Identification
                </th>
                <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300">
                  Diagnosis
                </th>
                <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                  Provider Initiated HIV Counseling & Testing (PIHCT)
                </th>
                <th colSpan={1} className="p-2 border-r border-slate-300 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                  Malaria
                </th>
                <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">
                  TB Screening & Investigation
                </th>
                <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300">
                  Referral & Status
                </th>
                <th colSpan={1} className="p-2 print:hidden bg-slate-200 dark:bg-slate-800">
                  Actions
                </th>
              </tr>

              {/* Sub Column Headers */}
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 text-center">
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-12">S/No<br/>(1)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-24">Service Date<br/>(DD/MM/YY)<br/>(2)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-28">MRN<br/>(3)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-14">Age<br/>(4)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-14">Sex<br/>(M/F)<br/>(5)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-36">Address<br/>(Woreda/Kebele)<br/>(6)</th>

                {/* Diagnosis */}
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 min-w-[220px]">
                  "ESV-ICD 11 Diagnosis"<br/>
                  <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400 block leading-tight my-0.5">(if patient admitted, do not write diagnosis, write admitted)</span>
                  (7) [Name & Code]
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-12">New<br/>(√)<br/>(8)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-12">Repeat<br/>(√)<br/>(9)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-28">
                  Road Traffic Accident<br/>(1=Ped, 2=Motor, 3=Vehicle)<br/>(10)
                </th>

                {/* PIHCT */}
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-14">HIV Offered<br/>(√)<br/>(11)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-14">HIV Perf.<br/>(√)<br/>(12)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-20">Target Pop.<br/>(Code A-I)<br/>(13)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-16">HIV Result<br/>(P/N)<br/>(14)</th>

                {/* Malaria */}
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-24">Travel Malarious Area<br/>(√)<br/>(15)</th>

                {/* TB */}
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-16">TB Screened<br/>(√)<br/>(16)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-16">TB Result<br/>(P/N)<br/>(17)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-24">Diagnostic Eval.<br/>(Code 1-6)<br/>(18)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-24">TB Screening Result<br/>(TB/No TB/ND)<br/>(19)</th>

                {/* Referral & Status */}
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-20">Referred To<br/>(Code 1-9)<br/>(20)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-12">Died<br/>(√)<br/>(21)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-16">Death Notified<br/>(√)<br/>(22)</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Remark<br/>(23)</th>

                <th className="p-2 print:hidden w-12">Del</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* (1) S/No */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center font-bold">
                    <input
                      type="text"
                      value={row.sNo}
                      onChange={(e) => handleCellChange(idx, 'sNo', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none font-bold"
                    />
                  </td>

                  {/* (2) Service Date */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center font-mono">
                    <input
                      type="text"
                      value={row.serviceDate}
                      onChange={(e) => handleCellChange(idx, 'serviceDate', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none text-[11px]"
                    />
                  </td>

                  {/* (3) MRN */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 font-mono font-bold">
                    <input
                      type="text"
                      value={row.mrn}
                      onChange={(e) => handleCellChange(idx, 'mrn', e.target.value)}
                      className="w-full bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none text-[11px] text-blue-600 dark:text-blue-400 font-bold"
                    />
                  </td>

                  {/* (4) Age */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="text"
                      value={row.age}
                      onChange={(e) => handleCellChange(idx, 'age', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none"
                    />
                  </td>

                  {/* (5) Sex */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.sex}
                      onChange={(e) => handleCellChange(idx, 'sex', e.target.value)}
                      className="bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none font-bold text-center"
                    >
                      <option value="">-</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>

                  {/* (6) Address */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={row.address}
                      onChange={(e) => handleCellChange(idx, 'address', e.target.value)}
                      className="w-full bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none"
                    />
                  </td>

                  {/* (7) ICD-11 Diagnosis */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Diagnosis Name"
                        value={row.icd11DiagnosisName}
                        onChange={(e) => handleCellChange(idx, 'icd11DiagnosisName', e.target.value)}
                        className="flex-1 bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Code"
                        value={row.icd11DiagnosisCode}
                        onChange={(e) => handleCellChange(idx, 'icd11DiagnosisCode', e.target.value)}
                        className="w-16 text-center font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded px-1 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold"
                      />
                    </div>
                  </td>

                  {/* (8) New */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.isNew}
                      onChange={(e) => {
                        handleCellChange(idx, 'isNew', e.target.checked);
                        if (e.target.checked) handleCellChange(idx, 'isRepeat', false);
                      }}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (9) Repeat */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.isRepeat}
                      onChange={(e) => {
                        handleCellChange(idx, 'isRepeat', e.target.checked);
                        if (e.target.checked) handleCellChange(idx, 'isNew', false);
                      }}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (10) Road Traffic Accident */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.roadTrafficAccident}
                      onChange={(e) => handleCellChange(idx, 'roadTrafficAccident', e.target.value)}
                      className="bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none text-center font-bold"
                    >
                      <option value="">None</option>
                      <option value="1">1 (Pedestrian)</option>
                      <option value="2">2 (Motorcyclist)</option>
                      <option value="3">3 (Vehicle Occupant)</option>
                    </select>
                  </td>

                  {/* (11) HIV Test Offered */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.hivTestOffered}
                      onChange={(e) => handleCellChange(idx, 'hivTestOffered', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (12) HIV Test Performed */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.hivTestPerformed}
                      onChange={(e) => handleCellChange(idx, 'hivTestPerformed', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (13) Targeted Population Category */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.targetedPopulationCategory}
                      onChange={(e) => handleCellChange(idx, 'targetedPopulationCategory', e.target.value)}
                      className="bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none font-bold text-center"
                    >
                      <option value="A">A (CSW)</option>
                      <option value="B">B (Long distance)</option>
                      <option value="C">C (Daily laborer)</option>
                      <option value="D">D (Prisoners)</option>
                      <option value="E">E (OVC)</option>
                      <option value="F">F (PLHIV child)</option>
                      <option value="G">G (PLHIV partner)</option>
                      <option value="H">H (Other MARPS)</option>
                      <option value="I">I (General pop)</option>
                    </select>
                  </td>

                  {/* (14) HIV Test Result */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.hivTestResult}
                      onChange={(e) => handleCellChange(idx, 'hivTestResult', e.target.value)}
                      className={`bg-transparent border-none outline-none font-extrabold text-center ${
                        row.hivTestResult === 'P' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <option value="">-</option>
                      <option value="P">P (Positive)</option>
                      <option value="N">N (Negative)</option>
                    </select>
                  </td>

                  {/* (15) Travel History Malaria */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.travelHistoryMalaria}
                      onChange={(e) => handleCellChange(idx, 'travelHistoryMalaria', e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (16) Screened for TB */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.screenedForTB}
                      onChange={(e) => handleCellChange(idx, 'screenedForTB', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (17) TB Screening Result */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.tbScreeningResult}
                      onChange={(e) => handleCellChange(idx, 'tbScreeningResult', e.target.value)}
                      className={`bg-transparent border-none outline-none font-bold text-center ${
                        row.tbScreeningResult === 'P' ? 'text-rose-600' : ''
                      }`}
                    >
                      <option value="">-</option>
                      <option value="P">P</option>
                      <option value="N">N</option>
                    </select>
                  </td>

                  {/* (18) Type Diagnostic Eval */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.typeOfDiagnosticEval}
                      onChange={(e) => handleCellChange(idx, 'typeOfDiagnosticEval', e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-center"
                    >
                      <option value="1">1 (Sputum Smear)</option>
                      <option value="2">2 (GeneXpert)</option>
                      <option value="3">3 (X-ray/Imaging)</option>
                      <option value="4">4 (Histopathologic)</option>
                      <option value="5">5 (Other)</option>
                      <option value="6">6 (Not done)</option>
                    </select>
                  </td>

                  {/* (19) Result TB Screening */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.resultOfTbScreening}
                      onChange={(e) => handleCellChange(idx, 'resultOfTbScreening', e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-center text-[10px]"
                    >
                      <option value="">-</option>
                      <option value="TB">TB</option>
                      <option value="No TB">No TB</option>
                      <option value="ND">ND</option>
                    </select>
                  </td>

                  {/* (20) Referred To Code */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <select
                      value={row.referredTo}
                      onChange={(e) => handleCellChange(idx, 'referredTo', e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-center"
                    >
                      <option value="">-</option>
                      <option value="1">1 (Hospital)</option>
                      <option value="2">2 (Health Center)</option>
                      <option value="3">3 (Health Post)</option>
                      <option value="4">4 (MCH)</option>
                      <option value="5">5 (ART)</option>
                      <option value="6">6 (SOPD)</option>
                      <option value="7">7 (ObGyn)</option>
                      <option value="8">8 (TB Clinic)</option>
                      <option value="9">9 (Other Service)</option>
                    </select>
                  </td>

                  {/* (21) Died */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.died}
                      onChange={(e) => handleCellChange(idx, 'died', e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (22) Death Notified */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="checkbox"
                      checked={row.deathNotified}
                      onChange={(e) => handleCellChange(idx, 'deathNotified', e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* (23) Remark */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => handleCellChange(idx, 'remark', e.target.value)}
                      className="w-full bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none outline-none"
                    />
                  </td>

                  {/* Remove Button */}
                  <td className="p-1 text-center print:hidden">
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={24} className="p-8 text-center text-slate-400">
                    No rows present. Click <strong>"Add Row"</strong> above to begin filling the register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTNOTE LEGENDS & SUMMARY COUNTS SECTION (Copied directly from PDF Page 3 Footnote) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
        
        {/* Targeted population category legend */}
        <div className="space-y-1.5 border-r border-slate-200 dark:border-slate-800 pr-3">
          <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[11px] border-b pb-1 border-slate-200 dark:border-slate-800">
            Targeted population category (Col. 13)
          </h4>
          <ul className="space-y-0.5 text-[10.5px] font-medium leading-tight text-slate-600 dark:text-slate-400">
            <li><strong>A.</strong> Female Commercial Sex workers</li>
            <li><strong>B.</strong> Long distance drivers</li>
            <li><strong>C.</strong> Mobile/Daily Laborers</li>
            <li><strong>D.</strong> Prisoners</li>
            <li><strong>E.</strong> OVC</li>
            <li><strong>F.</strong> Children of PLHIV</li>
            <li><strong>G.</strong> Partners of PLHIV</li>
            <li><strong>H.</strong> Other MARPS</li>
            <li><strong>I.</strong> General population</li>
          </ul>
        </div>

        {/* Diagnostic Eval legend */}
        <div className="space-y-1.5 border-r border-slate-200 dark:border-slate-800 pr-3">
          <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[11px] border-b pb-1 border-slate-200 dark:border-slate-800">
            Type of diagnostic evaluation (Col. 18)
          </h4>
          <ul className="space-y-0.5 text-[10.5px] font-medium leading-tight text-slate-600 dark:text-slate-400">
            <li><strong>1.</strong> Sputum smear microscopy</li>
            <li><strong>2.</strong> Sputum GeneXpert</li>
            <li><strong>3.</strong> X-ray/other imaging</li>
            <li><strong>4.</strong> Histopathologic test</li>
            <li><strong>5.</strong> Other (specify)</li>
            <li><strong>6.</strong> Not done</li>
          </ul>
        </div>

        {/* Referral codes legend */}
        <div className="space-y-1.5 border-r border-slate-200 dark:border-slate-800 pr-3">
          <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[11px] border-b pb-1 border-slate-200 dark:border-slate-800">
            ** Referral codes for (Col. 20)
          </h4>
          <div className="grid grid-cols-2 gap-x-2 text-[10.5px] font-medium leading-tight text-slate-600 dark:text-slate-400">
            <div><strong>1 =</strong> Hospital</div>
            <div><strong>5 =</strong> ART</div>
            <div><strong>2 =</strong> Health Center</div>
            <div><strong>6 =</strong> SOPD</div>
            <div><strong>3 =</strong> Health Post</div>
            <div><strong>7 =</strong> ObGyn</div>
            <div><strong>4 =</strong> MCH</div>
            <div><strong>8 =</strong> TB Clinic</div>
            <div className="col-span-2"><strong>9 =</strong> referred to another service / health institution</div>
          </div>
        </div>

        {/* Summary Count Table (Page 3 Bottom Box) */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-black text-slate-900 dark:text-white uppercase text-[11px] border-b pb-1 border-slate-200 dark:border-slate-700">
            Summary Register Counts
          </h4>
          
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-600 font-bold text-slate-800 dark:text-slate-200">
                <th className="py-1">Category</th>
                <th className="py-1 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
              <tr>
                <td className="py-1">Pedestrian (RTA)</td>
                <td className="py-1 text-right font-black text-blue-600">{pedestrianCount}</td>
              </tr>
              <tr>
                <td className="py-1">Motorcyclist (RTA)</td>
                <td className="py-1 text-right font-black text-blue-600">{motorcyclistCount}</td>
              </tr>
              <tr>
                <td className="py-1">Vehicle occupant (RTA)</td>
                <td className="py-1 text-right font-black text-blue-600">{vehicleOccupantCount}</td>
              </tr>
              <tr>
                <td className="py-1">Travel history (Malaria)</td>
                <td className="py-1 text-right font-black text-amber-600">{travelHistoryCount}</td>
              </tr>
              <tr className="text-rose-600 font-bold">
                <td className="py-1">Count death</td>
                <td className="py-1 text-right font-black">{deathCount}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
