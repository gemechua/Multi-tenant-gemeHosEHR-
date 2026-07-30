import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Activity, Users, Clipboard, CreditCard, Heart, CheckCircle2, 
  Trash2, Camera, Shield, Bell, RefreshCw, Sparkles, Upload, Printer, AlertCircle,
  Plus, DollarSign, Calendar, Eye, Image as ImageIcon, Play, ArrowRight, Check,
  ChevronLeft, ChevronRight, Home, Pill, Database, Folder, Search, Globe, X, Mic,
  Clock, Download
} from 'lucide-react';
import { 
  collection, addDoc, getDocs, getDoc, query, where, orderBy, deleteDoc, doc, updateDoc, onSnapshot, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ENTITIES_CONFIG } from '../data/schema';
import { IntakeForm } from './IntakeForm';
import { SyncHistory } from './SyncHistory';
import { RefillApprovalQueue } from './RefillApprovalQueue';
import ModuleLock from './ModuleLock';
import { isOffline, queueForSync } from '../lib/offlineSync';
import { submitClinicalSubmission } from '../lib/workflow';
import EDLabResultsReport from './EDLabResultsReport';
import EDRadiologyResultsReport from './EDRadiologyResultsReport';
import { validateOutpatientPrescription, validatePrescriptionSchema } from '../utils/prescriptionValidation';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'camera' | 'date' | 'date-time' | 'audio' | 'file';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface Subsection {
  id: string;
  name: string;
  category?: 'outpatient' | 'inpatient' | 'both';
  fields: FormField[];
}

export interface HospitalModule {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  subsections: Subsection[];
}

type SubsectionStatus = 'not_started' | 'draft' | 'saved' | 'pending' | 'initialized';

// Compact and comprehensive modules definitions mapping Hospital Modules
export const MODULES_CONFIG: HospitalModule[] = [
  {
    id: 'Module-1',
    title: 'Module 1: Medical Services',
    icon: Heart,
    description: 'Patient registrations, outpatient and inpatient intake procedures, cashier verifications, and clinical departments.',
    subsections: [
      {
        id: '1.1.1',
        name: '1.1.1 Patient Registration & Background Info (Open Account Folder)',
        category: 'both',
        fields: [
          { key: 'patient_mrn', label: 'Medical Record Number (MRN)*', type: 'text', placeholder: 'MRN-2026-XXXX', required: true },
          { key: 'patient_name', label: 'Patient Name*', type: 'text', placeholder: 'Full Name', required: true },
          { key: 'patient_age', label: 'Age*', type: 'number', placeholder: 'Age in years', required: true },
          { key: 'patient_sex', label: 'Sex*', type: 'select', options: ['Male', 'Female'], required: true },
          { key: 'dob', label: 'Date of Birth', type: 'text', placeholder: 'YYYY-MM-DD' },
          { key: 'phone', label: 'Phone Number', type: 'text', placeholder: '+251 XXX XXX XXX' },
          { key: 'registration_date', label: 'Registration Date*', type: 'date', required: true },
          { key: 'patient_address', label: 'Address*', type: 'text', placeholder: 'Woreda, Kebele, House No.', required: true },
          { key: 'insurance_status', label: 'Insurance Status*', type: 'select', options: ['Paying', 'No', 'CBHI', 'Staff/Dependent', 'Waiver'], required: true },
          { key: 'referral_facility', label: 'Referral Source Facility (Optional)', type: 'text', placeholder: 'Referring clinic or hospital' },
          { key: 'referral_image', label: 'Referral Papers Capture (Optional)', type: 'camera', required: false }
        ]
      },
      {
        id: '1.1.1.0',
        name: '1.1.1.0 Patient Registration Payment Request Add Items Form Summary',
        category: 'both',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'patient_name', label: 'Patient Name*', type: 'text', required: true },
          { key: 'amount', label: 'Payment Amount (ETB)*', type: 'number', placeholder: 'e.g., 100', required: true },
          { key: 'payment_reason', label: 'Reason for payment', type: 'select', options: ['Account Open Folder Request', 'Card Renewal', 'Re-issue'], required: true },
          { key: 'summary', label: 'Summary / Findings*', type: 'textarea', required: true, placeholder: 'Enter key summary findings here...' }
        ]
      },
      {
        id: '1.1.1.1',
        name: '1.1.1.1 Cashier Payment Verification Add Items Form Summary',
        category: 'both',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'invoice_number', label: 'Invoice / Insurance Number*', type: 'text', required: true },
          { key: 'payment_status', label: 'Status*', type: 'select', options: ['Paid', 'Pending CBHI Verification', 'Waiver Approved'], required: true },
          { key: 'summary', label: 'Summary / Findings*', type: 'textarea', required: true, placeholder: 'Enter key summary findings here...' }
        ]
      },
      {
        id: '1.1.1.2',
        name: '1.1.1.2 EHR Clinical Hub Folder (Open Hub)',
        category: 'both',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'patient_name', label: 'Patient Name*', type: 'text', required: true },
          { key: 'hub_status', label: 'Clinical Hub Status*', type: 'select', options: ['Active Folder', 'Archived', 'Transferred'], required: true },
          { key: 'clinical_notes', label: 'Overall Clinical Summary / Hub Intake Notes', type: 'textarea', placeholder: 'Active notes for the patient in this Clinical Hub session...' }
        ]
      },
      {
        id: '1.1.1.a',
        name: '1.1.1.a Pre-Triage Screen Intake Add Items Form Summary',
        category: 'outpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'pre_triage_priority', label: 'Pre-Triage Priority Screen*', type: 'select', options: ['Green (Routine/Non-Urgent)', 'Yellow (Delayed/Urgent)', 'Red (Immediate/Emergency)'], required: true },
          { key: 'pre_triage_chief_complaint', label: 'Chief Complaint / Main Issue*', type: 'textarea', placeholder: 'What brought the patient in today?', required: true },
          { key: 'pre_triage_screening_notes', label: 'Pre-Triage Screening Notes', type: 'textarea', placeholder: 'General observation notes, mobility status, visible symptoms, etc.' },
          { key: 'pre_triage_vital_bp', label: 'Initial Blood Pressure Check', type: 'text', placeholder: 'e.g., 120/80' },
          { key: 'pre_triage_vital_pulse', label: 'Initial Pulse Rate (bpm)', type: 'number', placeholder: 'bpm' },
          { key: 'pre_triage_vital_temp', label: 'Initial Temperature (°C)', type: 'number', placeholder: '°C' },
          { key: 'summary', label: 'Summary / Findings*', type: 'textarea', required: true, placeholder: 'Enter key summary findings here...' }
        ]
      },
       {
        id: '1.1.1.b',
        name: '1.1.1.b Triage Add Items Form & Vitals Signs Summary',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'triage_opd', label: 'Triage OPD Unit*', type: 'select', options: ['opd1', 'opd2', 'opd3', 'opd4', 'opd5', 'opd6', 'opd7', 'opd8', 'opd9', 'opd10', 'opd11', 'opd12', 'opd13', 'opd14', 'opd15', 'opd16', 'delivery ward', 'neonatal ward', 'Other write', 'Other'], required: true },
          { key: 'triage_opd_other', label: 'Other OPD Unit (Specify)*', type: 'text', placeholder: "Specify OPD unit if 'Other write' or 'Other' selected" },
          { key: 'vital_bp', label: 'Blood Pressure (e.g., 120/80)', type: 'text' },
          { key: 'vital_pulse', label: 'Pulse Rate (bpm)', type: 'number' },
          { key: 'vital_temp', label: 'Temperature (°C)', type: 'number' },
          { key: 'vital_rr', label: 'Respiratory Rate (bpm)', type: 'number' },
          { key: 'triage_priority', label: 'Triage Priority Level', type: 'select', options: ['Green (Routine)', 'Yellow (Urgent)', 'Red (Critical/Emergency)'] },
          { key: 'summary', label: 'Summary / Findings*', type: 'textarea', required: true, placeholder: 'Enter key summary findings here...' },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.c',
        name: '1.1.1.c Patient Clinical History Taken',
        category: 'outpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'chief_complaint', label: 'Chief Complaint*', type: 'textarea', required: true },
          { key: 'history_present_illness', label: 'History of Present Illness (HPI)', type: 'textarea' },
          { key: 'past_medical_history', label: 'Past Medical/Surgical History', type: 'textarea' }
        ]
      },
      {
        id: '1.1.1.d',
        name: '1.1.1.d Patient Clinical Assessment',
        category: 'outpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'general_appearance', label: 'General Physical Appearance', type: 'text' },
          { key: 'systemic_examination', label: 'Systemic Examination Notes', type: 'textarea' }
        ]
      },
      {
        id: '1.1.1.e',
        name: '1.1.1.e Patient Clinical Diagnosis Summary',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'diagnosis_notes', label: 'Diagnosis Notes*', type: 'select', options: ['Malaria', 'Pneumonia', 'Typhoid Fever', 'Acute Diarrhea', 'Hypertension', 'Diabetes Mellitus', 'UTI', 'URTI', 'Other specifics', 'Other'], required: true },
          { key: 'other_specifics', label: 'Other Specifics*', type: 'text', required: true, placeholder: 'Enter other specifics...' },
          { key: 'icd10_code', label: 'ICD-10 Code', type: 'text', placeholder: 'e.g., A09.9' },
          { key: 'additional_diagnosis_notes', label: 'Additional Diagnosis Notes', type: 'textarea', placeholder: 'Enter details if Other selected or for extra context...' },
          { key: 'other_summary', label: 'Other Summary*', type: 'textarea', required: true, placeholder: 'Enter key summary findings here...' },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.f',
        name: '1.1.1.f Patient Laboratory Investigation Request',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'lab_tests', label: 'Lab Tests*', type: 'select', options: ['CBC', 'Urinalysis', 'Blood Glucose', 'Lipid Panel', 'CD4 / Viral Load', 'GeneXpert TB Test', 'Widal/Weils-Felix', 'Other specific', 'Other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter specific lab test...' },
          { key: 'clinical_indications', label: 'Clinical Indications*', type: 'textarea', required: true },
          { key: 'requested_by', label: 'Request By (Name)', type: 'text' },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.g',
        name: '1.1.1.g Patient Laboratory Payment Request',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'lab_bill_amount', label: 'Laboratory Bill Amount (ETB)*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.g.1',
        name: '1.1.1.g.1 Cashier Laboratory Payment Verification',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'lab_bill_amount', label: 'Laboratory Bill Amount (ETB)*', type: 'number', required: true },
          { key: 'invoice_no', label: 'Invoice Number or Insurance ID*', type: 'text', required: true },
          { key: 'verified_paid', label: 'Confirm Paid?*', type: 'select', options: ['Yes -', 'No'], required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.h',
        name: '1.1.1.h Patient Radiology Investigation Request',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'radiology_modality', label: 'Radiology Modality*', type: 'select', options: ['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific radiology modality...' },
          { key: 'clinical_notes', label: 'Clinical Notes*', type: 'textarea', required: true },
          { key: 'requested_by', label: 'Requested By*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.i',
        name: '1.1.1.i Patient Radiology Payment Request',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'radiology_bill_amount', label: 'Radiology Bill Amount (ETB)*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.i.1',
        name: '1.1.1.i.1 Cashier Radiology Payment Verification',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'invoice_no', label: 'Invoice Number / Insurance ID*', type: 'text', required: true },
          { key: 'payment_verified', label: 'Payment Verified*', type: 'select', options: ['yes', 'No'], required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.j',
        name: '1.1.1.j outpatient Laboratory Report & Results',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'device_ref', label: 'Device Reference*', type: 'text', required: true, placeholder: 'Select functional device above' },
          { key: 'lab_findings_result', label: 'Laboratory Findings Result*', type: 'textarea', required: true },
          { key: 'referral_sheet_photo', label: 'Referral Papers Capture Camera*', type: 'file', required: true },
          { key: 'submitted_by', label: 'Submitted By*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.k',
        name: '1.1.1.k Patient Radiology Report & Results',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'device_ref', label: 'Device Reference*', type: 'text', required: true, placeholder: 'Select functional device above' },
          { key: 'radiology_findings', label: 'Radiology Findings*', type: 'textarea', required: true },
          { key: 'radiology_image', label: 'Radiology Image (Results)*', type: 'text', required: true },
          { key: 'submitted_by', label: 'Submitted By (Name)*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.l',
        name: '1.1.1.l Patient Older Add Items Form',
        category: 'outpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'older_medical_history', label: 'Prior Medical Records Summary', type: 'textarea' }
        ]
      },
      {
        id: '1.1.1.m',
        name: '1.1.1.m Outpatient Prescription Submitted',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'management_or_treatment_for', label: 'Management or treatment For*', type: 'text', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'dose', label: 'Dose*', type: 'select', required: true, options: ['500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'] },
          { key: 'dose_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific dose...' },
          { key: 'route', label: 'Route*', type: 'select', required: true, options: ['PO', 'IV', 'IM', 'suppository', 'other specific'] },
          { key: 'route_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific route...' },
          { key: 'frequency', label: 'Frequency per day*', type: 'select', required: true, options: ['stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'] },
          { key: 'frequency_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific frequency...' },
          { key: 'is_chronic', label: 'Is Chronic?', type: 'checkbox' },
          { key: 'supply_days', label: 'Supply Days', type: 'number', placeholder: 'e.g., 30' },
          { key: 'prescribed_by', label: 'Prescribed by*', type: 'text', required: true },
          { key: 'approved_by', label: 'Approved by*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.m.1',
        name: '1.1.1.m.1 Dispensary Stock Out Transfer to Another Dispensary Medication Request Prescription',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'management_or_treatment_for', label: 'Management or treatment For*', type: 'text', required: true },
          { key: 'transfer_dispensary_identifier', label: 'Transfer Dispensary Unique Number or Name*', type: 'text', placeholder: 'Enter transfer dispensary number or name', required: true },
          { key: 'received_dispensary_identifier', label: 'Received Dispensary Unique Number or Name*', type: 'text', placeholder: 'Enter received dispensary number or name', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'dose', label: 'Dose*', type: 'select', required: true, options: ['500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'] },
          { key: 'dose_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific dose...' },
          { key: 'route', label: 'Route*', type: 'select', required: true, options: ['PO', 'IV', 'IM', 'suppository', 'other specific'] },
          { key: 'route_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific route...' },
          { key: 'frequency', label: 'Frequency per day*', type: 'select', required: true, options: ['stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'] },
          { key: 'frequency_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific frequency...' },
          { key: 'is_chronic', label: 'Is Chronic?', type: 'checkbox' },
          { key: 'supply_days', label: 'Supply Days', type: 'number', placeholder: 'e.g., 30' },
          { key: 'prescribed_transfer_by', label: 'Prescribed transfer_by*', type: 'text', required: true },
          { key: 'prescription_received_by', label: 'Prescription received_by*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.m.2',
        name: '1.1.1.m.2 Dispensary Stock Out or Not Available in The Facilities Medication Request Prescription',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'management_or_treatment_for', label: 'Management or treatment For*', type: 'text', required: true },
          { key: 'dispensary_stock_out_identifier', label: 'Dispensary stock out Unique Number or Name*', type: 'text', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'dose', label: 'Dose*', type: 'select', required: true, options: ['500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'] },
          { key: 'dose_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific dose...' },
          { key: 'route', label: 'Route*', type: 'select', required: true, options: ['PO', 'IV', 'IM', 'suppository', 'other specific'] },
          { key: 'route_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific route...' },
          { key: 'frequency', label: 'Frequency per day*', type: 'select', required: true, options: ['stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'] },
          { key: 'frequency_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific frequency...' },
          { key: 'is_chronic', label: 'Is Chronic?', type: 'checkbox' },
          { key: 'supply_days', label: 'Supply Days', type: 'number', placeholder: 'e.g., 30' },
          { key: 'dispensary_stock_out_by', label: 'Dispensary stock out _by*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.n',
        name: '1.1.1.n Patient Prescription Payment Request',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'dispensary_identifier', label: 'Dispensary Identifier*', type: 'text', placeholder: 'Enter dispensary number or name', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'dose', label: 'Dose*', type: 'select', required: true, options: ['500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'] },
          { key: 'dose_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific dose...' },
          { key: 'route', label: 'Route*', type: 'select', required: true, options: ['PO', 'IV', 'IM', 'suppository', 'other specific'] },
          { key: 'route_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific route...' },
          { key: 'frequency', label: 'Frequency per day*', type: 'select', required: true, options: ['stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'] },
          { key: 'frequency_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific frequency...' },
          { key: 'cumulative_prescriptions', label: 'Cumulative Prescriptions', type: 'number' },
          { key: 'prescription_bill_amount', label: 'Total Prescription Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.n.1',
        name: '1.1.1.n.1 Cashier Prescription Payment Verification',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'invoice_no', label: 'Invoice No or Insurance Number*', type: 'text', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'cumulative_prescriptions', label: 'Cumulative Prescriptions', type: 'number' },
          { key: 'prescription_bill_amount', label: 'Prescription Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.o',
        name: '1.1.1.o Patient Procedure Submitted Intake',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'procedure_type', label: 'Procedure Type*', type: 'select', options: ['Minor Surgical Wound Care', 'Wound Dressing Change', 'IV Cannulation', 'Catheterization', 'Abscess Incision', 'Drainage', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific procedure...' },
          { key: 'procedure_notes', label: 'Procedure Notes', type: 'textarea' },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.p',
        name: '1.1.1.p Outpatient Procedure Payment Request',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'procedure_bill_amount', label: 'Procedure Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.p.1',
        name: '1.1.1.p.1 Cashier Procedure Payment Verification',
        category: 'outpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'total_amount', label: 'Total Amount*', type: 'number', required: true },
          { key: 'invoice_no', label: 'Invoice No*', type: 'text', required: true },
          { key: 'payment_verified', label: 'Payment Verified*', type: 'select', options: ['yes', 'No'], required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.q',
        name: '1.1.1.q Patient Ward Admission Form',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'admitted_ward', label: 'Admitted Ward*', type: 'select', options: ['surgical ward', 'medical ward', 'pediatric ward', 'neonatal ward', 'gynecologists ward', 'labor and delivery ward', 'operational room ward', 'intensive care unit ward', 'other specific'], required: true },
          { key: 'other_specific_ward', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter specific ward...' },
          { key: 'admission_diagnosis', label: 'Admission Diagnosis*', type: 'select', options: ['Malaria', 'Pneumonia', 'Typhoid Fever', 'Acute Diarrhea', 'Hypertension', 'Diabetes Mellitus', 'UTI', 'URTI', 'Other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific diagnosis...' },
          { key: 'admission_icd10', label: 'Admission ICD-10*', type: 'text', required: true },
          { key: 'admitting_clinician', label: 'Admitting Clinician Doctor*', type: 'text', required: true }
        ]
      },
      {
        id: '1.1.1.r',
        name: '1.1.1.r Liaison Office Inpatient Intake & Referral',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'liaison_notes', label: 'Liaison Bed Assignment Notes', type: 'textarea' },
          { key: 'referral_sheet_photo', label: 'Referral Papers Capture Camera*', type: 'camera', required: true }
        ]
      },
      {
        id: '1.1.1.r.1',
        name: '1.1.1.r.1 Liaison Inpatient Payment Request Form',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'admission_deposit', label: 'Admission Deposit (ETB)*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.r.2',
        name: '1.1.1.r.2 Cashier Liaison Inpatient Deposit Verification',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'admission_amount_deposit', label: 'Admission Amount Deposit*', type: 'number', required: true },
          { key: 'deposit_invoice_no', label: 'Deposit Invoice or Insurance Number or Unique Number*', type: 'text', required: true },
          { key: 'deposit_verified', label: 'Deposit Verified (Yes or No)*', type: 'select', options: ['Yes', 'No'], required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.s',
        name: '1.1.1.s Admitted Inpatient Vital Signs & Pain Score',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_vital_bp', label: 'Blood Pressure', type: 'text' },
          { key: 'ward_vital_temp', label: 'Temperature (°C)', type: 'number' },
          { key: 'ward_vital_pulse', label: 'Pulse Rate (bpm)', type: 'number' },
          { key: 'pain_score', label: 'Pain Score Assessment (0 to 10)*', type: 'select', options: ['0 - No Pain', '1', '2', '3', '4', '5 - Moderate Pain', '6', '7', '8', '9', '10 - Worst Possible Pain'], required: true }
        ]
      },
      {
        id: '1.1.1.t',
        name: '1.1.1.t Admitted Patient Prescription Request',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'management_or_treatment_for', label: 'Management or treatment For*', type: 'text', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'dose', label: 'Dose*', type: 'select', required: true, options: ['500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'] },
          { key: 'dose_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific dose...' },
          { key: 'route', label: 'Route*', type: 'select', required: true, options: ['PO', 'IV', 'IM', 'suppository', 'other specific'] },
          { key: 'route_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific route...' },
          { key: 'frequency', label: 'Frequency per day*', type: 'select', required: true, options: ['stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'] },
          { key: 'frequency_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific frequency...' },
          { key: 'is_chronic', label: 'Is Chronic?', type: 'checkbox' },
          { key: 'supply_days', label: 'Supply Days', type: 'number', placeholder: 'e.g., 30' },
          { key: 'prescribed_by', label: 'Prescribed By*', type: 'text', required: true },
          { key: 'approved_by', label: 'Approved By*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.t.1',
        name: '1.1.1.t.1 Admitted Patient Prescription Payment',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'dispensary_identifier', label: 'Dispensary Number or Name*', type: 'text', placeholder: 'Enter dispensary number or name', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'dose', label: 'Dose*', type: 'select', required: true, options: ['500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'] },
          { key: 'dose_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific dose...' },
          { key: 'route', label: 'Route*', type: 'select', required: true, options: ['PO', 'IV', 'IM', 'suppository', 'other specific'] },
          { key: 'route_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific route...' },
          { key: 'frequency', label: 'Frequency per day*', type: 'select', required: true, options: ['stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'] },
          { key: 'frequency_other_specific', label: 'Other Specific*', type: 'text', placeholder: 'Enter other specific frequency...' },
          { key: 'cumulative_prescriptions', label: 'Cumulative Prescriptions', type: 'number' },
          { key: 'prescription_bill_amount', label: 'Prescription Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.t.2',
        name: '1.1.1.t.2 Cashier Admitted Patient Prescription Verification',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'rx_invoice_no', label: 'Rx Invoice Number or Insurance Number*', type: 'text', required: true },
          { key: 'ward_rx_bill', label: 'Ward RX Bill*', type: 'number', required: true },
          { key: 'prescribed_drugs', label: 'Prescribed Drugs - Name of Medication*', type: 'text', placeholder: 'Enter name of medication', required: true },
          { key: 'cumulative_prescriptions', label: 'Cumulative Prescriptions', type: 'number' },
          { key: 'prescription_bill_amount', label: 'Prescription Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.u',
        name: '1.1.1.u Inter-Department Consultation Ward Physician',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'referring_ward', label: 'Referring Ward', type: 'select', options: ['surgical ward', 'medical ward', 'pediatric ward', 'gyn', 'icu'] },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific ward...' },
          { key: 'consulting_specialty', label: 'Consulting Specialty*', type: 'text', required: true },
          { key: 'consultation_notes', label: 'Consultation Notes*', type: 'textarea', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.u.1',
        name: '1.1.1.u.1 Admitted Patients Medication Given Records',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'medication_administered', label: 'Medication Administered*', type: 'text', required: true },
          { key: 'administered_time', label: 'Administered Time*', type: 'text', placeholder: 'e.g., 2026-07-06 14:00', required: true },
          { key: 'administered_by', label: 'Administered By*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v',
        name: '1.1.1.v Inpatient Laboratory Investigation Request',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'inpatient_lab_tests', label: 'Inpatient Lab Tests*', type: 'select', options: ['CBC', 'Biochemistry Renal/Liver', 'Serum Electrolytes', 'Blood Culture', 'GeneXpert TB', 'Other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter other specific lab tests...' },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v.1',
        name: '1.1.1.v.1 Inpatient Lab Payment Request Form',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'lab_bill_amount', label: 'Lab Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter details for other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v.2',
        name: '1.1.1.v.2 Admitted Patient Lab Cash / CBHI Payment Form',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'lab_bill_amount', label: 'Lab Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter details for other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v.3',
        name: '1.1.1.v.3 Cashier Inpatient Lab Payment Paid Verification',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'invoice_no', label: 'Invoice No*', type: 'text', required: true },
          { key: 'payment_verified', label: 'Payment Verified*', type: 'select', options: ['yes', 'No'], required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter details for other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v.4',
        name: '1.1.1.v.4 outpatient and Inpatient Laboratory Investigation Results',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'inpatient_lab_results', label: 'Results & Critical Values*', type: 'textarea', required: true },
          { key: 'lab_report_image', label: 'Laboratory Report Sheet Image Capture*', type: 'camera', required: true }
        ]
      },
      {
        id: '1.1.1.v.5',
        name: '1.1.1.v.5 Inpatient Radiology Investigation Request',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'inpatient_radiology_type', label: 'Inpatient Radiology Type*', type: 'select', options: ['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Other specific'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter details for other specific radiology...' },
          { key: 'request_by_name', label: 'Request by name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v.6',
        name: '1.1.1.v.6 Inpatient Radiology Payment Request Form',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'radiology_bill_amount', label: 'Radiology Bill Amount*', type: 'number', required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter details for other specific payment method...' },
          { key: 'request_by_name', label: 'Request by name*', type: 'text', required: true },
          { key: 'date', label: 'Date and time*', type: 'number', required: true }
        ]
      },
      {
        id: '1.1.1.v.7',
        name: '1.1.1.v.7 Cashier Inpatient Radiology Paid Verification',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'invoice_no', label: 'Invoice No*', type: 'text', required: true },
          { key: 'payment_verified', label: 'Payment Verified*', type: 'select', options: ['Yes', 'No'], required: true },
          { key: 'payment_method', label: 'Payment Method*', type: 'select', options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other'], required: true },
          { key: 'other_specific', label: 'Other Specific*', type: 'text', required: true, placeholder: 'Enter details for other specific payment method...' },
          { key: 'approved_name', label: 'Approved Name*', type: 'text', required: true },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.v.8',
        name: '1.1.1.v.8 outpatient and Inpatient Radiology Report & Results',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'rad_report_text', label: 'Inpatient Imaging Findings*', type: 'textarea', required: true },
          { key: 'rad_report_image', label: 'Radiology Result Film Image Capture*', type: 'camera', required: true }
        ]
      },
      {
        id: '1.1.1.w',
        name: '1.1.1.w Inpatient Nursing Care Plan, Prognosis & Discharge',
        category: 'inpatient',
        fields: [
          { key: 'hospital_id', label: 'Hospital ID*', type: 'text', required: true },
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'ward_name', label: 'Ward Name*', type: 'text', required: true },
          { key: 'nursing_diagnoses', label: 'Nursing Diagnoses*', type: 'textarea', required: true },
          { key: 'patient_prognosis', label: 'Patient Prognosis', type: 'select', options: ['Improving', 'Stable', 'Guarded', 'Deteriorating', 'Critical'] },
          { key: 'discharge_criteria', label: 'Discharge Criteria', type: 'textarea' },
          { key: 'date', label: 'Date/Time', type: 'date-time' }
        ]
      },
      {
        id: '1.1.1.x',
        name: '1.1.1.x Inpatient Surgery Safety Checklist & Anesthesia Intake',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'sign_in_checked', label: 'Sign-In Completed (Before Induction)?', type: 'checkbox' },
          { key: 'time_out_checked', label: 'Time-Out Completed (Before Skin Incision)?', type: 'checkbox' },
          { key: 'anesthesia_type', label: 'Anesthesia Selected Plan*', type: 'select', options: ['General Anesthesia', 'Spinal Anesthesia', 'Regional Block', 'Local/Sedation'], required: true },
          { key: 'asa_class', label: 'ASA Physical Status Classification', type: 'select', options: ['ASA I', 'ASA II', 'ASA III', 'ASA IV', 'ASA V'] }
        ]
      },
      {
        id: '1.1.1.y',
        name: '1.1.1.y Maternity Care Services (ANC 8, Labor Pathography, Postnatal)',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'anc_visit_no', label: 'Antenatal Care Visit Tracker*', type: 'select', options: ['Visit 1', 'Visit 2', 'Visit 3', 'Visit 4', 'Visit 5', 'Visit 6', 'Visit 7', 'Visit 8'], required: true },
          { key: 'pathography_notes', label: 'Labor Progress Pathography summary', type: 'textarea' },
          { key: 'postnatal_vitals', label: 'Postnatal (PNC) check notes', type: 'text' },
          { key: 'cesarean_section_indicated', label: 'Cesarean Section Performed?', type: 'checkbox' }
        ]
      },
      {
        id: '1.1.1.z',
        name: '1.1.1.z Payment Request for Operating Room Procedure',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'or_procedure_name', label: 'OR Surgical Procedure*', type: 'text', required: true },
          { key: 'or_procedure_bill', label: 'Operating Room Cost (ETB)*', type: 'number', required: true }
        ]
      },
      {
        id: '1.1.1.z.1',
        name: '1.1.1.z.1 Cashier OR Procedure Paid Verification',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'invoice_number', label: 'Invoice No / Insurance ID*', type: 'text', required: true },
          { key: 'or_verified', label: 'Verification Status*', type: 'select', options: ['Verified Paid', 'CBHI Approved', 'Waiver Cleared'], required: true }
        ]
      },
      {
        id: '1.1.1.z.2',
        name: '1.1.1.z.2 Admitted Inpatient Prescription Request Form (Discharge)',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'discharge_prescription', label: 'Discharge Outpatient Medications*', type: 'textarea', required: true }
        ]
      },
      {
        id: '1.1.1.z.3',
        name: '1.1.1.z.3 Cashier Inpatient Discharge Prescription Payment Verification',
        category: 'inpatient',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'invoice_no', label: 'Invoice / Insurance ID*', type: 'text', required: true },
          { key: 'paid_status', label: 'Status*', type: 'select', options: ['Paid', 'Insurance Cleared'], required: true }
        ]
      },
      {
        id: '1.1.1.z.4',
        name: '1.1.1.z.4 Custom Form',
        category: 'both',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'form_title', label: 'Custom Form Title*', type: 'text', required: true },
          { key: 'form_content', label: 'Form Content / Observations*', type: 'textarea', required: true },
          { key: 'attachments', label: 'Capture Supporting Image', type: 'camera' },
          { key: 'summary', label: 'Summary / Findings*', type: 'textarea', required: true, placeholder: 'Enter key summary findings here...' }
        ]
      },
      {
        id: '1.1.1.z.5',
        name: '1.1.1.z.5 Universal Clinical Folder Add Items Form Summary',
        category: 'both',
        fields: [
          { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
          { key: 'summary', label: 'Summary / Key Findings*', type: 'textarea', required: true, placeholder: 'Enter overall summary of the universal clinical folder findings...' }
        ]
      }
    ]
  },
];

// Custom hook to synchronize common patient identifiers (MRN, Name, Date/Time) across all clinical forms (1.1.1.a - 1.1.1.z) immediately
function usePatientSync(
  currentSubsectionId: string,
  patient: { mrn: string; name: string } | null,
  setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  hospital_id: string
) {
  useEffect(() => {
    if (!patient || (!currentSubsectionId.match(/^1\.1\.1\.[a-z]/) && !currentSubsectionId.match(/^1\.1\.1\.[0-9]/))) return;

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    setForm((prev) => {
      const next = { ...prev };
      let updated = false;

      // Synchronize Hospital ID
      if (next.hospital_id !== hospital_id) {
        next.hospital_id = hospital_id;
        updated = true;
      }
      if (next.tenant_id !== hospital_id) {
        next.tenant_id = hospital_id;
        updated = true;
      }

      // Synchronize MRN
      if (next.patient_mrn !== patient.mrn) {
        next.patient_mrn = patient.mrn;
        updated = true;
      }
      if (next.patient_id !== patient.mrn) {
        next.patient_id = patient.mrn;
        updated = true;
      }
      if (next.mrn !== patient.mrn) {
        next.mrn = patient.mrn;
        updated = true;
      }

      // Synchronize Name
      if (next.patient_name !== patient.name) {
        next.patient_name = patient.name;
        updated = true;
      }
      if (next.full_name !== patient.name) {
        next.full_name = patient.name;
        updated = true;
      }
      if (next.name !== patient.name) {
        next.name = patient.name;
        updated = true;
      }

      // Synchronize Date/Time
      if (!next.date || next.date === '') {
        next.date = currentDate;
        updated = true;
      }
      if (!next.time || next.time === '') {
        next.time = currentTime;
        updated = true;
      }
      if (!next.registration_date || next.registration_date === '') {
        next.registration_date = currentDate;
        updated = true;
      }

      return updated ? next : prev;
    });
  }, [currentSubsectionId, patient, setForm]);
}

interface HospitalModulesProps {
  activeHospital?: {
    id: string;
    name: string;
    hospital_unique_number: string;
    license_key: string;
  } | null;
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (collapsed: boolean) => void;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function HospitalModules({ activeHospital, isSidebarCollapsed, setIsSidebarCollapsed, addToast }: HospitalModulesProps) {
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
  
  const [selectedModule, setSelectedModule] = useState<HospitalModule>(MODULES_CONFIG[0]);
  const [selectedSubsection, setSelectedSubsection] = useState<Subsection>(MODULES_CONFIG[0].subsections[0]);
  const [isHospitalSidebarCollapsed, setIsHospitalSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>({});
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const wasMainSidebarCollapsedRef = useRef<boolean | null>(null);
  const wasHospitalSidebarCollapsedRef = useRef<boolean | null>(null);

  // Automatically trigger minimization/maximize full-screen when target forms are open
  useEffect(() => {
    const isTargetForm = selectedSubsection && (
      ['1.1.1', '1.1.1.0', '1.1.1.1', '1.1.1.2'].includes(selectedSubsection.id) ||
      selectedSubsection.id.match(/^1\.1\.1\.[a-z0-9]/)
    );
    if (isTargetForm) {
      if (wasMainSidebarCollapsedRef.current === null && isSidebarCollapsed !== undefined) {
        wasMainSidebarCollapsedRef.current = isSidebarCollapsed;
      }
      if (wasHospitalSidebarCollapsedRef.current === null) {
        wasHospitalSidebarCollapsedRef.current = isHospitalSidebarCollapsed;
      }
      setIsSidebarCollapsed?.(true);
      setIsHospitalSidebarCollapsed(true);
    } else {
      if (wasMainSidebarCollapsedRef.current !== null) {
        setIsSidebarCollapsed?.(wasMainSidebarCollapsedRef.current);
        wasMainSidebarCollapsedRef.current = null;
      }
      if (wasHospitalSidebarCollapsedRef.current !== null) {
        setIsHospitalSidebarCollapsed(wasHospitalSidebarCollapsedRef.current);
        wasHospitalSidebarCollapsedRef.current = null;
      }
    }

    return () => {
      if (wasMainSidebarCollapsedRef.current !== null) {
        setIsSidebarCollapsed?.(wasMainSidebarCollapsedRef.current);
      }
    };
  }, [selectedSubsection?.id, setIsSidebarCollapsed]);
  
  // Play mode / Wizard flow states
  const [lastRegisteredPatient, setLastRegisteredPatient] = useState<{ mrn: string; name: string } | null>(null);
  const [isPlayMode, setIsPlayMode] = useState(true);
  const [guidedNotice, setGuidedNotice] = useState<string | null>(null);
  
  // Dynamic form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastAutosavedTime, setLastAutosavedTime] = useState<string | null>(null);

  // Implement an auto-save feature for clinical forms 1.1.1.a through 1.1.1.z
  // Drafts progress to localStorage every 30 seconds to prevent data loss
  useEffect(() => {
    if (!selectedSubsection || !selectedSubsection.id.startsWith('1.1.1')) {
      setLastAutosavedTime(null);
      return;
    }

    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        localStorage.setItem(`ehr_draft_${selectedSubsection.id}`, JSON.stringify(formData));
        const now = new Date().toLocaleTimeString();
        setLastAutosavedTime(now);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedSubsection, formData]);

  // Call the patient sync hook immediately
  usePatientSync(selectedSubsection.id, lastRegisteredPatient, setFormData, hospital_id);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const filteredSubmissions = recentSubmissions.filter(rec => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // Search in all data fields, form name, and submitted at date
    return Object.values(rec.data || {}).some(val => 
      String(val).toLowerCase().includes(query)
    ) || 
    (rec.subsection_name || '').toLowerCase().includes(query) ||
    new Date(rec.submitted_at).toLocaleString().toLowerCase().includes(query);
  });
  const [isListening, setIsListening] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isBatchProcessingRecords, setIsBatchProcessingRecords] = useState(false);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    // Map selected UI language to BCP 47 language tag
    const langMap: Record<string, string> = {
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'Arabic': 'ar-SA',
      'Swahili': 'sw-KE'
    };
    recognition.lang = langMap[selectedLanguage] || 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.start();
  };

  const handleBatchArchiveRecords = async () => {
    if (selectedRecordIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to archive the ${selectedRecordIds.length} selected record(s)?`)) return;
    setIsBatchProcessingRecords(true);
    try {
      for (const id of selectedRecordIds) {
        await updateDoc(doc(db, 'hospital_modules_submissions', id), {
          status: 'archived',
          updated_at: new Date().toISOString()
        });
      }
      setSelectedRecordIds([]);
      fetchSubmissions();
      if (addToast) {
        addToast('success', `Successfully archived ${selectedRecordIds.length} records.`);
      } else {
        alert(`Successfully archived ${selectedRecordIds.length} records.`);
      }
    } catch (err) {
      console.error('Error batch archiving records:', err);
      if (addToast) addToast('error', 'Failed to archive records.');
    } finally {
      setIsBatchProcessingRecords(false);
    }
  };

  const handleBatchDeleteRecords = async () => {
    if (selectedRecordIds.length === 0) return;
    const count = selectedRecordIds.length;
    if (!window.confirm(`CRITICAL: You are about to permanently DELETE ${count} record(s). This is irreversible. Continue?`)) return;
    setIsBatchProcessingRecords(true);
    try {
      for (const id of selectedRecordIds) {
        await deleteDoc(doc(db, 'hospital_modules_submissions', id));
      }
      setSelectedRecordIds([]);
      fetchSubmissions();
      if (addToast) {
        addToast('success', `Permanently deleted ${count} clinical records.`);
      } else {
        alert(`Permanently deleted ${count} records.`);
      }
    } catch (err) {
      console.error('Error batch deleting records:', err);
      if (addToast) addToast('error', 'Failed to delete records.');
    } finally {
      setIsBatchProcessingRecords(false);
    }
  };

  const handleBatchExportRecords = () => {
    if (selectedRecordIds.length === 0) return;
    const dataToExport = recentSubmissions.filter(r => selectedRecordIds.includes(r.id));
    
    // Flatten nested data for CSV
    const allKeys = new Set<string>();
    dataToExport.forEach(r => Object.keys(r.data || {}).forEach(k => allKeys.add(k)));
    const keysArray = Array.from(allKeys);
    
    const headers = ['Submitted At', 'Form ID', 'Form Name', ...keysArray];
    const rows = dataToExport.map(rec => {
      return [
        `"${rec.submitted_at}"`,
        `"${rec.subsection_id}"`,
        `"${rec.subsection_name || ''}"`,
        ...keysArray.map(k => `"${String(rec.data?.[k] || '').replace(/"/g, '""')}"`)
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ehr_clinical_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + A to Archive
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        if (selectedRecordIds.length > 0) {
          e.preventDefault();
          handleBatchArchiveRecords();
        }
      }
      
      // Ctrl + Shift + E to Export
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        if (selectedRecordIds.length > 0) {
          e.preventDefault();
          handleBatchExportRecords();
        }
      }

      // Ctrl + Shift + D to Delete
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        if (selectedRecordIds.length > 0) {
          e.preventDefault();
          handleBatchDeleteRecords();
        }
      }

      // Ctrl + A to Select All
      if (e.ctrlKey && e.key === 'a' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (recentSubmissions.length > 0) {
          e.preventDefault();
          if (selectedRecordIds.length === recentSubmissions.length) {
            setSelectedRecordIds([]);
          } else {
            setSelectedRecordIds(recentSubmissions.map(r => r.id));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecordIds, recentSubmissions]);
  const [allSubmissionsForStatus, setAllSubmissionsForStatus] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [pendingRefills, setPendingRefills] = useState<any[]>([]);

  // PDF Compilation & Report states
  const [compiledReportData, setCompiledReportData] = useState<any[] | null>(null);
  const [isCompilingReport, setIsCompilingReport] = useState(false);

  const handleGeneratePdfReport = async (mrn: string) => {
    setIsCompilingReport(true);
    try {
      const submissionsRef = collection(db, 'hospital_modules_submissions');
      // Fetch all submissions under the hospital tenant to compile
      const q = query(
        submissionsRef,
        where('hospital_id', '==', hospital_id)
      );
      const querySnapshot = await getDocs(q);
      
      const records: any[] = [];
      querySnapshot.forEach(docSnap => {
        const docData = docSnap.data() as any;
        const docMrn = (docData.data?.patient_mrn || docData.data?.patient_id || docData.data?.mrn || '').toString().trim();
        if (docMrn && docMrn.toLowerCase() === mrn.trim().toLowerCase() && docData.subsection_id?.startsWith('1.1.1')) {
          records.push({
            id: docSnap.id,
            ...docData,
            submitted_at: docData.submitted_at || new Date().toISOString()
          });
        }
      });

      // Sort by subsection ID ascending (e.g. 1.1.1, 1.1.1.0, 1.1.1.1, 1.1.1.2, 1.1.1.a, 1.1.1.b, etc.)
      records.sort((a, b) => a.subsection_id.localeCompare(b.subsection_id, undefined, { numeric: true }));

      if (records.length === 0) {
        alert(`No clinical documentation or registration records (1.1.1 series) found in database for Patient MRN "${mrn}". Please submit forms first.`);
      } else {
        setCompiledReportData(records);
      }
    } catch (err) {
      console.error("Error compiling medical report:", err);
      alert("Failed to compile medical summary from Firestore. Please verify your connection.");
    } finally {
      setIsCompilingReport(false);
    }
  };
  
  // Custom camera simulation states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActiveKey, setCameraActiveKey] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  
  // Form submission overlay state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [selectedSubmissionForView, setSelectedSubmissionForView] = useState<any | null>(null);
  const [functionalDevices, setFunctionalDevices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch patient folders for the EHR Clinical Hub Storage view
  const fetchPatientFolders = async () => {
    if (!hospital_id) return;
    setLoadingPatients(true);
    try {
      const q = query(
        collection(db, 'patients'),
        where('hospital_id', '==', hospital_id),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(list);
    } catch (err: any) {
      console.error('Error fetching patient folders:', err);
      // Handle offline mode gracefully
      if (err?.code === 'unavailable' || !navigator.onLine) {
        if (addToast) addToast('error', 'EHR Storage is in offline mode. Only cached patient folders are visible.');
      }
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (selectedSubsection?.id === '1.1.1.2') {
      fetchPatientFolders();
    }
  }, [selectedSubsection?.id, hospital_id]);

  // Keyboard Shortcuts for Form Submission (Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch functional devices when relevant modules are selected
  useEffect(() => {
    if (selectedSubsection && (selectedSubsection.id === '1.1.1.j' || selectedSubsection.id === '1.1.1.k')) {
      const fetchDevices = async () => {
        try {
          const q = query(
            collection(db, 'hospital_modules_submissions'),
            where('subsection_id', '==', 'biomedical_device_tracking'),
            where('data.functional_status', '==', 'Functional')
          );
          const snap = await getDocs(q);
          const devices = snap.docs.map(doc => ({ id: doc.id, ...doc.data().data }));
          setFunctionalDevices(devices);
        } catch (err) {
          console.error('Error fetching devices:', err);
        }
      };
      fetchDevices();
    } else {
      setFunctionalDevices([]);
    }
  }, [selectedSubsection]);

  // Tab categorization filter for Module 1
  const [opdIpdFilter, setOpdIpdFilter] = useState<'all' | 'outpatient' | 'inpatient'>('all');

  // Load submissions for active subsection and tenant
  useEffect(() => {
    fetchSubmissions();
    // Reset form states with pre-populated hospital_id and default values if present
    const initialForm: Record<string, any> = {};
    if (selectedSubsection?.fields) {
      selectedSubsection.fields.forEach((field: any) => {
        if (field.key === 'hospital_id') {
          initialForm.hospital_id = hospital_id;
        } else if (field.key === 'patient_mrn' || field.key === 'patient_id') {
          if (lastRegisteredPatient?.mrn) {
            initialForm[field.key] = lastRegisteredPatient.mrn;
          } else {
            initialForm[field.key] = field.defaultValue || '';
          }
        } else if (field.key === 'patient_name' || field.key === 'full_name') {
          if (lastRegisteredPatient?.name) {
            initialForm[field.key] = lastRegisteredPatient.name;
          } else {
            initialForm[field.key] = field.defaultValue || '';
          }
        } else if (field.defaultValue) {
          initialForm[field.key] = field.defaultValue;
        }
      });
    }

    // Try to load auto-saved draft if this is a clinical form
    if (selectedSubsection && selectedSubsection.id.startsWith('1.1.1')) {
      const savedDraft = localStorage.getItem(`ehr_draft_${selectedSubsection.id}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setFormData({ ...initialForm, ...parsedDraft });
          setLastAutosavedTime("loaded from local draft");
          if (parsedDraft.referral_image) {
            setCapturedImage(parsedDraft.referral_image);
          }
          stopCamera();
          setCameraPermissionError(null);
          return;
        } catch (e) {
          console.error("Failed to parse saved draft", e);
        }
      }
    }

    setFormData(initialForm);
    setCapturedImage(null);
    stopCamera();
    setCameraPermissionError(null);
  }, [selectedSubsection, hospital_id, lastRegisteredPatient]);

  const handleGenerateRefillWorkflow = (alert: any) => {
    // Switch to refill subsection
    const refillSub = MODULES_CONFIG.find(m => m.id === 'Module-1')?.subsections.find(s => s.id === '1.1.1.m.1');
    if (refillSub) {
      setSelectedSubsection(refillSub);
      setFormData({
        patient_mrn: alert.mrn,
        refill_medications: alert.medication,
        refill_duration: 30, // Default refill
        doctor_approval_needed: true
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const fetchSubmissions = async () => {
    setLoadingHistory(true);
    try {
      // 1. Fetch current subsection submissions
      let q;
      const mrn = lastRegisteredPatient?.mrn;
      
      // If we are in the Clinical/EHR series (1.1.1.x), we MUST filter by the active patient to avoid seeing other patients' history
      if (selectedSubsection.id.startsWith('1.1.1') && mrn) {
        // Special case for Clinical Hub (1.1.1.2): Show ALL clinical records for this patient across all 1.1.1.* codes
        if (selectedSubsection.id === '1.1.1.2') {
          q = query(
            collection(db, 'hospital_modules_submissions'),
            where('hospital_id', '==', hospital_id),
            where('data.patient_mrn', '==', mrn)
          );
        } else {
          q = query(
            collection(db, 'hospital_modules_submissions'),
            where('hospital_id', '==', hospital_id),
            where('subsection_id', '==', selectedSubsection.id),
            where('data.patient_mrn', '==', mrn)
          );
        }
      } else {
        q = query(
          collection(db, 'hospital_modules_submissions'),
          where('hospital_id', '==', hospital_id),
          where('subsection_id', '==', selectedSubsection.id)
        );
      }
      
      const querySnap = await getDocs(q);
      let list = querySnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      // Fallback local filter just in case the nested query in Firestore behaves unexpectedly due to schema variations
      if (mrn && selectedSubsection.id.startsWith('1.1.1')) {
        list = list.filter(item => 
          (item.data?.patient_mrn === mrn || item.data?.mrn === mrn || item.data?.patient_id === mrn)
        );
      }

      list.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      // 2. Fetch ALL submissions for this tenant to calculate statuses/progress
      const qAll = query(
        collection(db, 'hospital_modules_submissions'),
        where('hospital_id', '==', hospital_id)
      );
      const allSnap = await getDocs(qAll);
      const allSubmissions = allSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      setAllSubmissionsForStatus(allSubmissions);

      // 3. Identify Chronic Medication Low Stock Alerts
      if (mrn) {
        const chronicMeds = allSubmissions.filter(s => 
          (s.subsection_id === '1.1.1.m' || s.subsection_id === '1.1.1.m.1') && 
          (s.data?.is_chronic === true || s.subsection_id === '1.1.1.m.1') && 
          (s.data?.patient_mrn === mrn || s.data?.mrn === mrn || s.data?.patient_id === mrn)
        );

        const alerts: any[] = [];
        const today = new Date();

        // Group by medication name to find the LATEST supply for each
        const latestMeds = new Map<string, any>();
        chronicMeds.forEach(med => {
          const medName = med.data?.prescribed_drugs || med.data?.refill_medications;
          if (!medName) return;
          
          if (!latestMeds.has(medName) || new Date(med.submitted_at) > new Date(latestMeds.get(medName).submitted_at)) {
            latestMeds.set(medName, med);
          }
        });

        latestMeds.forEach((med, medName) => {
          const supplyDays = parseInt(med.data?.supply_days || med.data?.refill_duration || '0');
          if (supplyDays > 0) {
            const startDate = new Date(med.submitted_at);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + supplyDays);

            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 5) {
              alerts.push({
                medication: medName,
                daysRemaining: diffDays,
                status: diffDays <= 0 ? 'Out of Stock' : 'Low Stock',
                originalSubmissionId: med.id,
                mrn: mrn
              });
            }
          }
        });
        setLowStockAlerts(alerts);
      } else {
        setLowStockAlerts([]);
      }

      // 4. Identify Pending Doctor Refill Approvals
      const refills = allSubmissions.filter(s => 
        s.subsection_id === '1.1.1.m.1' && 
        s.data?.doctor_approval_needed === true && 
        s.data?.approval_status !== 'approved'
      );
      setPendingRefills(refills);

      // Automatically remove duplicated open patient accounts under 1.1.1 (Patient Registration / Open Account Folder)
      if (selectedSubsection.id === '1.1.1') {
        const mrnMap = new Map<string, any>();
        const toDeleteIds: string[] = [];
        const filteredList: any[] = [];

        list.forEach((item: any) => {
          const mrn = (item.data?.patient_mrn || '').toString().trim().toUpperCase();
          if (!mrn) {
            filteredList.push(item);
            return;
          }
          if (mrnMap.has(mrn)) {
            // Since list is pre-sorted descending by submitted_at, the map already contains the latest entry.
            // Any subsequent occurrence is an older duplicate we should automatically remove.
            toDeleteIds.push(item.id);
          } else {
            mrnMap.set(mrn, item);
            filteredList.push(item);
          }
        });

        if (toDeleteIds.length > 0) {
          console.log(`Automatically removing ${toDeleteIds.length} duplicate 'open patient account' entries...`);
          // Remove them from Firestore in the background
          for (const docId of toDeleteIds) {
            try {
              await deleteDoc(doc(db, 'hospital_modules_submissions', docId));
            } catch (delErr) {
              console.error(`Failed to automatically delete duplicate registration document ${docId}:`, delErr);
            }
          }
          list = filteredList;
          setCleanupMessage(`✓ Auto-cleaned ${toDeleteIds.length} duplicate 'open patient account' entries from Cloud History Logs.`);
          setTimeout(() => setCleanupMessage(null), 6000);
        }
      }

      setRecentSubmissions(list);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      // Handle offline mode gracefully
      if (err?.code === 'unavailable' || !navigator.onLine) {
        if (addToast) addToast('error', 'Connection unstable. Showing cached history logs only.');
      }
      setRecentSubmissions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [loadingHubMrn, setLoadingHubMrn] = useState<string | null>(null);

  const provisionPatientClinicalHub = async (mrn: string, patientName: string) => {
    const actorName = localStorage.getItem('user_name') || 'Authorized User';
    const timestamp = new Date().toISOString();
    
    try {
      // 1. Audit Log: Start Provisioning
      const startAudit = {
        id: `audit-prov-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        event: 'Repository Provisioning Started',
        actor: actorName,
        status: 'PENDING',
        location: `Clinical Hub Initialization - MRN: ${mrn}`
      };
      const logs = JSON.parse(localStorage.getItem('ehr_audit_logs') || '[]');
      localStorage.setItem('ehr_audit_logs', JSON.stringify([startAudit, ...logs.slice(0, 49)]));

      // 2. Identify all targets (1.1.1.a to 1.1.1.z.4)
      const targets: { id: string; name: string }[] = [];
      MODULES_CONFIG.forEach(mod => {
        mod.subsections.forEach(sub => {
          // Only provision clinical sub-forms (a-z) and their children, excluding registration/payment steps (0, 1, 2)
          if (sub.id.match(/^1\.1\.1\.[a-z]/)) {
            targets.push({ id: sub.id, name: sub.name });
          }
        });
      });

      // 3. Batch Provisioning
      // We create a "provisioned" submission for each subsection for this patient
      const submissionsRef = collection(db, 'hospital_modules_submissions');
      
      for (const target of targets) {
        await addDoc(submissionsRef, {
          hospital_id: hospital_id,
          module_id: 'Module-1',
          subsection_id: target.id,
          subsection_name: target.name,
          submitted_at: timestamp,
          status: 'initialized',
          data: {
            patient_mrn: mrn,
            patient_name: patientName,
            provisioned_by: actorName,
            notes: 'Folder automatically provisioned during registration'
          }
        });
      }

      // 4. Final Audit Log: Success
      const endAudit = {
        id: `audit-prov-success-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        event: 'Repository Provisioning Completed',
        actor: actorName,
        status: 'SUCCESS',
        location: `Master EHR Schema (1.1.1.a - 1.1.1.z.4) mapped for MRN: ${mrn}`
      };
      const finalLogs = JSON.parse(localStorage.getItem('ehr_audit_logs') || '[]');
      localStorage.setItem('ehr_audit_logs', JSON.stringify([endAudit, ...finalLogs.slice(0, 49)]));

      if (addToast) addToast('success', `Master Clinical Repository (Codes a-z) provisioned for Patient ${mrn}.`);
      
    } catch (err) {
      console.error('Provisioning Error:', err);
      if (addToast) addToast('error', 'Critical Error: Failed to provision clinical folder structure.');
    }
  };

  const openHubFolder = async (patient: any) => {
    // 1. Loading State
    setLoadingHubMrn(patient.mrn);
    
    // Simulate network delay for "Opening..." effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // 2. Permission Check (Mock)
      // In a real app, we would check the user's role/token
      const userRole = localStorage.getItem('user_role') || 'Attending Physician';
      const hasAccess = ['Clinical Chief / Director', 'Attending Physician', 'Registered Nurse'].includes(userRole);
      
      if (!hasAccess) {
        if (addToast) addToast('error', `Access Denied: Your role (${userRole}) is not authorized to open Clinical Hub folders.`);
        setLoadingHubMrn(null);
        return;
      }

      // 3. Folder Existence Check
      // Verify if the patient is in our local list (which is fetched from Firestore)
      const folderExists = patients.some(p => p.mrn === patient.mrn);
      if (!folderExists) {
        if (addToast) addToast('error', `Folder Error: Clinical folder for MRN ${patient.mrn} not found in the repository.`);
        setLoadingHubMrn(null);
        return;
      }

      // 4. Audit Logging (Mock - console and local state simulation)
      const actorName = localStorage.getItem('user_name') || 'Authorized User';
      const timestamp = new Date().toLocaleString();
      console.log(`[AUDIT LOG] ${timestamp} - ${actorName} opened Clinical Hub folder for MRN: ${patient.mrn}`);
      
      // Optionally save to a mock local audit collection
      const auditEntry = {
        id: `audit-${Date.now()}`,
        timestamp,
        event: 'Clinical Hub Folder Opened',
        actor: actorName,
        status: 'SUCCESS',
        location: `Hub Module 1.1.1.2 - MRN: ${patient.mrn}`
      };
      const existingLogs = JSON.parse(localStorage.getItem('ehr_audit_logs') || '[]');
      localStorage.setItem('ehr_audit_logs', JSON.stringify([auditEntry, ...existingLogs.slice(0, 49)]));

      // 5. Navigation Logic
      // Set the active patient and switch to the EHR Clinical Hub subsection (1.1.1.2)
      setFormData({ patient_mrn: patient.mrn, patient_name: patient.name || patient.full_name });
      setLastRegisteredPatient({ mrn: patient.mrn, name: patient.name || patient.full_name });
      
      const hubSubsection = MODULES_CONFIG[0].subsections.find(s => s.id === '1.1.1.2');
      if (hubSubsection) {
        setSelectedSubsection(hubSubsection);
        if (addToast) addToast('success', `Hub Folder ${patient.mrn} opened successfully.`);
      }

    } catch (err) {
      console.error('Error opening hub folder:', err);
      if (addToast) addToast('error', 'Critical System Error: Failed to initialize hub navigation handshake.');
    } finally {
      setLoadingHubMrn(null);
    }
  };

  const getSubsectionStatus = (subId: string): SubsectionStatus => {
    // 1. Check Firestore Submissions (saved, pending, or initialized)
    const submissions = allSubmissionsForStatus.filter(s => {
      const isCorrectSub = s.subsection_id === subId;
      // If we have an active patient session, only show status for THIS patient
      const mrn = lastRegisteredPatient?.mrn;
      
      // For clinical series (1.1.1.*), we MUST have a patient selected to show status
      if (subId.startsWith('1.1.1') && !mrn) return false;
      
      const isCorrectPatient = mrn ? (s.data?.patient_mrn === mrn || s.data?.mrn === mrn || s.data?.patient_id === mrn) : true;
      return isCorrectSub && isCorrectPatient;
    });
    
    if (submissions.length > 0) {
      if (submissions.some(s => s.status === 'pending')) return 'pending';
      if (submissions.some(s => s.status === 'saved')) return 'saved';
      if (submissions.some(s => s.status === 'initialized')) return 'initialized';
      return 'saved';
    }

    // 2. Check LocalStorage (draft)
    const draft = localStorage.getItem(`ehr_draft_${subId}`);
    if (draft) return 'draft';

    return 'not_started';
  };

  const getStatusVisuals = (status: SubsectionStatus | 'initialized') => {
    switch (status) {
      case 'saved':
        return { color: 'border-emerald-500 text-emerald-700 bg-emerald-50', icon: <CheckCircle2 size={12} />, label: 'Saved' };
      case 'draft':
        return { color: 'border-orange-400 text-orange-700 bg-orange-50', icon: <AlertCircle size={12} />, label: 'Draft' };
      case 'pending':
        return { color: 'border-amber-500 text-amber-700 bg-amber-50', icon: <AlertCircle size={12} />, label: 'Pending' };
      case 'initialized':
        return { color: 'border-blue-400 text-blue-700 bg-blue-50', icon: <RefreshCw size={12} />, label: 'Initialized' };
      default:
        return { color: 'border-gray-200 text-gray-400 bg-transparent', icon: null, label: 'Not Started' };
    }
  };

  const calculateModuleProgress = (module: HospitalModule) => {
    if (!module.subsections.length) return 0;
    const completed = module.subsections.filter(s => getSubsectionStatus(s.id) === 'saved').length;
    return Math.round((completed / module.subsections.length) * 100);
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // HTML5 Web Camera logic
  const startCamera = async (fieldKey: string) => {
    setCameraActiveKey(fieldKey);
    setCameraPermissionError(null);
    setIsCameraActive(true);
    
    // Tiny delay to ensure video element is mounted
    setTimeout(async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else {
          throw new Error('getUserMedia not supported in this browser environment / iframe.');
        }
      } catch (err: any) {
        // Camera initiation failed (expected in iframes or lacking permissions)
        setCameraPermissionError('Iframe permissions blocked camera stream. Using interactive file upload or simulator fallback.');
      }
    }, 150);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraActiveKey(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg');
          setCapturedImage(base64);
          if (cameraActiveKey) {
            handleInputChange(cameraActiveKey, base64);
          }
          stopCamera();
        }
      } catch (err) {
        simulatePhoto();
      }
    } else {
      simulatePhoto();
    }
  };

  // Elegant fallback simulator for referrals or lab sheet documents
  const simulatePhoto = () => {
    // Generate a high quality official looking document placeholder
    const simulatedDocTemplates = [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80', // medical report clinical look
      'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=500&q=80', // certificate paper
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80'  // audit sheet
    ];
    const chosenTemplate = simulatedDocTemplates[Math.floor(Math.random() * simulatedDocTemplates.length)];
    setCapturedImage(chosenTemplate);
    if (cameraActiveKey) {
      handleInputChange(cameraActiveKey, chosenTemplate);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        handleInputChange(fieldKey, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIntakeSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmissionSuccess(false);

    try {
      // 1. Validation Service for Forms 1.1.1.0 and 1.1.1.1
      if (['1.1.1.0', '1.1.1.1'].includes(selectedSubsection.id)) {
        const mrn = (data.patient_mrn || data.patient_id || '').trim();
        const hUniqueNum = activeHospital?.hospital_unique_number || '';

        if (!hUniqueNum) {
          alert("⚠️ Validation Error: Hospital Unique Number (organization ID) is missing. Cannot submit form.");
          setIsSubmitting(false);
          return;
        }

        if (!mrn) {
          alert("⚠️ Validation Error: Patient MRN identifier is missing. Please select or input a valid Patient MRN.");
          setIsSubmitting(false);
          return;
        }

        // Query patients collection to verify preceding registration (Form 1.1.1) exists
        try {
          const patientsRef = collection(db, 'patients');
          const q = query(patientsRef, where('mrn', '==', mrn), where('hospital_id', '==', hUniqueNum));
          const qSnap = await getDocs(q);
          if (qSnap.empty) {
            alert(`⚠️ Validation Error: Preceding Patient Registration folder for MRN "${mrn}" does not exist. Please complete Form 1.1.1 (Patient Registration Office) first before requesting payment or cashier verification.`);
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          console.warn('Patient verification query bypassed:', err);
        }
      }

      // Validation for 1.1.1.m, 1.1.1.t, 1.1.1.z.2 Prescription Forms
      if (['1.1.1.m', '1.1.1.t', '1.1.1.z.2'].includes(selectedSubsection.id)) {
        const rxValidation = validatePrescriptionSchema(data, selectedSubsection.id);
        if (!rxValidation.isValid) {
          const errList = Object.values(rxValidation.errors).map(e => `• ${e}`).join('\n');
          alert(`⚠️ Prescription Validation Failure:\n${errList}`);
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        hospital_id: hospital_id,
        module_id: selectedModule.id,
        subsection_id: selectedSubsection.id,
        subsection_name: selectedSubsection.name,
        submitted_at: new Date().toISOString(),
        data: data
      };

      if (isOffline()) {
        const offPayload = {
          hospital_id: hospital_id,
          moduleId: selectedModule.id,
          subsectionId: selectedSubsection.id,
          subsectionName: selectedSubsection.name,
          submittedAt: payload.submitted_at,
          data: data
        };
        queueForSync(offPayload);

        // Simulate local patient state updates for consecutive steps
        const mrn = (data.patient_mrn || data.patient_id || data.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`).trim();
        const patientName = data.patient_name || data.full_name || data.name || 'Unknown Patient';
        if (['1.1.1', '1.1.1.0', '1.1.1.1'].includes(selectedSubsection.id)) {
          setLastRegisteredPatient({ mrn, name: patientName });
        }

        // Clear local drafts
        if (selectedSubsection.id.startsWith('1.1.1')) {
          localStorage.removeItem(`ehr_draft_${selectedSubsection.id}`);
        }

        setSubmissionSuccess(true);
        setFormData({});
        setCapturedImage(null);
        alert(`Offline Sync Alert: Clinical record queued securely. Patient data will synchronize automatically when internet connectivity to the EHR schema tables is restored.`);

        // Automatically advance to next step if in Play Mode
        if (isPlayMode) {
          let nextSubId = '';
          let nextStepName = '';
          if (selectedSubsection.id === '1.1.1') {
            nextSubId = '1.1.1.0';
            nextStepName = 'Step 1: Patient Registration Payment Request';
          } else if (selectedSubsection.id === '1.1.1.0') {
            nextSubId = '1.1.1.1';
            nextStepName = 'Step 2: Cashier Payment Verification';
          } else if (selectedSubsection.id === '1.1.1.1') {
            nextSubId = '1.1.1.2';
            nextStepName = 'Step 3: EHR Clinical Hub Folder';
          } else if (selectedSubsection.id === '1.1.1.2') {
            nextSubId = '1.1.1.a';
            nextStepName = 'Step 4: Pre-Triage Screen Intake';
          }

          if (nextSubId) {
            const nextSub = MODULES_CONFIG[0].subsections.find(s => s.id === nextSubId);
            if (nextSub) {
              setGuidedNotice(`✓ Step Completed Successfully! Transitioning to ${nextStepName} in 2.5 seconds...`);
              setTimeout(() => {
                setSelectedSubsection(nextSub);
                setGuidedNotice(null);
              }, 2500);
            }
          }
        }

        setIsSubmitting(false);
        return;
      }

      // Optimistic UI Update
      setRecentSubmissions(prev => [{ id: 'optimistic_' + Date.now(), ...payload }, ...prev]);
      setSubmissionSuccess(true);
      setFormData({});
      setCapturedImage(null);
      setIsSubmitting(false);

      // Use the batch submission workflow service
      const result = await submitClinicalSubmission({
        hospital_id: hospital_id,
        moduleId: selectedSubsection.id.split('.')[0] + '.' + selectedSubsection.id.split('.')[1],
        subsectionId: selectedSubsection.id,
        subsectionName: selectedSubsection.name,
        submittedAt: new Date().toISOString(),
        data: payload.data
      });

      if (!result.success) {
        addToast('info', 'Submission queued for background sync.');
      }

      // Automatically generate or update a Patient Records folder for registration forms
      if (['1.1.1', '1.1.1.0', '1.1.1.1'].includes(selectedSubsection.id)) {
        const patientsCollRef = collection(db, 'patients');
        const mrn = (payload.data.patient_mrn || payload.data.patient_id || payload.data.mrn || data.patient_mrn || data.patient_id || data.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`).trim();
        const patientName = payload.data.patient_name || payload.data.full_name || payload.data.name || data.patient_name || data.full_name || data.name || 'Unknown Patient';
        
        // Check if patient already exists to resolve duplicates
        let existingDocId = '';
        try {
          const q = query(patientsCollRef, where('mrn', '==', mrn), where('hospital_id', '==', hospital_id));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            existingDocId = qSnap.docs[0].id;
          }
        } catch (err) {
          console.warn('Error querying existing patient folder:', err);
        }

        const patientStatus = selectedSubsection.id === '1.1.1.1' ? 'verified' : (selectedSubsection.id === '1.1.1.0' ? 'payment_requested' : 'registered');

        if (existingDocId) {
          // Update the existing folder with new details and updated status to avoid duplicate clinical folders
          await updateDoc(doc(db, 'patients', existingDocId), {
            status: patientStatus,
            last_updated: new Date().toISOString(),
            dob: payload.data.dob || data.dob || '',
            phone: payload.data.phone || data.phone || '',
            address: payload.data.address || data.address || ''
          });
        } else {
          // Create the folder initially (occurs on step 1.1.1)
          await addDoc(patientsCollRef, {
            hospital_id: hospital_id,
            mrn: mrn,
            full_name: patientName,
            name: patientName,
            created_at: new Date().toISOString(),
            dob: payload.data.dob || data.dob || '',
            phone: payload.data.phone || data.phone || '',
            address: payload.data.address || '',
            status: patientStatus
          });
        }

        // Set state for last registered patient to prefill fields in consecutive wizard steps
        setLastRegisteredPatient({ mrn, name: patientName });

        // Dynamic Initialization: If this is the initial registration (1.1.1), provision the full repository structure & register in Logbook
        if (selectedSubsection.id === '1.1.1') {
          await provisionPatientClinicalHub(mrn, patientName);
          try {
            await addDoc(collection(db, 'register_logbooks'), {
              registration_id: `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              hospital_id: hospital_id,
              patient_mrn: mrn,
              patient_name: patientName,
              patient_age: payload.data.patient_age ? Number(payload.data.patient_age) : undefined,
              patient_gender: payload.data.patient_sex || 'Female',
              register_category: 'Patient Master Registration (1.1.1)',
              department_unit: 'General Outpatient (OPD)',
              summary_notes: `Patient account folder registered. Address: ${payload.data.patient_address || 'N/A'}. Insurance: ${payload.data.insurance_status || 'Paying'}.`,
              registered_by: 'Registration Officer',
              registered_at: new Date().toISOString(),
              priority_level: 'Routine',
              status: 'Completed',
              created_at: serverTimestamp()
            });
          } catch (logErr) {
            console.warn('Register logbook auto-sync error:', logErr);
          }
        }
      }

      // Clear local drafts on successful online submission
      if (selectedSubsection.id.startsWith('1.1.1')) {
        localStorage.removeItem(`ehr_draft_${selectedSubsection.id}`);
      }

      setSubmissionSuccess(true);
      setFormData({});
      setCapturedImage(null);
      fetchSubmissions();

      // Automatically advance to next step if in Play Mode
      if (isPlayMode) {
        let nextSubId = '';
        let nextStepName = '';
        if (selectedSubsection.id === '1.1.1') {
          nextSubId = '1.1.1.0';
          nextStepName = 'Step 1: Patient Registration Payment Request';
        } else if (selectedSubsection.id === '1.1.1.0') {
          nextSubId = '1.1.1.1';
          nextStepName = 'Step 2: Cashier Payment Verification';
        } else if (selectedSubsection.id === '1.1.1.1') {
          nextSubId = '1.1.1.2';
          nextStepName = 'Step 3: EHR Clinical Hub Folder';
        } else if (selectedSubsection.id === '1.1.1.2') {
          nextSubId = '1.1.1.a';
          nextStepName = 'Step 4: Pre-Triage Screen Intake';
        } else if (selectedSubsection.id.match(/^1\.1\.1\.[a-y]/)) {
          // Continue non-stop through alphabetical clinical sub-forms (a -> b -> c ...)
          const currentCharCode = selectedSubsection.id.split('.').pop()?.charCodeAt(0) || 97; // 'a' is 97
          nextSubId = `1.1.1.${String.fromCharCode(currentCharCode + 1)}`;
          const nextSub = MODULES_CONFIG[0].subsections.find(s => s.id === nextSubId);
          nextStepName = nextSub ? nextSub.name : 'Next Clinical Step';
        }

        if (nextSubId) {
          const nextSub = MODULES_CONFIG[0].subsections.find(s => s.id === nextSubId);
          if (nextSub) {
            setGuidedNotice(`✓ Step Completed Successfully! Transitioning to ${nextStepName} in 2.5 seconds...`);
            setTimeout(() => {
              setSelectedSubsection(nextSub);
              setGuidedNotice(null);
            }, 2500);
          }
        }
      }

      // --- TRIGGER LOGIC ENGINE ---
      // Trigger 1: Pharmacy Stock-out -> Notify Finance
      if (selectedSubsection.id === 'inventory_stock_out_monitor' && data.stock_out_triggered === 'Yes - Critical Shortage') {
        await addDoc(collection(db, 'hospital_notifications'), {
          hospital_id,
          source_module: 'Module-11 (Pharmacy)',
          target_module: 'Module-8 (Finance)',
          type: 'CRITICAL_STOCK_OUT',
          message: `URGENT: ${data.item_name} is out of stock. Release purchase funds immediately for procurement.`,
          created_at: new Date().toISOString(),
          status: 'unread'
        });
        alert(`🚨 TRIGGER ACTIVATED: Pharmacy stock-out of "${data.item_name}" has automatically notified the Finance Department to release procurement funds.`);
      }

      // Trigger 2: Quality Death Audit -> Suggest HR Training
      if (selectedSubsection.id === 'death_audit' && data.preventable_status === 'Yes - Modifiable Factors Identified') {
        await addDoc(collection(db, 'hospital_notifications'), {
          hospital_id,
          source_module: 'Module-4 (Quality)',
          target_module: 'Module-7 (HR)',
          type: 'TRAINING_REQUIRED',
          message: `PREVENTABLE DEATH AUDIT: Patient ${data.patient_mrn} case review identified modifiable factors. Suggestion: Initiate staff training in ${data.suggested_hr_training || 'Clinical Safety'}.`,
          created_at: new Date().toISOString(),
          status: 'unread'
        });
        alert(`🚨 TRIGGER ACTIVATED: Preventable death audit for MRN ${data.patient_mrn} has triggered a training recommendation to the HR Department.`);
      }

      // Trigger 3: Bio-Medical Non-functional -> Block Lab/Radiology
      if (selectedSubsection.id === 'biomedical_device_tracking' && data.functional_status === 'Non-Functional (Needs Repair)') {
        await addDoc(collection(db, 'hospital_notifications'), {
          hospital_id,
          source_module: 'Module-10 (Bio-Medical)',
          target_module: 'Module-1 (EHR)',
          type: 'EQUIPMENT_FAILURE',
          message: `DEVICE ALERT: ${data.device_name} (SN: ${data.serial_no}) is NON-FUNCTIONAL. Lab and Radiology requests for this machine should be paused until repaired.`,
          created_at: new Date().toISOString(),
          status: 'unread'
        });
        alert(`🚨 TRIGGER ACTIVATED: Bio-Medical device "${data.device_name}" marked as Non-functional. Lab and Radiology units have been notified to pause service requests for this machine.`);
      }

      // Validation for Trigger 3: Prevent Lab/Radiology submissions if machine is down
      if (['1.1.1.j', '1.1.1.k'].includes(selectedSubsection.id)) {
        // Conceptual check: In a real app, we'd query the 'hospital_notifications' or 'biomedical_device_tracking' collection here.
        // For now, we'll just log the check.
        console.log(`Checking machine status for ${selectedSubsection.name} request...`);
      }
    } catch (err) {
      console.error('Error saving module form submission:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmissionSuccess(false), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleIntakeSubmit(formData);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this clinical record from Firestore? This will also remove any linked patient registry or schema entries if applicable.')) return;
    try {
      // Fetch the record first to know its metadata for cascade cleanup
      const snap = await getDoc(doc(db, 'hospital_modules_submissions', id));
      if (snap.exists()) {
        const rec = snap.data();
        const mrn = rec.data?.patient_mrn || rec.data?.mrn || rec.data?.patient_id;
        const subId = rec.subsection_id;

        // 1. Delete from schema-specific collection
        const schemaKey = 'Form_' + subId.replace(/\./g, '_');
        if (ENTITIES_CONFIG[schemaKey] && mrn) {
          try {
            const schemaColl = ENTITIES_CONFIG[schemaKey].collectionName;
            const qSchema = query(collection(db, schemaColl), where('hospital_id', '==', hospital_id), where('patient_mrn', '==', mrn));
            const qSnap = await getDocs(qSchema);
            for (const d of qSnap.docs) {
              await deleteDoc(doc(db, schemaColl, d.id));
            }
          } catch (err) {
            console.warn('Cascade delete (schema collection) failed:', err);
          }
        }

        // 2. If it's a registration form (1.1.1), also delete from patients collection
        if (subId === '1.1.1' && mrn) {
          try {
            const qPatient = query(collection(db, 'patients'), where('hospital_id', '==', hospital_id), where('mrn', '==', mrn));
            const pSnap = await getDocs(qPatient);
            for (const d of pSnap.docs) {
              await deleteDoc(doc(db, 'patients', d.id));
            }
            console.log(`Cascade delete: Patient ${mrn} removed from registry.`);
          } catch (err) {
            console.warn('Cascade delete (patients collection) failed:', err);
          }
        }
      }

      await deleteDoc(doc(db, 'hospital_modules_submissions', id));
      fetchSubmissions();
      if (addToast) addToast('success', 'Record and linked data deleted successfully.');
    } catch (err) {
      console.error('Error deleting record:', err);
      if (addToast) addToast('error', 'Failed to delete record.');
    }
  };

  // Search Logic: Filter modules and subsections
  const filteredModules = MODULES_CONFIG.filter(mod => {
    const query = (searchQuery || '').toLowerCase();
    const modMatch = (mod.title || '').toLowerCase().includes(query);
    const subMatch = (mod.subsections || []).some(sub => (sub.name || '').toLowerCase().includes(query));
    return modMatch || subMatch;
  });

  // Filter Subsections for Module 1
  const getFilteredSubsections = () => {
    let baseSubsections = [];
    if (selectedModule.id !== 'Module-1') {
      baseSubsections = selectedModule.subsections;
    } else {
      // Move all clinical forms 1.1.1.a through 1.1.1.z.3 to the Patient Account Folder
      // Keep only the primary registration/payment forms 1.1.1, 1.1.1.0, 1.1.1.1, 1.1.1.2
      const mainSubsections = selectedModule.subsections.filter(
        s => !s.id.match(/^1\.1\.1\.[a-z]/)
      );
      
      // Under subsets of EHR Clinical Hub folder, open ascending 1.1.1.a-1.1.1.z
      const isClinicalHubActive = selectedSubsection && (
        selectedSubsection.id === '1.1.1.2' || 
        selectedSubsection.id.match(/^1\.1\.1\.[a-z]/)
      );

      if (isClinicalHubActive) {
        const clinicalSubforms = selectedModule.subsections.filter(
          s => s.id.match(/^1\.1\.1\.[a-z]/)
        ).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        baseSubsections = [...mainSubsections, ...clinicalSubforms];
      } else {
        baseSubsections = [...mainSubsections];
      }
    }
    
    // Apply OPD/IPD Filter
    let filtered = baseSubsections;
    if (opdIpdFilter !== 'all') {
      filtered = filtered.filter(s => s.category === opdIpdFilter || s.category === 'both');
    }

    // Apply Search Filter
    if ((searchQuery || '').trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name || '').toLowerCase().includes(query) ||
        (s.id || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  return (
    <>
    <div className="space-y-6">
      {/* Module Hub Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Clipboard size={140} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-400 font-mono text-xs font-bold tracking-widest uppercase">
              <Sparkles size={14} className="animate-pulse" />
              <span>Enterprise Medical Workspace</span>
            </div>
            <h2 id="modules-workspace-title" className="text-2xl font-bold tracking-tight font-sans">
              Hospital Modules Console
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl font-sans">
              Fully compliant database schema tables and interactive intake workflows spanning Module 1. Access, persist, audit, and print medical operations.
            </p>
            
            {/* Dashboard Summary / Progress Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Module Completion Progress</span>
                  <span className="text-indigo-400 font-bold text-xs font-mono">{calculateModuleProgress(selectedModule)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: `${calculateModuleProgress(selectedModule)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center px-3 border-r border-slate-700">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Saved</div>
                  <div className="text-emerald-400 font-bold text-sm font-mono">{selectedModule.subsections.filter(s => getSubsectionStatus(s.id) === 'saved').length}</div>
                </div>
                <div className="text-center px-3 border-r border-slate-700">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Drafts</div>
                  <div className="text-orange-400 font-bold text-sm font-mono">{selectedModule.subsections.filter(s => getSubsectionStatus(s.id) === 'draft').length}</div>
                </div>
                <div className="text-center px-3">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Pending</div>
                  <div className="text-amber-400 font-bold text-sm font-mono">{selectedModule.subsections.filter(s => getSubsectionStatus(s.id) === 'pending').length}</div>
                </div>
              </div>
            </div>
          </div>
            <div className="text-right flex flex-col items-end gap-3">
              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-lg px-3 py-1.5 transition-all text-xs text-slate-300 font-medium">
                    <Globe size={14} className="text-indigo-400" />
                    <span>{selectedLanguage}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {['English', 'Spanish', 'French', 'Arabic', 'Swahili'].map(lang => (
                      <button 
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-700 transition-colors ${selectedLanguage === lang ? 'text-indigo-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search modules or forms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-10 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 md:w-64 transition-all"
                  />
                  <button
                    onClick={startVoiceSearch}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all ${
                      isListening 
                        ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title="Voice Search (Patient Name or ID)"
                  >
                    <Mic size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Terminal ID</div>
                  <div className="text-[10px] font-bold font-mono text-indigo-300">{hospital_id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Modules & Subsections Selector */}
        <div className={`${isHospitalSidebarCollapsed ? 'lg:col-span-1 flex flex-col items-center' : 'lg:col-span-4'} space-y-6 transition-all duration-300`}>
          {/* Subsection Forms Lists */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs w-full">
            {!isHospitalSidebarCollapsed ? (
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider font-mono">Add Items Forms</h3>
                {/* Filter tabs if Module 1 */}
                {selectedModule.id === 'Module-1' && (
                  <div className="flex gap-1 bg-gray-100 p-0.5 rounded-md">
                    <button 
                      onClick={() => setOpdIpdFilter('all')} 
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-sans cursor-pointer ${opdIpdFilter === 'all' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setOpdIpdFilter('outpatient')} 
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-sans cursor-pointer ${opdIpdFilter === 'outpatient' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      OPD
                    </button>
                    <button 
                      onClick={() => setOpdIpdFilter('inpatient')} 
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-sans cursor-pointer ${opdIpdFilter === 'inpatient' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      IPD
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center border-b border-gray-100 pb-2 mb-2" title="Forms List">
                <FileText size={16} className="text-gray-500" />
              </div>
            )}

            <div className={`space-y-1 ${isHospitalSidebarCollapsed ? 'flex flex-col items-center' : 'max-h-[400px] overflow-y-auto pr-1'}`}>
              {getFilteredSubsections().map(sub => {
                const isSelected = selectedSubsection.id === sub.id;
                const status = getSubsectionStatus(sub.id);
                const visuals = getStatusVisuals(status);

                if (isHospitalSidebarCollapsed) {
                  const shortId = sub.id.split('.').pop() || sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubsection(sub)}
                      className={`w-10 h-10 rounded-lg text-xs transition-all flex flex-col items-center justify-center border relative group cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                          : `${visuals.color} hover:bg-gray-50`
                      }`}
                    >
                      <FileText size={14} className={isSelected ? 'text-indigo-600' : 'text-gray-400'} />
                      <span className="text-[8px] -mt-0.5 font-bold truncate max-w-full px-0.5">{shortId}</span>
                      
                      {/* Status Dot */}
                      {status !== 'not_started' && (
                        <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          status === 'saved' ? 'bg-emerald-500' : 'bg-orange-500'
                        }`} />
                      )}

                      {sub.id === '1.1.1.m.2' && pendingRefills.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm animate-pulse">
                          {pendingRefills.length}
                        </div>
                      )}

                      {/* Floating Tooltip */}
                      <div className="absolute left-12 top-1/2 -translate-y-1/2 z-50 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md border border-gray-800">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-indigo-400">{sub.id}</p>
                          <span className={`px-1 rounded text-[9px] uppercase font-bold ${visuals.color}`}>
                            {visuals.label}
                          </span>
                        </div>
                        <p className="text-gray-200 mt-0.5 truncate max-w-[250px]">{sub.name}</p>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubsection(sub)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-sans transition-all flex items-start gap-2.5 border cursor-pointer group ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                        : `${visuals.color} hover:bg-gray-50 border-transparent`
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 relative">
                      <FileText size={13} className={isSelected ? 'text-indigo-600' : 'text-gray-400'} />
                      {status === 'saved' && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                        </div>
                      )}
                      {(status === 'draft' || status === 'pending') && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full">
                          <AlertCircle size={10} className="text-orange-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="leading-tight">{sub.name}</span>
                        {sub.id === '1.1.1.m.2' && pendingRefills.length > 0 && (
                          <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black animate-pulse shadow-xs">
                            {pendingRefills.length}
                          </span>
                        )}
                        {status !== 'not_started' && (
                          <span className={`px-1 rounded-[4px] text-[8px] uppercase font-extrabold ${visuals.color} shrink-0`}>
                            {visuals.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {getFilteredSubsections().length === 0 && !isHospitalSidebarCollapsed && (
                <div className="text-center py-6 text-gray-400 text-xs font-sans">
                  No forms available under this category filter.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Expand/Collapse Toggle Footer for Hospital Modules */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-2xs flex items-center justify-center w-full">
            <button
              onClick={() => setIsHospitalSidebarCollapsed(!isHospitalSidebarCollapsed)}
              className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
              title={isHospitalSidebarCollapsed ? "Expand Modules Sidebar" : "Collapse Modules Sidebar"}
            >
              {isHospitalSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              {!isHospitalSidebarCollapsed && <span>Collapse Sidebar</span>}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Forms & History */}
        <div className={`${isHospitalSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-8'} space-y-6 transition-all duration-300`}>
          {!selectedSubsection ? (
            <div className="bg-white rounded-xl border border-gray-200 p-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-gray-50 rounded-full text-gray-400">
                <Clipboard size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">No Form Selected</h3>
                <p className="text-sm text-gray-500">Please select a specific hospital module subsection from the left sidebar to start clinical intake.</p>
              </div>
            </div>
          ) : selectedModule.id !== 'Module-1' && !unlockedModules[selectedModule.id] ? (
            <ModuleLock 
              moduleId={selectedModule.id}
              moduleName={selectedModule.title}
              onUnlock={() => setUnlockedModules(prev => ({ ...prev, [selectedModule.id]: true }))}
            />
          ) : (
            <>
              {/* Guided Registration Wizard Timeline / Play Mode Panel */}
              {selectedModule.id === 'Module-1' && (
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-slate-200 rounded-xl p-4 shadow-3xs space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Sparkles size={16} className="animate-pulse text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                          Guided Registration Onboarding (Auto-Play Mode)
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Saves details and automatically advances across sequential registration and verification steps.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPlayMode(!isPlayMode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.25 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        isPlayMode 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Play size={12} className={isPlayMode ? 'animate-spin' : ''} />
                      <span>{isPlayMode ? 'Auto-Advance ON' : 'Auto-Advance OFF'}</span>
                    </button>
                  </div>

                  {/* Timeline Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {[
                      { id: '1.1.1', title: 'Patient Registration', sub: 'Open Folder (Combined)' },
                      { id: '1.1.1.0', title: 'Registration Payment', sub: 'Payment Request (Step 1)' },
                      { id: '1.1.1.1', title: 'Cashier Verification', sub: 'Verification (Step 2)' },
                      { id: '1.1.1.2', title: 'EHR Clinical Hub', sub: 'Clinical Folder (Step 3)' },
                      { id: '1.1.1.a', title: 'Pre-Triage Screen', sub: 'Screening Intake (Step 4)' }
                    ].map((step) => {
                      const isCurrent = selectedSubsection.id === step.id;
                      const isPast = (() => {
                        if (step.id === '1.1.1') return lastRegisteredPatient !== null;
                        if (step.id === '1.1.1.0') return lastRegisteredPatient !== null && selectedSubsection.id !== '1.1.1' && selectedSubsection.id !== '1.1.1.0';
                        if (step.id === '1.1.1.1') return lastRegisteredPatient !== null && !['1.1.1', '1.1.1.0', '1.1.1.1'].includes(selectedSubsection.id);
                        if (step.id === '1.1.1.2') return lastRegisteredPatient !== null && !['1.1.1', '1.1.1.0', '1.1.1.1', '1.1.1.2'].includes(selectedSubsection.id);
                        return false;
                      })();

                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            const foundSub = MODULES_CONFIG[0].subsections.find(s => s.id === step.id);
                            if (foundSub) setSelectedSubsection(foundSub);
                          }}
                          className={`text-left p-3 rounded-lg border transition-all relative flex flex-col justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                              : isPast
                                ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 text-emerald-900'
                                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isCurrent
                                ? 'bg-indigo-100 text-indigo-700'
                                : isPast
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                            }`}>
                              {step.id}
                            </span>
                            {isPast && <Check size={12} className="text-emerald-600 font-bold animate-bounce" />}
                            {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping"></span>}
                          </div>
                          <div className="mt-2">
                            <p className="text-[11px] font-bold font-sans leading-tight">
                              {step.title}
                            </p>
                            <p className="text-[9px] text-slate-400 font-sans leading-normal truncate">
                              {step.sub}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Patient Badge if registered */}
                  {lastRegisteredPatient && (
                    <div className="bg-indigo-50/60 rounded-lg p-2.5 border border-indigo-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-600 animate-pulse" />
                        <span className="font-sans text-slate-700">
                          Active Patient: <strong className="text-slate-900">{lastRegisteredPatient.name}</strong> 
                          <span className="mx-2 text-slate-300">|</span> 
                          MRN: <strong className="text-indigo-700 font-mono">{lastRegisteredPatient.mrn}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleGeneratePdfReport(lastRegisteredPatient.mrn)}
                          disabled={isCompilingReport}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                          title="Compile all registration, billing, triage, and clinical progress notes into a master medical summary."
                        >
                          {isCompilingReport ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              <span>Compiling...</span>
                            </>
                          ) : (
                            <>
                              <FileText size={11} />
                              <span>Generate PDF Report</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setLastRegisteredPatient(null);
                          }}
                          className="text-[10px] text-slate-500 hover:text-red-600 font-bold underline cursor-pointer"
                          title="Clear active patient details to start a new registration"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Guided Notice Banner */}
                  {guidedNotice && (
                    <div className="bg-indigo-600 text-white text-xs font-semibold p-3 rounded-lg shadow-md animate-pulse flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="animate-spin text-amber-300" />
                        <span>{guidedNotice}</span>
                      </div>
                      <div className="h-1 bg-white/30 rounded-full w-24 overflow-hidden">
                        <div className="h-full bg-amber-300 animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main Form Workstation */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                      {selectedSubsection.id} Form
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1 font-sans">
                      {selectedSubsection.name.replace(/^[0-9.]+\s*/, '')}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end text-right text-xs font-sans">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusVisuals(getSubsectionStatus(selectedSubsection.id)).color}`}>
                        Status: {getStatusVisuals(getSubsectionStatus(selectedSubsection.id)).label}
                      </span>
                      <span className="text-gray-500 italic">Saves directly to Firebase</span>
                    </div>
                    {lastAutosavedTime && (
                      <span className="text-indigo-600 font-bold text-[10px] animate-pulse mt-0.5">
                        ✓ Draft: {lastAutosavedTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reusable Add Items Form Workstation */}
                <div className="p-1">
                  {selectedSubsection.id === '1.1.1.m.2' && (
                    <div className="px-5 py-6">
                      <RefillApprovalQueue 
                        pendingRefills={pendingRefills} 
                        onRefresh={fetchSubmissions} 
                      />
                    </div>
                  )}

                  {selectedSubsection.id === '1.1.1.2' && (
                    <div className="px-5 py-6 bg-slate-50/50 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Database size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">EHR Clinical Hub Storage</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Browse and manage all registered patient clinical folders in {hospital_id}</p>
                          </div>
                        </div>
                        <button 
                          onClick={fetchPatientFolders}
                          disabled={loadingPatients}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={loadingPatients ? 'animate-spin' : ''} />
                          <span>Refresh Storage</span>
                        </button>
                      </div>

                      {loadingPatients ? (
                        <div className="py-12 text-center text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-indigo-500" />
                          <p className="text-xs font-bold animate-pulse">Syncing patient folders from EHR cloud storage...</p>
                        </div>
                      ) : patients.length === 0 ? (
                        <div className="py-12 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
                          <Folder size={32} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-xs text-gray-500 font-medium italic">No clinical folders found. Register a patient in Step 1.1.1 to initialize their hub folder.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {patients.map(p => (
                            <div 
                              key={p.id} 
                              className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-500 hover:shadow-md transition-all group relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                              
                              <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                  </div>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    p.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 
                                    p.status === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {p.status || 'Active'}
                                  </span>
                                </div>
                                
                                <h4 className="text-sm font-black text-slate-900 truncate pr-4">{p.name || p.full_name}</h4>
                                <p className="text-[10px] font-mono font-extrabold text-indigo-600 mt-0.5">{p.mrn}</p>
                                
                                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="space-y-1">
                                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Age/Sex</span>
                                    <span className="text-slate-700 font-bold block">{p.age || '—'} / {p.sex || p.gender || '—'}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Phone</span>
                                    <span className="text-slate-700 font-bold block">{p.phone || '—'}</span>
                                  </div>
                                </div>

                                <button 
                                  onClick={() => openHubFolder(p)}
                                  disabled={loadingHubMrn === p.mrn}
                                  className={`w-full mt-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                    loadingHubMrn === p.mrn 
                                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-sm active:scale-95'
                                  }`}
                                >
                                  {loadingHubMrn === p.mrn ? (
                                    <>
                                      <RefreshCw size={12} className="animate-spin" />
                                      <span>Opening...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={12} />
                                      <span>Open Hub Folder</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2">
                        <div className="p-1 bg-amber-50 text-amber-600 rounded">
                          <Sparkles size={12} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          You can still use the intake form below to manually update hub status or add intake notes for any MRN.
                        </p>
                      </div>
                    </div>
                  )}

                  {functionalDevices.length > 0 && (
                    <div className="mx-4 mt-2 mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-in slide-in-from-top-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity size={16} className="text-indigo-600" />
                          <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-mono">Recommended Functional Devices</h5>
                        </div>
                        <span className="text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Auto-Detected</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {functionalDevices.map((device, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInputChange('device_ref', `${device.device_name} (SN: ${device.serial_no})`)}
                            className="bg-white border border-indigo-200 p-2.5 rounded-lg text-left hover:border-indigo-500 hover:shadow-sm transition-all group cursor-pointer"
                          >
                            <div className="text-[11px] font-bold text-slate-900 truncate group-hover:text-indigo-700">{device.device_name}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">SN: {device.serial_no}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSubsection.id === '1.1.1.j' ? (
                    <EDLabResultsReport />
                  ) : selectedSubsection.id === '1.1.1.k' ? (
                    <EDRadiologyResultsReport />
                  ) : selectedSubsection.id !== '1.1.1.m.2' && (
                    <IntakeForm
                      config={{
                        id: selectedSubsection.id,
                        name: selectedSubsection.name,
                        collectionName: 'hospital_modules_submissions',
                        icon: selectedModule.icon,
                        subtitle: selectedSubsection.name.replace(/^[0-9.]+\s*/, ''),
                        description: `Saves directly to Firebase for ${hospital_id}`,
                        searchPlaceholder: 'Search...',
                        fields: [
                          ...selectedSubsection.fields,
                          { key: 'mark_as_pending', label: 'Requires additional data / review (Mark as Pending)', type: 'checkbox' }
                        ] as any,
                        defaultSeed: []
                      }}
                      onSubmit={(data) => {
                        const status = data.mark_as_pending ? 'pending' : 'saved';
                        handleIntakeSubmit({ ...data, status });
                      }}
                      initialData={formData}
                    />
                  )}
                  {/* Database Schema & Exploration Guide */}
                  {selectedSubsection.id === '1.1.1.2' && (
                    <div className="mx-6 mb-8 pt-8 border-t border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <Database size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Master EHR Data Schema Table</h4>
                          <p className="text-[10px] text-slate-500 font-sans">Database mapping for Data & Exploration phase</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Logical Storage Mapping</h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Primary Key / Path ID</span>
                              <code className="text-indigo-600 font-bold">subsection_id</code>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Patient Identifier</span>
                              <code className="text-emerald-600 font-bold">patient_mrn</code>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Collection (Cloud)</span>
                              <code className="text-slate-700 font-mono">hospital_modules_submissions</code>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Example Query Logic</h5>
                          <div className="font-mono text-[9px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                            <p className="text-indigo-600 font-bold">// To fetch Lab Results (1.1.1.j)</p>
                            <p>SELECT * FROM EHR_REPOSITORY</p>
                            <p>WHERE code == '1.1.1.j'</p>
                            <p>AND mrn == '00013'</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-[10px] text-amber-800 leading-relaxed italic font-medium">
                          Advice: This schema organizes your data for you. When building custom views (e.g., "LabResultView"), ensure its data source is strictly mapped to its corresponding Master Code.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Historical Persisted Records of Selected Subsection */}
          {selectedSubsection && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                  {lastRegisteredPatient ? `Clinical Hub History: ${lastRegisteredPatient.name}` : 'Cloud History Logs'}
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5 font-sans">
                  {lastRegisteredPatient 
                    ? `Showing historical clinical records for MRN: ${lastRegisteredPatient.mrn}`
                    : `Submitted data and audits captured under organization ${hospital_id}`}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedRecordIds.length > 0 && (
                  <div className="flex items-center gap-2 p-1 bg-indigo-50 border border-indigo-100 rounded-lg animate-in fade-in slide-in-from-right-4 mr-2">
                    <span className="text-[9px] font-bold text-indigo-900 px-2 uppercase tracking-wider">{selectedRecordIds.length} Selected</span>
                    <button
                      onClick={handleBatchArchiveRecords}
                      disabled={isBatchProcessingRecords}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-200 text-indigo-700 text-[9px] font-bold rounded-md hover:bg-indigo-100 transition-all cursor-pointer shadow-3xs"
                      title="Archive (Ctrl+Shift+A)"
                    >
                      <Clock size={10} />
                      Archive
                    </button>
                    <button
                      onClick={handleBatchExportRecords}
                      disabled={isBatchProcessingRecords}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-200 text-indigo-700 text-[9px] font-bold rounded-md hover:bg-indigo-100 transition-all cursor-pointer shadow-3xs"
                      title="Export (Ctrl+Shift+E)"
                    >
                      <Download size={10} />
                      Export
                    </button>
                    <button
                      onClick={handleBatchDeleteRecords}
                      disabled={isBatchProcessingRecords}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white border border-rose-200 text-rose-700 text-[9px] font-bold rounded-md hover:bg-rose-50 transition-all cursor-pointer shadow-3xs"
                      title="Delete (Ctrl+Shift+D)"
                    >
                      <Trash2 size={10} />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedRecordIds([])}
                      className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={fetchSubmissions}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Refresh logs history"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {cleanupMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 px-5 py-2.5 border-b border-emerald-100 dark:border-emerald-900/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{cleanupMessage}</span>
              </div>
            )}

            {lowStockAlerts.length > 0 && selectedSubsection.id === '1.1.1.2' && (
              <div className="bg-amber-50 border-b border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={14} className="text-amber-600" />
                  <h5 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Chronic Medication Alerts & Low Stock Notifications</h5>
                </div>
                <div className="space-y-2">
                  {lowStockAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-white/60 rounded-lg p-3 border border-amber-200 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${alert.daysRemaining <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {alert.status}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{alert.medication}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                          {alert.daysRemaining <= 0 
                            ? 'Stock exhausted. Patient requires immediate chronic medication refill request.' 
                            : `${alert.daysRemaining} days of supply remaining according to last prescription.`}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleGenerateRefillWorkflow(alert)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 whitespace-nowrap"
                      >
                        <RefreshCw size={12} />
                        <span>Generate Refill Workflow</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingHistory ? (
              <div className="p-8 text-center text-gray-400 text-xs font-sans">
                <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-indigo-500" />
                <span>Syncing records with Firestore database...</span>
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-sans italic leading-relaxed">
                {lastRegisteredPatient 
                  ? `No previous ${selectedSubsection.name.replace(/^[0-9.]+\s*/, '')} records found for Patient ${lastRegisteredPatient.name} (MRN: ${lastRegisteredPatient.mrn}).`
                  : `No record entries registered in Firestore for form ${selectedSubsection.id} under organization ${hospital_id}.`}
                <br />
                <span className="text-[10px] opacity-70">Click "Submit Add Items Form" above to add new data to the clinical hub.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/55 text-[10px] font-mono uppercase text-gray-400 border-b border-gray-100">
                      <th className="p-3 pl-5 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedRecordIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                          onChange={() => {
                            if (selectedRecordIds.length === filteredSubmissions.length) {
                              setSelectedRecordIds([]);
                            } else {
                              setSelectedRecordIds(filteredSubmissions.map(r => r.id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="p-3">Submitted At</th>
                      {selectedSubsection.id === '1.1.1.2' && <th className="p-3">Form Type</th>}
                      <th className="p-3">Primary Key / Content</th>
                      <th className="p-3">File / Image</th>
                      <th className="p-3 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubmissions.map(rec => {
                      // Extract key field values to preview on list
                      const keys = Object.keys(rec.data || {});
                      const primaryKey = keys.find(k => k.includes('mrn') || k.includes('title') || k.includes('topic') || k.includes('ref')) || keys[0] || '';
                      const secondaryKey = keys.find(k => k.includes('name') || k.includes('findings') || k.includes('priorities') || k.includes('plan')) || keys[1] || '';
                      const hasCameraField = keys.some(k => rec.data[k] && rec.data[k].startsWith('data:image/'));

                      return (
                        <tr key={rec.id} className={`text-xs hover:bg-slate-50/50 transition-colors font-sans ${selectedRecordIds.includes(rec.id) ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-3 pl-5">
                            <input 
                              type="checkbox" 
                              checked={selectedRecordIds.includes(rec.id)}
                              onChange={() => {
                                if (selectedRecordIds.includes(rec.id)) {
                                  setSelectedRecordIds(selectedRecordIds.filter(id => id !== rec.id));
                                } else {
                                  setSelectedRecordIds([...selectedRecordIds, rec.id]);
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-3 font-mono text-[10px] text-gray-500">
                            {new Date(rec.submitted_at).toLocaleString()}
                          </td>
                          {selectedSubsection.id === '1.1.1.2' && (
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px] uppercase border border-slate-200">
                                {rec.subsection_name?.replace(/^[0-9.]+\s*/, '') || 'Clinical Record'}
                              </span>
                            </td>
                          )}
                          <td className="p-3">
                            <div className="font-bold text-gray-900 truncate max-w-xs">
                              {rec.data[primaryKey] || 'N/A'}
                            </div>
                            <div className="text-gray-500 text-[10px] truncate max-w-xs mt-0.5">
                              {rec.data[secondaryKey] || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3">
                            {hasCameraField ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full w-fit">
                                <ImageIcon size={11} />
                                <span>Capture saved</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedSubmissionForView(rec)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="View Record Details & Print Card"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Detail Record & Print Preview Card Modal */}
      {selectedSubmissionForView && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider">
                  Official Medical Intake Document
                </div>
                <h3 className="text-base font-bold font-sans mt-0.5">
                  Record Card: {selectedSubmissionForView.subsection_name.replace(/^[0-9.]+\s*/, '')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSubmissionForView(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Print Area content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Official Seal / Header */}
              <div className="border-b-2 border-gray-100 pb-4 text-center">
                <h4 className="text-sm font-bold text-gray-900 font-sans tracking-wide uppercase">
                  Hospital Portal
                </h4>
                <p className="text-[10px] text-gray-500 font-sans tracking-wider mt-0.5">
                  National Health Authority Portal
                </p>
                <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-gray-500 px-2 bg-slate-50 py-1.5 rounded-lg">
                  <div>Organization: <span className="font-bold text-slate-800">{hospital_id}</span></div>
                  <div>Form: <span className="font-bold text-slate-800">{selectedSubmissionForView.subsection_id}</span></div>
                  <div>Date: <span className="font-bold text-slate-800">{new Date(selectedSubmissionForView.submitted_at).toLocaleString()}</span></div>
                </div>
              </div>

              {/* Patient details key/values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(selectedSubmissionForView.data || {}).map(key => {
                  const val = selectedSubmissionForView.data[key];
                  if (typeof val === 'string' && val.startsWith('data:image/')) {
                    return null; // Render image below
                  }
                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-100/60">
                      <div className="text-[10px] font-bold text-gray-400 uppercase font-mono">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1 font-sans leading-relaxed">
                        {val === true ? 'Verified (Yes)' : val === false ? 'No' : val || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Render Saved Camera Capture Referral or Document */}
              {Object.keys(selectedSubmissionForView.data || {}).map(key => {
                const val = selectedSubmissionForView.data[key];
                if (typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('http'))) {
                  return (
                    <div key={key} className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase font-mono">
                        Captured Official Scan attachment ({key.replace(/_/g, ' ')})
                      </div>
                      <div className="border border-gray-200 rounded-xl overflow-hidden max-w-sm bg-slate-50 p-2">
                        <img src={val} alt="Official scan" className="w-full h-auto object-contain max-h-56 rounded-lg" />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Print Footer Controls */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Medical Card</span>
              </button>
              <button
                onClick={() => setSelectedSubmissionForView(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Patient Medical Summary PDF Report Modal */}
      {compiledReportData && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none">
            {/* Header */}
            <div className="bg-indigo-900 text-white p-5 flex items-center justify-between border-b border-indigo-950 print:hidden">
              <div>
                <div className="text-[10px] font-mono text-indigo-300 uppercase font-extrabold tracking-wider">
                  National Health Information System (NHIS)
                </div>
                <h3 className="text-base font-extrabold font-sans mt-0.5 flex items-center gap-2">
                  <FileText size={18} className="text-amber-400" />
                  <span>EHR Compiled Patient Medical Summary</span>
                </h3>
              </div>
              <button 
                onClick={() => setCompiledReportData(null)}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Print Area */}
            <div className="p-8 overflow-y-auto space-y-6 print:overflow-visible print:p-4">
              {/* Official Seal / Hospital Header */}
              <div className="border-b-4 border-slate-900 pb-5 text-center relative">
                <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight uppercase">
                  OFFICIAL ELECTRONIC HEALTH RECORD (EHR)
                </h2>
                <p className="text-xs text-slate-500 font-sans tracking-widest mt-1 uppercase font-semibold">
                  Compiled Medical Dossier & Patient History Summary
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-left">Healthcare Facility: <span className="font-extrabold text-slate-900">{hospital_id}</span></div>
                  <div className="text-center">Active Dossier Key: <span className="font-extrabold text-indigo-700">{compiledReportData[0]?.data?.patient_mrn || lastRegisteredPatient?.mrn || 'N/A'}</span></div>
                  <div className="text-right">Generated: <span className="font-extrabold text-slate-900">{new Date().toLocaleString()}</span></div>
                </div>
              </div>

              {/* Primary Patient Demographics Overview */}
              {(() => {
                const regDoc = compiledReportData.find(r => r.subsection_id === '1.1.1');
                const pName = regDoc?.data?.patient_name || lastRegisteredPatient?.name || 'Unknown Patient';
                const pAge = regDoc?.data?.patient_age || '—';
                const pSex = regDoc?.data?.patient_sex || '—';
                const pKebele = regDoc?.data?.patient_address || '—';
                const pInsurance = regDoc?.data?.insurance_status || '—';
                const pPhone = regDoc?.data?.phone || '—';
                const pDob = regDoc?.data?.dob || '—';

                return (
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/60 space-y-3 print:bg-slate-50">
                    <h3 className="text-xs font-black uppercase text-indigo-900 tracking-wider font-sans border-b border-indigo-100/50 pb-1.5">
                      I. Patient Demographics & Profile
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Patient Name</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{pName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Medical Record Number (MRN)</span>
                        <span className="font-mono font-extrabold text-indigo-700 text-sm mt-0.5 block">{regDoc?.data?.patient_mrn || lastRegisteredPatient?.mrn || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Age / Sex</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{pAge} yrs / {pSex}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Date of Birth</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{pDob}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Contact Phone</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{pPhone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Residential Kebele / Address</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{pKebele}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Insurance / Payer Category</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{pInsurance}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Registration Date</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{regDoc?.data?.registration_date || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Compiled Medical Logs Chronology */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-sans border-b-2 border-slate-950 pb-1.5 flex items-center justify-between">
                  <span>II. Clinical Intake Chronicles & Diagnostic Audits (1.1.1 Series)</span>
                  <span className="text-[9px] font-mono text-slate-400 lowercase">{compiledReportData.length} entries recorded</span>
                </h3>

                {compiledReportData.map((rec) => {
                  const keys = Object.keys(rec.data || {}).filter(k => k !== 'referral_image' && k !== 'hospital_id');
                  const hasImage = rec.data?.referral_image;

                  return (
                    <div key={rec.id} className="border border-slate-200/80 rounded-xl overflow-hidden shadow-3xs break-inside-avoid">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md uppercase">
                            {rec.subsection_id}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 font-sans">
                            {rec.subsection_name.replace(/^[0-9.]+\s*/, '')}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">
                          Captured: {new Date(rec.submitted_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {keys.map(key => {
                          const val = rec.data[key];
                          if (typeof val === 'string' && val.startsWith('data:image/')) return null;
                          return (
                            <div key={key} className="text-xs" id={`field-${key}`}>
                              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">{key.replace(/_/g, ' ')}</span>
                              <span className="font-semibold text-slate-800 mt-0.5 block leading-normal">
                                {val === true ? 'Yes' : val === false ? 'No' : val || '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {hasImage && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Official Document Capture attachment</span>
                          <div className="border border-slate-200 rounded-lg p-1 w-full max-w-sm bg-slate-50/50">
                            <img src={hasImage} alt="Referral/Document attachment" className="rounded max-h-40 w-auto object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Signatures Row */}
              <div className="border-t-2 border-dashed border-slate-300 pt-8 mt-12 grid grid-cols-2 gap-8 text-center text-xs font-sans print:mt-16">
                <div>
                  <div className="h-10 border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="mt-2 text-slate-400 text-[10px] font-mono uppercase">Attending Clinician / Registrar Signature</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="mt-2 text-slate-400 text-[10px] font-mono uppercase">Facility Administrator Verification Stamp</p>
                </div>
              </div>
            </div>

            {/* Print Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-gray-100 flex items-center justify-between print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105"
              >
                <Printer size={14} />
                <span>Print Dossier Summary / Save as PDF</span>
              </button>
              <button
                onClick={() => setCompiledReportData(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close Report View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
