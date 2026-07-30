import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, Plus, Trash2, Printer, Download, Save, RefreshCw, 
  FileSpreadsheet, Check, Info, ArrowLeft, Table, Search, ChevronDown,
  Building, Copy, Clipboard, Sparkles, Filter, CheckCircle2, ShieldCheck,
  Database
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { assignAuditSchemaCodes } from '../utils/auditCounter';

export interface RegisterTemplateDef {
  id: string;
  name: string;
  category: string;
  code: string;
  description: string;
  columns: { key: string; label: string; width?: string; type?: 'text' | 'number' | 'select' | 'boolean'; options?: string[] }[];
  defaultRow: Record<string, any>;
  metadataFields?: { key: string; label: string; placeholder: string }[];
  instructions?: { title: string; items: { sn: string; term: string; desc: string }[] };
  summaryFields?: { key: string; label: string; formula: string }[];
}

export const STANDARD_PDF_TEMPLATES: RegisterTemplateDef[] = [
  {
    id: 'opd_abstract',
    name: 'OPD Abstract Register (23-Column)',
    category: 'Outpatient & Emergency',
    code: 'OPD-ABS-23',
    description: 'Official 23-Column Outpatient Department Abstract Register',
    columns: [
      { key: 'sNo', label: 'S/No (1)', width: 'w-12' },
      { key: 'serviceDate', label: 'Service Date (2)', width: 'w-24' },
      { key: 'mrn', label: 'MRN (3)', width: 'w-28' },
      { key: 'age', label: 'Age (4)', width: 'w-16' },
      { key: 'sex', label: 'Sex (5)', width: 'w-16' },
      { key: 'address', label: 'Address (Woreda/Kebele) (6)', width: 'w-36' },
      { key: 'icd11DiagnosisName', label: 'ESV-ICD 11 Diagnosis Name & Code (7)', width: 'w-48' },
      { key: 'isNew', label: 'New (8)', width: 'w-16' },
      { key: 'isRepeat', label: 'Repeat (9)', width: 'w-16' },
      { key: 'roadTrafficAccident', label: 'RTA Code (10)', width: 'w-20' },
      { key: 'hivTestOffered', label: 'HIV Offered (11)', width: 'w-16' },
      { key: 'hivTestPerformed', label: 'HIV Performed (12)', width: 'w-16' },
      { key: 'targetedPopulationCategory', label: 'Target Pop (13)', width: 'w-20' },
      { key: 'hivTestResult', label: 'HIV Result (14)', width: 'w-20' },
      { key: 'travelHistoryMalaria', label: 'Malaria Travel (15)', width: 'w-16' },
      { key: 'screenedForTB', label: 'TB Screened (16)', width: 'w-16' },
      { key: 'tbScreeningResult', label: 'TB Result (17)', width: 'w-20' },
      { key: 'typeOfDiagnosticEval', label: 'Eval Type (18)', width: 'w-20' },
      { key: 'resultOfTbScreening', label: 'TB Outcome (19)', width: 'w-24' },
      { key: 'referredTo', label: 'Referral (20)', width: 'w-20' },
      { key: 'died', label: 'Died (21)', width: 'w-16' },
      { key: 'deathNotified', label: 'Death Notified (22)', width: 'w-16' },
      { key: 'remark', label: 'Remark (23)', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', serviceDate: '', mrn: '', age: '', sex: '', address: '',
      icd11DiagnosisName: '', isNew: '', isRepeat: '', roadTrafficAccident: '',
      hivTestOffered: '', hivTestPerformed: '', targetedPopulationCategory: '',
      hivTestResult: '', travelHistoryMalaria: '', screenedForTB: '',
      tbScreeningResult: '', typeOfDiagnosticEval: '', resultOfTbScreening: '',
      referredTo: '', died: '', deathNotified: '', remark: ''
    },
    summaryFields: [
      { key: 'total_patients', label: 'Total Patients Logged', formula: 'count' },
      { key: 'new_patients', label: 'New Patients (8)', formula: 'isNew:Yes' },
      { key: 'repeat_patients', label: 'Repeat Patients (9)', formula: 'isRepeat:Yes' },
      { key: 'deaths', label: 'Total Deaths (21)', formula: 'died:Yes' },
      { key: 'tb_screened', label: 'TB Screened (16)', formula: 'screenedForTB:Yes' }
    ]
  },
  {
    id: 'ipd_register',
    name: 'INPATIENT ADMISSION / DISCHARGE REGISTER',
    category: 'Inpatient & Critical Care',
    code: 'IPD-ADM-DIS',
    description: 'OFFICIAL 27-COLUMN INPATIENT ADMISSION / DISCHARGE REGISTER',
    metadataFields: [
      { key: 'facility', label: 'Health Facility Name', placeholder: 'Enter Health Facility Name' },
      { key: 'region', label: 'Region', placeholder: 'Enter Region' },
      { key: 'zone', label: 'Zone/Sub city /Woreda', placeholder: 'Enter Zone/Sub city /Woreda' },
      { key: 'beginDate', label: 'Register begin date', placeholder: 'DD/MM/YYYY' },
      { key: 'endDate', label: 'Register end date', placeholder: 'DD/MM/YYYY' }
    ],
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'mrn', label: 'MRN (2)', width: 'w-28' },
      { key: 'age', label: 'Age (3)', width: 'w-16' },
      { key: 'sex', label: 'Sex (M/F) (4)', width: 'w-16' },
      { key: 'woredaSubcity', label: 'Woreda/Sub city (5)', width: 'w-40' },
      { key: 'dateAdmission', label: 'Date of Admission (DD/MM/YY) (6)', width: 'w-36' },
      { key: 'diagnosisAdmission', label: 'ESV_ICD11 Diagnosis Admission (7)', width: 'w-48' },
      { key: 'rta', label: 'Road Traffic Accident (8)', width: 'w-24' },
      { key: 'hivOffered', label: 'HIV Test Offered (√) (9)', width: 'w-20' },
      { key: 'hivPerformed', label: 'HIV Test performed (√) (10)', width: 'w-20' },
      { key: 'targetPop', label: 'Targeted population category (11)', width: 'w-32' },
      { key: 'hivResult', label: 'HIV Test result (P/N) (12)', width: 'w-20' },
      { key: 'malariaHistory', label: 'Travel History to malarious area (13)', width: 'w-32' },
      { key: 'tbScreened', label: 'Screened for TB (√) (14)', width: 'w-20' },
      { key: 'tbResult', label: 'TB screening result (P/N) (15)', width: 'w-20' },
      { key: 'tbEvalType', label: 'Type of diagnostic eval (16)', width: 'w-28' },
      { key: 'tbOutcome', label: 'Result of TB screening (17)', width: 'w-28' },
      { key: 'dateDischarge', label: 'Date of Discharge (DD/MM/YY) (18)', width: 'w-36' },
      { key: 'stayDays', label: 'Length of stay (days) (19)', width: 'w-24' },
      { key: 'conditionDischarge', label: 'Condition at discharge * (20)', width: 'w-32' },
      { key: 'diagnosisDischarge', label: 'ESV_ICD11 Diagnosis Discharge (21)', width: 'w-48' },
      { key: 'ipdDeath', label: 'Death in the IPD (1, 2) (22)', width: 'w-32' },
      { key: 'deathNotif', label: 'Death Notification Given (23)', width: 'w-28' },
      { key: 'amountCharged', label: 'Amount charged (birr) (24)', width: 'w-28' },
      { key: 'amountPaid', label: 'Amount paid (birr or free) (25)', width: 'w-28' },
      { key: 'voucherNo', label: 'Voucher No (26)', width: 'w-24' },
      { key: 'remark', label: 'Remark (27)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', mrn: '', age: '', sex: '', woredaSubcity: '',
      dateAdmission: '', diagnosisAdmission: '', rta: '',
      hivOffered: '', hivPerformed: '', targetPop: '', hivResult: '',
      malariaHistory: '', tbScreened: '', tbResult: '', tbEvalType: '',
      tbOutcome: '', dateDischarge: '', stayDays: '',
      conditionDischarge: '', diagnosisDischarge: '', ipdDeath: '',
      deathNotif: '', amountCharged: '', amountPaid: '',
      voucherNo: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Inpatient Admission / Discharge Register',
      items: [
        { sn: '3', term: 'Age', desc: 'In years. If < 1 year, enter in months (M). If < 1 month, enter in days (D).' },
        { sn: '8', term: 'RTA', desc: '1. Pedestrian, 2. Motorcyclist, 3. Vehicle occupant.' },
        { sn: '11', term: 'Target Pop', desc: 'A-Female Sex Workers, B-Drivers, C-Mobile, D-Prisoners, I-General population.' },
        { sn: '16', term: 'TB Eval', desc: '1. Sputum microscopy, 2. GeneXpert, 3. X-ray, 4. Histopathologic, 6. Not done.' },
        { sn: '17', term: 'TB Result', desc: 'TB, No TB, Not decided (ND).' },
        { sn: '20', term: 'Condition', desc: 'A-Improved, B-Same, C-Deteriorated, D-LAMA, E-Died, F-Referred, G-Absconded.' },
        { sn: '22', term: 'Death', desc: '1. Within 24 hours, 2. After 24 hours.' },
        { sn: '23', term: 'Death Notif', desc: 'Yes or No for deaths notified using appropriate form.' }
      ]
    }
  },
  {
    id: 'emergency_unit_register',
    name: 'EMERGENCY UNIT / DEPARTMENT REGISTER',
    category: 'Outpatient & Emergency',
    code: 'ER-UNIT-REG',
    description: 'OFFICIAL 31-COLUMN EMERGENCY UNIT / DEPARTMENT REGISTER',
    metadataFields: [
      { key: 'region', label: 'Region', placeholder: 'Enter Region' },
      { key: 'zone', label: 'Zone/Subcity/Woreda', placeholder: 'Enter Zone/Subcity/Woreda' },
      { key: 'facility', label: 'Health Facility Name', placeholder: 'Enter Facility Name' },
      { key: 'beginDate', label: 'Begin Date', placeholder: 'DD/MM/YY' },
      { key: 'endDate', label: 'End Date', placeholder: 'DD/MM/YY' }
    ],
    columns: [
      { key: 'sn', label: 'S/No (1)', width: 'w-12' },
      { key: 'date', label: 'Date (2)', width: 'w-24' },
      { key: 'mrn', label: 'MRN (3)', width: 'w-28' },
      { key: 'patientName', label: 'Patient Name (4)', width: 'w-44' },
      { key: 'age', label: 'Age (5)', width: 'w-16' },
      { key: 'sex', label: 'Sex (M/F) (6)', width: 'w-16' },
      { key: 'arrivalTime', label: 'Arrival Time (7)', width: 'w-28' },
      { key: 'triageTime', label: 'Triage Time (8)', width: 'w-28' },
      { key: 'arrivalMode', label: 'Mode of Arrival (9)', width: 'w-32' },
      { key: 'handover', label: 'Handover code (10)', width: 'w-24' },
      { key: 'referralSource', label: 'Referral Source (11)', width: 'w-36' },
      { key: 'triageCategory', label: 'Triage category* (12)', width: 'w-24' },
      { key: 'diagnosisArrival', label: 'Diagnosis on Arrival (13)', width: 'w-48' },
      { key: 'isNew', label: 'New(√) (14)', width: 'w-16' },
      { key: 'isRepeat', label: 'Repeat(√) (15)', width: 'w-16' },
      { key: 'rta', label: 'RTA Code (16)', width: 'w-20' },
      { key: 'immediateAction', label: 'Immediate action (17)', width: 'w-32' },
      { key: 'hivOffered', label: 'HIV test offered (18)', width: 'w-20' },
      { key: 'hivPerformed', label: 'HIV test performed (19)', width: 'w-20' },
      { key: 'targetPop', label: 'Targeted pop Category (20)', width: 'w-32' },
      { key: 'hivResult', label: 'HIV test result (P/N) (21)', width: 'w-20' },
      { key: 'diagnosisDisposition', label: 'Diagnosis at Disposition (22)', width: 'w-48' },
      { key: 'decisionTime', label: 'Decision Date/Time (23)', width: 'w-40' },
      { key: 'dispositionTime', label: 'Actual Disposition Date/Time (24)', width: 'w-44' },
      { key: 'stayDuration', label: 'Stay Duration (hrs) (25)', width: 'w-24' },
      { key: 'referred', label: 'Referred (26)', width: 'w-16' },
      { key: 'stabilized', label: 'Stabilized (27)', width: 'w-16' },
      { key: 'admitted', label: 'Admitted (28)', width: 'w-16' },
      { key: 'died', label: 'Died (29)', width: 'w-16' },
      { key: 'deathNotified', label: 'Death Notified (30)', width: 'w-16' },
      { key: 'remark', label: 'Remark (31)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', date: '', mrn: '', patientName: '', age: '', sex: '',
      arrivalTime: '', triageTime: '', arrivalMode: '',
      handover: '', referralSource: '', triageCategory: '',
      diagnosisArrival: '', isNew: '', isRepeat: '', rta: '',
      immediateAction: '', hivOffered: '', hivPerformed: '',
      targetPop: '', hivResult: '', diagnosisDisposition: '',
      decisionTime: '', dispositionTime: '', stayDuration: '',
      referred: '', stabilized: '', admitted: '', died: '',
      deathNotified: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Emergency Unit / Department Register',
      items: [
        { sn: '1', term: 'S/No', desc: 'Sequential starting from 1 until budget year end.' },
        { sn: '5', term: 'Age', desc: 'Days if <1mo, Months+0 if <5yr, Years if >5yr.' },
        { sn: '9', term: 'Arrival Mode', desc: '1. Ambulance, 2. Walk in, 3. Police Car, 4. Motored Vehicles, 5. Other.' },
        { sn: '10', term: 'Handover', desc: '1. No handover, 2. With form, 3. Handed without form.' },
        { sn: '12', term: 'Triage Category', desc: '1=Red, 2=Orange, 3=Yellow, 4=Green, 5=Black.' },
        { sn: '13', term: 'Diagnosis', desc: 'ESV_ICD11 Diagnosis (Name and Code). Do not abbreviate.' },
        { sn: '16', term: 'RTA', desc: '1. Pedestrian, 2. Motorcyclist, 3. Vehicle occupant.' },
        { sn: '17', term: 'Immediate Action', desc: '1. Resuscitation, 2. Procedure/OR, 3. Examination room, 4. Waiting area.' },
        { sn: '25', term: 'Length of Stay', desc: 'Calculate and enter length of stay in hours.' },
        { sn: '30', term: 'Death Notif', desc: 'Yes/No if death notification was given.' }
      ]
    }
  },
  {
    id: 'pre_triage_standard',
    name: 'PRE-TRIAGE REGISTER',
    category: 'Outpatient & Emergency',
    code: 'PRE-TRIAGE-REG',
    description: 'INITIAL SCREENING, FACILITY ENTRY ASSESSMENT & PATIENT ROUTING LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'arrivalDateTime', label: 'Arrival Date / Time', width: 'w-32' },
      { key: 'mrnId', label: 'MRN / ID (if any)', width: 'w-32' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-44' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-24' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/ Woreda)', width: 'w-40' },
      { key: 'presentingSymptomsScreeningReason', label: 'Presenting Symptoms / Screening Reason', width: 'w-48' },
      { key: 'temperatureVitals', label: 'Temperature / Vitals', width: 'w-36' },
      { key: 'screeningStatusCategory', label: 'Screening Status / Category', width: 'w-40' },
      { key: 'routingActionTaken', label: 'Routing / Action Taken', width: 'w-40' },
      { key: 'timeForwarded', label: 'Time Forwarded', width: 'w-28' },
      { key: 'screeningOfficerNameSig', label: 'Screening Officer Name / Sig', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', arrivalDateTime: '', mrnId: '', patientFullName: '', ageSex: '',
      addressKebeleWoreda: '',
      presentingSymptomsScreeningReason: '',
      temperatureVitals: '',
      screeningStatusCategory: '',
      routingActionTaken: '',
      timeForwarded: '', screeningOfficerNameSig: ''
    }
  },
  {
    id: 'central_triage_actual',
    name: 'CENTRAL TRIAGE REGISTER',
    category: 'Outpatient & Emergency',
    code: 'CENTRAL-TRIAGE-REG',
    description: 'EMERGENCY TRIAGE, PATIENT FLOW, PRIORITY ASSESSMENT & DEPARTMENTAL LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'arrivalDateTime', label: 'Arrival Date / Time', width: 'w-32' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/Woreda)', width: 'w-36' },
      { key: 'modeOfArrival', label: 'Mode of Arrival', width: 'w-28' },
      { key: 'triageCategoryPriority', label: 'Triage Category (Priority)', width: 'w-36' },
      { key: 'presentingComplaint', label: 'Presenting Complaint', width: 'w-48' },
      { key: 'vitalSigns', label: 'Vital Signs (BP/PR/SpO2/Temp)', width: 'w-44' },
      { key: 'assignedAreaClinician', label: 'Assigned Area / Clinician', width: 'w-40' },
      { key: 'dispositionOutcome', label: 'Disposition / Outcome', width: 'w-36' },
      { key: 'remarksTimeSeen', label: 'Remarks / Time Seen', width: 'w-32' }
    ],
    defaultRow: {
      sNo: '1', arrivalDateTime: '', mrnId: '', patientFullName: '', ageSex: '',
      addressKebeleWoreda: '', modeOfArrival: '',
      triageCategoryPriority: '',
      presentingComplaint: '',
      vitalSigns: '',
      assignedAreaClinician: '',
      dispositionOutcome: '', remarksTimeSeen: ''
    }
  },
  {
    id: 'ophthalmology_opd',
    name: 'OPHTHALMOLOGY OPD REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'OPHTHALMOLOGY-OPD-REG',
    description: 'EYE CLINIC OUTPATIENT CONSULTATION, EXAMINATION & PROCEDURE LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-44' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/Woreda)', width: 'w-36' },
      { key: 'chiefComplaintHistory', label: 'Chief Complaint / History', width: 'w-48' },
      { key: 'visualAcuityReLe', label: 'Visual Acuity (RE / LE)', width: 'w-32' },
      { key: 'magnification', label: 'Magnification / Refraction', width: 'w-36' },
      { key: 'ocularExaminationDiagnosis', label: 'Ocular Examination / Diagnosis', width: 'w-44' },
      { key: 'treatmentProcedurePerformed', label: 'Treatment / Procedure Performed', width: 'w-44' },
      { key: 'medicationsEyewearRx', label: 'Medications / Eyewear Rx', width: 'w-40' },
      { key: 'nextApptDate', label: 'Next Appt Date', width: 'w-28' },
      { key: 'remarksOutcome', label: 'Remarks / Outcome', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', patientFullName: '', ageSex: '',
      addressKebeleWoreda: '', chiefComplaintHistory: '',
      visualAcuityReLe: '', magnification: '', ocularExaminationDiagnosis: '',
      treatmentProcedurePerformed: '',
      medicationsEyewearRx: '',
      nextApptDate: '', remarksOutcome: ''
    }
  },
  {
    id: 'dental_opd',
    name: 'DENTAL OPD REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'DENTAL-OPD-REG',
    description: 'DENTAL CLINIC OUTPATIENT CONSULTATION, EXAMINATION & PROCEDURE LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-44' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/Woreda)', width: 'w-36' },
      { key: 'chiefComplaintHistory', label: 'Chief Complaint / History', width: 'w-48' },
      { key: 'dentalExaminationDiagnosis', label: 'Dental Examination / Diagnosis', width: 'w-44' },
      { key: 'treatmentPerformedProcedure', label: 'Treatment Performed / Procedure', width: 'w-44' },
      { key: 'medicationsPrescribed', label: 'Medications Prescribed', width: 'w-40' },
      { key: 'nextApptDate', label: 'Next Appt Date', width: 'w-28' },
      { key: 'remarksOutcome', label: 'Remarks / Outcome', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', patientFullName: '', ageSex: '',
      addressKebeleWoreda: '', chiefComplaintHistory: '',
      dentalExaminationDiagnosis: '',
      treatmentPerformedProcedure: '',
      medicationsPrescribed: '',
      nextApptDate: '', remarksOutcome: ''
    }
  },
  {
    id: 'specialist_opd',
    name: 'SPECIALIST OPD REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'SPECIALIST-OPD-REG',
    description: 'SPECIALIST OUTPATIENT CONSULTATION, CLINICAL ASSESSMENT & REFERRAL LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-44' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/Woreda)', width: 'w-36' },
      { key: 'referringUnitSource', label: 'Referring Unit / Source', width: 'w-36' },
      { key: 'specialistClinicSpecialty', label: 'Specialist Clinic Specialty', width: 'w-40' },
      { key: 'clinicalDiagnosisAssessment', label: 'Clinical Diagnosis / Assessment', width: 'w-44' },
      { key: 'treatmentPlanProcedures', label: 'Treatment Plan / Procedures', width: 'w-48' },
      { key: 'nextApptDate', label: 'Next Appt Date', width: 'w-28' },
      { key: 'remarksOutcome', label: 'Remarks / Outcome', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', patientFullName: '', ageSex: '',
      addressKebeleWoreda: '', referringUnitSource: '',
      specialistClinicSpecialty: '',
      clinicalDiagnosisAssessment: '',
      treatmentPlanProcedures: '',
      nextApptDate: '', remarksOutcome: ''
    }
  },
  {
    id: 'chronic_opd',
    name: 'CHRONIC OPD REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'CHRONIC-OPD-REG',
    description: 'NON-COMMUNICABLE DISEASES (NCDS), CHRONIC DISEASE MONITORING & FOLLOW-UP LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-44' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/Woreda)', width: 'w-36' },
      { key: 'chronicDiagnosis', label: 'Chronic Diagnosis (HTN, DM, Asthma, etc.)', width: 'w-48' },
      { key: 'vitals', label: 'Vitals (BP / RBS / BMI)', width: 'w-40' },
      { key: 'medicationsCurrentRegimen', label: 'Medications / Current Regimen', width: 'w-48' },
      { key: 'nextApptDate', label: 'Next Appt Date', width: 'w-28' },
      { key: 'remarksComplications', label: 'Remarks / Complications', width: 'w-40' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', patientFullName: '', ageSex: '',
      addressKebeleWoreda: '',
      chronicDiagnosis: '',
      vitals: '',
      medicationsCurrentRegimen: '',
      nextApptDate: '', remarksComplications: ''
    }
  },
  {
    id: 'under_five_children',
    name: 'UNDER-FIVE CHILDREN REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'UNDER-FIVE-REG',
    description: 'IMCI, GROWTH MONITORING, CHILD HEALTH & NUTRITION SERVICES LOGBOOK',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'childsFullName', label: "Child's Full Name", width: 'w-44' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'dob', label: 'DOB', width: 'w-24' },
      { key: 'ageMos', label: 'Age (Mos)', width: 'w-20' },
      { key: 'addressKebeleWoreda', label: 'Address (Kebele/Woreda)', width: 'w-36' },
      { key: 'caregiverName', label: 'Caregiver Name', width: 'w-40' },
      { key: 'wtKgHt', label: 'Wt (kg) / Ht', width: 'w-28' },
      { key: 'muacNutritionalStatus', label: 'MUAC / Nutritional Status', width: 'w-40' },
      { key: 'imciClinicalDiagnosis', label: 'IMCI Clinical Diagnosis', width: 'w-48' },
      { key: 'treatmentMedications', label: 'Treatment / Medications', width: 'w-48' },
      { key: 'vitADeworm', label: 'Vit A / Deworm', width: 'w-28' },
      { key: 'nextVisit', label: 'Next Visit', width: 'w-28' },
      { key: 'remarks', label: 'Remarks', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', childsFullName: '', sex: '',
      dob: '', ageMos: '', addressKebeleWoreda: '',
      caregiverName: '', wtKgHt: '',
      muacNutritionalStatus: '',
      imciClinicalDiagnosis: '',
      treatmentMedications: '',
      vitADeworm: '', nextVisit: '', remarks: ''
    }
  },
  {
    id: 'cac_register',
    name: 'COMPREHENSIVE ABORTION CARE (CAC) REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'CAC-REG',
    description: 'OFFICIAL 36-COLUMN COMPREHENSIVE ABORTION CARE (CAC) SERVICES REGISTER',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'date', label: 'Date (2)', width: 'w-24' },
      { key: 'mrn', label: 'MRN (3)', width: 'w-28' },
      { key: 'age', label: 'Age (4)', width: 'w-16' },
      { key: 'gaWks', label: 'Gestational age (wks) (5)', width: 'w-20' },
      { key: 'gravida', label: 'Gravida (6)', width: 'w-16' },
      { key: 'para', label: 'Para (7)', width: 'w-16' },
      { key: 'prevAbortions', label: 'No. of previous abortions (8)', width: 'w-24' },
      { key: 'safeAbortion', label: 'safe abortion care(√) (9)', width: 'w-20' },
      { key: 'postAbortion', label: 'post abortion care(√) (10)', width: 'w-20' },
      { key: 'diagnosisReason', label: 'Diagnosis/ Reason for safe*/post abortion care** (11)', width: 'w-48' },
      { key: 'mva', label: 'MVA(√) (12)', width: 'w-16' },
      { key: 'ec', label: 'E&C(√) (13)', width: 'w-16' },
      { key: 'ma', label: 'MA(√) (14)', width: 'w-16' },
      { key: 'de', label: 'D&E(√) (15)', width: 'w-16' },
      { key: 'otherEvacuation', label: 'Other (16)', width: 'w-20' },
      { key: 'outpatient', label: 'Out-pt(√) (17)', width: 'w-16' },
      { key: 'inpatient', label: 'In-pt(√) (18)', width: 'w-16' },
      { key: 'referred', label: 'Referred(√) (19)', width: 'w-16' },
      { key: 'drugsProvided', label: 'Drugs provided (Analegsic, Anesthesia, Sedation ) / Dose given (20)', width: 'w-48' },
      { key: 'counseled', label: 'Counseled(√) (21)', width: 'w-16' },
      { key: 'expressedDesire', label: 'Expressed desire(√) (22)', width: 'w-16' },
      { key: 'newAcceptor', label: 'New acceptor (√) (23)', width: 'w-16' },
      { key: 'repeatAcceptor', label: 'Repeat acceptor(√) (24)', width: 'w-16' },
      { key: 'contraceptiveMethod', label: 'Contraceptive Method/s Provided (25)', width: 'w-36' },
      { key: 'hivTestAccepted', label: 'HIV test accepted(√) (26)', width: 'w-20' },
      { key: 'targetPopCategory', label: 'Target population Category write code (27)', width: 'w-32' },
      { key: 'hivTestResult', label: 'HIV test result(P/N) (28)', width: 'w-20' },
      { key: 'hivTestCounseling', label: 'HIV test received with post test counseling(√) (29)', width: 'w-32' },
      { key: 'hivLinkedArt', label: 'HIV positives linked to ART(√) (30)', width: 'w-24' },
      { key: 'complications', label: 'Complications if yes (specify) or No (31)', width: 'w-40' },
      { key: 'death', label: 'Death (√) (32)', width: 'w-16' },
      { key: 'otherTreatment', label: 'Other (√) treatment provided (33)', width: 'w-24' },
      { key: 'otherServiceCode', label: 'if other service provided write the code (34)', width: 'w-28' },
      { key: 'remarks', label: 'Remarks/ Linkage to services etc (35)', width: 'w-44' },
      { key: 'providerSignature', label: 'Name & Signature of service provider (36)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', date: '', mrn: '', age: '', gaWks: '', gravida: '', para: '', prevAbortions: '',
      safeAbortion: '', postAbortion: '', diagnosisReason: '',
      mva: '', ec: '', ma: '', de: '', otherEvacuation: '',
      outpatient: '', inpatient: '', referred: '',
      drugsProvided: '',
      counseled: '', expressedDesire: '', newAcceptor: '', repeatAcceptor: '', contraceptiveMethod: '',
      hivTestAccepted: '', targetPopCategory: '', hivTestResult: '', hivTestCounseling: '', hivLinkedArt: '',
      complications: '', death: '', otherTreatment: '', otherServiceCode: '',
      remarks: '', providerSignature: ''
    },
    instructions: {
      title: 'Instructions for Comprehensive Abortion Care (CAC) Registration',
      items: [
        { sn: '1', term: 'S.N', desc: 'Sequential serial number in registration book.' },
        { sn: '2', term: 'Date', desc: 'Date of service provision in dd/mm/yy.' },
        { sn: '3', term: 'MRN', desc: 'Unique individual identifier (Medical Record Number).' },
        { sn: '4', term: 'Age', desc: 'Write age in years.' },
        { sn: '5', term: 'GA (wks)', desc: 'Gestational age of the pregnancy calculated in weeks.' },
        { sn: '6-8', term: 'G / P / A', desc: 'Gravida (pregnancies), Para (births), and Number of previous abortions.' },
        { sn: '9-10', term: 'Type of Care', desc: 'Tick if safe abortion (√) or post-abortion care (√) is provided.' },
        { sn: '11', term: 'Diagnosis Code', desc: 'Safe: 1. Rape, 2. Incest, 3. Maternal Condition, 4. Fetal Deformity. Post: A. Incomplete, B. Inevitable, C. Missed, D. Others.' },
        { sn: '12-16', term: 'Uterine Evacuation', desc: 'Manual Vacuum Aspiration (MVA), E&C, MA, D&E, or other methods.' },
        { sn: '17-19', term: 'Management', desc: 'Managed as Outpatient, Inpatient, or Referred.' },
        { sn: '20', term: 'Drugs / Dose', desc: 'Write specific drug provided (top row) and doses (bottom row).' },
        { sn: '21-25', term: 'Contraception', desc: 'Counseling, desire, and method provided (Mc, FeC, OC, Ec, Inj).' },
        { sn: '26-30', term: 'HIV Assessment', desc: 'Test accepted, Target category (A-I), Result (P/N), Counseling, and ART linkage.' },
        { sn: '31-34', term: 'Outcome', desc: 'Complications, Death, or other treatments provided (1. Counseling, 2. Screening, 3. Diagnosis).' }
      ]
    }
  },
  {
    id: 'lafp_removal',
    name: 'LONG ACTING FAMILY PLANNING REMOVAL REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'LAFP-REM-REG',
    description: 'OFFICIAL 19-COLUMN LONG ACTING FAMILY PLANNING REMOVAL REGISTER',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'mrn', label: 'MRN (2)', width: 'w-28' },
      { key: 'clientName', label: 'Name of Client (3)', width: 'w-44' },
      { key: 'age', label: 'Age (4)', width: 'w-16' },
      { key: 'regDate', label: 'Reg. date (DD/MM/YY) (5)', width: 'w-32' },
      { key: 'insertionDate', label: 'Date of insretion (DD/MM/YY) (6)', width: 'w-32' },
      { key: 'lafpType', label: 'Type of LAFP used (7)', width: 'w-36' },
      { key: 'placeReceived', label: 'Place of LAFP received use code (8)', width: 'w-32' },
      { key: 'removalDate', label: 'Date of Removl service provided (DD/MM/YY) (9)', width: 'w-32' },
      { key: 'durationUsed', label: 'LAFP method duration used in month (10)', width: 'w-32' },
      { key: 'removalReason', label: 'Reason for Removal (11)', width: 'w-36' },
      { key: 'hivOffered', label: 'HIV Test offered (√) (12)', width: 'w-20' },
      { key: 'hivPerformed', label: 'HIV Test performed (√) (13)', width: 'w-20' },
      { key: 'hivResult', label: 'HIV Test Result (P/N) (14)', width: 'w-20' },
      { key: 'hivCounseling', label: 'HIV specific coun seling / methods offered (√) (15)', width: 'w-32' },
      { key: 'artLinked', label: 'Positive and linked to ART (16)', width: 'w-24' },
      { key: 'targetPop', label: 'Target population Category write code (17)', width: 'w-32' },
      { key: 'postRemovalContra', label: 'Post Removal Contra ceptive provided (18)', width: 'w-40' },
      { key: 'remark', label: 'Remark (19)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', mrn: '', clientName: '', age: '', regDate: '', insertionDate: '',
      lafpType: '', placeReceived: '', removalDate: '', durationUsed: '',
      removalReason: '', hivOffered: '', hivPerformed: '',
      hivResult: '', hivCounseling: '', artLinked: '', targetPop: '',
      postRemovalContra: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Long Acting Family Planning (LAFP) Removal Registration',
      items: [
        { sn: '1', term: 'S.N', desc: 'Sequential serial number in registration book.' },
        { sn: '2', term: 'MRN', desc: 'Medical Record Number.' },
        { sn: '3-4', term: 'Client Info', desc: 'Full name and age in years.' },
        { sn: '5', term: 'Reg. Date', desc: 'Date client registered in this book (DD/MM/YY).' },
        { sn: '6', term: 'Date of Insertion', desc: 'Date the LAFP was originally inserted.' },
        { sn: '7', term: 'Type of LAFP', desc: 'Implanon, Sino-Implant, Jadelle, or IUD.' },
        { sn: '8', term: 'Place Received', desc: 'WI (Within), 1 (Hospital), 2 (HC), 3 (HP), 4 (Private).' },
        { sn: '9-10', term: 'Removal Data', desc: 'Removal date and total duration used in months.' },
        { sn: '11', term: 'Reason', desc: 'a) Recommended time, b) Side effect, c) Want pregnancy, d) Misconception, e) Others.' },
        { sn: '12-16', term: 'HIV / ART', desc: 'HIV testing status, result, specific counseling, and linkage to ART if positive.' },
        { sn: '17', term: 'Target Pop', desc: 'Category code A-I based on population demographics.' },
        { sn: '18', term: 'Post-Removal FP', desc: 'New contraceptive method provided after removal.' }
      ]
    }
  },
  {
    id: 'routine_immunization',
    name: 'ROUTINE IMMUNIZATION REGISTER',
    category: 'Immunization',
    code: 'ROUTINE-IMM-REG',
    description: 'OFFICIAL 27-COLUMN ROUTINE IMMUNIZATION REGISTER WITH MULTI-DOSE TRACKING',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'infantMrn', label: "Infant's MRN (2)", width: 'w-28' },
      { key: 'infantName', label: 'Name of infant (3)', width: 'w-44' },
      { key: 'dob', label: 'Date of Birth (DD/MM/YY) (4)', width: 'w-32' },
      { key: 'sex', label: 'Sex (M/F) (5)', width: 'w-16' },
      { key: 'motherName', label: 'Name of mother (6)', width: 'w-44' },
      { key: 'motherMrn', label: "Mother's MRN (7)", width: 'w-28' },
      { key: 'woredaKebele', label: 'Woreda / Kebele (8-9)', width: 'w-40' },
      { key: 'houseNo', label: 'House No (9)', width: 'w-20' },
      { key: 'regDate', label: 'Reg. Date (10)', width: 'w-32' },
      { key: 'doseNum', label: 'Dose num (11)', width: 'w-20' },
      { key: 'bcg', label: 'BCG (12)', width: 'w-24' },
      { key: 'opv', label: 'OPV (13)', width: 'w-24' },
      { key: 'hepb', label: 'HepB Birth dose (14-15)', width: 'w-40' },
      { key: 'pentavalent', label: 'DPT-Hep-Hib (16)', width: 'w-32' },
      { key: 'pcv', label: 'PCV (17)', width: 'w-24' },
      { key: 'rota', label: 'Rota (18)', width: 'w-24' },
      { key: 'ipv', label: 'IPV (19)', width: 'w-24' },
      { key: 'measles', label: 'Measles (20)', width: 'w-24' },
      { key: 'fullyImmunized', label: 'Fully immunized (√) (21)', width: 'w-28' },
      { key: 'tdLastPreg', label: 'No. Td doses last pregnancy (22)', width: 'w-32' },
      { key: 'tdTotal', label: 'Total Td doses received (23)', width: 'w-28' },
      { key: 'pab', label: 'Protected at birth (PAB) (24)', width: 'w-24' },
      { key: 'nutritionalScreening', label: 'Nutritional screening (25)', width: 'w-32' },
      { key: 'milestones', label: 'Developmental milestones (26)', width: 'w-32' },
      { key: 'remark', label: 'Remark/Appointment (27)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', infantMrn: '', infantName: '', dob: '', sex: '', motherName: '', motherMrn: '',
      woredaKebele: '', houseNo: '', regDate: '', doseNum: '',
      bcg: '', opv: '', hepb: '', pentavalent: '', pcv: '', rota: '', ipv: '', measles: '',
      fullyImmunized: '', tdLastPreg: '', tdTotal: '', pab: '',
      nutritionalScreening: '', milestones: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Routine Immunization Registration',
      items: [
        { sn: '1-7', term: 'Identification', desc: "Infant's MRN, DOB, Sex, and Mother's MRN (crucial for Td tracking)." },
        { sn: '11', term: 'Dose Number', desc: 'Indicates specific dose number of antigens (0-3).' },
        { sn: '12-20', term: 'Antigens', desc: 'BCG, OPV, HepB BD (within 24h or 24h-14d), Pentavalent, PCV, Rota, IPV, Measles.' },
        { sn: '21', term: 'Fully Immunized', desc: 'Tick if child completes full series by first birthday.' },
        { sn: '22-24', term: 'Neonatal Tetanus', desc: 'Td doses mother received. PAB = Protected At Birth.' },
        { sn: '26', term: 'Milestones', desc: 'NDD: No Delay, SDD: Suspected Delay, DD: Developmental Delay.' }
      ]
    }
  },
  {
    id: 'pnc_register_standard',
    name: 'POSTNATAL CARE (PNC) REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'PNC-REG',
    description: 'OFFICIAL 42-COLUMN POSTNATAL CARE (PNC) SERVICES REGISTER',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'name', label: 'Name (Mother) (2)', width: 'w-44' },
      { key: 'mrn', label: 'MRN (3)', width: 'w-28' },
      { key: 'age', label: 'Age (4)', width: 'w-16' },
      { key: 'woredaKebele', label: 'Woreda/Kebele (5)', width: 'w-40' },
      { key: 'infantDob', label: "Infant's Date of birth (6)", width: 'w-32' },
      { key: 'deliveryPlace', label: 'Place of Delivery code (7)', width: 'w-24' },
      { key: 'infantMrn', label: "MRN (Infant's) (8)", width: 'w-28' },
      { key: 'sex', label: 'Sex (M/F) (9)', width: 'w-16' },
      { key: 'visitTime', label: 'Visit Time (Period) (10)', width: 'w-28' },
      { key: 'visitDate', label: 'Date of visit (11)', width: 'w-32' },
      { key: 'maternalCondition', label: 'Maternal Health Condition (12)', width: 'w-36' },
      { key: 'pph', label: 'PPH (√) (13)', width: 'w-16' },
      { key: 'otherComplications', label: 'Other Obstetric Complications (14)', width: 'w-40' },
      { key: 'hivAccepted', label: 'HIV testing accepted (√) (15)', width: 'w-20' },
      { key: 'hivRetesting', label: 'HIV re-testing accepted (√) (16)', width: 'w-20' },
      { key: 'hivResult', label: 'HIV test result (P/N) (17)', width: 'w-20' },
      { key: 'targetPop', label: 'Target population Category code (18)', width: 'w-32' },
      { key: 'artLinked', label: 'HIV positives linked to ART (19)', width: 'w-24' },
      { key: 'knownHiv', label: 'Known HIV positives (transferred) (20)', width: 'w-28' },
      { key: 'partnerHivAccepted', label: 'Partner: HIV testing accepted (21)', width: 'w-28' },
      { key: 'partnerHivResult', label: 'Partner: HIV test result (22)', width: 'w-28' },
      { key: 'partnerTargetPop', label: 'Partner: Target pop Category (23)', width: 'w-32' },
      { key: 'partnerArtLinked', label: 'Partner: HIV linked to ART (24)', width: 'w-28' },
      { key: 'counselDangerSigns', label: 'Danger signs(√) (25)', width: 'w-20' },
      { key: 'counselBreastfeeding', label: 'Breast feeding/nutrition(√) (26)', width: 'w-24' },
      { key: 'counselNewborn', label: 'Newborn care (cord care) (27)', width: 'w-24' },
      { key: 'counselFp', label: 'Family Planning(√) (28)', width: 'w-20' },
      { key: 'counselEpi', label: 'EPI(√) (29)', width: 'w-16' },
      { key: 'counselEcd', label: 'Early Childhood Dev (ECD) (30)', width: 'w-20' },
      { key: 'weight', label: 'Weight in gram (31)', width: 'w-24' },
      { key: 'breastfeeding', label: 'Breast feeding(√) (32)', width: 'w-20' },
      { key: 'problemIdentified', label: 'Problem identified code (33)', width: 'w-32' },
      { key: 'treatmentGiven', label: 'Treatment given code (34)', width: 'w-32' },
      { key: 'treatmentOutcome', label: 'Treatment Outcome code (35)', width: 'w-32' },
      { key: 'ageDeath', label: 'Age at death (36)', width: 'w-20' },
      { key: 'causeDeath', label: 'Cause of death code (37)', width: 'w-24' },
      { key: 'ippfpNew', label: 'IPPFP: New acceptor (38)', width: 'w-20' },
      { key: 'ippfpRepeat', label: 'IPPFP: Repeat acceptor (39)', width: 'w-24' },
      { key: 'ippfpMethod', label: 'type of immediate PPFP (40)', width: 'w-32' },
      { key: 'managedBy', label: 'Managed by (41)', width: 'w-36' },
      { key: 'remark', label: 'Remark (42)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', name: '', mrn: '', age: '', woredaKebele: '', infantDob: '',
      deliveryPlace: '', infantMrn: '', sex: '', visitTime: '', visitDate: '',
      maternalCondition: '', pph: '', otherComplications: '',
      hivAccepted: '', hivRetesting: '', hivResult: '', targetPop: '', artLinked: '',
      knownHiv: '', partnerHivAccepted: '', partnerHivResult: '', partnerTargetPop: '',
      partnerArtLinked: '', counselDangerSigns: '', counselBreastfeeding: '',
      counselNewborn: '', counselFp: '', counselEpi: '', counselEcd: '',
      weight: '', breastfeeding: '', problemIdentified: '', treatmentGiven: '',
      treatmentOutcome: '', ageDeath: '', causeDeath: '',
      ippfpNew: '', ippfpRepeat: '', ippfpMethod: '', managedBy: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Postnatal Care (PNC) Registration',
      items: [
        { sn: '7', term: 'Delivery Place', desc: '1=Same Facility, 2=Other Facility, 3=Home.' },
        { sn: '10', term: 'Visit Time', desc: '24 hrs, 25-48 hrs, 49-72 hrs, 73 hrs-7 days, 8-42 days.' },
        { sn: '12', term: 'Maternal Status', desc: '1.Normal, 2.Complicated & managed, 3.Complicated & referred, 4. Died.' },
        { sn: '14', term: 'Obstetric Complications', desc: 'PE (Pre-eclampsia), E (Eclampsia), SEP (Sepsis), OTH (Other).' },
        { sn: '33', term: 'Newborn Problems', desc: '1.Normal, 2.Prematurity, 3.Sepsis, 4.Resp Distress, 5.Asphyxia, 6.LBW, 7.Congenital, 10.HC <33cm.' },
        { sn: '35', term: 'Outcome', desc: '1. Improved, 2.No change, 3. Died, 4.Referral, 5.Unknown, 6.Resuscitated.' },
        { sn: '40', term: 'PPFP Method', desc: 'POP (Progestin pill), Imp (Implant), IUCD, TL (Tubaligation), Oth.' }
      ]
    }
  },
  {
    id: 'malaria_screening',
    name: 'MALARIA SCREENING AND INVESTIGATION REGISTER',
    category: 'Communicable Diseases',
    code: 'MAL-SCREEN-REG',
    description: 'OFFICIAL 22-COLUMN MALARIA SCREENING AND INVESTIGATION REGISTER',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'examDate', label: 'Examination Date (DD/MM/YY) (2)', width: 'w-32' },
      { key: 'patientName', label: 'Full Name of Patients (3)', width: 'w-44' },
      { key: 'mrn', label: 'MRN (4)', width: 'w-28' },
      { key: 'age', label: 'Age (5)', width: 'w-16' },
      { key: 'sex', label: 'Sex (M/F) (6)', width: 'w-16' },
      { key: 'pregnancyStatus', label: 'Pregnancy status (P/NP/NA) (7)', width: 'w-28' },
      { key: 'addressPhone', label: 'Address (Kebele, Got, HH No.)/Phone No (8)', width: 'w-48' },
      { key: 'feverHistory', label: 'History of fever in the last 48 hrs (Y/N) (9)', width: 'w-28' },
      { key: 'temperature', label: 'Temperature (°C) (10)', width: 'w-20' },
      { key: 'travelHistory', label: 'Travel history (Qolama)(Y, N)/ Travel Place Location (11)', width: 'w-48' },
      { key: 'diagnosticResult', label: 'Diagnostic method (Mic/RDT/Clinical)/Result (N/Pf/Pv/Mix) (12)', width: 'w-48' },
      { key: 'treatment', label: 'Treatment* (1,2,3,4,5,6 and 7) (13)', width: 'w-36' },
      { key: 'visitorCase', label: 'A visitor case (Y/N)/ Stayed for 21 days or more? (Y/N) (14)', width: 'w-48' },
      { key: 'eligibleInvestigation', label: 'Eligible for Investigation (Y/N) (15)', width: 'w-28' },
      { key: 'indexCaseNotified', label: 'The index case notified for investigation (Y/N/NA) (16)', width: 'w-32' },
      { key: 'ftatDates', label: 'Date FTAT started (DD/MM/YY) /Date FTAT completed (DD/MM/YY) (17)', width: 'w-48' },
      { key: 'indexCaseInvestigated', label: 'The index case investigated and classified (Y/N) (18)', width: 'w-32' },
      { key: 'householdMembersTested', label: 'Number of HH members tested within 70 m radius (19)', width: 'w-36' },
      { key: 'secondaryCases', label: 'Number secondary cases identified /Number of imported secondary cases (20)', width: 'w-48' },
      { key: 'fociInvestigation', label: 'Foci investigation done round the index case (Y/N) (21)', width: 'w-32' },
      { key: 'remark', label: 'Remark (22)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', examDate: '', patientName: '', mrn: '', age: '', sex: '',
      pregnancyStatus: '', addressPhone: '', feverHistory: '',
      temperature: '', travelHistory: '', diagnosticResult: '',
      treatment: '', visitorCase: '', eligibleInvestigation: '',
      indexCaseNotified: '', ftatDates: '', indexCaseInvestigated: '',
      householdMembersTested: '', secondaryCases: '', fociInvestigation: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Malaria Screening and Investigation Registration',
      items: [
          { sn: '1', term: 'S.N', desc: 'Serial number starting from 001 for the patient.' },
          { sn: '5', term: 'Age', desc: 'MM (Months) if < 5 years, YY (Years) if 5 years or older.' },
          { sn: '11', term: 'Travel History', desc: 'History of travel to malarias (Kolama) area in last 30 days.' },
          { sn: '12', term: 'Diagnosis', desc: 'Mic=Microscopic, RDT=Rapid Test, Clinical. Result: N=Neg, Pf=Falciparum, Pv=Vivax, Mix=Mixed.' },
          { sn: '13', term: 'Treatment', desc: '1=ACT, 2=ACT+SLDPQ, 3=CQ, 4=CQ+RCPQ, 5=Artesunate, 6=Other, 7=Referred.' },
          { sn: '14', term: 'Visitor Case', desc: 'Staying temporarily with relatives; stayed for 21 days or more (Y/N).' },
          { sn: '17', term: 'FTAT', desc: 'Reactive Focal Test and Treat started (top) and completed (bottom) dates.' },
          { sn: '19-21', term: 'Investigation', desc: 'Testing within 70m radius, identifying secondary/imported cases, and foci investigation.' }
      ]
    }
  },
  {
    id: 'hpv_immunization',
    name: 'HPV IMMUNIZATION REGISTER',
    category: 'Immunization',
    code: 'HPV-REG',
    description: 'OFFICIAL 15-COLUMN HUMAN PAPILLOMAVIRUS (HPV) IMMUNIZATION TRACKING REGISTER',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'mrn', label: 'MRN (2)', width: 'w-28' },
      { key: 'girlName', label: 'Full Name of the Girls (3)', width: 'w-44' },
      { key: 'dob', label: 'Date of Birth (DD/MM/YY) (4)', width: 'w-32' },
      { key: 'age', label: 'Age (5)', width: 'w-16' },
      { key: 'schoolGrade', label: 'In school (Grade) (6)', width: 'w-24' },
      { key: 'outOfSchool', label: 'Out of school (√) (7)', width: 'w-20' },
      { key: 'woreda', label: 'Woreda (8)', width: 'w-32' },
      { key: 'kebele', label: 'Kebele (9)', width: 'w-32' },
      { key: 'gott', label: 'Gott (10)', width: 'w-32' },
      { key: 'houseNo', label: 'House No. (11)', width: 'w-24' },
      { key: 'regDate', label: 'Registration Date (DD/MM/YY) (12)', width: 'w-32' },
      { key: 'hpv1', label: 'HPV -1 (DD/MM/YY) (13)', width: 'w-32' },
      { key: 'hpv2', label: 'HPV -2 (DD/MM/YY) (14)', width: 'w-32' },
      { key: 'remark', label: 'Remark/Appointment (15)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', mrn: '', girlName: '', dob: '', age: '14', schoolGrade: '8',
      outOfSchool: '', woreda: '', kebele: '', gott: '', houseNo: '',
      regDate: '', hpv1: '', hpv2: '', remark: ''
    },
    instructions: {
      title: 'Instructions for HPV Immunization Registration',
      items: [
        { sn: '1', term: 'S.N', desc: 'Sequential serial number in registration book.' },
        { sn: '2', term: 'MRN', desc: 'Medical Record Number identifier.' },
        { sn: '3-4', term: 'Girl\'s Info', desc: 'Full name and Date of Birth (EC).' },
        { sn: '5', term: 'Age', desc: 'Age of the girl in years.' },
        { sn: '6-7', term: 'School Status', desc: 'Current grade if in school, or tick if out of school.' },
        { sn: '8-11', term: 'Address', desc: 'Woreda, Kebele, Ketena/Gott, and House Number.' },
        { sn: '12', term: 'Reg. Date', desc: 'Date of registration (DD/MM/YY).' },
        { sn: '13-14', term: 'HPV Doses', desc: 'Dates when HPV Dose 1 and Dose 2 antigens were received.' },
        { sn: '15', term: 'Remarks', desc: 'Appointment details or other relevant comments.' }
      ]
    }
  },
  {
    id: 'family_planning',
    name: 'FAMILY PLANNING (FP) REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'FP-REG',
    description: 'OFFICIAL 21-COLUMN FAMILY PLANNING & CONTRACEPTIVE SERVICES REGISTER',
    columns: [
      { key: 'sn', label: 'S.N (1)', width: 'w-12' },
      { key: 'mrn', label: 'MRN (2)', width: 'w-28' },
      { key: 'clientName', label: 'Name of Client (3)', width: 'w-44' },
      { key: 'age', label: 'Age (4)', width: 'w-16' },
      { key: 'sex', label: 'Sex (M/F) (5)', width: 'w-16' },
      { key: 'regDate', label: 'Reg. date (DD/MM/YY) (6)', width: 'w-32' },
      { key: 'newAcceptor', label: 'New acceptor (√) (7)', width: 'w-20' },
      { key: 'repeatAcceptor', label: 'Repeat acceptor(√) (8)', width: 'w-20' },
      { key: 'hivOffered', label: 'HIV test offered(√) (9)', width: 'w-20' },
      { key: 'hivPerformed', label: 'HIV test performed(√) (10)', width: 'w-20' },
      { key: 'hivResult', label: 'HIV Test results(P/N) (11)', width: 'w-20' },
      { key: 'hivCounseling', label: 'HIV specific Contra ceptive counseling offered (√) (12)', width: 'w-32' },
      { key: 'artLinked', label: 'HIV Positive and linked to ART(√) (13)', width: 'w-28' },
      { key: 'targetPop', label: 'Targeted population category Write code (14)', width: 'w-32' },
      { key: 'tdStatus', label: 'Td status checked (√) (15)', width: 'w-20' },
      { key: 'iucdContra', label: 'Contraindication for IUCD (√) (16)', width: 'w-24' },
      { key: 'visitNo', label: 'Visit No. (17)', width: 'w-16' },
      { key: 'visitDate', label: 'Visit date (DD/MM/YY) (18)', width: 'w-32' },
      { key: 'contraProvided', label: 'Contraceptive provided (19)', width: 'w-36' },
      { key: 'appointmentDate', label: 'Appointment date (20)', width: 'w-32' },
      { key: 'remark', label: 'Remark/Name &signature (21)', width: 'w-44' }
    ],
    defaultRow: {
      sn: '1', mrn: '', clientName: '', age: '', sex: '', regDate: '',
      newAcceptor: '', repeatAcceptor: '', hivOffered: '', hivPerformed: '',
      hivResult: '', hivCounseling: '', artLinked: '', targetPop: '',
      tdStatus: '', iucdContra: '', visitNo: '', visitDate: '',
      contraProvided: '', appointmentDate: '', remark: ''
    },
    instructions: {
      title: 'Instructions for Family Planning (FP) Registration',
      items: [
        { sn: '1', term: 'S.N', desc: 'Sequential serial number in registration book.' },
        { sn: '2', term: 'MRN', desc: 'Medical Record Number identifier.' },
        { sn: '3-5', term: 'Client Info', desc: 'Name, Age, and Sex (M/F).' },
        { sn: '6', term: 'Reg. Date', desc: 'Date client registered in this book (EC).' },
        { sn: '7-8', term: 'Acceptor Type', desc: 'Tick if New acceptor (no previous method) or Repeat acceptor.' },
        { sn: '9-13', term: 'HIV / ART', desc: 'HIV testing, results (P/N), counseling offered, and linkage to ART clinic if positive.' },
        { sn: '14', term: 'Target Pop', desc: 'Category code A-I (A=CSW, B=Drivers, C=Daily Laborers, D=Prisoners, I=General).' },
        { sn: '15-16', term: 'Assessments', desc: 'Td status and Contraindications for IUCD (Heavy bleeding, PID, etc).' },
        { sn: '17-18', term: 'Visit Info', desc: 'Visit number (1-5) and Date of visit.' },
        { sn: '19', term: 'Method', desc: 'MaC, FeC, OC, Inj, EC, IUCD, Imp, TL, Vas, Oth.' },
        { sn: '20-21', term: 'Follow-up', desc: 'Appointment date for next visit and Signature.' }
      ]
    }
  },
  {
    id: 'art_register',
    name: 'ART (Anti-Retroviral Therapy) Register',
    category: 'Infectious Disease & TB',
    code: 'ART-MOH-V1',
    description: 'Comprehensive ART Patient Monitoring, CD4, Viral Load & Regimen Tracker',
    columns: [
      { key: 'artStartDate', label: 'ART Start Date (1)', width: 'w-28' },
      { key: 'uniqueArtNumber', label: 'Unique ART No (2)', width: 'w-32' },
      { key: 'mrn', label: 'MRN (3)', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name (4)', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex (5-6)', width: 'w-20' },
      { key: 'address', label: 'Woreda / Kebele (7)', width: 'w-32' },
      { key: 'functionalStatus', label: 'Functional Status (8)', width: 'w-24' },
      { key: 'weightHeight', label: 'Weight (kg) / Ht (cm) (9-10)', width: 'w-28' },
      { key: 'whoStage', label: 'WHO Clinical Stage (14)', width: 'w-24' },
      { key: 'cd4Count', label: 'CD4 Count / % (15)', width: 'w-24' },
      { key: 'originalRegimen', label: '1st Line Regimen (35)', width: 'w-32' },
      { key: 'substitution', label: 'Regimen Substitutions (36)', width: 'w-32' },
      { key: 'viralLoad6M', label: 'Viral Load 6M (51)', width: 'w-28' },
      { key: 'viralLoad12M', label: 'Viral Load 12M (61)', width: 'w-28' },
      { key: 'statusOutcome', label: 'Follow-up Status / Outcome', width: 'w-32' }
    ],
    defaultRow: {
      artStartDate: '', uniqueArtNumber: '', mrn: '', patientName: '', ageSex: '',
      address: '', functionalStatus: '', weightHeight: '',
      whoStage: '', cd4Count: '', originalRegimen: '',
      substitution: '', viralLoad6M: '', viralLoad12M: '',
      statusOutcome: ''
    }
  },
  {
    id: 'pmtct_register',
    name: 'INTEGRATED MNCH / PMTCT REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'PMTCT-REG',
    description: 'INTEGRATED PMTCT REGISTER FOR HEALTH CENTRE / CLINIC / HOSPITAL',
    columns: [
      { key: 'sNo', label: 'S.N. (1)', width: 'w-12' },
      { key: 'motherName', label: 'Mother’s name (2)', width: 'w-40' },
      { key: 'mrn', label: 'MRN (3)', width: 'w-24' },
      { key: 'artUniqueId', label: 'ART unique ID number (4)', width: 'w-36' },
      { key: 'age', label: 'Age (5)', width: 'w-14' },
      { key: 'bookingDate', label: 'Booking Date (6)', width: 'w-28' },
      { key: 'newlyDiagnosedArt', label: 'Newly diagnosed & started on ART (1=ANC; 2=L&D; 3=post partum) (7)', width: 'w-44' },
      { key: 'knownHivStatus', label: 'Known HIV + (1=On ART at entry; 2=Not on ART) (8)', width: 'w-44' },
      { key: 'lnmp', label: 'LNMP (9)', width: 'w-24' },
      { key: 'edd', label: 'EDD (10)', width: 'w-24' },
      { key: 'gaWeeks', label: 'Gestational age (GA) in weeks (11)', width: 'w-24' },
      { key: 'ferrousSulfate', label: 'Ferrous Sulfate / Folic Acid Provided (Y/N) (12)', width: 'w-32' },
      { key: 'syphilisTest', label: 'Syphilis test result (R/NR/ND) (13)', width: 'w-28' },
      { key: 'infantFeedingOption', label: 'Selected Infant Feeding option (EBF, ERF, MF) (14)', width: 'w-36' },
      { key: 'deliveryDate', label: 'Date of delivery (15)', width: 'w-28' },
      { key: 'infantSex', label: 'Sex of Infant (M/F) (16)', width: 'w-20' },
      { key: 'placeOfDelivery', label: 'Place of Delivery (1=Same, 2=Other, 3=Home) (17)', width: 'w-32' },
      { key: 'deliveryOutcome', label: 'Delivery Outcome (LB, SB) (18)', width: 'w-24' },
      { key: 'artDuringLabor', label: 'ART Taken During Labor (Y/N) (19)', width: 'w-28' },
      { key: 'infantArvProphylaxis12Wks', label: 'Infant Received ARV Prophylaxis (AZT + NVP for 1st 6 wks & NVP next 6 wks) (20)', width: 'w-44' },
      { key: 'fpCounseled', label: 'Family Planning Counseled (Y/N) (21)', width: 'w-32' },
      { key: 'newAcceptor', label: 'New acceptor (√) (22)', width: 'w-20' },
      { key: 'repeatAcceptor', label: 'Repeat acceptor (√) (23)', width: 'w-20' },
      { key: 'contraceptiveProvided', label: 'Contraceptive provided (write abbreviation) (24)', width: 'w-36' },
      { key: 'hivTestingAccepted', label: 'HIV testing accepted (√) (25)', width: 'w-24' },
      { key: 'partnerTested', label: 'Partner tested (P/N/ND) (26)', width: 'w-24' },
      { key: 'partnerTargetPop', label: 'Partner Target population Category write code (27)', width: 'w-36' },
      { key: 'hivPartnerLinked', label: 'HIV Positive partner Linked to ART (28)', width: 'w-28' },
      { key: 'tbSymptomScreening', label: 'TB symptom screening (P/N/ND) (29)', width: 'w-28' },
      { key: 'dateInhProphylaxis', label: 'Date INH prophylaxis started (30)', width: 'w-28' },
      { key: 'dateTbRxStarted', label: 'Date TB Rx started/Unit TB Number (31)', width: 'w-36' },
      { key: 'initialCd4Count', label: 'Initial CD4 count (Value/ND) (32)', width: 'w-28' },
      { key: 'whoClinicalStage', label: 'WHO Clinical Stage (33)', width: 'w-24' },
      { key: 'maternalCptStarted', label: 'Maternal CPT started (Y/N) (34)', width: 'w-24' },
      { key: 'dateArtInitiated', label: 'Date ART initiated (35)', width: 'w-28' },
      { key: 'initialArtRegimen', label: 'Initial ART Regimen (write Code) (36)', width: 'w-36' },
      { key: 'infantsMrn', label: 'Infant’s MRN (37)', width: 'w-28' },
      { key: 'dateHeiEnrollment', label: 'Date of HEI enrollment to PMTCT (38)', width: 'w-32' },
      { key: 'infantArvProphylaxisInit', label: 'Infant Received ARV prophylaxis (DD/MM/YY) (39)', width: 'w-36' },
      { key: 'infantFeeding6Mos', label: 'Infant feeding practice within the first 6 months (40)', width: 'w-40' },
      { key: 'ageWksStartedCpt', label: 'Age in wks Started CPT (41)', width: 'w-24' },
      { key: 'ageWksDnaPcr', label: 'Age in weeks DNA/PCR test done (Wks) (42)', width: 'w-28' },
      { key: 'resultDnaPcr', label: 'Result of DNA/ PCR(P/N) (43)', width: 'w-24' },
      { key: 'rapidHivAbResult', label: 'Rapid HIV-AB test result at/ within 18 months of age (44)', width: 'w-44' },
      { key: 'ecdCounseled', label: 'Early Childhood Development/ECD (Y/N) (45)', width: 'w-36' },
      { key: 'nutritionCounseled', label: 'Nutrition (Y/N) (46)', width: 'w-24' },
      { key: 'remarks', label: 'Remarks (47)', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1',
      motherName: '',
      mrn: '',
      artUniqueId: '',
      age: '',
      bookingDate: '',
      newlyDiagnosedArt: '',
      knownHivStatus: '',
      lnmp: '',
      edd: '',
      gaWeeks: '',
      ferrousSulfate: '',
      syphilisTest: '',
      infantFeedingOption: '',
      deliveryDate: '',
      infantSex: '',
      placeOfDelivery: '',
      deliveryOutcome: '',
      artDuringLabor: '',
      infantArvProphylaxis12Wks: '',
      fpCounseled: '',
      newAcceptor: '',
      repeatAcceptor: '',
      contraceptiveProvided: '',
      hivTestingAccepted: '',
      partnerTested: '',
      partnerTargetPop: '',
      hivPartnerLinked: '',
      tbSymptomScreening: '',
      dateInhProphylaxis: '',
      dateTbRxStarted: '',
      initialCd4Count: '',
      whoClinicalStage: '',
      maternalCptStarted: '',
      dateArtInitiated: '',
      initialArtRegimen: '',
      infantsMrn: '',
      dateHeiEnrollment: '',
      infantArvProphylaxisInit: '',
      infantFeeding6Mos: '',
      ageWksStartedCpt: '',
      ageWksDnaPcr: '',
      resultDnaPcr: '',
      rapidHivAbResult: '',
      ecdCounseled: '',
      nutritionCounseled: '',
      remarks: ''
    }
  },
  {
    id: 'unit_tb_register',
    name: 'Unit TB Register',
    category: 'Infectious Disease & TB',
    code: 'TB-UNIT-REG',
    description: 'Standard Health Centre / Hospital TB DOTS Unit Patient Register & Contact Tracing',
    columns: [
      { key: 'sNo', label: 'S/N', width: 'w-12' },
      { key: 'mrn', label: 'MRN (1)', width: 'w-28' },
      { key: 'unitTbNumber', label: 'Unit TB No (2)', width: 'w-28' },
      { key: 'patientNameAddress', label: 'Patient Name & Address (3)', width: 'w-44' },
      { key: 'sexAge', label: 'Sex / Age (4)', width: 'w-20' },
      { key: 'keyPopulationGroup', label: 'TB Risk Category (5)', width: 'w-32' },
      { key: 'contactPerson', label: 'Contact Person Details (6)', width: 'w-36' },
      { key: 'rapidTestResult', label: 'GeneXpert / RDT Result (9)', width: 'w-32' },
      { key: 'smearResult', label: 'Smear Result (10)', width: 'w-24' },
      { key: 'tbCategory', label: 'TB Category (N/R/F/L/T/O) (11)', width: 'w-32' },
      { key: 'treatmentStartedDate', label: 'Treatment Start Date (16)', width: 'w-28' },
      { key: 'tbHivCoInfection', label: 'TB/HIV Status (48-51)', width: 'w-28' },
      { key: 'finalTreatmentOutcome', label: 'Final Outcome (81)', width: 'w-32' },
      { key: 'remarks', label: 'Remarks (86)', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', mrn: '', unitTbNumber: '', patientNameAddress: '', sexAge: '',
      keyPopulationGroup: '', contactPerson: '', rapidTestResult: '',
      smearResult: '', tbCategory: '', treatmentStartedDate: '',
      tbHivCoInfection: '', finalTreatmentOutcome: '', remarks: ''
    }
  },
  {
    id: 'dr_tb_register',
    name: 'Drug Resistant TB (DR-TB) Follow-up Register',
    category: 'Infectious Disease & TB',
    code: 'DR-TB-REG',
    description: 'Drug Resistant (MDR/XDR) TB Patient Monitoring & Daily DOTS Chart',
    columns: [
      { key: 'sNo', label: 'S/N', width: 'w-12' },
      { key: 'drTbRegNumber', label: 'MDR TB Reg No (1)', width: 'w-32' },
      { key: 'patientNameAddress', label: 'Patient Name & Address (2)', width: 'w-44' },
      { key: 'sexAgeHeight', label: 'Sex / Age / Height (3)', width: 'w-24' },
      { key: 'contactPerson', label: 'Contact Person (4)', width: 'w-36' },
      { key: 'eligibilityRegimen', label: 'Regimen Eligibility (5)', width: 'w-28' },
      { key: 'registrationGroup', label: 'Registration Group (6)', width: 'w-28' },
      { key: 'resistantType', label: 'Resistant Type (RR/MDR/XDR) (6)', width: 'w-32' },
      { key: 'weightBmi', label: 'Weight & BMI (7-8)', width: 'w-24' },
      { key: 'treatmentStarted', label: 'Treatment Started Date (11)', width: 'w-28' },
      { key: 'smearCultureResult', label: 'Smear & Culture Result (12-13)', width: 'w-28' },
      { key: 'drTbOutcome', label: 'DR TB Treatment Outcome (73)', width: 'w-32' },
      { key: 'remarks', label: 'Remarks (74)', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', drTbRegNumber: '', patientNameAddress: '', sexAgeHeight: '',
      contactPerson: '', eligibilityRegimen: '', registrationGroup: '',
      resistantType: '', weightBmi: '',
      treatmentStarted: '', smearCultureResult: '', drTbOutcome: '', remarks: ''
    }
  },
  {
    id: 'delivery_register',
    name: 'LABOR & DELIVERY REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'DELIVERY-REG',
    description: 'MASTER INTRAPARTUM CARE, PARTOGRAPH, MODE OF DELIVERY & NEWBORN BIRTH REGISTER',
    columns: [
      { key: 'sNo', label: 'S.N (1)', width: 'w-12' },
      { key: 'mrn', label: 'MRN (2)', width: 'w-24' },
      { key: 'motherName', label: 'Name of the mother (3)', width: 'w-36' },
      { key: 'age', label: 'Age (4)', width: 'w-14' },
      { key: 'kebele', label: 'Kebele (5)', width: 'w-24' },
      { key: 'deliveryDateTime', label: 'Delivery date & time (DD/MM/YY - 00:00) (6)', width: 'w-44' },
      { key: 'partographUsed', label: 'Partograph Used (Y/N) (7)', width: 'w-24' },
      { key: 'modeOfDelivery', label: 'Mode of Delivery (SVD/CS/Vacuum/Epis/Other) (8-12)', width: 'w-52' },
      { key: 'uterotonicDrugs', label: 'Uterotonic Drugs Given (Write code) (13)', width: 'w-48' },
      { key: 'cct', label: 'Controlled cord traction (CCT) (14)', width: 'w-36' },
      { key: 'maternalCondition', label: 'Maternal Status (Stable/Unstable/Died) (15-17)', width: 'w-44' },
      { key: 'causeOfDeath', label: 'Cause of maternal death (Write Code) (18)', width: 'w-48' },
      { key: 'obstetricComplications', label: 'Obstetric Complications (PE/Ecl/APH/PPH/Referred) (19-24)', width: 'w-52' },
      { key: 'newbornOutcome', label: 'Newborn birth Outcome (Alive) (25)', width: 'w-36' },
      { key: 'apgarScore', label: 'APGAR score 1\'/5\' (26)', width: 'w-24' },
      { key: 'newbornSex', label: 'Sex (M/F) (27)', width: 'w-16' },
      { key: 'newbornWeight', label: 'Weight in grams (28)', width: 'w-28' },
      { key: 'stillBirth', label: 'Still birth (1=Fresh, 2=Macerated) (29)', width: 'w-40' },
      { key: 'liveBirthDied', label: 'Live birth, died after arrival or delivery in facility (30)', width: 'w-48' },
      { key: 'newbornMrn', label: 'MRN (Newborn\'s) (31)', width: 'w-28' },
      { key: 'newbornPreventive', label: 'Newborn Preventive (Vitamin K / TTC / Chlorhexidine) (32-34)', width: 'w-56' },
      { key: 'vaccinatedAtBirth', label: 'Vaccinated at birth for (Write code) (35)', width: 'w-44' },
      { key: 'maternalHivCare', label: 'Maternal HIV+ Care and Follow-up (36-39)', width: 'w-44' },
      { key: 'targetPopulation', label: 'Target population Category write code (40)', width: 'w-44' },
      { key: 'hivDeliveryPmtct', label: 'HIV positive delivery link to PMTCT (41)', width: 'w-44' },
      { key: 'counseledFeeding', label: 'Counseled on feeding options (42)', width: 'w-36' },
      { key: 'motherArtRegimen', label: 'Mother’s ART Regimen write code (43)', width: 'w-44' },
      { key: 'newbornAztNvp', label: 'Newborn AZT + NVP (for 6 wks/12 wks) (44)', width: 'w-44' },
      { key: 'partnerHivTesting', label: 'Partner HIV Testing (Accepted/Result/Linked) (45-47)', width: 'w-52' },
      { key: 'partnerTargetPop', label: 'Partner Target Population Category (48)', width: 'w-44' },
      { key: 'ippfpAcceptor', label: 'IPPFP Acceptor (New/Repeat) (49-50)', width: 'w-36' },
      { key: 'ippfpMethods', label: 'Type of immediate PPFP methods received (51)', width: 'w-48' },
      { key: 'newbornProblem', label: 'Newborn Problem Identified (Premature/Sepsis/Asphyxia/LBW/Congenital) (52-57)', width: 'w-64' },
      { key: 'breastfeedingTime', label: 'Breast feeding initiated time write code (58)', width: 'w-44' },
      { key: 'resuscitationOxygen', label: 'Treatment: Oxygen/Resuscitation (59-60)', width: 'w-44' },
      { key: 'newbornDied', label: 'Newborn Died (61)', width: 'w-24' },
      { key: 'ageAtDeath', label: 'Age at death (postnatal age) (62)', width: 'w-32' },
      { key: 'causeOfNewbornDeath', label: 'Cause of newborn death write code (63)', width: 'w-44' },
      { key: 'birthNotification', label: 'If alive, Birth notification given for the mother (64)', width: 'w-48' },
      { key: 'managedBy', label: 'Managed by (65)', width: 'w-36' },
      { key: 'remark', label: 'Remark (66)', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1',
      mrn: '',
      motherName: '',
      age: '',
      kebele: '',
      deliveryDateTime: '',
      partographUsed: '',
      modeOfDelivery: '',
      uterotonicDrugs: '',
      cct: '',
      maternalCondition: '',
      causeOfDeath: '',
      obstetricComplications: '',
      newbornOutcome: '',
      apgarScore: '',
      newbornSex: '',
      newbornWeight: '',
      stillBirth: '',
      liveBirthDied: '',
      newbornMrn: '',
      newbornPreventive: '',
      vaccinatedAtBirth: '',
      maternalHivCare: '',
      targetPopulation: '',
      hivDeliveryPmtct: '',
      counseledFeeding: '',
      motherArtRegimen: '',
      newbornAztNvp: '',
      partnerHivTesting: '',
      partnerTargetPop: '',
      ippfpAcceptor: '',
      ippfpMethods: '',
      newbornProblem: '',
      breastfeedingTime: '',
      resuscitationOxygen: '',
      newbornDied: '',
      ageAtDeath: '',
      causeOfNewbornDeath: '',
      birthNotification: '',
      managedBy: '',
      remark: ''
    }
  },
  {
    id: 'anc_8_register',
    name: 'ANTENATAL CARE (ANC) 8-CONTACT REGISTER',
    category: 'Maternal & Neonatal Health',
    code: 'ANC-8-CONTACT-REG',
    description: 'Standardized Maternal Health Clinical Logbook (WHO 8-Contact Model)',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'mothersFullName', label: 'Mother\'s Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'gp', label: 'G / P', width: 'w-16' },
      { key: 'gaWks', label: 'GA (Wks)', width: 'w-20' },
      { key: 'ancContact18', label: 'ANC Contact (1-8)', width: 'w-28' },
      { key: 'bpWeightFhrFindings', label: 'BP / Weight / FHR / Findings', width: 'w-48' },
      { key: 'interventionsTtIfaLabs', label: 'Interventions (TT, IFA, Labs)', width: 'w-44' },
      { key: 'riskComplication', label: 'Risk / Complication', width: 'w-36' },
      { key: 'nextAppt', label: 'Next Appt', width: 'w-28' },
      { key: 'clinicianSignature', label: 'Clinician Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnCardNo: '', mothersFullName: '', age: '',
      addressKebele: '', gp: '', gaWks: '', ancContact18: '',
      bpWeightFhrFindings: '',
      interventionsTtIfaLabs: '',
      riskComplication: '', nextAppt: '', clinicianSignature: ''
    }
  },
  {
    id: 'pediatrics_opd_register',
    name: 'PEDIATRICS OUTPATIENT DEPARTMENT (OPD) REGISTER',
    category: 'Pediatrics & Child Health',
    code: 'PEDS-OPD-REG',
    description: 'Standardized Pediatric Outpatient Clinical Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'childFullName', label: 'Child\'s Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'visitType', label: 'Visit Type (New/F-Up)', width: 'w-28' },
      { key: 'chiefComplaintVitals', label: 'Chief Complaint & Vitals (Temp, Wt, RR)', width: 'w-48' },
      { key: 'pediatricDiagnosisImci', label: 'Pediatric Diagnosis / IMCI Classification', width: 'w-48' },
      { key: 'treatmentPrescriptions', label: 'Treatment / Prescriptions Given', width: 'w-48' },
      { key: 'outcomeNextAppt', label: 'Outcome / Next Appt', width: 'w-32' },
      { key: 'clinicianSignature', label: 'Clinician Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', childFullName: '', age: '',
      sex: '', addressKebele: '', visitType: '',
      chiefComplaintVitals: '', pediatricDiagnosisImci: '',
      treatmentPrescriptions: '', outcomeNextAppt: '',
      clinicianSignature: ''
    }
  },
  {
    id: 'pediatrics_department_register',
    name: 'PEDIATRICS DEPARTMENT REGISTER',
    category: 'Pediatrics & Child Health',
    code: 'PEDS-DEPT-REG',
    description: 'Standardized Pediatric Clinical Logbook (IMCI & Inpatient / OPD)',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'childFullName', label: 'Child\'s Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'wtMuac', label: 'Wt (kg) / MUAC', width: 'w-28' },
      { key: 'chiefComplaintClinicalFindings', label: 'Chief Complaint & Clinical Findings', width: 'w-48' },
      { key: 'pediatricDiagnosisImciGeneral', label: 'Pediatric Diagnosis (IMCI / General)', width: 'w-48' },
      { key: 'treatmentMedicationIvFluids', label: 'Treatment / Medication / IV Fluids', width: 'w-48' },
      { key: 'outcome', label: 'Outcome (Disch/Adm/Ref/Died)', width: 'w-36' },
      { key: 'clinicianSignature', label: 'Clinician Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', childFullName: '', age: '',
      sex: '', addressKebele: '', wtMuac: '',
      chiefComplaintClinicalFindings: '',
      pediatricDiagnosisImciGeneral: '',
      treatmentMedicationIvFluids: '',
      outcome: '', clinicianSignature: ''
    }
  },
  {
    id: 'under_five_children_imci',
    name: 'Under-Five Children Register (IMCI)',
    category: 'Pediatrics & Child Health',
    code: 'U5-IMCI-REG',
    description: 'IMCI, Growth Monitoring, MUAC, Child Health & Nutrition Services Logbook',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrn', label: 'MRN / ID', width: 'w-28' },
      { key: 'childName', label: 'Child\'s Full Name', width: 'w-40' },
      { key: 'sexDob', label: 'Sex / DOB / Age (Mos)', width: 'w-32' },
      { key: 'address', label: 'Address (Kebele/Woreda)', width: 'w-32' },
      { key: 'caregiverName', label: 'Caregiver Name', width: 'w-36' },
      { key: 'weightHeight', label: 'Wt (kg) / Ht (cm)', width: 'w-28' },
      { key: 'muacStatus', label: 'MUAC / Nutritional Status', width: 'w-32' },
      { key: 'imciDiagnosis', label: 'IMCI Clinical Diagnosis', width: 'w-44' },
      { key: 'treatmentMeds', label: 'Treatment / Medications', width: 'w-40' },
      { key: 'vitADeworm', label: 'Vit A / Deworming', width: 'w-28' },
      { key: 'nextVisit', label: 'Next Visit', width: 'w-24' },
      { key: 'remarks', label: 'Remarks', width: 'w-32' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrn: '', childName: '', sexDob: '',
      address: '', caregiverName: '', weightHeight: '',
      muacStatus: '', imciDiagnosis: '',
      treatmentMeds: '', vitADeworm: '',
      nextVisit: '', remarks: ''
    }
  },
  {
    id: 'pediatric_malnutrition',
    name: 'PEDIATRIC MALNUTRITION REGISTER (OTP / SC / TSFP)',
    category: 'Pediatrics & Child Health',
    code: 'PED-MALNUTRITION-REG',
    description: 'Standardized Therapeutic & Supplementary Feeding Clinical Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'regDate', label: 'Reg Date', width: 'w-24' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'childFullName', label: 'Child\'s Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'admissionCriteria', label: 'Admission Criteria (MUAC/WFH)', width: 'w-40' },
      { key: 'edema', label: 'Edema (+/++/+++)', width: 'w-28' },
      { key: 'wtHt', label: 'Wt (kg) & Ht (cm)', width: 'w-28' },
      { key: 'programType', label: 'Program (OTP/SC/TSFP)', width: 'w-32' },
      { key: 'treatmentRutfMeds', label: 'Treatment / RUTF / Routine Meds', width: 'w-48' },
      { key: 'outcome', label: 'Outcome (Cured/Def/Died/Trans)', width: 'w-36' },
      { key: 'clinicianSignature', label: 'Clinician Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', regDate: '', mrnCardNo: '', childFullName: '', age: '',
      sex: '', addressKebele: '', admissionCriteria: '',
      edema: '', wtHt: '', programType: '',
      treatmentRutfMeds: '', outcome: '',
      clinicianSignature: ''
    }
  },
  {
    id: 'operation_room_surgical',
    name: 'Operation Room (OR) & Surgical Register',
    category: 'Surgery & Specialized',
    code: 'OR-SURGERY-REG',
    description: 'Master Intraoperative Logging & Patient Safety Tracking System',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrn', label: 'MRN', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'preOpDiagnosis', label: 'Pre-op Diagnosis', width: 'w-40' },
      { key: 'operationPerformed', label: 'Operation / Procedure Performed', width: 'w-48' },
      { key: 'surgeonAsst', label: 'Surgeon / Assistant', width: 'w-36' },
      { key: 'anesthesiaType', label: 'Anesthesia Type', width: 'w-28' },
      { key: 'anaesthetist', label: 'Anaesthetist', width: 'w-32' },
      { key: 'startEndTime', label: 'Start / End Time', width: 'w-28' },
      { key: 'woundClassBloodLoss', label: 'Wound Class / Blood Loss', width: 'w-32' },
      { key: 'postOpDestination', label: 'Post-op Destination', width: 'w-32' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrn: '', patientName: '', ageSex: '',
      preOpDiagnosis: '', operationPerformed: '',
      surgeonAsst: '', anesthesiaType: '',
      anaesthetist: '', startEndTime: '',
      woundClassBloodLoss: '', postOpDestination: ''
    }
  },
  {
    id: 'adult_icu',
    name: 'ADULT INTENSIVE CARE UNIT (ICU) REGISTER',
    category: 'Inpatient & Critical Care',
    code: 'ICU-CRITICAL-REG',
    description: 'Standardized Adult Inpatient Admission & Critical Care Clinical Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'admissionDateTime', label: 'Admission Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'diagnosisReason', label: 'Diagnosis / Reason for Admission', width: 'w-48' },
      { key: 'initialVitalsScore', label: 'Initial Vitals / Score (GCS/SOFA)', width: 'w-40' },
      { key: 'ventilatorSupport', label: 'Ventilator / Support (Vent/O2/Inotropes)', width: 'w-48' },
      { key: 'outcome', label: 'Outcome (Ward/Ref/Died)', width: 'w-36' },
      { key: 'losDays', label: 'LOS (Days)', width: 'w-20' },
      { key: 'attendingSignature', label: 'Attending Intensivist / Clinician Signature', width: 'w-48' }
    ],
    defaultRow: {
      sNo: '1', admissionDateTime: '', mrnCardNo: '', patientFullName: '', age: '',
      sex: '', addressKebele: '', diagnosisReason: '', initialVitalsScore: '',
      ventilatorSupport: '', outcome: '',
      losDays: '', attendingSignature: ''
    }
  },
  {
    id: 'nicu_register',
    name: 'NEONATAL INTENSIVE CARE UNIT (NICU) REGISTER',
    category: 'Inpatient & Critical Care',
    code: 'NICU-REGISTER',
    description: 'Standardized Neonatal Inpatient Admission & Clinical Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'admissionDateTime', label: 'Admission Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'neonateName', label: 'Neonate\'s Name (Baby of ...)', width: 'w-40' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'birthWtGa', label: 'Birth Wt (g) & GA', width: 'w-28' },
      { key: 'modeDeliveryPlace', label: 'Mode of Delivery & Place', width: 'w-36' },
      { key: 'apgarScore', label: 'Apgar (1\' / 5\')', width: 'w-24' },
      { key: 'reasonAdmissionDiagnosis', label: 'Reason for Admission / Diagnosis', width: 'w-48' },
      { key: 'treatmentOxygenSupport', label: 'Treatment / Oxygen / Support', width: 'w-44' },
      { key: 'outcome', label: 'Outcome (Disch/Ref/Died)', width: 'w-36' },
      { key: 'losDays', label: 'LOS (Days)', width: 'w-20' },
      { key: 'attendingSignature', label: 'Attending Clinician & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', admissionDateTime: '', mrnCardNo: '', neonateName: '', sex: '',
      birthWtGa: '', modeDeliveryPlace: '', apgarScore: '',
      reasonAdmissionDiagnosis: '', treatmentOxygenSupport: '',
      outcome: '', losDays: '', attendingSignature: ''
    }
  },
  {
    id: 'psychiatric_opd',
    name: 'PSYCHIATRIC OPD & MENTAL HEALTH CLINIC REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'PSYCH-OPD-REG',
    description: 'Standardized Outpatient Clinical Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'visitType', label: 'Visit Type (New/F-Up)', width: 'w-28' },
      { key: 'psychiatricDiagnosisClinicalNotes', label: 'Psychiatric Diagnosis / Clinical Notes', width: 'w-48' },
      { key: 'medicationPsychotherapyPrescribed', label: 'Medication / Psychotherapy Prescribed', width: 'w-48' },
      { key: 'outcomeReferral', label: 'Outcome / Referral', width: 'w-36' },
      { key: 'nextAppointment', label: 'Next Appointment', width: 'w-28' },
      { key: 'clinicianSignature', label: 'Clinician Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', patientFullName: '', age: '',
      sex: '', addressKebele: '', visitType: '',
      psychiatricDiagnosisClinicalNotes: '',
      medicationPsychotherapyPrescribed: '',
      outcomeReferral: '', nextAppointment: '',
      clinicianSignature: ''
    }
  },
  {
    id: 'dental_opd_classic',
    name: 'Dental OPD Register',
    category: 'Specialty & Diagnostics',
    code: 'DENTAL-OPD-REG',
    description: 'Dental Clinic Outpatient Consultation, Examination & Procedure Logbook',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'address', label: 'Address (Kebele/Woreda)', width: 'w-32' },
      { key: 'chiefComplaint', label: 'Chief Complaint / History', width: 'w-40' },
      { key: 'dentalExamDiagnosis', label: 'Dental Examination / Diagnosis', width: 'w-44' },
      { key: 'treatmentPerformed', label: 'Treatment Performed / Procedure', width: 'w-44' },
      { key: 'medicationsPrescribed', label: 'Medications Prescribed', width: 'w-36' },
      { key: 'nextAppt', label: 'Next Appt Date', width: 'w-28' },
      { key: 'remarksOutcome', label: 'Remarks / Outcome', width: 'w-32' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', patientName: '', ageSex: '',
      address: '', chiefComplaint: '', dentalExamDiagnosis: '',
      treatmentPerformed: '', medicationsPrescribed: '',
      nextAppt: '', remarksOutcome: ''
    }
  },
  {
    id: 'ophthalmology_opd_eye_clinic',
    name: 'OPHTHALMOLOGY OPD & EYE CLINIC REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'EYE-OPD-REG',
    description: 'Standardized Outpatient Clinical Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'sex', label: 'Sex', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'visualAcuityReLe', label: 'Visual Acuity (RE / LE)', width: 'w-36' },
      { key: 'chiefComplaintExamination', label: 'Chief Complaint & Examination', width: 'w-48' },
      { key: 'ophthalmologicalDiagnosis', label: 'Ophthalmological Diagnosis', width: 'w-48' },
      { key: 'treatmentProcedureSpecs', label: 'Treatment / Procedure / Specs', width: 'w-48' },
      { key: 'outcomeReferral', label: 'Outcome / Referral', width: 'w-36' },
      { key: 'clinicianSignature', label: 'Clinician Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', patientFullName: '', age: '',
      sex: '', addressKebele: '', visualAcuityReLe: '',
      chiefComplaintExamination: '',
      ophthalmologicalDiagnosis: '',
      treatmentProcedureSpecs: '',
      outcomeReferral: '', clinicianSignature: ''
    }
  },
  {
    id: 'cervical_cancer',
    name: 'CERVICAL CANCER SCREENING & TREATMENT REGISTER',
    category: 'Specialty & Diagnostics',
    code: 'CERVICAL-SCREENING-REG',
    description: 'Health Management Information System (HMIS) Standardized Clinical Logbook (VIA / HPV / Thermal Ablation / LEEP)',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'age', label: 'Age', width: 'w-16' },
      { key: 'parity', label: 'Parity', width: 'w-16' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'screeningMethod', label: 'Screening Method', width: 'w-36' },
      { key: 'screeningResult', label: 'Screening Result', width: 'w-32' },
      { key: 'treatmentProvidedSameDayOther', label: 'Treatment Provided (Same-day/Other)', width: 'w-44' },
      { key: 'biopsyHistology', label: 'Biopsy / Histology', width: 'w-32' },
      { key: 'followUpDate', label: 'Follow-up Date', width: 'w-28' },
      { key: 'outcomeReferral', label: 'Outcome / Referral', width: 'w-36' },
      { key: 'providerNameSignature', label: 'Provider Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnCardNo: '', patientFullName: '', age: '',
      parity: '', addressKebele: '', screeningMethod: '',
      screeningResult: '', treatmentProvidedSameDayOther: '',
      biopsyHistology: '', followUpDate: '', outcomeReferral: '',
      providerNameSignature: ''
    }
  },
  {
    id: 'chronic_opd_ncds',
    name: 'Chronic OPD Register (NCDs)',
    category: 'Specialty & Diagnostics',
    code: 'NCD-CHRONIC-REG',
    description: 'Non-Communicable Diseases (NCDs), Hypertension, Diabetes & Asthma Monitoring',
    columns: [
      { key: 'sNo', label: 'S/No', width: 'w-12' },
      { key: 'date', label: 'Date', width: 'w-24' },
      { key: 'mrnId', label: 'MRN / ID', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'address', label: 'Address (Kebele/Woreda)', width: 'w-32' },
      { key: 'chronicDiagnosis', label: 'Chronic Diagnosis (HTN/DM/Asthma)', width: 'w-44' },
      { key: 'vitalsBpRbs', label: 'Vitals (BP / RBS / BMI)', width: 'w-36' },
      { key: 'medicationsRegimen', label: 'Medications / Current Regimen', width: 'w-44' },
      { key: 'nextApptDate', label: 'Next Appt Date', width: 'w-28' },
      { key: 'remarksComplications', label: 'Remarks / Complications', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', date: '', mrnId: '', patientName: '', ageSex: '',
      address: '', chronicDiagnosis: '',
      vitalsBpRbs: '', medicationsRegimen: '',
      nextApptDate: '', remarksComplications: ''
    }
  },
  {
    id: 'laboratory_services',
    name: 'Laboratory Services Register',
    category: 'Specialty & Diagnostics',
    code: 'LAB-SERVICES-REG',
    description: 'Master Diagnostic Accession, Specimen Tracking & Laboratory Results Logbook',
    columns: [
      { key: 'labNo', label: 'Lab No', width: 'w-20' },
      { key: 'dateTimeReq', label: 'Date / Time Req.', width: 'w-32' },
      { key: 'mrn', label: 'MRN', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'requestingWard', label: 'Requesting Ward / OPD', width: 'w-32' },
      { key: 'testsRequested', label: 'Test(s) Requested', width: 'w-44' },
      { key: 'specimenType', label: 'Specimen Type', width: 'w-28' },
      { key: 'resultFindings', label: 'Result Findings / Summary', width: 'w-48' },
      { key: 'dateTimeReleased', label: 'Date/Time Released', width: 'w-32' },
      { key: 'techSign', label: 'Tech Sign', width: 'w-28' }
    ],
    defaultRow: {
      labNo: '', dateTimeReq: '', mrn: '', patientName: '', ageSex: '',
      requestingWard: '', testsRequested: '',
      specimenType: '', resultFindings: '',
      dateTimeReleased: '', techSign: ''
    }
  },
  {
    id: 'radiology_imaging',
    name: 'Radiology & Imaging Register',
    category: 'Specialty & Diagnostics',
    code: 'RAD-IMAGING-REG',
    description: 'Master Diagnostic Imaging Requisition, Examination & Reporting Logbook',
    columns: [
      { key: 'accessionNo', label: 'Accession No', width: 'w-24' },
      { key: 'dateTimeReq', label: 'Date / Time Req.', width: 'w-32' },
      { key: 'mrn', label: 'MRN', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'wardOpd', label: 'Ward / OPD', width: 'w-28' },
      { key: 'modality', label: 'Modality (X-Ray/US/CT)', width: 'w-28' },
      { key: 'anatomicalPart', label: 'Anatomical Part / Indication', width: 'w-40' },
      { key: 'findingsReport', label: 'Findings / Radiologist Report', width: 'w-48' },
      { key: 'radiologistSign', label: 'Radiologist Sign', width: 'w-32' }
    ],
    defaultRow: {
      accessionNo: '', dateTimeReq: '', mrn: '', patientName: '', ageSex: '',
      wardOpd: '', modality: '', anatomicalPart: '',
      findingsReport: '',
      radiologistSign: ''
    }
  },
  {
    id: 'health_insurance_cbhi',
    name: 'Health Insurance & CBHI Patient Register',
    category: 'Finance & Administration',
    code: 'INSURANCE-CBHI-REG',
    description: 'Standardized Medical Insurance Verification & Claims Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'insuranceCbhiId', label: 'Insurance / CBHI ID', width: 'w-32' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'addressKebele', label: 'Address (Kebele)', width: 'w-32' },
      { key: 'schemeType', label: 'Scheme Type (CBHI/SHI/Priv)', width: 'w-36' },
      { key: 'diagnosisServices', label: 'Diagnosis / Services Rendered', width: 'w-44' },
      { key: 'claimAmount', label: 'Claim Amount', width: 'w-28' },
      { key: 'approvalStatus', label: 'Approval Status (App/Den/Pend)', width: 'w-36' },
      { key: 'remarksFollowup', label: 'Remarks / Follow-up', width: 'w-36' },
      { key: 'insuranceOfficerSig', label: 'Insurance Officer / Clerk Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', insuranceCbhiId: '', patientFullName: '', ageSex: '',
      addressKebele: '', schemeType: '', diagnosisServices: '',
      claimAmount: '', approvalStatus: '', remarksFollowup: '',
      insuranceOfficerSig: ''
    }
  },
  {
    id: 'mrn_master_register',
    name: 'MRN & Master Patient Register',
    category: 'Finance & Administration',
    code: 'MRN-MASTER-REG',
    description: 'Standardized Patient Identification & Medical Records Issuance Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'assignedMrn', label: 'Assigned MRN', width: 'w-32' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-44' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'address', label: 'Address (Kebele / Phone)', width: 'w-36' },
      { key: 'nextOfKin', label: 'Next of Kin & Contact', width: 'w-36' },
      { key: 'entryType', label: 'Entry Type (New/Ret/Trans)', width: 'w-32' },
      { key: 'remarksPreviousCard', label: 'Remarks / Previous Card No', width: 'w-36' },
      { key: 'recordsOfficer', label: 'Records Officer Signature', width: 'w-40' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', assignedMrn: '', patientName: '',
      ageSex: '', address: '', nextOfKin: '', entryType: '',
      remarksPreviousCard: '', recordsOfficer: ''
    }
  },
  {
    id: 'liaison_register',
    name: 'INTER-FACILITY & DEPARTMENTAL LIAISON REGISTER',
    category: 'Finance & Administration',
    code: 'LIAISON-REG',
    description: 'Standardized Coordination & Communication Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'patientSubjectNameMrn', label: 'Patient / Subject Name & MRN', width: 'w-44' },
      { key: 'referringSourceUnitFacility', label: 'Referring / Source Unit / Facility', width: 'w-40' },
      { key: 'receivingTargetUnitFacility', label: 'Receiving / Target Unit / Facility', width: 'w-40' },
      { key: 'contactPerson', label: 'Contact Person', width: 'w-32' },
      { key: 'purposeLiaisonNatureInquiry', label: 'Purpose of Liaison / Nature of Inquiry', width: 'w-48' },
      { key: 'actionRequiredCoordinationDetails', label: 'Action Required / Coordination Details', width: 'w-48' },
      { key: 'statusPendDone', label: 'Status (Pend/Done)', width: 'w-28' },
      { key: 'outcomeFeedback', label: 'Outcome / Feedback', width: 'w-36' },
      { key: 'officerNameDesignationSignature', label: 'Officer Name, Designation & Signature', width: 'w-48' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', patientSubjectNameMrn: '', referringSourceUnitFacility: '',
      receivingTargetUnitFacility: '', contactPerson: '',
      purposeLiaisonNatureInquiry: '',
      actionRequiredCoordinationDetails: '',
      statusPendDone: '', outcomeFeedback: '',
      officerNameDesignationSignature: ''
    }
  },
  {
    id: 'social_work_patient_support',
    name: 'SOCIAL WORK & PATIENT SUPPORT REGISTER',
    category: 'Finance & Administration',
    code: 'SOCIAL-WORK-REG',
    description: 'Standardized Clinical Social Services & Welfare Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'patientClientName', label: 'Patient / Client Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'address', label: 'Address (Kebele / Phone)', width: 'w-32' },
      { key: 'referringWard', label: 'Referring Unit / Ward', width: 'w-32' },
      { key: 'assessmentChiefNeed', label: 'Social & Economic Assessment / Chief Need', width: 'w-48' },
      { key: 'servicesProvided', label: 'Services Provided (Counseling, Support, Referral)', width: 'w-48' },
      { key: 'assistanceRendered', label: 'Assistance / Material Aid Rendered', width: 'w-40' },
      { key: 'outcomeFollowupPlan', label: 'Outcome / Follow-up Plan', width: 'w-36' },
      { key: 'socialWorkerSignature', label: 'Social Worker Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', patientClientName: '', ageSex: '',
      address: '', referringWard: '', assessmentChiefNeed: '',
      servicesProvided: '', assistanceRendered: '',
      outcomeFollowupPlan: '', socialWorkerSignature: ''
    }
  },
  {
    id: 'palliative_rehab',
    name: 'Palliative & Rehabilitation Care Register',
    category: 'Specialty & Diagnostics',
    code: 'PALLIATIVE-REHAB',
    description: 'Standardized Clinical Care, Pain Management & Physical Therapy Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / Card No', width: 'w-28' },
      { key: 'patientName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'address', label: 'Address (Kebele / Phone)', width: 'w-32' },
      { key: 'diagnosisCondition', label: 'Diagnosis / Underlying Condition', width: 'w-44' },
      { key: 'careType', label: 'Care Type (Pall/Rehab/OT/PT)', width: 'w-32' },
      { key: 'assessmentFunctional', label: 'Assessment / Functional Status', width: 'w-40' },
      { key: 'treatmentPainManagement', label: 'Treatment / Therapy / Pain Management', width: 'w-48' },
      { key: 'outcomeDischarge', label: 'Outcome / Progress / Discharge', width: 'w-36' },
      { key: 'clinicianSignature', label: 'Clinician / Therapist Name & Signature', width: 'w-40' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', patientName: '', ageSex: '',
      address: '', diagnosisCondition: '', careType: '',
      assessmentFunctional: '', treatmentPainManagement: '',
      outcomeDischarge: '', clinicianSignature: ''
    }
  },
  {
    id: 'health_education',
    name: 'HEALTH EDUCATION & COMMUNITY HEALTH PROMOTION REGISTER',
    category: 'Finance & Administration',
    code: 'HEALTH-EDU-PROMOTION',
    description: 'Standardized Health Education Session & Community Outreach Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'topicSubject', label: 'Topic / Health Education Subject', width: 'w-48' },
      { key: 'targetAudience', label: 'Target Audience / Group', width: 'w-40' },
      { key: 'venueLocation', label: 'Venue / Location', width: 'w-36' },
      { key: 'attendeesCount', label: 'Attendees (M / F / Total)', width: 'w-32' },
      { key: 'materialsAids', label: 'Materials / Aids Used', width: 'w-40' },
      { key: 'keyDiscussionPoints', label: 'Key Discussion Points / Feedback', width: 'w-48' },
      { key: 'supervisorNotes', label: 'Supervisor / Reviewer Notes', width: 'w-40' },
      { key: 'facilitatorSignature', label: 'Facilitator Name & Signature', width: 'w-44' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', topicSubject: '',
      targetAudience: '', venueLocation: '',
      attendeesCount: '', materialsAids: '',
      keyDiscussionPoints: '', supervisorNotes: '',
      facilitatorSignature: ''
    }
  },
  {
    id: 'pre_triage_screening',
    name: 'Pre-Triage & Infection Screening Register',
    category: 'Outpatient & Emergency',
    code: 'PRE-TRIAGE-SCREEN',
    description: 'Facility Entrance Temperature & Respiratory Infection Screening Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'mrnCardNo', label: 'MRN / ID No', width: 'w-28' },
      { key: 'visitorName', label: 'Patient / Visitor Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'temperature', label: 'Temp (°C)', width: 'w-20' },
      { key: 'respiratorySymptoms', label: 'Respiratory Symptoms (Cough/Sore Throat)', width: 'w-44' },
      { key: 'travelContactHistory', label: 'High Risk Travel / Contact History', width: 'w-40' },
      { key: 'screeningDisposition', label: 'Screening Disposition (Pass/Isolation/ER)', width: 'w-40' },
      { key: 'screenerSig', label: 'Screener Name & Sig', width: 'w-36' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', mrnCardNo: '', visitorName: '', ageSex: '',
      temperature: '', respiratorySymptoms: '', travelContactHistory: '',
      screeningDisposition: '', screenerSig: ''
    }
  },
  {
    id: 'mrn_master_patient',
    name: 'Medical Record Number (MRN) & Master Patient Register',
    category: 'Finance & Administration',
    code: 'MRN-MASTER-REG',
    description: 'Standardized Patient Identification & Records Issuance Logbook',
    columns: [
      { key: 'sNo', label: 'S.No', width: 'w-12' },
      { key: 'dateTime', label: 'Date & Time', width: 'w-28' },
      { key: 'assignedMrn', label: 'Assigned MRN', width: 'w-28' },
      { key: 'patientFullName', label: 'Patient Full Name', width: 'w-40' },
      { key: 'ageSex', label: 'Age / Sex', width: 'w-20' },
      { key: 'address', label: 'Address (Kebele / Phone)', width: 'w-32' },
      { key: 'nextOfKinContact', label: 'Next of Kin & Contact', width: 'w-36' },
      { key: 'entryType', label: 'Entry Type (New/Ret/Trans)', width: 'w-32' },
      { key: 'remarks', label: 'Remarks / Previous Card No', width: 'w-36' },
      { key: 'recordsOfficerSig', label: 'Records Officer Name & Signature', width: 'w-40' }
    ],
    defaultRow: {
      sNo: '1', dateTime: '', assignedMrn: '', patientFullName: '', ageSex: '',
      address: '', nextOfKinContact: '', entryType: '',
      remarks: '', recordsOfficerSig: ''
    }
  }
];

interface StandardPdfRegisterSuiteProps {
  hospital_id: string;
  staffName: string;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onBackToLogbook?: () => void;
  selectedTemplateId?: string;
  onSelectTemplate?: (id: string) => void;
  authenticatedUser?: any;
  activeView?: 'standard' | 'saved';
  onViewChange?: (view: 'standard' | 'saved') => void;
}

export default function StandardPdfRegisterSuite({ 
  hospital_id, 
  staffName, 
  addToast, 
  onBackToLogbook,
  selectedTemplateId: controlledTemplateId,
  onSelectTemplate: controlledSetTemplateId,
  authenticatedUser,
  activeView: controlledView,
  onViewChange: controlledSetView
}: StandardPdfRegisterSuiteProps) {
  const [internalTemplateId, setInternalTemplateId] = useState<string>('opd_abstract');
  const [internalView, setInternalView] = useState<'standard' | 'saved'>('standard');
  
  const selectedTemplateId = controlledTemplateId !== undefined ? controlledTemplateId : internalTemplateId;
  const setSelectedTemplateId = controlledSetTemplateId !== undefined ? controlledSetTemplateId : setInternalTemplateId;
  
  const view = controlledView !== undefined ? controlledView : internalView;
  const setView = controlledSetView !== undefined ? controlledSetView : setInternalView;

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  
  // Active Template Object
  const currentTemplate = STANDARD_PDF_TEMPLATES.find(t => t.id === selectedTemplateId) || STANDARD_PDF_TEMPLATES[0];

  // Metadata State
  const [metadata, setMetadata] = useState({
    facilityName: hospital_id || 'General Hospital',
    region: '',
    zoneWoreda: '',
    departmentUnit: 'Main Outpatient Department',
    beginDate: new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
    endDate: new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
    officerInCharge: staffName
  });

  // Rows State
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Quick Copy-Paste Modal State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');

  const isRealRow = (row: Record<string, any>): boolean => {
    if (!row) return false;
    const values = Object.values(row).map(v => String(v).toLowerCase().trim());
    const hasMockOrError = values.some(val => 
      ['test', 'mock', 'dummy', 'placeholder', 'false', 'temp', 'error', 'invalid'].some(word => val.includes(word)) ||
      ['12345', '123456', '12345678', '000000', '111111'].some(seq => val === seq)
    );
    return !hasMockOrError;
  };

  // Helper to detect fake/false/mock/invalid/test/error rows
  const isFakeOrFalseRow = (row: Record<string, any>): boolean => {
    if (!row) return false;
    const ignoredKeys = ['sNo', 'id', 'uuid', 'key'];
    return Object.entries(row).some(([key, val]) => {
      if (ignoredKeys.includes(key)) return false;
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        return (
          lower.includes('fake') ||
          lower.includes('mock') ||
          lower.includes('test') ||
          lower.includes('dummy') ||
          lower.includes('false') ||
          lower.includes('invalid') ||
          lower.includes('error')
        );
      }
      return false;
    });
  };
  
  // Initialize column widths from template
  useEffect(() => {
    const initialWidths: Record<string, number> = {};
    currentTemplate.columns.forEach(col => {
      if (col.width?.startsWith('w-')) {
        const val = parseInt(col.width.replace('w-', ''));
        // Convert Tailwind w-x to pixels (roughly w-28 = 112px, w-44 = 176px)
        initialWidths[col.key] = val * 4;
      } else {
        initialWidths[col.key] = 150;
      }
    });
    setColumnWidths(initialWidths);
  }, [selectedTemplateId, currentTemplate.columns]);

  const handleColumnResize = (key: string, startX: number, startWidth: number) => {
    const onMouseMove = (e: MouseEvent) => {
      const delta = e.pageX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(60, startWidth + delta)
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedRecordsList, setSavedRecordsList] = useState<any[]>([]);

  // Fetch saved records for the 'Saved' view
  useEffect(() => {
    async function fetchSavedList() {
      if (view !== 'saved' || !authenticatedUser?.id) return;
      setIsLoadingSaved(true);
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const colRef = collection(db, 'pdf_standard_registers');
        const snap = await getDocs(colRef);
        const list: any[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId === authenticatedUser.id || docSnap.id.includes(`_${authenticatedUser.id}_`)) {
            list.push({
              id: docSnap.id,
              templateId: data.templateId || 'opd_abstract',
              templateName: data.templateName || 'Standard Register',
              updatedAt: data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : data.updatedAt || 'Recently',
              rowsCount: Array.isArray(data.rows) ? data.rows.length : 0
            });
          }
        });
        setSavedRecordsList(list);
      } catch (err) {
        console.warn('Failed to fetch saved records list in Suite:', err);
      } finally {
        setIsLoadingSaved(true);
        setTimeout(() => setIsLoadingSaved(false), 500);
      }
    }
    fetchSavedList();
  }, [view, authenticatedUser, hospital_id]);

  // Fetch or setup default rows when template changes
  useEffect(() => {
    async function loadTableData() {
      setIsFetching(true);
      try {
        const docId = authenticatedUser 
          ? `${hospital_id}_${authenticatedUser.id}_${selectedTemplateId}` 
          : `${hospital_id}_${selectedTemplateId}`;
        
        let docRef = doc(db, 'pdf_standard_registers', docId);
        let snap = await getDoc(docRef);
        
        // Fallback to global/tenant-level if user-specific doesn't exist
        if (!snap.exists() && authenticatedUser) {
          const globalDocRef = doc(db, 'pdf_standard_registers', `${hospital_id}_${selectedTemplateId}`);
          snap = await getDoc(globalDocRef);
        }

        if (snap.exists()) {
          const data = snap.data();
          if (data.metadata) setMetadata(prev => ({ ...prev, ...data.metadata }));
          if (Array.isArray(data.rows)) {
            setRows(data.rows);
          } else {
            setRows([]);
          }
        } else {
          setRows([]);
        }
      } catch (err) {
        console.warn('Could not fetch register data:', err);
        setRows([]);
      } finally {
        setIsFetching(false);
      }
    }

    loadTableData();
  }, [selectedTemplateId, hospital_id, authenticatedUser]);

  // Handle Save
  const handleSaveTable = async () => {
    setIsSaving(true);
    try {
      const docId = authenticatedUser 
        ? `${hospital_id}_${authenticatedUser.id}_${selectedTemplateId}` 
        : `${hospital_id}_${selectedTemplateId}`;

      const hasFakeRows = rows.some(isFakeOrFalseRow);
      // Clean / filter out the fake rows and assign 1.1.1 to 1.1.1.z alphanumeric schema codes
      const cleanRows = rows.filter(row => !isFakeOrFalseRow(row));
      const validRows = assignAuditSchemaCodes(cleanRows, '1.1.1');

      if (hasFakeRows) {
        addToast?.('warning', 'Identified fake, mock, or invalid records. Filtered them out of the permanent logbook save to ensure data integrity.');
      }

      const docRef = doc(db, 'pdf_standard_registers', docId);
      await setDoc(docRef, {
        hospital_id,
        templateId: selectedTemplateId,
        templateName: currentTemplate.name,
        metadata,
        rows: validRows,
        userId: authenticatedUser?.id || null,
        userEmail: authenticatedUser?.email || null,
        updatedAt: serverTimestamp(),
        updatedBy: staffName,
        isUserSaved: !!authenticatedUser
      });

      // Update local state to match the clean, recorded rows
      setRows(validRows);
      
      addToast?.('success', `${currentTemplate.name} saved successfully under active account!`);
      
      // Notify active logbook accounts list of update
      window.dispatchEvent(new CustomEvent('savedRegisterUpdate'));
    } catch (err) {
      console.error('Failed to save register:', err);
      addToast?.('error', 'Failed to save register table. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Row
  const handleAddRow = () => {
    const nextSNo = String(rows.length + 1);
    setRows(prev => [
      ...prev,
      { ...currentTemplate.defaultRow, sNo: nextSNo }
    ]);
  };

  // Delete Row
  const handleDeleteRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleAutoCalculateSummary = (field: { key: string; label: string; formula: string }) => {
    // Filter out false/fake information to satisfy "don't count false or fake information"
    const validRows = rows.filter(row => !isFakeOrFalseRow(row));
    if (field.formula === 'count') return validRows.length;
    if (field.formula.includes(':')) {
      const [colKey, val] = field.formula.split(':');
      return validRows.filter(r => String(r[colKey]) === val).length;
    }
    return 0;
  };

  // Clear All
  const handleClearAllRows = () => {
    if (rows.length === 0) return;
    if (window.confirm(`Are you sure you want to clear all ${rows.length} rows from this register?`)) {
      setRows([]);
      addToast?.('info', 'All rows cleared. Click Save Table to apply.');
    }
  };

  // Parse Raw Copied Text into Table Rows
  const handleProcessPastedText = () => {
    if (!rawPastedText.trim()) {
      addToast?.('warning', 'Please paste text into the area first.');
      return;
    }

    const lines = rawPastedText.trim().split('\n').filter(l => l.trim().length > 0);
    const newParsedRows: Record<string, any>[] = [];

    lines.forEach((line, idx) => {
      // Split by tab or comma or multispaces
      const parts = line.includes('\t') ? line.split('\t') : line.split(/,\s*/);
      const rowData: Record<string, any> = { ...currentTemplate.defaultRow };

      currentTemplate.columns.forEach((col, cIdx) => {
        if (parts[cIdx] !== undefined && parts[cIdx].trim() !== '') {
          rowData[col.key] = parts[cIdx].trim();
        }
      });

      rowData.sNo = String(rows.length + idx + 1);
      newParsedRows.push(rowData);
    });

    setRows(prev => [...prev, ...newParsedRows]);

    setRawPastedText('');
    setShowPasteModal(false);
    addToast?.('success', `Parsed and added ${newParsedRows.length} new records!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = currentTemplate.columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const csvRows = rows.map(r => {
      return currentTemplate.columns.map(c => {
        const val = String(r[c.key] ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const blob = new Blob([ [headers, ...csvRows].join('\n') ], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTemplate.id}_${hospital_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast?.('success', 'Exported register to CSV format.');
  };

  // Export PDF using jsPDF
  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: currentTemplate.columns.length > 8 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const hospitalTitle = metadata.facilityName || 'FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA - MINISTRY OF HEALTH';
      const timestamp = new Date().toLocaleString();

      // Hospital & Ministry Header Branding
      doc.setFillColor(49, 46, 129); // Deep Indigo
      doc.rect(0, 0, doc.internal.pageSize.width, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('HEALTHFLOW EHR • OFFICIAL CLINICAL REGISTER LOGBOOK REPORT', 10, 6.5);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(hospitalTitle.toUpperCase(), 10, 18);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${currentTemplate.name} (${currentTemplate.code})`, 10, 24);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Region/Zone: ${metadata.region || 'N/A'} | Department/Ward: ${metadata.departmentUnit || 'N/A'} | Period: ${metadata.beginDate || 'Start'} to ${metadata.endDate || 'Present'}`, 10, 29);
      doc.text(`Generated Timestamp: ${timestamp} | Total Logged Records: ${rows.length}`, 10, 33);

      // Prepare Table Headers & Rows
      const tableHeaders = currentTemplate.columns.map(c => c.label);
      const tableData = rows.map(r => 
        currentTemplate.columns.map(col => String(r[col.key] ?? ''))
      );

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 37,
        styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [49, 46, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 37, left: 8, right: 8, bottom: 12 }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Official Register Logbook Report • Page ${i} of ${pageCount}`, 10, doc.internal.pageSize.height - 5);
      }

      doc.save(`${currentTemplate.id}_logbook_report_${Date.now()}.pdf`);
      addToast?.('success', 'Clean PDF report exported successfully with hospital branding!');
    } catch (err: any) {
      console.error('PDF export error:', err);
      addToast?.('error', 'Failed to generate PDF report.');
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Filter Categories
  const categories = ['All', ...Array.from(new Set(STANDARD_PDF_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = STANDARD_PDF_TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = t.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                        t.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        t.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-600/20">
                Official Standardized Logbook Templates
              </span>
              <span className="text-slate-500 text-xs font-mono">Editable Format</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-2">
              <FileText className="text-indigo-600 dark:text-indigo-400" size={24} />
              <span>Standardized Clinical Registers (Editable Suite)</span>
            </h2>

            <div className="flex items-center gap-2 mt-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select View:</label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                <button
                  onClick={() => setView('standard')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${
                    view === 'standard' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Table size={13} />
                  <span>Standard</span>
                </button>
                <button
                  onClick={() => setView('saved')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${
                    view === 'saved' 
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Database size={13} />
                  <span>Saved</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onBackToLogbook && (
              <button
                onClick={onBackToLogbook}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Logbook Ledger</span>
              </button>
            )}

            {currentTemplate.instructions && (
              <button
                onClick={() => setShowInstructions(true)}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 cursor-pointer"
              >
                <Info size={15} />
                <span>View Instructions</span>
              </button>
            )}

            <button
              onClick={() => setShowPasteModal(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200 dark:border-amber-800 cursor-pointer"
            >
              <Clipboard size={15} />
              <span>Paste from PDF / Excel</span>
            </button>

            <button
              onClick={handleSaveTable}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : 'Save Register'}</span>
            </button>

            <button
              onClick={handleClearAllRows}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-all border border-rose-200 dark:border-rose-900/40 cursor-pointer"
              title="Clear all records"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-xs font-bold cursor-pointer"
              title="Export to CSV"
            >
              <FileSpreadsheet size={16} />
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Generate printable PDF report with hospital branding and timestamp"
            >
              <Download size={15} />
              <span>Export to PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print View</span>
            </button>
          </div>
        </div>
      </div>

      {view === 'saved' ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Saved</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Access clinical records saved specifically under your authorized session.</p>
            </div>
          </div>

          {isLoadingSaved ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="text-indigo-600 animate-spin" size={32} />
              <span className="text-sm font-bold text-slate-400">Synchronizing database...</span>
            </div>
          ) : savedRecordsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40">
              <Sparkles size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
              <h4 className="text-base font-black text-slate-800 dark:text-white uppercase mb-1">No saved records found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-medium">
                Switch to 'Standard' view, fill in a register, and click 'Save Register' to begin your collection.
              </p>
              <button
                onClick={() => setView('standard')}
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-wider"
              >
                Go to Standard View
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {savedRecordsList.map(record => (
                <div key={record.id} className="group p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase border border-indigo-100 dark:border-indigo-900">
                        {record.templateId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{record.updatedAt}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight mb-2 truncate">
                      {record.templateName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Table size={14} />
                      <span className="font-bold">{record.rowsCount} Records Logged</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplateId(record.templateId);
                        setView('standard');
                        addToast?.('success', `Successfully loaded ${record.templateName} clinical records.`);
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer"
                    >
                      Load & View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* TEMPLATE PICKER BAR */}
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter size={12} /> Category:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template Select Dropdown & Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                Select Standard Register Template ({filteredTemplates.length} available)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {filteredTemplates.map(tmp => (
                  <option key={tmp.id} value={tmp.id}>
                    [{tmp.code}] {tmp.name} ({tmp.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Search Template Name</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter registers..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

      {/* METADATA / HEADER FORM */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:shadow-none print:p-0 print:border-none">
        
        {/* Official Standard Heading */}
        <div className="text-center border-b pb-5 mb-5 border-slate-200 dark:border-slate-800">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl border border-indigo-600/20 shadow-inner">
              <Building size={22} />
            </div>
          </div>
          <div className="inline-block bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[10px] font-black tracking-widest px-3 py-0.5 rounded-full uppercase mb-1">
            OFFICIAL STANDARDIZED REGISTER • {currentTemplate.code}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {currentTemplate.name}
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
            {currentTemplate.description}
          </p>
        </div>

        {/* Metadata Inputs */}
        {selectedTemplateId === 'laboratory_services' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs print:grid-cols-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hospital / Facility Name</label>
              <input
                type="text"
                value={metadata.facilityName}
                onChange={(e) => setMetadata({ ...metadata, facilityName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Laboratory Section</label>
              <input
                type="text"
                value={metadata.departmentUnit}
                onChange={(e) => setMetadata({ ...metadata, departmentUnit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Month / Year</label>
              <input
                type="text"
                value={metadata.beginDate}
                onChange={(e) => setMetadata({ ...metadata, beginDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="e.g. July 2026"
              />
            </div>
          </div>
        ) : selectedTemplateId === 'radiology_imaging' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs print:grid-cols-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hospital / Facility Name</label>
              <input
                type="text"
                value={metadata.facilityName}
                onChange={(e) => setMetadata({ ...metadata, facilityName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Department / Modality</label>
              <input
                type="text"
                value={metadata.departmentUnit}
                onChange={(e) => setMetadata({ ...metadata, departmentUnit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Month / Year</label>
              <input
                type="text"
                value={metadata.beginDate}
                onChange={(e) => setMetadata({ ...metadata, beginDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="e.g. July 2026"
              />
            </div>
          </div>
        ) : selectedTemplateId === 'ipd_register' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs print:grid-cols-5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Health Facility Name</label>
              <input
                type="text"
                value={metadata.facilityName}
                onChange={(e) => setMetadata({ ...metadata, facilityName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Region / Zone / Woreda</label>
              <input
                type="text"
                value={metadata.region}
                onChange={(e) => setMetadata({ ...metadata, region: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Name of Ward</label>
              <input
                type="text"
                value={metadata.departmentUnit}
                onChange={(e) => setMetadata({ ...metadata, departmentUnit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="e.g. Medical Ward"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Begin Date</label>
              <input
                type="text"
                value={metadata.beginDate}
                onChange={(e) => setMetadata({ ...metadata, beginDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">End Date</label>
              <input
                type="text"
                value={metadata.endDate}
                onChange={(e) => setMetadata({ ...metadata, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs print:grid-cols-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Facility Name</label>
              <input
                type="text"
                value={metadata.facilityName}
                onChange={(e) => setMetadata({ ...metadata, facilityName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Region / Zone / Woreda</label>
              <input
                type="text"
                value={metadata.region}
                onChange={(e) => setMetadata({ ...metadata, region: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Begin Date</label>
              <input
                type="text"
                value={metadata.beginDate}
                onChange={(e) => setMetadata({ ...metadata, beginDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">End Date</label>
              <input
                type="text"
                value={metadata.endDate}
                onChange={(e) => setMetadata({ ...metadata, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 rounded-t-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
        )}
      </div>

      {/* EDITABLE TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-slate-400">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Interactive Table Rows ({rows.length})
            </span>
            <span className="text-[11px] text-slate-400">| Auto-formatted PDF Ledger</span>
          </div>

          <button
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table 
            className="text-left border-collapse"
            style={{ 
              width: 'max-content',
              minWidth: '100%'
            }}
          >
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700">
                {currentTemplate.columns.map(col => (
                  <th 
                    key={col.key} 
                    className="p-2.5 border-r border-slate-200 dark:border-slate-700 relative group select-none whitespace-nowrap"
                    style={{ 
                      width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                      minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined
                    }}
                  >
                    <div className="truncate pr-2" title={col.label}>{col.label}</div>
                    {/* Draggable Handle */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-600 transition-colors z-10 print:hidden"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleColumnResize(col.key, e.pageX, columnWidths[col.key] || 150);
                      }}
                    />
                  </th>
                ))}
                <th className="p-2.5 w-16 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={currentTemplate.columns.length + 1} className="p-8 text-center text-slate-400 font-bold">
                    No rows present. Click "Add Row" to populate data.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => {
                  const isFake = isFakeOrFalseRow(row);
                  return (
                    <tr 
                      key={rIdx} 
                      className={`transition-colors ${
                        isFake 
                          ? 'bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border-l-4 border-l-rose-500' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {currentTemplate.columns.map(col => (
                        <td key={col.key} className="p-1 border-r border-slate-200 dark:border-slate-800">
                          <input
                            type="text"
                            value={row[col.key] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRows(prev => {
                                const copy = [...prev];
                                copy[rIdx] = { ...copy[rIdx], [col.key]: val };
                                return copy;
                              });
                            }}
                            className="w-full px-2 py-1 bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded text-xs text-slate-900 dark:text-slate-100 font-medium outline-none transition-all"
                          />
                        </td>
                      ))}
                      <td className="p-1 text-center print:hidden">
                        <div className="flex items-center justify-center gap-2">
                          {isFake && (
                            <span 
                              className="text-[10px] text-rose-600 dark:text-rose-400 font-black bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded cursor-help"
                              title="Fake/False data detected! This row is excluded from permanent recorded logs and reporting summary counts."
                            >
                              Excluded
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500 mr-2">
              Total Records: <strong className="text-slate-900 dark:text-white">{rows.length}</strong>
            </span>
            {rows.some(isFakeOrFalseRow) && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-black bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5">
                <span>⚠️ {rows.filter(isFakeOrFalseRow).length} False/Fake record(s) excluded from recording & counts</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PRINTABLE SIGNATURE BLOCK */}
      <div className="hidden print:block pt-12 text-slate-900">
        <div className="flex justify-between items-end border-t border-slate-400 pt-6">
          <div>
            <p className="text-xs font-bold uppercase">Prepared / Recorded By:</p>
            <p className="text-sm font-black mt-1">{staffName}</p>
            <p className="text-[10px] text-slate-600">Authorized Clinical Logbook Officer</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-900 mb-1"></div>
            <p className="text-xs font-bold uppercase">Signature & Date</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase">Verified By Facility Manager:</p>
            <div className="w-48 border-b border-slate-900 mt-6 mb-1"></div>
            <p className="text-[10px] text-slate-600">Official Stamp & Seal</p>
          </div>
        </div>
      </div>

      {/* REGISTER SUMMARY TOTALS (REPORTING COUNTS) */}
        {currentTemplate.summaryFields && rows.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 animate-fadeIn mt-6 print:mt-10 print:border-slate-900 print:bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg print:hidden">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest print:text-slate-900">
                Register Summary Totals (Reporting Counts)
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {currentTemplate.summaryFields.map((field) => (
                <div key={field.key} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-slate-900 print:p-2">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1 truncate print:text-slate-700" title={field.label}>
                    {field.label}
                  </span>
                  <span className="block text-xl font-black text-slate-900 dark:text-white print:text-base">
                    {handleAutoCalculateSummary(field)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )}

    {/* INSTRUCTIONS MODAL */}
      {showInstructions && currentTemplate.instructions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="text-amber-500" size={20} />
                <span>{currentTemplate.instructions.title}</span>
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {currentTemplate.instructions.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start group">
                  <div className="mt-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black rounded border border-slate-200 dark:border-slate-700 group-hover:border-amber-500/50 transition-colors">
                    {item.sn}
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                      {item.term}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-6 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-extrabold rounded-xl hover:opacity-90 transition-all"
              >
                Got it, Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE / PARSE MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clipboard className="text-emerald-500" size={20} />
                <span>Paste Table Data (PDF / Excel / CSV)</span>
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Copy tabular text directly from your PDF register or Excel spreadsheet, paste it below, and click <strong>Auto-Parse</strong> to append the records to <strong>{currentTemplate.name}</strong>.
            </p>

            <textarea
              rows={8}
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder="Paste tab-separated or comma-separated row text here..."
              className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPastedText}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={15} />
                <span>Auto-Parse into Table</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
