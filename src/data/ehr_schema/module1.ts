import { Bed, Heart, FileText, Activity, DollarSign, Database, Folder, Baby, Stethoscope, Scissors, Search, Clock, Calendar, ClipboardList, TrendingUp, Brain, UserMinus, Syringe, Pill, FlaskConical, FileSpreadsheet, Droplets, AlertTriangle, Wind, BookOpen, CreditCard, Receipt, ShieldCheck, Smile, Eye, Accessibility, Award } from 'lucide-react';
import { EntityConfig } from '../schema';

export const PATIENT_MODULE_ENTITIES: Record<string, EntityConfig> = {
  Form_1_1_1: {
    id: 'Form_1_1_1',
    name: '1.1.1 Patient Registration & Background Info (Open Account Folder)',
    collectionName: 'form_1_1_1',
    icon: Database,
    subtitle: 'Form 1.1.1',
    description: '1.1.1 Patient Registration & Background Info (Open Account Folder)',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Medical Record Number (MRN)*",
        "type": "string",
        "required": true,
        "placeholder": "MRN-XXXX"
      },
      {
        "key": "patient_name",
        "label": "Patient Name*",
        "type": "string",
        "required": true,
        "placeholder": "Full Name"
      },
      {
        "key": "patient_age",
        "label": "Age*",
        "type": "number",
        "required": true,
        "placeholder": "Age in years"
      },
      {
        "key": "patient_sex",
        "label": "Sex*",
        "type": "select",
        "required": true,
        "options": [
          "Male",
          "Female"
        ]
      },
      {
        "key": "has_national_id",
        "label": "National ID / Passport (Yes/No)",
        "type": "select",
        "required": false,
        "options": [
          "Yes",
          "No"
        ]
      },
      {
        "key": "national_id_number",
        "label": "National ID / Passport Number",
        "type": "number",
        "required": false,
        "placeholder": "Enter National ID/Passport Number"
      },
      {
        "key": "has_dob",
        "label": "Date of Birth (Yes/No)",
        "type": "select",
        "required": false,
        "options": [
          "Yes",
          "No"
        ]
      },
      {
        "key": "has_phone",
        "label": "Phone Number (Yes/No)",
        "type": "select",
        "required": false,
        "options": [
          "Yes",
          "No"
        ]
      },
      {
        "key": "phone",
        "label": "Phone Number",
        "type": "string",
        "required": false,
        "placeholder": "+251 XXX XXX XXX"
      },
      {
        "key": "registration_date",
        "label": "Registration Date*",
        "type": "date",
        "required": true
      },
      {
        "key": "patient_address",
        "label": "Address*",
        "type": "string",
        "required": true,
        "placeholder": "Woreda, Kebele, House No."
      },
      {
        "key": "has_insurance",
        "label": "Has Insurance*",
        "type": "select",
        "required": true,
        "options": [
          "Yes",
          "No",
          "yes passive"
        ]
      },
      {
        "key": "cbhi_number",
        "label": "CBHI Number",
        "type": "number",
        "required": false,
        "placeholder": "Enter CBHI Number"
      },
      {
        "key": "insurance_status",
        "label": "Insurance Status*",
        "type": "select",
        "required": true,
        "options": [
          "Paying",
          "Staff/Dependent",
          "expired",
          "Other Specific"
        ]
      },
      {
        "key": "other_insurance_details",
        "label": "Other Specific Details",
        "type": "string",
        "required": false,
        "placeholder": "Specify other payment category"
      },
      {
        "key": "referral_papers_option",
        "label": "Referral Papers Capture Camera",
        "type": "select",
        "required": false,
        "options": [
          "No Referral Paper",
          "Yes, Capture / Upload"
        ]
      },
      {
        "key": "referral_facility",
        "label": "Referring Facility",
        "type": "string",
        "required": false,
        "placeholder": "Referring clinic or hospital"
      },
      {
        "key": "referral_image",
        "label": "Referral Papers Attachment",
        "type": "camera",
        "required": false,
        "placeholder": "No referral file attached yet. Capture with camera or upload above."
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_0: {
    id: 'Form_1_1_1_0',
    name: '1.1.1.0 Patient Registration Payment Request Add Items Form Summary',
    collectionName: 'patient_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.0',
    description: '1.1.1.0 Patient Registration Payment Request Add Items Form Summary',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_name",
        "label": "Patient Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "amount",
        "label": "Amount*",
        "type": "number",
        "required": true,
        "placeholder": "e.g., 100"
      },
      {
        "key": "payment_reason",
        "label": "Payment Reason*",
        "type": "select",
        "required": true,
        "options": [
          "Account Open Folder Request",
          "Card Renewal",
          "Re-issue or repeat"
        ]
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted",
          "other"
        ]
      },
      {
        "key": "other_payment_details",
        "label": "Other Payment Details",
        "type": "string",
        "required": false,
        "placeholder": "Enter details if 'other' selected"
      },
      {
        "key": "request_by",
        "label": "Request by*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_1: {
    id: 'Form_1_1_1_1',
    name: '1.1.1.1 Cashier Payment Verification Add Items Form Summary',
    collectionName: 'cashier_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.1',
    description: '1.1.1.1 Cashier Payment Verification Add Items Form Summary',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "invoice_number",
        "label": "Invoice or Insurance Number*",
        "type": "string",
        "required": true
      },
      {
        "key": "payment_reason",
        "label": "Payment Reason*",
        "type": "select",
        "required": true,
        "options": [
          "Account Open Folder Request",
          "Card Renewal",
          "Re-issue or repeat"
        ]
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted"
        ]
      },
      {
        "key": "other_payment_details",
        "label": "Other Specific Payment Category*",
        "type": "string",
        "required": true,
        "placeholder": "Specify details if other category"
      },
      {
        "key": "approved_name",
        "label": "Approved Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_2: {
    id: 'Form_1_1_1_2',
    name: '1.1.1.2 EHR Clinical Hub Folder (Open Hub)',
    collectionName: 'form_1_1_1_2',
    icon: Database,
    subtitle: 'Form 1.1.1.2',
    description: '1.1.1.2 EHR Clinical Hub Folder (Open Hub)',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_name",
            "label": "Patient Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "hub_status",
            "label": "Clinical Hub Status*",
            "type": "select",
            "required": true,
            "options": [
                  "Active Folder",
                  "Archived",
                  "Transferred"
            ]
      },
      {
            "key": "clinical_notes",
            "label": "Overall Clinical Summary / Hub Intake Notes",
            "type": "textarea",
            "required": false,
            "placeholder": "Active notes for the patient in this Clinical Hub session..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_a: {
    id: 'Form_1_1_1_a',
    name: '1.1.1.a Pre-Triage Screen Intake Add Items Form Summary',
    collectionName: 'form_1_1_1_a',
    icon: Activity,
    subtitle: 'Form 1.1.1.a',
    description: '1.1.1.a Pre-Triage Screen Intake Add Items Form Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "pre_triage_priority",
            "label": "Pre-Triage Priority Screen*",
            "type": "select",
            "required": true,
            "options": [
                  "Green (Routine/Non-Urgent)",
                  "Yellow (Delayed/Urgent)",
                  "Red (Immediate/Emergency)"
            ]
      },
      {
            "key": "pre_triage_chief_complaint",
            "label": "Chief Complaint / Main Issue*",
            "type": "textarea",
            "required": true,
            "placeholder": "What brought the patient in today?"
      },
      {
            "key": "pre_triage_screening_notes",
            "label": "Pre-Triage Screening Notes",
            "type": "textarea",
            "required": false,
            "placeholder": "General observation notes, mobility status, visible symptoms, etc."
      },
      {
            "key": "pre_triage_vital_bp",
            "label": "Initial Blood Pressure Check",
            "type": "string",
            "required": false,
            "placeholder": "e.g., 120/80"
      },
      {
            "key": "pre_triage_vital_pulse",
            "label": "Initial Pulse Rate (bpm)",
            "type": "number",
            "required": false,
            "placeholder": "bpm"
      },
      {
            "key": "pre_triage_vital_temp",
            "label": "Initial Temperature (°C)",
            "type": "number",
            "required": false,
            "placeholder": "°C"
      },
      {
            "key": "summary",
            "label": "Summary / Findings*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_b: {
    id: 'Form_1_1_1_b',
    name: '1.1.1.b Triage Add Items Form & Vitals Signs Summary',
    collectionName: 'form_1_1_1_b',
    icon: Activity,
    subtitle: 'Form 1.1.1.b',
    description: '1.1.1.b Triage Add Items Form & Vitals Signs Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "triage_opd",
            "label": "Triage OPD Unit*",
            "type": "select",
            "required": true,
            "options": [
                  "opd1",
                  "opd2",
                  "opd3",
                  "opd4",
                  "opd5",
                  "opd6",
                  "opd7",
                  "opd8",
                  "opd9",
                  "opd10",
                  "opd11",
                  "opd12",
                  "opd13",
                  "opd14",
                  "opd15",
                  "opd16",
                  "delivery ward",
                  "neonatal ward",
                  "Other write",
                  "Other"
            ]
      },
      {
            "key": "triage_opd_other",
            "label": "Other OPD Unit (Specify)*",
            "type": "string",
            "required": false,
            "placeholder": "Enter other OPD unit if 'Other write' or 'Other' selected"
      },
      {
            "key": "vital_bp",
            "label": "Blood Pressure (e.g., 120/80)",
            "type": "string",
            "required": false
      },
      {
            "key": "vital_pulse",
            "label": "Pulse Rate (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "vital_temp",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "vital_rr",
            "label": "Respiratory Rate (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "triage_priority",
            "label": "Triage Priority Level",
            "type": "select",
            "required": false,
            "options": [
                  "Green (Routine)",
                  "Yellow (Urgent)",
                  "Red (Critical/Emergency)"
            ]
      },
      {
            "key": "summary",
            "label": "Summary / Findings*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_c: {
    id: 'Form_1_1_1_c',
    name: '1.1.1.c Patient Clinical History Taken Summary',
    collectionName: 'form_1_1_1_c',
    icon: FileText,
    subtitle: 'Form 1.1.1.c',
    description: '1.1.1.c Patient Clinical History Taken Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "chief_complaint",
            "label": "Chief Complaint*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "history_present_illness",
            "label": "History of Present Illness (HPI)",
            "type": "textarea",
            "required": false
      },
      {
            "key": "past_medical_history",
            "label": "Past Medical/Surgical History",
            "type": "textarea",
            "required": false
      },
      {
            "key": "summary",
            "label": "Summary / Findings*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_d: {
    id: 'Form_1_1_1_d',
    name: '1.1.1.d Patient Clinical Assessment Summary',
    collectionName: 'form_1_1_1_d',
    icon: FileText,
    subtitle: 'Form 1.1.1.d',
    description: '1.1.1.d Patient Clinical Assessment Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "general_appearance",
            "label": "General Physical Appearance",
            "type": "string",
            "required": false
      },
      {
            "key": "systemic_examination",
            "label": "Systemic Examination Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "summary",
            "label": "Summary / Findings*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_e: {
    id: 'Form_1_1_1_e',
    name: '1.1.1.e Patient Clinical Diagnosis Summary',
    collectionName: 'patient_clinical_diagnosis_summaries',
    icon: FileText,
    subtitle: 'Form 1.1.1.e',
    description: '1.1.1.e Patient Clinical Diagnosis Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "diagnosis_notes",
            "label": "Diagnosis Notes*",
            "type": "select",
            "required": true,
            "options": [
                  "Malaria",
                  "Pneumonia",
                  "Typhoid Fever",
                  "Acute Diarrhea",
                  "Hypertension",
                  "Diabetes Mellitus",
                  "UTI",
                  "URTI",
                  "Other specifics",
                  "Other"
            ]
      },
      {
            "key": "other_specifics",
            "label": "Other Specifics*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specifics..."
      },
      {
            "key": "icd10_code",
            "label": "ICD-10 Code",
            "type": "string",
            "required": false,
            "placeholder": "e.g., A09.9"
      },
      {
            "key": "additional_diagnosis_notes",
            "label": "Additional Diagnosis Notes",
            "type": "textarea",
            "required": false,
            "placeholder": "Enter details if Other selected or for extra context..."
      },
      {
            "key": "other_summary",
            "label": "Other Summary*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_f: {
    id: 'Form_1_1_1_f',
    name: '1.1.1.f Patient Laboratory Investigation Request',
    collectionName: 'patient_laboratory_investigation_requests',
    icon: Activity,
    subtitle: 'Form 1.1.1.f',
    description: '1.1.1.f Patient Laboratory Investigation Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "lab_tests",
            "label": "Lab Tests*",
            "type": "select",
            "required": true,
            "options": [
                  "CBC",
                  "Urinalysis",
                  "Blood Glucose",
                  "Lipid Panel",
                  "CD4 / Viral Load",
                  "GeneXpert TB Test",
                  "Widal/Weils-Felix",
                  "Other specific",
                  "Other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter specific lab test..."
      },
      {
            "key": "clinical_indications",
            "label": "Clinical Indications*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "requested_by",
            "label": "Request By (Name)",
            "type": "string",
            "required": false
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_g: {
    id: 'Form_1_1_1_g',
    name: '1.1.1.g Patient Laboratory Payment Request',
    collectionName: 'patient_laboratory_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.g',
    description: '1.1.1.g Patient Laboratory Payment Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "lab_bill_amount",
            "label": "Laboratory Bill Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_g_1: {
    id: 'Form_1_1_1_g_1',
    name: '1.1.1.g.1 Cashier Laboratory Payment Verification',
    collectionName: 'cashier_laboratory_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.g.1',
    description: '1.1.1.g.1 Cashier Laboratory Payment Verification',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "lab_bill_amount",
            "label": "Laboratory Bill Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice Number or Insurance ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "verified_paid",
            "label": "Confirm Paid?*",
            "type": "select",
            "required": true,
            "options": [
                  "Yes -",
                  "No"
            ]
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_h: {
    id: 'Form_1_1_1_h',
    name: '1.1.1.h Patient Radiology Investigation Request',
    collectionName: 'patient_radiology_investigation_requests',
    icon: Activity,
    subtitle: 'Form 1.1.1.h',
    description: '1.1.1.h Patient Radiology Investigation Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "radiology_modality",
            "label": "Radiology Modality*",
            "type": "select",
            "required": true,
            "options": [
                  "X-Ray",
                  "Ultrasound",
                  "CT Scan",
                  "MRI",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific radiology modality..."
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "requested_by",
            "label": "Request By (Name)*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_i: {
    id: 'Form_1_1_1_i',
    name: '1.1.1.i Patient Radiology Payment Request',
    collectionName: 'patient_radiology_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.i',
    description: '1.1.1.i Patient Radiology Payment Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "radiology_bill_amount",
            "label": "Radiology Bill Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_i_1: {
    id: 'Form_1_1_1_i_1',
    name: '1.1.1.i.1 Cashier Radiology Payment Verification',
    collectionName: 'cashier_radiology_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.i.1',
    description: '1.1.1.i.1 Cashier Radiology Payment Verification',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice Number*",
            "type": "string",
            "required": true
      },
      {
            "key": "payment_verified",
            "label": "Payment Verified*",
            "type": "select",
            "required": true,
            "options": [
                  "yes",
                  "No"
            ]
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_j: {
    id: 'Form_1_1_1_j',
    name: '1.1.1.j Emergency Department Laboratory Report',
    collectionName: 'form_1_1_1_j',
    icon: FlaskConical,
    subtitle: 'Form 1.1.1.j',
    description: 'Emergency Laboratory Results Report (ED LIS) with STAT priority and critical value tracking.',
    fields: [
      { key: "hospital_id", label: "Hospital ID*", type: "string", required: true },
      { key: "patient_MRN", label: "Patient MRN*", type: "string", required: true },
      { key: "opd_or_ward_name", label: "OPD or Ward name*", type: "string", required: true },
      { key: "first_last_name", label: "First & Last Name*", type: "string", required: true },
      { key: "gender", label: "Gender*", type: "select", options: ["Male", "Female", "Other", "Unknown"], required: true },
      { key: "ed_location", label: "ED Location*", type: "string", required: true, placeholder: "e.g., Trauma Bay 1, Bed 14" },
      { key: "triage_acuity", label: "Triage Acuity (1=Resuscitation, 5=Non-urgent)*", type: "number", required: true, placeholder: "1 = Resuscitation, 5 = Non-urgent" },
      { key: "admit_timestamp", label: "Admit Timestamp*", type: "date-time", required: true },
      { key: "ordering_provider_id", label: "Ordering Provider ID*", type: "string", required: true },
      { key: "order_priority", label: "Order Priority*", type: "select", options: ["STAT", "ASAP", "Timed", "Routine"], required: true },
      { key: "panel_code", label: "Panel Code*", type: "string", required: true, placeholder: "BMP, CBC, ABG, TROP, CMP, WBC or other specific" },
      { key: "specimen_type", label: "Specimen Type*", type: "string", required: true, placeholder: "Whole Blood, Serum, Plasma, CSF, Urine or other specific" },
      { key: "collection_timestamp", label: "Collection Timestamp*", type: "date-time", required: true },
      { key: "receipt_timestamp", label: "Receipt Timestamp", type: "date-time", required: false },
      { key: "specimen_status", label: "Specimen Status*", type: "select", options: ["Collected", "In-Transit", "Received", "Processing", "Completed", "Rejected"], required: true },
      { key: "rejection_reason", label: "Rejection Reason", type: "textarea", required: false },
      { key: "test_code", label: "Test Code*", type: "string", required: true },
      { key: "test_name", label: "Test Name*", type: "string", required: true, placeholder: "e.g., Potassium, Troponin T" },
      { key: "numeric_value", label: "Numeric Value", type: "number", required: false },
      { key: "text_value", label: "Text Value", type: "textarea", required: false },
      { key: "unit_of_measure", label: "Unit of Measure", type: "string", required: false, placeholder: "e.g., mmol/L, ng/mL" },
      { key: "reference_range_low", label: "Reference Range Low", type: "number", required: false },
      { key: "reference_range_high", label: "Reference Range High", type: "number", required: false },
      { key: "abnormal_flag", label: "Abnormal Flag*", type: "select", options: ["Normal", "High", "Low", "Critical High", "Critical Low"], required: true },
      { key: "result_timestamp", label: "Result Timestamp*", type: "date-time", required: true },
      { key: "technician_name", label: "Technician Name*", type: "string", required: true },
      { key: "alert_trigger_time", label: "Alert Trigger Time", type: "date-time", required: false },
      { key: "notification_status", label: "Notification Status", type: "select", options: ["N/A", "Pending Acknowledgment", "Acknowledged", "Escalated"], required: false },
      { key: "notified_provider_id", label: "Notified Provider ID", type: "string", required: false },
      { key: "acknowledgment_time", label: "Acknowledgment Time", type: "date-time", required: false },
      { key: "referral_papers_option", label: "Referral Papers Capture Camera*", type: "select", options: ["No Referral Paper", "Yes, Capture / Upload"], required: false },
      { key: "referral_facility", label: "Referring Facility", type: "string", required: false, placeholder: "Referring clinic or hospital" },
      { key: "referral_image", label: "Referral Papers Attachment", type: "camera", required: false, placeholder: "No referral file attached yet. Capture with camera or upload above." },
      { key: "read_back_verified", label: "Read-Back Verified", type: "checkbox", required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_k: {
    id: 'Form_1_1_1_k',
    name: '1.1.1.k Emergency Radiology Reports',
    collectionName: 'form_1_1_1_k',
    icon: FileText,
    subtitle: 'Form 1.1.1.k',
    description: 'Emergency Department Radiology Reports capturing findings, turnaround-times, and critical result escalation logs.',
    fields: [
      { key: "hospital_id", label: "Hospital ID*", type: "string", required: true },
      { key: "patient_MRN", label: "Patient MRN*", type: "string", required: true },
      { key: "opd_or_ward_name", label: "OPD or Ward name*", type: "string", required: true },
      { key: "modality", label: "Modality*", type: "select", options: ["CT", "XR", "US", "MR", "other specific"], required: true },
      { key: "study_description", label: "Study Description*", type: "string", required: true, placeholder: "e.g., CT Head w/o Contrast" },
      { key: "urgency_level", label: "Urgency Level*", type: "select", options: ["STAT", "Urgent", "Routine"], required: true },
      { key: "report_status", label: "Report Status*", type: "select", options: ["Preliminary", "Final", "Corrected", "Addendum"], required: true },
      { key: "clinical_indication", label: "Clinical Indication", type: "textarea", required: false },
      { key: "findings", label: "Findings*", type: "textarea", required: true },
      { key: "impression", label: "Impression*", type: "textarea", required: true },
      { key: "critical_finding", label: "Critical Finding", type: "checkbox", required: false },
      { key: "critical_notified_to", label: "Critical Notified To", type: "string", required: false },
      { key: "critical_notified_at", label: "Critical Notified At", type: "date-time", required: false },
      { key: "ordering_physician_id", label: "Ordering Physician ID*", type: "string", required: true },
      { key: "radiologist_id", label: "Radiologist ID*", type: "string", required: true },
      { key: "order_time", label: "Order Time*", type: "date-time", required: true },
      { key: "acquisition_time", label: "Acquisition Time*", type: "date-time", required: true },
      { key: "preliminary_time", label: "Preliminary Time", type: "date-time", required: false },
      { key: "referral_papers_option", label: "Referral Papers Capture Camera*", type: "select", options: ["No Referral Paper", "Yes, Capture / Upload"], required: false },
      { key: "referral_facility", label: "Referring Facility", type: "string", required: false, placeholder: "Referring clinic or hospital" },
      { key: "referral_image", label: "Referral Papers Attachment", type: "camera", required: false, placeholder: "No referral file attached yet. Capture with camera or upload above." },
      { key: "final_time", label: "Final Time", type: "date-time", required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_l: {
    id: 'Form_1_1_1_l',
    name: '1.1.1.l Patient Older Add Items Form',
    collectionName: 'form_1_1_1_l',
    icon: FileText,
    subtitle: 'Form 1.1.1.l',
    description: '1.1.1.l Patient Older Add Items Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "older_medical_history",
            "label": "Prior Medical Records Summary",
            "type": "textarea",
            "required": false
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_m: {
    id: 'Form_1_1_1_m',
    name: '1.1.1.m Outpatient Prescription Submitted',
    collectionName: 'form_1_1_1_m',
    icon: FileText,
    subtitle: 'Form 1.1.1.m',
    description: '1.1.1.m Outpatient Prescription Submitted',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "management_or_treatment_for",
        "label": "Management or treatment For*",
        "type": "string",
        "required": true
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency per day*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "is_chronic",
        "label": "Is Chronic?",
        "type": "checkbox"
      },
      {
        "key": "supply_days",
        "label": "Supply Days",
        "type": "number",
        "required": false,
        "placeholder": "e.g., 30"
      },
      {
        "key": "prescribed_by",
        "label": "Prescribed by*",
        "type": "string",
        "required": true
      },
      {
        "key": "approved_by",
        "label": "Approved by*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_m_1: {
    id: 'Form_1_1_1_m_1',
    name: '1.1.1.m.1 Dispensary Stock Out Transfer to Another Dispensary Medication Request Prescription',
    collectionName: 'form_1_1_1_m_1',
    icon: FileText,
    subtitle: 'Form 1.1.1.m.1',
    description: '1.1.1.m.1 Dispensary Stock Out Transfer to Another Dispensary Medication Request Prescription',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "management_or_treatment_for",
        "label": "Management or treatment For*",
        "type": "string",
        "required": true
      },
      {
        "key": "transfer_dispensary_identifier",
        "label": "Transfer Dispensary Unique Number or Name*",
        "type": "string",
        "required": true,
        "placeholder": "Enter transfer dispensary number or name"
      },
      {
        "key": "received_dispensary_identifier",
        "label": "Received Dispensary Unique Number or Name*",
        "type": "string",
        "required": true,
        "placeholder": "Enter received dispensary number or name"
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency per day*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "is_chronic",
        "label": "Is Chronic?",
        "type": "checkbox"
      },
      {
        "key": "supply_days",
        "label": "Supply Days",
        "type": "number",
        "placeholder": "e.g., 30"
      },
      {
        "key": "prescribed_transfer_by",
        "label": "Prescribed transfer_by*",
        "type": "string",
        "required": true
      },
      {
        "key": "prescription_received_by",
        "label": "Prescription received_by*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_m_2: {
    id: 'Form_1_1_1_m_2',
    name: '1.1.1.m.2 Dispensary Stock Out or Not Available in The Facilities Medication Request Prescription',
    collectionName: 'form_1_1_1_m_2',
    icon: FileText,
    subtitle: 'Form 1.1.1.m.2',
    description: '1.1.1.m.2 Dispensary Stock Out or Not Available in The Facilities Medication Request Prescription',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "management_or_treatment_for",
        "label": "Management or treatment For*",
        "type": "string",
        "required": true
      },
      {
        "key": "dispensary_stock_out_identifier",
        "label": "Dispensary stock out Unique Number or Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency per day*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "is_chronic",
        "label": "Is Chronic?",
        "type": "checkbox"
      },
      {
        "key": "supply_days",
        "label": "Supply Days",
        "type": "number",
        "placeholder": "e.g., 30"
      },
      {
        "key": "dispensary_stock_out_by",
        "label": "Dispensary stock out _by*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_n: {
    id: 'Form_1_1_1_n',
    name: '1.1.1.n Patient Prescription Payment Request',
    collectionName: 'patient_prescription_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.n',
    description: '1.1.1.n Patient Prescription Payment Request - Stock Available in dispensary',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "dispensary_identifier",
        "label": "Dispensary Unique Number or Name*",
        "type": "string",
        "required": true,
        "placeholder": "Enter dispensary number or name"
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency per day*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "cumulative_prescriptions",
        "label": "Cumulative Prescriptions (number + number + number)",
        "type": "number"
      },
      {
        "key": "prescription_bill_amount",
        "label": "Total Prescription Bill Amount*",
        "type": "number",
        "required": true
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted",
          "other specific"
        ]
      },
      {
        "key": "other_specific",
        "label": "Other Specific*",
        "type": "string",
        "required": true,
        "placeholder": "Enter other specific payment method..."
      },
      {
        "key": "approved_name",
        "label": "Approved Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_n_1: {
    id: 'Form_1_1_1_n_1',
    name: '1.1.1.n.1 Cashier Prescription Payment Verification',
    collectionName: 'cashier_prescription_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.n.1',
    description: '1.1.1.n.1 Cashier Prescription Payment Verification',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "invoice_no",
        "label": "Invoice No or Insurance Number*",
        "type": "string",
        "required": true
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "cumulative_prescriptions",
        "label": "Cumulative Prescriptions",
        "type": "number"
      },
      {
        "key": "prescription_bill_amount",
        "label": "Prescription Bill Amount*",
        "type": "number",
        "required": true
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted",
          "other specific"
        ]
      },
      {
        "key": "other_specific",
        "label": "Other Specific*",
        "type": "string",
        "required": true,
        "placeholder": "Enter other specific payment method..."
      },
      {
        "key": "approved_name",
        "label": "Approved Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_o: {
    id: 'Form_1_1_1_o',
    name: '1.1.1.o Patient Procedure Submitted Intake',
    collectionName: 'form_1_1_1_o',
    icon: FileText,
    subtitle: 'Form 1.1.1.o',
    description: '1.1.1.o Patient Procedure Submitted Intake',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "procedure_type",
            "label": "Procedure Type*",
            "type": "select",
            "required": true,
            "options": [
                  "Minor Surgical Wound Care",
                  "Wound Dressing Change",
                  "IV Cannulation",
                  "Catheterization",
                  "Abscess Incision",
                  "Drainage",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific procedure..."
      },
      {
            "key": "procedure_notes",
            "label": "Procedure Notes",
            "type": "textarea"
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_p: {
    id: 'Form_1_1_1_p',
    name: '1.1.1.p Outpatient Procedure Payment Request',
    collectionName: 'patient_procedure_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.p',
    description: '1.1.1.p Outpatient Procedure Payment Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "procedure_bill_amount",
            "label": "Procedure Bill Amount*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_p_1: {
    id: 'Form_1_1_1_p_1',
    name: '1.1.1.p.1 Cashier Procedure Payment Verification',
    collectionName: 'cashier_procedure_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.p.1',
    description: '1.1.1.p.1 Cashier Procedure Payment Verification',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "total_amount",
            "label": "Total Amount*",
            "type": "number",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice No*",
            "type": "string",
            "required": true
      },
      {
            "key": "payment_verified",
            "label": "Payment Verified*",
            "type": "select",
            "required": true,
            "options": [
                  "yes",
                  "No"
            ]
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_q: {
    id: 'Form_1_1_1_q',
    name: '1.1.1.q Patient Ward Admission Form',
    collectionName: 'form_1_1_1_q',
    icon: FileText,
    subtitle: 'Form 1.1.1.q',
    description: '1.1.1.q Patient Ward Admission Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "admitted_ward",
            "label": "Admitted Ward*",
            "type": "select",
            "required": true,
            "options": [
                  "surgical ward",
                  "medical ward",
                  "pediatric ward",
                  "neonatal ward",
                  "gynecologists ward",
                  "labor and delivery ward",
                  "operational room ward",
                  "intensive care unit ward",
                  "other specific"
            ]
      },
      {
            "key": "other_specific_ward",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter specific ward..."
      },
      {
            "key": "admission_diagnosis",
            "label": "Admission Diagnosis*",
            "type": "select",
            "required": true,
            "options": [
                  "Malaria",
                  "Pneumonia",
                  "Typhoid Fever",
                  "Acute Diarrhea",
                  "Hypertension",
                  "Diabetes Mellitus",
                  "UTI",
                  "URTI",
                  "Other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific diagnosis..."
      },
      {
            "key": "admission_icd10",
            "label": "Admission ICD-10*",
            "type": "string",
            "required": true
      },
      {
            "key": "admitting_clinician",
            "label": "Admitting Clinician Doctor*",
            "type": "string",
            "required": true
      }
],
    defaultSeed: []
  },
  Form_1_1_1_r: {
    id: 'Form_1_1_1_r',
    name: '1.1.1.r Liaison Office Inpatient Intake & Referral',
    collectionName: 'form_1_1_1_r',
    icon: FileText,
    subtitle: 'Form 1.1.1.r',
    description: '1.1.1.r Liaison Office Inpatient Intake & Referral',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "liaison_notes",
            "label": "Liaison Bed Assignment Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "referral_sheet_photo",
            "label": "Referral Papers Capture Camera*",
            "type": "camera",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_r_1: {
    id: 'Form_1_1_1_r_1',
    name: '1.1.1.r.1 Liaison Inpatient Payment Request Form',
    collectionName: 'patient_liaison_inpatient_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.r.1',
    description: '1.1.1.r.1 Liaison Inpatient Payment Request Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "admission_deposit",
            "label": "Admission Deposit (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_r_2: {
    id: 'Form_1_1_1_r_2',
    name: '1.1.1.r.2 Cashier Liaison Inpatient Deposit Verification',
    collectionName: 'cashier_liaison_inpatient_deposit_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.r.2',
    description: '1.1.1.r.2 Cashier Liaison Inpatient Deposit Verification',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "admission_amount_deposit",
        "label": "Admission Amount Deposit*",
        "type": "number",
        "required": true
      },
      {
        "key": "deposit_invoice_no",
        "label": "Deposit Invoice or Insurance Number or Unique Number*",
        "type": "string",
        "required": true
      },
      {
        "key": "deposit_verified",
        "label": "Deposit Verified (Yes or No)*",
        "type": "select",
        "required": true,
        "options": [
          "Yes",
          "No"
        ]
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted",
          "other"
        ]
      },
      {
        "key": "other_specific",
        "label": "Other Specific*",
        "type": "string",
        "required": true,
        "placeholder": "Enter other specific payment method..."
      },
      {
        "key": "approved_name",
        "label": "Approved Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_r_a: {
    id: 'Form_1_1_1_r_a',
    name: '1.1.1.r.a Bed',
    collectionName: 'form_1_1_1_r_a',
    icon: Bed,
    subtitle: 'Ward bed management',
    description: 'Management of hospital beds, ward locations, and occupancy status.',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string' },
      { key: 'date', label: 'Date/Time', type: 'date-time' },
      { key: 'bed_id', label: 'Bed ID*', type: 'string', required: true },
      { key: 'ward', label: 'Ward*', type: 'string', required: true },
      { key: 'status', label: 'Status*', type: 'select', options: ['available', 'occupied', 'maintenance', 'cleaning'], required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_s: {
    id: 'Form_1_1_1_s',
    name: '1.1.1.s Admitted Inpatient Vital Signs & Pain Score',
    collectionName: 'form_1_1_1_s',
    icon: Activity,
    subtitle: 'Form 1.1.1.s',
    description: '1.1.1.s Admitted Inpatient Vital Signs & Pain Score',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_vital_bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "ward_vital_temp",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "ward_vital_pulse",
            "label": "Pulse Rate (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "pain_score",
            "label": "Pain Score Assessment (0 to 10)*",
            "type": "select",
            "required": true,
            "options": [
                  "0 - No Pain",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5 - Moderate Pain",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10 - Worst Possible Pain"
            ]
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_t: {
    id: 'Form_1_1_1_t',
    name: '1.1.1.t Admitted Patient Prescription Request',
    collectionName: 'form_1_1_1_t',
    icon: FileText,
    subtitle: 'Form 1.1.1.t',
    description: '1.1.1.t Admitted Patient Prescription Request',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "ward_name",
        "label": "Ward Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "management_or_treatment_for",
        "label": "Management or treatment For*",
        "type": "string",
        "required": true
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency per day*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "is_chronic",
        "label": "Is Chronic?",
        "type": "checkbox"
      },
      {
        "key": "supply_days",
        "label": "Supply Days",
        "type": "number",
        "placeholder": "e.g., 30"
      },
      {
        "key": "prescribed_by",
        "label": "Prescribed By*",
        "type": "string",
        "required": true
      },
      {
        "key": "approved_by",
        "label": "Approved By*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_t_1: {
    id: 'Form_1_1_1_t_1',
    name: '1.1.1.t.1 Admitted Patient Prescription Payment',
    collectionName: 'admitted_patient_prescription_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.t.1',
    description: '1.1.1.t.1 Admitted Patient Prescription Payment',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "ward_name",
        "label": "Ward Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "dispensary_identifier",
        "label": "Dispensary Number or Name*",
        "type": "string",
        "required": true,
        "placeholder": "Enter dispensary number or name"
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency per day*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific*",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "cumulative_prescriptions",
        "label": "Cumulative Prescriptions",
        "type": "number"
      },
      {
        "key": "prescription_bill_amount",
        "label": "Prescription Bill Amount*",
        "type": "number",
        "required": true
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted",
          "other specific"
        ]
      },
      {
        "key": "other_specific",
        "label": "Other Specific*",
        "type": "string",
        "required": true,
        "placeholder": "Enter other specific payment method..."
      },
      {
        "key": "approved_name",
        "label": "Approved Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_t_2: {
    id: 'Form_1_1_1_t_2',
    name: '1.1.1.t.2 Cashier Admitted Patient Prescription Verification',
    collectionName: 'cashier_admitted_patient_prescription_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.t.2',
    description: '1.1.1.t.2 Cashier Admitted Patient Prescription Verification',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "ward_name",
        "label": "Ward Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "rx_invoice_no",
        "label": "Rx Invoice Number or Insurance Number*",
        "type": "string",
        "required": true
      },
      {
        "key": "ward_rx_bill",
        "label": "Ward RX Bill*",
        "type": "number",
        "required": true
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "cumulative_prescriptions",
        "label": "Cumulative Prescriptions",
        "type": "number"
      },
      {
        "key": "prescription_bill_amount",
        "label": "Prescription Bill Amount*",
        "type": "number",
        "required": true
      },
      {
        "key": "payment_method",
        "label": "Payment Method*",
        "type": "select",
        "required": true,
        "options": [
          "cash",
          "insurance",
          "prison",
          "police",
          "low income",
          "exempted",
          "other specific"
        ]
      },
      {
        "key": "other_specific",
        "label": "Other Specific*",
        "type": "string",
        "required": true,
        "placeholder": "Enter other specific payment method..."
      },
      {
        "key": "approved_name",
        "label": "Approved Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_u: {
    id: 'Form_1_1_1_u',
    name: '1.1.1.u Inter-Department Consultation Ward Physician',
    collectionName: 'form_1_1_1_u',
    icon: FileText,
    subtitle: 'Form 1.1.1.u',
    description: '1.1.1.u Inter-Department Consultation Ward Physician',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "referring_ward",
            "label": "Referring Ward",
            "type": "select",
            "required": false,
            "options": [
                  "surgical ward",
                  "medical ward",
                  "pediatric ward",
                  "gyn",
                  "icu"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific ward..."
      },
      {
            "key": "consulting_specialty",
            "label": "Consulting Specialty*",
            "type": "string",
            "required": true
      },
      {
            "key": "consultation_notes",
            "label": "Consultation Notes*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_u_1: {
    id: 'Form_1_1_1_u_1',
    name: '1.1.1.u.1 Admitted Patients Medication Given Records',
    collectionName: 'form_1_1_1_u_1',
    icon: FileText,
    subtitle: 'Form 1.1.1.u.1',
    description: '1.1.1.u.1 Admitted Patients Medication Given Records',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "medication_administered",
            "label": "Medication Administered*",
            "type": "string",
            "required": true
      },
      {
            "key": "administered_time",
            "label": "Administered Time*",
            "type": "string",
            "required": true,
            "placeholder": "e.g., 2026-07-06 14:00"
      },
      {
            "key": "administered_by",
            "label": "Administered By*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v: {
    id: 'Form_1_1_1_v',
    name: '1.1.1.v Inpatient Laboratory Investigation Request',
    collectionName: 'form_1_1_1_v',
    icon: Activity,
    subtitle: 'Form 1.1.1.v',
    description: '1.1.1.v Inpatient Laboratory Investigation Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "inpatient_lab_tests",
            "label": "Inpatient Lab Tests*",
            "type": "select",
            "required": true,
            "options": [
                  "CBC",
                  "Biochemistry Renal/Liver",
                  "Serum Electrolytes",
                  "Blood Culture",
                  "GeneXpert TB",
                  "Other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter other specific lab tests..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_1: {
    id: 'Form_1_1_1_v_1',
    name: '1.1.1.v.1 Inpatient Lab Payment Request Form',
    collectionName: 'patient_inpatient_laboratory_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.v.1',
    description: '1.1.1.v.1 Inpatient Lab Payment Request Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "lab_bill_amount",
            "label": "Laboratory Bill Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter details for other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_2: {
    id: 'Form_1_1_1_v_2',
    name: '1.1.1.v.2 Admitted Patient Lab Cash / CBHI Payment Form',
    collectionName: 'form_1_1_1_v_2',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.v.2',
    description: '1.1.1.v.2 Admitted Patient Lab Cash / CBHI Payment Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "lab_bill_amount",
            "label": "Laboratory Bill Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter details for other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_3: {
    id: 'Form_1_1_1_v_3',
    name: '1.1.1.v.3 Cashier Inpatient Lab Payment Paid Verification',
    collectionName: 'cashier_inpatient_laboratory_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.v.3',
    description: '1.1.1.v.3 Cashier Inpatient Lab Payment Paid Verification',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice No*",
            "type": "string",
            "required": true
      },
      {
            "key": "payment_verified",
            "label": "Payment Verified*",
            "type": "select",
            "required": true,
            "options": [
                  "yes",
                  "No"
            ]
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter details for other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_4: {
    id: 'Form_1_1_1_v_4',
    name: '1.1.1.v.4 outpatient and Inpatient Laboratory Investigation Results',
    collectionName: 'form_1_1_1_v_4',
    icon: Activity,
    subtitle: 'Form 1.1.1.v.4',
    description: '1.1.1.v.4 outpatient and Inpatient Laboratory Investigation Results',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "inpatient_lab_results",
            "label": "Results & Critical Values*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "lab_report_image",
            "label": "Laboratory Report Sheet Image Capture*",
            "type": "camera",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_5: {
    id: 'Form_1_1_1_v_5',
    name: '1.1.1.v.5 Inpatient Radiology Investigation Request',
    collectionName: 'form_1_1_1_v_5',
    icon: Activity,
    subtitle: 'Form 1.1.1.v.5',
    description: '1.1.1.v.5 Inpatient Radiology Investigation Request',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "inpatient_radiology_type",
            "label": "Inpatient Radiology Type*",
            "type": "select",
            "required": true,
            "options": [
                  "X-Ray",
                  "Ultrasound",
                  "CT Scan",
                  "MRI",
                  "Other specific"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter details for other specific radiology..."
      },
      {
            "key": "request_by_name",
            "label": "Request by name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_6: {
    id: 'Form_1_1_1_v_6',
    name: '1.1.1.v.6 Inpatient Radiology Payment Request Form',
    collectionName: 'patient_inpatient_radiology_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.v.6',
    description: '1.1.1.v.6 Inpatient Radiology Payment Request Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "radiology_bill_amount",
            "label": "Radiology Bill Amount*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter details for other specific payment method..."
      },
      {
            "key": "request_by_name",
            "label": "Request by name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date and time*",
            "type": "number",
            "required": true
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_v_7: {
    id: 'Form_1_1_1_v_7',
    name: '1.1.1.v.7 Cashier Inpatient Radiology Paid Verification',
    collectionName: 'cashier_inpatient_radiology_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.v.7',
    description: '1.1.1.v.7 Cashier Inpatient Radiology Paid Verification',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice No*",
            "type": "string",
            "required": true
      },
      {
            "key": "payment_verified",
            "label": "Payment Verified*",
            "type": "select",
            "required": true,
            "options": [
                  "Yes",
                  "No"
            ]
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "other_specific",
            "label": "Other Specific*",
            "type": "string",
            "required": true,
            "placeholder": "Enter details for other specific payment method..."
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_v_8: {
    id: 'Form_1_1_1_v_8',
    name: '1.1.1.v.8 outpatient and Inpatient Radiology Report & Results',
    collectionName: 'form_1_1_1_v_8',
    icon: Activity,
    subtitle: 'Form 1.1.1.v.8',
    description: '1.1.1.v.8 outpatient and Inpatient Radiology Report & Results',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "rad_report_text",
            "label": "Inpatient Imaging Findings*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "rad_report_image",
            "label": "Radiology Result Film Image Capture*",
            "type": "camera",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_w: {
    id: 'Form_1_1_1_w',
    name: '1.1.1.w Inpatient Nursing Care Plan, Prognosis & Discharge',
    collectionName: 'form_1_1_1_w',
    icon: FileText,
    subtitle: 'Form 1.1.1.w',
    description: '1.1.1.w Inpatient Nursing Care Plan, Prognosis & Discharge',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "ward_name",
            "label": "Ward Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "nursing_diagnoses",
            "label": "Nursing Diagnoses*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "patient_prognosis",
            "label": "Patient Prognosis",
            "type": "select",
            "required": false,
            "options": [
                  "Improving",
                  "Stable",
                  "Guarded",
                  "Deteriorating",
                  "Critical"
            ]
      },
      {
            "key": "discharge_criteria",
            "label": "Discharge Criteria",
            "type": "textarea",
            "required": false
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_x: {
    id: 'Form_1_1_1_x',
    name: '1.1.1.x Inpatient Surgery Safety Checklist & Anesthesia Intake',
    collectionName: 'form_1_1_1_x',
    icon: FileText,
    subtitle: 'Form 1.1.1.x',
    description: '1.1.1.x Inpatient Surgery Safety Checklist & Anesthesia Intake',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "sign_in_checked",
            "label": "Sign-In Completed (Before Induction)?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "time_out_checked",
            "label": "Time-Out Completed (Before Skin Incision)?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "anesthesia_type",
            "label": "Anesthesia Selected Plan*",
            "type": "select",
            "required": true,
            "options": [
                  "General Anesthesia",
                  "Spinal Anesthesia",
                  "Regional Block",
                  "Local/Sedation"
            ]
      },
      {
            "key": "asa_class",
            "label": "ASA Physical Status Classification",
            "type": "select",
            "required": false,
            "options": [
                  "ASA I",
                  "ASA II",
                  "ASA III",
                  "ASA IV",
                  "ASA V"
            ]
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_y: {
    id: 'Form_1_1_1_y',
    name: '1.1.1.y Maternity Care Services (ANC 8, Labor Pathography, Postnatal)',
    collectionName: 'form_1_1_1_y',
    icon: Activity,
    subtitle: 'Form 1.1.1.y',
    description: '1.1.1.y Maternity Care Services (ANC 8, Labor Pathography, Postnatal)',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "Antenatal Care Visit Tracker*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1",
                  "Visit 2",
                  "Visit 3",
                  "Visit 4",
                  "Visit 5",
                  "Visit 6",
                  "Visit 7",
                  "Visit 8"
            ]
      },
      {
            "key": "pathography_notes",
            "label": "Labor Progress Pathography summary",
            "type": "textarea",
            "required": false
      },
      {
            "key": "postnatal_vitals",
            "label": "Postnatal (PNC) check notes",
            "type": "string",
            "required": false
      },
      {
            "key": "cesarean_section_indicated",
            "label": "Cesarean Section Performed?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_z: {
    id: 'Form_1_1_1_z',
    name: '1.1.1.z Payment Request for Operating Room Procedure',
    collectionName: 'patient_or_procedure_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.z',
    description: '1.1.1.z Payment Request for Operating Room Procedure',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "procedure_bill_amount",
            "label": "Operating Room Cost (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_z_1: {
    id: 'Form_1_1_1_z_1',
    name: '1.1.1.z.1 Cashier OR Procedure Paid Verification Summary',
    collectionName: 'cashier_or_procedure_payment_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.z.1',
    description: '1.1.1.z.1 Cashier OR Procedure Paid Verification Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice Number*",
            "type": "string",
            "required": true
      },
      {
            "key": "payment_verified",
            "label": "Payment Verified*",
            "type": "select",
            "required": true,
            "options": [
                  "Paid",
                  "Insurance Verified",
                  "Exempted",
                  "other"
            ]
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_z_2: {
    id: 'Form_1_1_1_z_2',
    name: '1.1.1.z.2 Admitted Inpatient Prescription Request Form (Discharge) Summary',
    collectionName: 'form_1_1_1_z_2',
    icon: FileText,
    subtitle: 'Form 1.1.1.z.2',
    description: '1.1.1.z.2 Admitted Inpatient Prescription Request Form (Discharge) Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "discharge_prescription",
            "label": "Discharge Outpatient Medications*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "summary",
            "label": "Summary / Findings*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_z_3: {
    id: 'Form_1_1_1_z_3',
    name: '1.1.1.z.3 Cashier Inpatient Discharge Prescription Payment Verification Summary',
    collectionName: 'form_1_1_1_z_3',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.z.3',
    description: '1.1.1.z.3 Cashier Inpatient Discharge Prescription Payment Verification Summary',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "invoice_no",
            "label": "Invoice / Insurance ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "paid_status",
            "label": "Status*",
            "type": "select",
            "required": true,
            "options": [
                  "Paid",
                  "Insurance Cleared"
            ]
      },
      {
            "key": "summary",
            "label": "Summary / Findings*",
            "type": "textarea",
            "required": true,
            "placeholder": "Enter key summary findings here..."
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
],
    defaultSeed: []
  },
  Form_1_1_1_z_4: {
    id: 'Form_1_1_1_z_4',
    name: '1.1.1.z.4 Liaison discharge Inpatient Payment Request Form',
    collectionName: 'patient_liaison_discharge_payments',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.z.4',
    description: '1.1.1.z.4 Liaison discharge Inpatient Payment Request Form',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "admission_deposit",
            "label": "Admission Deposit (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "total_amount",
            "label": "Total Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "difference_amount",
            "label": "The difference amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "remain_amount",
            "label": "Remain amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "additional_amount",
            "label": "Additional amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_5: {
    id: 'Form_1_1_1_z_5',
    name: '1.1.1.z.5 Cashier Liaison Inpatient Deposit Verification',
    collectionName: 'cashier_liaison_discharge_deposit_verifications',
    icon: DollarSign,
    subtitle: 'Form 1.1.1.z.5',
    description: '1.1.1.z.5 Cashier Liaison Inpatient Deposit Verification',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "discharge_invoice",
            "label": "Discharge Invoice Number*",
            "type": "string",
            "required": true
      },
      {
            "key": "deposit_verified",
            "label": "Deposit Verified*",
            "type": "string",
            "required": true
      },
      {
            "key": "amount",
            "label": "Amount (ETB)*",
            "type": "number",
            "required": true
      },
      {
            "key": "payment_method",
            "label": "Payment Method*",
            "type": "select",
            "required": true,
            "options": [
                  "cash",
                  "insurance",
                  "prison",
                  "police",
                  "low income",
                  "exempted",
                  "other"
            ]
      },
      {
            "key": "approved_name",
            "label": "Approved Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date",
            "label": "Date/Time",
            "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_9: {
    id: 'Form_1_1_1_z_9',
    name: '1.1.1.z.9 Prescription Module',
    collectionName: 'form_1_1_1_z_9',
    icon: FileText,
    subtitle: 'Form 1.1.1.z.9',
    description: '1.1.1.z.9 Prescription Module',
    fields: [
      {
        "key": "hospital_id",
        "label": "Hospital ID*",
        "type": "string",
        "required": true
      },
      {
        "key": "patient_mrn",
        "label": "Patient MRN*",
        "type": "string",
        "required": true
      },
      {
        "key": "ward_name",
        "label": "Ward Name*",
        "type": "string",
        "required": true
      },
      {
        "key": "management_or_treatment_for",
        "label": "Management or treatment For*",
        "type": "string",
        "required": true
      },
      {
        "key": "prescribed_drugs",
        "label": "Prescribed Drugs - Name of Medication*",
        "type": "string",
        "required": true,
        "placeholder": "Enter name of medication"
      },
      {
        "key": "dose",
        "label": "Dose*",
        "type": "select",
        "required": true,
        "options": [
          "500mg",
          "250mg",
          "125mg",
          "100mg",
          "200mg",
          "20mg",
          "40mg",
          "400mg",
          "1gm",
          "2gm",
          "other specific"
        ]
      },
      {
        "key": "dose_other_specific",
        "label": "Other Specific Dose",
        "type": "string",
        "placeholder": "Enter other specific dose..."
      },
      {
        "key": "route",
        "label": "Route*",
        "type": "select",
        "required": true,
        "options": [
          "PO",
          "IV",
          "IM",
          "suppository",
          "other specific"
        ]
      },
      {
        "key": "route_other_specific",
        "label": "Other Specific Route",
        "type": "string",
        "placeholder": "Enter other specific route..."
      },
      {
        "key": "frequency",
        "label": "Frequency*",
        "type": "select",
        "required": true,
        "options": [
          "stat",
          "BID",
          "TID",
          "QID",
          "once",
          "PRN",
          "other specific"
        ]
      },
      {
        "key": "frequency_other_specific",
        "label": "Other Specific Frequency",
        "type": "string",
        "placeholder": "Enter other specific frequency..."
      },
      {
        "key": "is_chronic",
        "label": "Is Chronic?",
        "type": "checkbox"
      },
      {
        "key": "supply_days",
        "label": "Supply Days",
        "type": "number",
        "placeholder": "e.g., 30"
      },
      {
        "key": "prescribed_by",
        "label": "Prescribed by*",
        "type": "string",
        "required": true
      },
      {
        "key": "approved_by",
        "label": "Approved by*",
        "type": "string",
        "required": true
      },
      {
        "key": "date",
        "label": "Date/Time",
        "type": "date-time"
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_1: {
    id: 'Form_1_1_1_y_1',
    name: '1.1.1.y.1 Antenatal Episode Registration',
    collectionName: 'antenatal_episodes',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.1',
    description: 'Master record for Antenatal Care episode',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "lmp_date",
            "label": "LMP Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "edd",
            "label": "EDD*",
            "type": "date",
            "required": true
      },
      {
            "key": "gravida",
            "label": "Gravida",
            "type": "number",
            "required": false
      },
      {
            "key": "para",
            "label": "Para",
            "type": "number",
            "required": false
      },
      {
            "key": "is_active",
            "label": "Is Active Episode?",
            "type": "checkbox",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_2: {
    id: 'Form_1_1_1_y_2',
    name: '1.1.1.y.2 ANC Visit Record',
    collectionName: 'anc_visits',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.2',
    description: 'Clinical record for an ANC visit',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3", "Visit 4",
                  "Visit 5", "Visit 6", "Visit 7", "Visit 8"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_3: {
    id: 'Form_1_1_1_y_3',
    name: '1.1.1.y.3 ANC Visit Record (3-Visit Protocol)',
    collectionName: 'anc_visits_3',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.3',
    description: 'Clinical record for an ANC visit (3-visit protocol)',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_4: {
    id: 'Form_1_1_1_y_4',
    name: '1.1.1.y.4 ANC Visit Record (4-Visit Protocol)',
    collectionName: 'anc_visits_4',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.4',
    description: 'Clinical record for an ANC visit (4-visit protocol)',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3", "Visit 4"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_5: {
    id: 'Form_1_1_1_y_5',
    name: '1.1.1.y.5 ANC Visit Record (5-Visit Protocol)',
    collectionName: 'anc_visits_5',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.5',
    description: 'Clinical record for an ANC visit (5-visit protocol)',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3", "Visit 4", "Visit 5"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_6: {
    id: 'Form_1_1_1_y_6',
    name: '1.1.1.y.6 ANC Visit Record (6-Visit Protocol)',
    collectionName: 'anc_visits_6',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.6',
    description: 'Clinical record for an ANC visit (6-visit protocol)',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3", "Visit 4", "Visit 5", "Visit 6"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
   },
  Form_1_1_1_y_7: {
    id: 'Form_1_1_1_y_7',
    name: '1.1.1.y.7 ANC Visit Record (7-Visit Protocol)',
    collectionName: 'anc_visits_7',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.7',
    description: 'Clinical record for an ANC visit (7-visit protocol)',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3", "Visit 4", "Visit 5", "Visit 6", "Visit 7"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_8: {
    id: 'Form_1_1_1_y_8',
    name: '1.1.1.y.8 ANC Visit Record (8-Visit Protocol)',
    collectionName: 'anc_visits',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.8',
    description: 'Clinical record for an ANC visit (8-visit protocol)',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "anc_visit_no",
            "label": "ANC Visit No*",
            "type": "select",
            "required": true,
            "options": [
                  "Visit 1", "Visit 2", "Visit 3", "Visit 4", 
                  "Visit 5", "Visit 6", "Visit 7", "Visit 8"
            ]
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (Weeks)*",
            "type": "number",
            "required": true
      },
      {
            "key": "bp",
            "label": "Blood Pressure",
            "type": "string",
            "required": false
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "iron_folic_acid_provided",
            "label": "Iron Folic Acid Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "tetanus_toxoid_dose",
            "label": "Tetanus Toxoid Dose",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "next_appointment_date",
            "label": "Next Appointment Date",
            "type": "date",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_9_Labor: {
    id: 'Form_1_1_1_y_9_Labor',
    name: '1.1.1.y.9 Labor Episode Admission',
    collectionName: 'labor_episodes',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.9 (Admission)',
    description: 'Master record for a labor and delivery episode',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "admission_date",
            "label": "Admission Date*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "gravida",
            "label": "Gravida",
            "type": "number",
            "required": false
      },
      {
            "key": "para",
            "label": "Para",
            "type": "number",
            "required": false
      },
      {
            "key": "delivery_outcome",
            "label": "Delivery Outcome",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_9_Assessment: {
    id: 'Form_1_1_1_y_9_Assessment',
    name: '1.1.1.y.9 Latent Phase Assessment',
    collectionName: 'latent_phase_assessments',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.9 (Assessment)',
    description: 'Clinical record for a latent phase assessment',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "assessment_time",
            "label": "Assessment Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "contraction_frequency",
            "label": "Contraction Frequency (min)",
            "type": "number",
            "required": false
      },
      {
            "key": "contraction_duration",
            "label": "Contraction Duration (sec)",
            "type": "number",
            "required": false
      },
      {
            "key": "cervical_dilatation",
            "label": "Cervical Dilatation (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "effacement_percent",
            "label": "Effacement (%)",
            "type": "number",
            "required": false
      },
      {
            "key": "station",
            "label": "Station (-3 to +3)",
            "type": "number",
            "required": false
      },
      {
            "key": "membrane_status",
            "label": "Membrane Status",
            "type": "select",
            "required": false,
            "options": ["Intact", "Ruptured"]
      },
      {
            "key": "liquor_color",
            "label": "Liquor Color",
            "type": "select",
            "required": false,
            "options": ["Clear", "Meconium", "Bloodstained"]
      },
      {
            "key": "maternal_bp",
            "label": "Maternal BP",
            "type": "string",
            "required": false
      },
      {
            "key": "maternal_pulse",
            "label": "Maternal Pulse",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "management_decision",
            "label": "Management Decision",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_10: {
    id: 'Form_1_1_1_y_10',
    name: '1.1.1.y.10 Active Phase Assessment',
    collectionName: 'active_phase_assessments',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.10',
    description: 'Frequent clinical assessments for the Partograph',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "assessment_time",
            "label": "Assessment Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "cervical_dilatation",
            "label": "Cervical Dilatation (cm)*",
            "type": "number",
            "required": true
      },
      {
            "key": "station",
            "label": "Station (-3 to +3)",
            "type": "number",
            "required": false
      },
      {
            "key": "contraction_frequency",
            "label": "Contraction Frequency (per 10m)",
            "type": "number",
            "required": false
      },
      {
            "key": "contraction_duration",
            "label": "Contraction Duration (sec)",
            "type": "number",
            "required": false
      },
      {
            "key": "maternal_bp",
            "label": "Maternal BP",
            "type": "string",
            "required": false
      },
      {
            "key": "maternal_pulse",
            "label": "Maternal Pulse",
            "type": "number",
            "required": false
      },
      {
            "key": "maternal_temp",
            "label": "Maternal Temp (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "liquor_status",
            "label": "Membrane Status",
            "type": "select",
            "required": false,
            "options": ["Intact", "Ruptured"]
      },
      {
            "key": "liquor_color",
            "label": "Liquor Color",
            "type": "select",
            "required": false,
            "options": ["Clear", "Meconium", "Bloodstained"]
      },
      {
            "key": "oxytocin_dosage_mu_min",
            "label": "Oxytocin Dosage (mU/min)",
            "type": "number",
            "required": false
      },
      {
            "key": "medication_given",
            "label": "Medications Given",
            "type": "textarea",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_11_Monitoring: {
    id: 'Form_1_1_1_y_11_Monitoring',
    name: '1.1.1.y.11 Second Stage Monitoring',
    collectionName: 'second_stage_monitoring',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.11 (Monitoring)',
    description: 'Clinical assessments during the second stage of labor',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "assessment_time",
            "label": "Assessment Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "station",
            "label": "Station (-3 to +3)",
            "type": "number",
            "required": false
      },
      {
            "key": "maternal_effort",
            "label": "Maternal Effort",
            "type": "string",
            "required": false
      },
      {
            "key": "maternal_bp",
            "label": "Maternal BP",
            "type": "string",
            "required": false
      },
      {
            "key": "maternal_pulse",
            "label": "Maternal Pulse",
            "type": "number",
            "required": false
      },
      {
            "key": "fetal_heart_rate",
            "label": "Fetal Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "maneuvers_performed",
            "label": "Maneuvers Performed",
            "type": "textarea",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_11_Outcome: {
    id: 'Form_1_1_1_y_11_Outcome',
    name: '1.1.1.y.11 Delivery Outcome',
    collectionName: 'delivery_outcomes',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.11 (Outcome)',
    description: 'Record of delivery outcome and maternal/neonatal status',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "birth_time",
            "label": "Birth Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "mode_of_delivery",
            "label": "Mode of Delivery*",
            "type": "select",
            "required": true,
            "options": ["SVD", "Cesarean", "Vacuum", "Forceps"]
      },
      {
            "key": "baby_gender",
            "label": "Baby Gender",
            "type": "select",
            "required": false,
            "options": ["Male", "Female", "Other"]
      },
      {
            "key": "baby_weight_grams",
            "label": "Baby Weight (grams)",
            "type": "number",
            "required": false
      },
      {
            "key": "apgar_1min",
            "label": "APGAR (1 min)",
            "type": "number",
            "required": false
      },
      {
            "key": "apgar_5min",
            "label": "APGAR (5 min)",
            "type": "number",
            "required": false
      },
      {
            "key": "placenta_status",
            "label": "Placenta Status",
            "type": "select",
            "required": false,
            "options": ["Complete", "Incomplete"]
      },
      {
            "key": "perineal_tear_degree",
            "label": "Perineal Tear Degree",
            "type": "select",
            "required": false,
            "options": ["None", "1st", "2nd", "3rd", "4th"]
      },
      {
            "key": "blood_loss_ml",
            "label": "Blood Loss (ml)",
            "type": "number",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_12: {
    id: 'Form_1_1_1_y_12',
    name: '1.1.1.y.12 Third Stage (Placental) Assessment',
    collectionName: 'third_stage_assessments',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.12',
    description: 'Clinical record for the third stage of labor and placental delivery',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "time_of_placental_delivery",
            "label": "Time of Placental Delivery*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "management_method",
            "label": "Management Method",
            "type": "select",
            "required": false,
            "options": ["AMTSL", "Expectant"]
      },
      {
            "key": "uterotonic_administered",
            "label": "Uterotonic Administered",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "controlled_cord_traction",
            "label": "Controlled Cord Traction",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "uterine_massage_performed",
            "label": "Uterine Massage Performed",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "placenta_condition",
            "label": "Placenta Condition",
            "type": "select",
            "required": false,
            "options": ["Complete", "Incomplete", "Retained"]
      },
      {
            "key": "membranes_condition",
            "label": "Membranes Condition",
            "type": "select",
            "required": false,
            "options": ["Intact", "Incomplete"]
      },
      {
            "key": "estimated_blood_loss_ml",
            "label": "Estimated Blood Loss (ml)*",
            "type": "number",
            "required": true
      },
      {
            "key": "maternal_bp_post_delivery",
            "label": "Maternal BP Post-Delivery",
            "type": "string",
            "required": false
      },
      {
            "key": "complications",
            "label": "Complications/Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_13: {
    id: 'Form_1_1_1_y_13',
    name: '1.1.1.y.13 Postpartum Care Services',
    collectionName: 'postpartum_checks',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.13',
    description: 'Protocol for postpartum clinical checks and maternal monitoring',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "check_date",
            "label": "Check Date*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "check_type",
            "label": "Check Type*",
            "type": "select",
            "required": true,
            "options": ["Immediate", "24h", "1Week", "6Week", "Other"]
      },
      {
            "key": "maternal_bp",
            "label": "Maternal BP",
            "type": "string",
            "required": false
      },
      {
            "key": "maternal_pulse",
            "label": "Maternal Pulse (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "maternal_temp",
            "label": "Maternal Temp (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "fundal_height_cm",
            "label": "Fundal Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "lochia_amount",
            "label": "Lochia Amount",
            "type": "select",
            "required": false,
            "options": ["Scant", "Moderate", "Heavy"]
      },
      {
            "key": "lochia_color",
            "label": "Lochia Color",
            "type": "select",
            "required": false,
            "options": ["Rubra", "Serosa", "Alba"]
      },
      {
            "key": "wound_status",
            "label": "Wound Status",
            "type": "select",
            "required": false,
            "options": ["Clean", "Redness", "Discharge"]
      },
      {
            "key": "breast_status",
            "label": "Breast Status",
            "type": "string",
            "required": false
      },
      {
            "key": "breastfeeding_status",
            "label": "Breastfeeding Status",
            "type": "select",
            "required": false,
            "options": ["Exclusive", "Mixed", "Formula"]
      },
      {
            "key": "contraception_provided",
            "label": "Contraception Provided",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_14: {
    id: 'Form_1_1_1_y_14',
    name: '1.1.1.y.14 Cesarean Section Details',
    collectionName: 'cesarean_sections',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.14',
    description: 'Surgical record for Cesarean Section procedures',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "registry_id",
            "label": "Surgical Registry ID",
            "type": "string",
            "required": false
      },
      {
            "key": "classification",
            "label": "Classification*",
            "type": "select",
            "required": true,
            "options": ["Emergency", "Elective"]
      },
      {
            "key": "indication",
            "label": "Indication*",
            "type": "textarea",
            "required": true
      },
      {
            "key": "decision_time",
            "label": "Decision Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "incision_time",
            "label": "Incision Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "anesthesia_type",
            "label": "Anesthesia Type",
            "type": "select",
            "required": false,
            "options": ["Spinal", "General", "Epidural"]
      },
      {
            "key": "incision_type",
            "label": "Incision Type",
            "type": "select",
            "required": false,
            "options": ["Pfannenstiel", "Vertical"]
      },
      {
            "key": "surgeon_name",
            "label": "Surgeon Name",
            "type": "string",
            "required": false
      },
      {
            "key": "assistant_name",
            "label": "Assistant Name",
            "type": "string",
            "required": false
      },
      {
            "key": "anesthetist_name",
            "label": "Anesthetist Name",
            "type": "string",
            "required": false
      },
      {
            "key": "complications",
            "label": "Complications",
            "type": "textarea",
            "required": false
      },
      {
            "key": "blood_loss_ml",
            "label": "Blood Loss (ml)",
            "type": "number",
            "required": false
      },
      {
            "key": "surgical_notes",
            "label": "Surgical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_15: {
    id: 'Form_1_1_1_y_15',
    name: '1.1.1.y.15 Post-Op Recovery Monitoring (PACU)',
    collectionName: 'post_op_recovery_monitoring',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.15',
    description: 'Protocol for immediate post-operative recovery monitoring in the PACU',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "assessment_time",
            "label": "Assessment Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "motor_block_level",
            "label": "Motor Block Level (e.g. Bromage Score)",
            "type": "string",
            "required": false
      },
      {
            "key": "pain_score_vas",
            "label": "Pain Score (VAS 0-10)",
            "type": "number",
            "required": false
      },
      {
            "key": "vitals_bp",
            "label": "BP",
            "type": "string",
            "required": false
      },
      {
            "key": "vitals_pulse",
            "label": "Pulse (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "vitals_resp_rate",
            "label": "Respiratory Rate (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "vitals_temp",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "surgical_dressing_status",
            "label": "Surgical Dressing Status",
            "type": "select",
            "required": false,
            "options": ["Dry", "Slightly Stained", "Soaked"]
      },
      {
            "key": "fundus_consistency",
            "label": "Fundus Consistency",
            "type": "select",
            "required": false,
            "options": ["Firm", "Boggy"]
      },
      {
            "key": "vaginal_bleeding_amount",
            "label": "Vaginal Bleeding Amount",
            "type": "select",
            "required": false,
            "options": ["Scant", "Moderate", "Heavy"]
      },
      {
            "key": "urine_output_ml",
            "label": "Urine Output (ml)",
            "type": "number",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_16: {
    id: 'Form_1_1_1_y_16',
    name: '1.1.1.y.16 Post-Op Ward Transfer Record',
    collectionName: 'post_op_transfer_status',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.16',
    description: 'Protocol for transferring patients from PACU to the ward',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "transfer_time",
            "label": "Transfer Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "transfer_from",
            "label": "Transfer From*",
            "type": "string",
            "required": true
      },
      {
            "key": "transfer_to",
            "label": "Transfer To*",
            "type": "string",
            "required": true
      },
      {
            "key": "stability_status",
            "label": "Stability Status",
            "type": "select",
            "required": false,
            "options": ["Stable", "Requires Monitoring"]
      },
      {
            "key": "iv_fluids_status",
            "label": "IV Fluids Status",
            "type": "string",
            "required": false
      },
      {
            "key": "catheter_removed",
            "label": "Catheter Removed",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "handover_notes",
            "label": "Handover Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "received_by",
            "label": "Received By (Nurse/Midwife)",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_17: {
    id: 'Form_1_1_1_y_17',
    name: '1.1.1.y.17 Master Birth Summary View',
    collectionName: 'birth_summaries',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.17',
    description: 'Comprehensive overview of labor, delivery, and postpartum status',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "hospital_id",
            "label": "Hospital ID",
            "type": "string",
            "required": false
      },
      {
            "key": "birth_time",
            "label": "Birth Time",
            "type": "date-time",
            "required": false
      },
      {
            "key": "mode_of_delivery",
            "label": "Mode of Delivery",
            "type": "string",
            "required": false
      },
      {
            "key": "baby_weight_grams",
            "label": "Baby Weight (grams)",
            "type": "number",
            "required": false
      },
      {
            "key": "apgar_5min",
            "label": "APGAR (5 min)",
            "type": "number",
            "required": false
      },
      {
            "key": "total_blood_loss",
            "label": "Total Blood Loss (ml)",
            "type": "number",
            "required": false
      },
      {
            "key": "surgery_type",
            "label": "Surgery Type",
            "type": "string",
            "required": false
      },
      {
            "key": "surgery_indication",
            "label": "Surgery Indication",
            "type": "string",
            "required": false
      },
      {
            "key": "surgeon_name",
            "label": "Surgeon Name",
            "type": "string",
            "required": false
      },
      {
            "key": "latest_check_type",
            "label": "Latest Check Type",
            "type": "string",
            "required": false
      },
      {
            "key": "latest_bp",
            "label": "Latest BP",
            "type": "string",
            "required": false
      },
      {
            "key": "latest_temp",
            "label": "Latest Temp (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "latest_fundus_cm",
            "label": "Latest Fundus (cm)",
            "type": "number",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_18_a: {
    id: 'Form_1_1_1_y_18_a',
    name: '1.1.1.y.18 Vaccine Master Registry',
    collectionName: 'vaccine_master',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.18-A',
    description: 'Master registry for vaccines, including recommended age and dosage',
    fields: [
      {
            "key": "vaccine_code",
            "label": "Vaccine Code*",
            "type": "string",
            "required": true
      },
      {
            "key": "vaccine_name",
            "label": "Vaccine Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "target_disease",
            "label": "Target Disease",
            "type": "string",
            "required": false
      },
      {
            "key": "recommended_age_weeks",
            "label": "Recommended Age (weeks)",
            "type": "number",
            "required": false
      },
      {
            "key": "dose_sequence",
            "label": "Dose Sequence",
            "type": "number",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_18_b: {
    id: 'Form_1_1_1_y_18_b',
    name: '1.1.1.y.18 Patient Immunizations',
    collectionName: 'patient_immunizations',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.18-B',
    description: 'Record of vaccines administered to patients',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "episode_id",
            "label": "Episode ID",
            "type": "string",
            "required": false
      },
      {
            "key": "vaccine_id",
            "label": "Vaccine ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "date_administered",
            "label": "Date Administered*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "batch_number",
            "label": "Batch Number",
            "type": "string",
            "required": false
      },
      {
            "key": "expiry_date",
            "label": "Expiry Date",
            "type": "date",
            "required": false
      },
      {
            "key": "site_administered",
            "label": "Site Administered",
            "type": "string",
            "required": false
      },
      {
            "key": "provider_name",
            "label": "Provider Name",
            "type": "string",
            "required": false
      },
      {
            "key": "status",
            "label": "Status*",
            "type": "select",
            "required": true,
            "options": ["Completed", "Refused", "Contraindicated"]
      },
      {
            "key": "next_due_date",
            "label": "Next Due Date",
            "type": "date",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_18_c: {
    id: 'Form_1_1_1_y_18_c',
    name: '1.1.1.y.18 AEFI Reports',
    collectionName: 'aefi_reports',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.18-C',
    description: 'Reporting of adverse events following immunization',
    fields: [
      {
            "key": "immunization_id",
            "label": "Immunization ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "report_date",
            "label": "Report Date*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "reaction_type",
            "label": "Reaction Type*",
            "type": "string",
            "required": true
      },
      {
            "key": "severity",
            "label": "Severity*",
            "type": "select",
            "required": true,
            "options": ["Mild", "Moderate", "Severe"]
      },
      {
            "key": "action_taken",
            "label": "Action Taken",
            "type": "textarea",
            "required": false
      },
      {
            "key": "reported_by",
            "label": "Reported By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_19_a: {
    id: 'Form_1_1_1_y_19_a',
    name: '1.1.1.y.19 Newborn Registry',
    collectionName: 'newborn_registry',
    icon: Baby,
    subtitle: 'Form 1.1.1.y.19-A',
    description: 'Master registry for newborn babies',
    fields: [
      {
            "key": "episode_id",
            "label": "Maternal Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "baby_index",
            "label": "Baby Index (1 for Single, 1/2 for Twins)*",
            "type": "number",
            "required": true
      },
      {
            "key": "gender",
            "label": "Gender*",
            "type": "select",
            "required": true,
            "options": ["Male", "Female", "Ambiguous"]
      },
      {
            "key": "birth_weight_grams",
            "label": "Birth Weight (grams)",
            "type": "number",
            "required": false
      },
      {
            "key": "gestational_age_at_birth",
            "label": "Gestational Age at Birth (weeks)",
            "type": "number",
            "required": false
      },
      {
            "key": "status",
            "label": "Status*",
            "type": "select",
            "required": true,
            "options": ["Alive", "Stillborn", "Expired"]
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_19_b: {
    id: 'Form_1_1_1_y_19_b',
    name: '1.1.1.y.19 Neonatal Routine Care',
    collectionName: 'neonatal_routine_care',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.19-B',
    description: 'Routine clinical care assessment for neonates',
    fields: [
      {
            "key": "newborn_id",
            "label": "Newborn ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "assessment_time",
            "label": "Assessment Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "temp_celsius",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "heart_rate",
            "label": "Heart Rate (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "respiratory_rate",
            "label": "Respiratory Rate (bpm)",
            "type": "number",
            "required": false
      },
      {
            "key": "oxygen_saturation",
            "label": "Oxygen Saturation (%)",
            "type": "number",
            "required": false
      },
      {
            "key": "feeding_method",
            "label": "Feeding Method",
            "type": "select",
            "required": false,
            "options": ["Exclusive Breastfeeding", "Cup Feed", "IV", "Other"]
      },
      {
            "key": "urine_output_status",
            "label": "Urine Output Status",
            "type": "select",
            "required": false,
            "options": ["Normal", "Decreased", "Absent"]
      },
      {
            "key": "stool_status",
            "label": "Stool Status",
            "type": "select",
            "required": false,
            "options": ["Normal Meconium", "Passed", "Not Passed"]
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_19_c: {
    id: 'Form_1_1_1_y_19_c',
    name: '1.1.1.y.19 NICU Daily Log',
    collectionName: 'nicu_daily_logs',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.19-C',
    description: 'Daily clinical log for neonates in the NICU',
    fields: [
      {
            "key": "newborn_id",
            "label": "Newborn ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "log_time",
            "label": "Log Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "spo2_percent",
            "label": "SpO2 (%)",
            "type": "number",
            "required": false
      },
      {
            "key": "fio2_percentage",
            "label": "FiO2 (%)",
            "type": "number",
            "required": false
      },
      {
            "key": "iv_fluid_rate_ml_hr",
            "label": "IV Fluid Rate (ml/hr)",
            "type": "number",
            "required": false
      },
      {
            "key": "respiratory_support",
            "label": "Respiratory Support",
            "type": "select",
            "required": false,
            "options": ["Room Air", "Nasal Cannula", "CPAP", "Ventilator"]
      },
      {
            "key": "medications_administered",
            "label": "Medications Administered",
            "type": "textarea",
            "required": false
      },
      {
            "key": "jaundice_level",
            "label": "Jaundice Level",
            "type": "string",
            "required": false
      },
      {
            "key": "is_septic_workup_done",
            "label": "Septic Workup Done?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_19_d: {
    id: 'Form_1_1_1_y_19_d',
    name: '1.1.1.y.19 KMC Session Record',
    collectionName: 'kmc_sessions',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.19-D',
    description: 'Record of Kangaroo Mother Care (KMC) sessions',
    fields: [
      {
            "key": "newborn_id",
            "label": "Newborn ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "date_of_session",
            "label": "Date of Session*",
            "type": "date",
            "required": true
      },
      {
            "key": "skin_to_skin_hours_daily",
            "label": "Skin-to-Skin Hours (Daily)",
            "type": "number",
            "required": false
      },
      {
            "key": "maternal_participation_score",
            "label": "Maternal Participation Score (1-5)",
            "type": "number",
            "required": false
      },
      {
            "key": "current_weight_grams",
            "label": "Current Weight (grams)",
            "type": "number",
            "required": false
      },
      {
            "key": "feeding_status",
            "label": "Feeding Status",
            "type": "string",
            "required": false
      },
      {
            "key": "is_ready_for_discharge",
            "label": "Ready for Discharge?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_20_a: {
    id: 'Form_1_1_1_y_20_a',
    name: '1.1.1.y.20 Abortion/PAC Episodes',
    collectionName: 'abortion_pac_episodes',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.20-A',
    description: 'Master registry for CAC and PAC episodes',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "admission_date",
            "label": "Admission Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "case_type",
            "label": "Case Type*",
            "type": "select",
            "required": true,
            "options": ["Induced", "Spontaneous (Miscarriage)", "Septic"]
      },
      {
            "key": "gestational_age_weeks",
            "label": "Gestational Age (weeks)",
            "type": "number",
            "required": false
      },
      {
            "key": "vitals_bp",
            "label": "BP",
            "type": "string",
            "required": false
      },
      {
            "key": "vitals_temp",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "hb_level",
            "label": "HB Level (g/dL)",
            "type": "number",
            "required": false
      },
      {
            "key": "is_active",
            "label": "Is Episode Active?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "clinical_summary",
            "label": "Clinical Summary",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_20_b: {
    id: 'Form_1_1_1_y_20_b',
    name: '1.1.1.y.20 PAC Management Details',
    collectionName: 'pac_management_details',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.20-B',
    description: 'Procedure and management details for CAC/PAC episodes',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "management_method",
            "label": "Management Method*",
            "type": "select",
            "required": true,
            "options": ["MVA", "EVA", "Medical (Miso/Mife)", "Expectant"]
      },
      {
            "key": "procedure_date",
            "label": "Procedure Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "anesthesia_type",
            "label": "Anesthesia Type",
            "type": "string",
            "required": false
      },
      {
            "key": "cervical_dilation_cm",
            "label": "Cervical Dilation (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "procedure_complications",
            "label": "Procedure Complications",
            "type": "textarea",
            "required": false
      },
      {
            "key": "medication_regimen",
            "label": "Medication Regimen (Dose/Route/Freq)",
            "type": "textarea",
            "required": false
      },
      {
            "key": "is_procedure_complete",
            "label": "Is Procedure Complete?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "total_blood_loss_ml",
            "label": "Total Blood Loss (ml)",
            "type": "number",
            "required": false
      },
      {
            "key": "performed_by",
            "label": "Performed By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_20_c: {
    id: 'Form_1_1_1_y_20_c',
    name: '1.1.1.y.20 Contraceptive Counseling',
    collectionName: 'pac_contraceptive_counseling',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.20-C',
    description: 'Contraceptive counseling and follow-up for PAC/CAC patients',
    fields: [
      {
            "key": "episode_id",
            "label": "Episode ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "counseling_date",
            "label": "Counseling Date*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "counseling_provided",
            "label": "Counseling Provided?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "contraceptive_method_selected",
            "label": "Contraceptive Method Selected",
            "type": "select",
            "required": false,
            "options": ["IUD", "Implant", "Pills", "Injectable", "Condoms", "Permanent", "None"]
      },
      {
            "key": "method_provided_immediately",
            "label": "Method Provided Immediately?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "follow_up_appointment_date",
            "label": "Follow-up Appointment Date",
            "type": "date",
            "required": false
      },
      {
            "key": "notes",
            "label": "Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_21_a: {
    id: 'Form_1_1_1_y_21_a',
    name: '1.1.1.y.21 FP Method Registry',
    collectionName: 'fp_method_registry',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.21-A',
    description: 'Master registry for family planning methods',
    fields: [
      {
            "key": "method_name",
            "label": "Method Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "category",
            "label": "Category",
            "type": "select",
            "required": false,
            "options": ["LARC", "Short-Acting", "Permanent"]
      },
      {
            "key": "standard_duration_months",
            "label": "Standard Duration (months)",
            "type": "number",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_21_b: {
    id: 'Form_1_1_1_y_21_b',
    name: '1.1.1.y.21 FP Provision Record',
    collectionName: 'fp_provision_records',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.21-B',
    description: 'Record of family planning methods provided to patients',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "method_id",
            "label": "Method ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "provision_date",
            "label": "Provision Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "expiry_date",
            "label": "Expiry Date",
            "type": "date",
            "required": false
      },
      {
            "key": "counseling_provided",
            "label": "Counseling Provided?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "provider_name",
            "label": "Provider Name",
            "type": "string",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "is_active",
            "label": "Is active?",
            "type": "checkbox",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_21_c: {
    id: 'Form_1_1_1_y_21_c',
    name: '1.1.1.y.21 FP Removal Record',
    collectionName: 'fp_removal_records',
    icon: Activity,
    subtitle: 'Form 1.1.1.y.21-C',
    description: 'Record of family planning method removal or discontinuation',
    fields: [
      {
            "key": "provision_id",
            "label": "Provision ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "removal_date",
            "label": "Removal Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "removal_reason",
            "label": "Removal Reason",
            "type": "select",
            "required": false,
            "options": ["Planned Pregnancy", "Side Effects", "Method Failure", "Moved away", "Other"]
      },
      {
            "key": "side_effects_noted",
            "label": "Side Effects Noted",
            "type": "textarea",
            "required": false
      },
      {
            "key": "provider_name",
            "label": "Provider Name",
            "type": "string",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_22_a: {
    id: 'Form_1_1_1_y_22_a',
    name: '1.1.1.y.22 Gyn Encounters',
    collectionName: 'gyn_encounters',
    icon: Stethoscope,
    subtitle: 'Form 1.1.1.y.22-A',
    description: 'General gynecology clinical encounter record',
    fields: [
      {
            "key": "hospital_id",
            "label": "Hospital ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "visit_date",
            "label": "Visit Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "chief_complaint",
            "label": "Chief Complaint",
            "type": "textarea",
            "required": false
      },
      {
            "key": "diagnosis_code",
            "label": "Diagnosis Code (ICD-10)",
            "type": "string",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "treatment_plan",
            "label": "Treatment Plan",
            "type": "textarea",
            "required": false
      },
      {
            "key": "prescription_notes",
            "label": "Prescription Notes",
            "type": "textarea",
            "required": false
      },
      {
            "key": "follow_up_required",
            "label": "Follow-up Required?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "follow_up_date",
            "label": "Follow-up Date",
            "type": "date",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_22_b: {
    id: 'Form_1_1_1_y_22_b',
    name: '1.1.1.y.22 Gyn Surgeries',
    collectionName: 'gyn_surgeries',
    icon: Scissors,
    subtitle: 'Form 1.1.1.y.22-B',
    description: 'Gynecological surgical procedure record',
    fields: [
      {
            "key": "encounter_id",
            "label": "Encounter ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "procedure_name",
            "label": "Procedure Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "surgery_date",
            "label": "Surgery Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "anesthesia_type",
            "label": "Anesthesia Type",
            "type": "string",
            "required": false
      },
      {
            "key": "surgical_findings",
            "label": "Surgical Findings",
            "type": "textarea",
            "required": false
      },
      {
            "key": "blood_loss_ml",
            "label": "Blood Loss (ml)",
            "type": "number",
            "required": false
      },
      {
            "key": "complications",
            "label": "Complications",
            "type": "textarea",
            "required": false
      },
      {
            "key": "surgeon_name",
            "label": "Surgeon Name",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_y_22_c: {
    id: 'Form_1_1_1_y_22_c',
    name: '1.1.1.y.22 Gyn Investigations',
    collectionName: 'gyn_investigations',
    icon: Search,
    subtitle: 'Form 1.1.1.y.22-C',
    description: 'Gynecological investigations and diagnostic tests',
    fields: [
      {
            "key": "encounter_id",
            "label": "Encounter ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "test_type",
            "label": "Test Type*",
            "type": "string",
            "required": true
      },
      {
            "key": "test_date",
            "label": "Test Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "result_summary",
            "label": "Result Summary",
            "type": "textarea",
            "required": false
      },
      {
            "key": "interpretation",
            "label": "Interpretation*",
            "type": "select",
            "required": true,
            "options": ["Normal", "Pathological", "Suspicious"]
      },
      {
            "key": "attached_file_path",
            "label": "Attached File Path",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_6_a: {
    id: 'Form_1_1_1_z_6_a',
    name: '1.1.1.z.6 Surgical Master Registry',
    collectionName: 'surgical_master_registry',
    icon: Database,
    subtitle: 'Form 1.1.1.z.6-A',
    description: 'Master registry for all surgical procedures',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "surgery_date",
            "label": "Surgery Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "specialty",
            "label": "Specialty",
            "type": "select",
            "required": false,
            "options": ["OBGYN", "General Surgery", "Orthopedics", "Other"]
      },
      {
            "key": "procedure_name",
            "label": "Procedure Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "pre_op_diagnosis",
            "label": "Pre-op Diagnosis",
            "type": "textarea",
            "required": false
      },
      {
            "key": "post_op_diagnosis",
            "label": "Post-op Diagnosis",
            "type": "textarea",
            "required": false
      },
      {
            "key": "theatre_id",
            "label": "Theatre ID",
            "type": "select",
            "required": false,
            "options": ["Theatre 1", "Theatre 2", "Theatre 3", "Emergency Theatre"]
      },
      {
            "key": "surgeon_name",
            "label": "Surgeon Name",
            "type": "string",
            "required": false
      },
      {
            "key": "anesthetist_name",
            "label": "Anesthetist Name",
            "type": "string",
            "required": false
      },
      {
            "key": "status",
            "label": "Status",
            "type": "select",
            "required": false,
            "options": ["Booked", "Completed", "Cancelled"]
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_6_b: {
    id: 'Form_1_1_1_z_6_b',
    name: '1.1.1.z.6 Surgical Bookings',
    collectionName: 'surgical_bookings',
    icon: Calendar,
    subtitle: 'Form 1.1.1.z.6-B',
    description: 'Surgical procedure bookings and scheduling',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "tentative_date",
            "label": "Tentative Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "urgency_level",
            "label": "Urgency Level",
            "type": "select",
            "required": false,
            "options": ["Elective", "Urgent", "Emergency"]
      },
      {
            "key": "scheduled_procedure",
            "label": "Scheduled Procedure*",
            "type": "string",
            "required": true
      },
      {
            "key": "requesting_doctor",
            "label": "Requesting Doctor",
            "type": "string",
            "required": false
      },
      {
            "key": "status",
            "label": "Status",
            "type": "select",
            "required": false,
            "options": ["Pending", "Confirmed", "Cancelled"]
      },
      {
            "key": "notes",
            "label": "Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_6_c: {
    id: 'Form_1_1_1_z_6_c',
    name: '1.1.1.z.6 Theatre Time Logs',
    collectionName: 'theatre_time_logs',
    icon: Clock,
    subtitle: 'Form 1.1.1.z.6-C',
    description: 'Time tracking logs for theatre operations',
    fields: [
      {
            "key": "registry_id",
            "label": "Registry ID*",
            "type": "string",
            "required": true
      },
      {
            "key": "patient_entry_time",
            "label": "Patient Entry Time",
            "type": "date-time",
            "required": false
      },
      {
            "key": "anesthesia_start_time",
            "label": "Anesthesia Start Time",
            "type": "date-time",
            "required": false
      },
      {
            "key": "incision_time",
            "label": "Incision Time",
            "type": "date-time",
            "required": false
      },
      {
            "key": "closure_time",
            "label": "Closure Time",
            "type": "date-time",
            "required": false
      },
      {
            "key": "patient_exit_time",
            "label": "Patient Exit Time",
            "type": "date-time",
            "required": false
      },
      {
            "key": "complications_noted",
            "label": "Complications Noted",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_7_a: {
    id: 'Form_1_1_1_z_7_a',
    name: '1.1.1.z.7 Pediatric Growth Monitoring',
    collectionName: 'pediatric_growth_records',
    icon: TrendingUp,
    subtitle: 'Form 1.1.1.z.7-A',
    description: 'Pediatric growth and nutritional health tracking',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "visit_date",
            "label": "Visit Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false
      },
      {
            "key": "height_cm",
            "label": "Height (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "muac_cm",
            "label": "MUAC (cm)",
            "type": "number",
            "required": false
      },
      {
            "key": "nutritional_status",
            "label": "Nutritional Status",
            "type": "select",
            "required": false,
            "options": ["Normal", "MAM", "SAM", "Obese"]
      },
      {
            "key": "weight_for_age_zscore",
            "label": "Weight-for-age Z-Score",
            "type": "number",
            "required": false
      },
      {
            "key": "height_for_age_zscore",
            "label": "Height-for-age Z-Score",
            "type": "number",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_7_b: {
    id: 'Form_1_1_1_z_7_b',
    name: '1.1.1.z.7 Developmental Screening',
    collectionName: 'developmental_screenings',
    icon: Brain,
    subtitle: 'Form 1.1.1.z.7-B',
    description: 'Assessment of developmental milestones',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "screening_date",
            "label": "Screening Date*",
            "type": "date",
            "required": true
      },
      {
            "key": "age_category",
            "label": "Age Category*",
            "type": "select",
            "required": true,
            "options": ["1-2yr", "3-5yr", "6-12yr"]
      },
      {
            "key": "motor_skills_status",
            "label": "Motor Skills Status",
            "type": "select",
            "required": false,
            "options": ["On Track", "Delayed"]
      },
      {
            "key": "speech_language_status",
            "label": "Speech & Language Status",
            "type": "select",
            "required": false,
            "options": ["On Track", "Delayed"]
      },
      {
            "key": "social_emotional_status",
            "label": "Social-Emotional Status",
            "type": "select",
            "required": false,
            "options": ["On Track", "Delayed"]
      },
      {
            "key": "concern_flagged",
            "label": "Concern Flagged?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "clinical_notes",
            "label": "Clinical Notes",
            "type": "textarea",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_7_c: {
    id: 'Form_1_1_1_z_7_c',
    name: '1.1.1.z.7 Pediatric Consultation',
    collectionName: 'pediatric_consultations',
    icon: UserMinus,
    subtitle: 'Form 1.1.1.z.7-C',
    description: 'Clinical consultation for sick children',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "visit_date",
            "label": "Visit Date/Time*",
            "type": "date-time",
            "required": true
      },
      {
            "key": "temp_celsius",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false
      },
      {
            "key": "respiratory_rate",
            "label": "Respiratory Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "heart_rate",
            "label": "Heart Rate",
            "type": "number",
            "required": false
      },
      {
            "key": "oxygen_saturation",
            "label": "SpO2 (%)",
            "type": "number",
            "required": false
      },
      {
            "key": "chief_complaint",
            "label": "Chief Complaint",
            "type": "textarea",
            "required": false
      },
      {
            "key": "diagnosis_icd10",
            "label": "Diagnosis (ICD-10)",
            "type": "string",
            "required": false
      },
      {
            "key": "treatment_plan",
            "label": "Treatment Plan",
            "type": "textarea",
            "required": false
      },
      {
            "key": "medication_prescribed",
            "label": "Medication Prescribed",
            "type": "textarea",
            "required": false
      },
      {
            "key": "is_referral_required",
            "label": "Referral Required?",
            "type": "checkbox",
            "required": false
      },
      {
            "key": "recorded_by",
            "label": "Recorded By",
            "type": "string",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_7_d: {
    id: 'Form_1_1_1_z_7_d',
    name: '1.1.1.z.7 Immunization Boosters',
    collectionName: 'pediatric_immunization_boosters',
    icon: Syringe,
    subtitle: 'Form 1.1.1.z.7-D',
    description: 'School-age vaccine boosters tracking',
    fields: [
      {
            "key": "patient_mrn",
            "label": "Patient MRN*",
            "type": "string",
            "required": true
      },
      {
            "key": "vaccine_name",
            "label": "Vaccine Name*",
            "type": "string",
            "required": true
      },
      {
            "key": "date_administered",
            "label": "Date Administered*",
            "type": "date",
            "required": true
      },
      {
            "key": "batch_number",
            "label": "Batch Number",
            "type": "string",
            "required": false
      },
      {
            "key": "next_due_date",
            "label": "Next Due Date",
            "type": "date",
            "required": false
      },
      {
            "key": "is_completed",
            "label": "Is Completed?",
            "type": "checkbox",
            "required": false
      }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_8_a: {
    id: 'Form_1_1_1_z_8_a',
    name: '1.1.1.z.8 ICU Admission & Severity Indexing',
    collectionName: 'icu_admissions',
    icon: Stethoscope,
    subtitle: 'Form 1.1.1.z.8-A',
    description: 'ICU admission details and severity scoring (APACHE II, SOFA)',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'admission_time', label: 'Admission Time*', type: 'date-time', required: true },
      { key: 'admission_reason', label: 'Admission Reason', type: 'textarea', required: false },
      { key: 'apache_ii_score', label: 'APACHE II Score', type: 'number', required: false },
      { key: 'sofa_score', label: 'SOFA Score', type: 'number', required: false },
      { key: 'bed_number', label: 'Bed Number', type: 'string', required: false },
      { key: 'attending_physician', label: 'Attending Physician', type: 'string', required: false },
      { key: 'is_active', label: 'Is Active?', type: 'checkbox', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_8_b: {
    id: 'Form_1_1_1_z_8_b',
    name: '1.1.1.z.8 ICU Hourly Vitals (Hemodynamics)',
    collectionName: 'icu_vitals_hourly',
    icon: TrendingUp,
    subtitle: 'Form 1.1.1.z.8-B',
    description: 'Hourly hemodynamic and respiratory monitoring',
    fields: [
      { key: 'admission_id', label: 'Admission ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'timestamp', label: 'Vitals Time*', type: 'date-time', required: true },
      { key: 'bp_systolic', label: 'BP Systolic (mmHg)', type: 'number', required: false },
      { key: 'bp_diastolic', label: 'BP Diastolic (mmHg)', type: 'number', required: false },
      { key: 'mean_arterial_pressure', label: 'MAP (mmHg)', type: 'number', required: false },
      { key: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number', required: false },
      { key: 'cvp_cmh2o', label: 'CVP (cmH2O)', type: 'number', required: false },
      { key: 'spo2_percent', label: 'SpO2 (%)', type: 'number', required: false },
      { key: 'respiratory_rate', label: 'Resp Rate (bpm)', type: 'number', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_8_c: {
    id: 'Form_1_1_1_z_8_c',
    name: '1.1.1.z.8 ICU Ventilator Settings',
    collectionName: 'icu_ventilator_settings',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.8-C',
    description: 'Ventilation mode, respiratory monitoring, and sedation',
    fields: [
      { key: 'admission_id', label: 'Admission ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'timestamp', label: 'Settings Time*', type: 'date-time', required: true },
      { key: 'vent_mode', label: 'Vent Mode (e.g. SIMV, AC, CPAP)', type: 'string', required: false },
      { key: 'fio2_percent', label: 'FiO2 (%)', type: 'number', required: false },
      { key: 'peep_cmh2o', label: 'PEEP (cmH2O)', type: 'number', required: false },
      { key: 'tidal_volume_ml', label: 'Tidal Volume (mL)', type: 'number', required: false },
      { key: 'respiratory_rate_set', label: 'Resp Rate Set (bpm)', type: 'number', required: false },
      { key: 'sedation_score_rass', label: 'Sedation Score (RASS)', type: 'number', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_8_d: {
    id: 'Form_1_1_1_z_8_d',
    name: '1.1.1.z.8 ICU Daily Systems Assessment',
    collectionName: 'icu_daily_assessments',
    icon: ClipboardList,
    subtitle: 'Form 1.1.1.z.8-D',
    description: 'Daily assessment of GCS, systems, and nutrition',
    fields: [
      { key: 'admission_id', label: 'Admission ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'assessment_date', label: 'Assessment Date*', type: 'date', required: true },
      { key: 'neurological_gcs', label: 'Neurological (GCS)', type: 'number', required: false },
      { key: 'cardiovascular_notes', label: 'Cardiovascular Assessment', type: 'textarea', required: false },
      { key: 'renal_urine_output_24h', label: 'Renal (24h Urine Output)', type: 'number', required: false },
      { key: 'nutrition_status', label: 'Nutrition Status', type: 'string', required: false },
      { key: 'plan_of_day', label: 'Plan of the Day', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_9_a: {
    id: 'Form_1_1_1_z_9_a',
    name: '1.1.1.z.9 IM Consultation (SOAP)',
    collectionName: 'im_encounters',
    icon: Stethoscope,
    subtitle: 'Form 1.1.1.z.9-A',
    description: 'Internal Medicine daily clinical encounter record (SOAP note)',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'visit_date', label: 'Visit Date/Time*', type: 'date-time', required: true },
      { key: 'subjective_history', label: 'Subjective (HPI/CC)', type: 'textarea', required: false },
      { key: 'objective_exam', label: 'Objective (Physical Exam)', type: 'textarea', required: false },
      { key: 'assessment_diagnosis', label: 'Assessment (Diagnosis)', type: 'textarea', required: false },
      { key: 'plan_management', label: 'Plan & Management', type: 'textarea', required: false },
      { key: 'bp_systolic', label: 'BP Systolic', type: 'number', required: false },
      { key: 'bp_diastolic', label: 'BP Diastolic', type: 'number', required: false },
      { key: 'heart_rate', label: 'Heart Rate', type: 'number', required: false },
      { key: 'temp_celsius', label: 'Temp (°C)', type: 'number', required: false },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_9_b: {
    id: 'Form_1_1_1_z_9_b',
    name: '1.1.1.z.9 Chronic Disease Management',
    collectionName: 'chronic_disease_logs',
    icon: FileSpreadsheet,
    subtitle: 'Form 1.1.1.z.9-B',
    description: 'Longitudinal registry for chronic conditions like Diabetes/Hypertension',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'condition_name', label: 'Condition Name*', type: 'string', required: true },
      { key: 'diagnosis_date', label: 'Diagnosis Date', type: 'date', required: false },
      { key: 'hba1c_level', label: 'HbA1c Level (%)', type: 'number', required: false },
      { key: 'glucose_fasting_mgdl', label: 'Fasting Glucose (mg/dL)', type: 'number', required: false },
      { key: 'cholesterol_ldl_mgdl', label: 'LDL Cholesterol (mg/dL)', type: 'number', required: false },
      { key: 'current_medication_list', label: 'Current Medications', type: 'textarea', required: false },
      { key: 'status', label: 'Current Status*', type: 'select', required: true, options: ['Stable', 'Uncontrolled', 'Complicated'] },
      { key: 'next_follow_up_date', label: 'Next Follow-up Date', type: 'date', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_9_c: {
    id: 'Form_1_1_1_z_9_c',
    name: '1.1.1.z.9 Prescription Module',
    collectionName: 'prescriptions',
    icon: Pill,
    subtitle: 'Form 1.1.1.z.9-C',
    description: 'Comprehensive medication prescription records',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID', type: 'string', required: false },
      { key: 'drug_name', label: 'Drug Name*', type: 'string', required: true },
      { key: 'dosage', label: 'Dosage (e.g. 500mg)', type: 'string', required: false },
      { key: 'frequency', label: 'Frequency (e.g. BID, TID)', type: 'string', required: false },
      { key: 'duration_days', label: 'Duration (Days)', type: 'number', required: false },
      { key: 'prescription_date', label: 'Prescription Date*', type: 'date-time', required: true },
      { key: 'is_active', label: 'Is Active?', type: 'checkbox', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_9_d: {
    id: 'Form_1_1_1_z_9_d',
    name: '1.1.1.z.9 IM Lab Results',
    collectionName: 'im_lab_results',
    icon: FlaskConical,
    subtitle: 'Form 1.1.1.z.9-D',
    description: 'Laboratory investigation results linked to clinical encounters',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID', type: 'string', required: false },
      { key: 'test_name', label: 'Test Name*', type: 'string', required: true },
      { key: 'result_value', label: 'Result Value*', type: 'string', required: true },
      { key: 'unit', label: 'Unit (e.g. mg/dL)', type: 'string', required: false },
      { key: 'reference_range', label: 'Reference Range', type: 'string', required: false },
      { key: 'is_abnormal', label: 'Is Abnormal?', type: 'checkbox', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_10_a: {
    id: 'Form_1_1_1_z_10_a',
    name: '1.1.1.z.10 Vital Signs Monitoring',
    collectionName: 'vital_signs_records',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.10-A',
    description: 'Comprehensive vital signs and assessment monitoring',
    fields: [
      { key: 'episode_id', label: 'Episode ID', type: 'string', required: false },
      { key: 'recorded_at', label: 'Recorded At*', type: 'date-time', required: true },
      { key: 'systolic_bp', label: 'Systolic BP (mmHg)', type: 'number', required: false },
      { key: 'diastolic_bp', label: 'Diastolic BP (mmHg)', type: 'number', required: false },
      { key: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number', required: false },
      { key: 'respiratory_rate', label: 'Respiratory Rate (bpm)', type: 'number', required: false },
      { key: 'spo2_percent', label: 'SpO2 (%)', type: 'number', required: false },
      { key: 'fio2_percent', label: 'FiO2 (%)', type: 'number', required: false, defaultValue: '21' },
      { key: 'temperature_c', label: 'Temperature (°C)', type: 'number', required: false },
      { key: 'pain_score', label: 'Pain Score (0-10)', type: 'number', required: false },
      { key: 'consciousness_level', label: 'Level of Consciousness', type: 'select', required: false, options: ['Alert', 'Voice', 'Pain', 'Unresponsive'] },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false },
      { key: 'notes', label: 'Clinical Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_10_b: {
    id: 'Form_1_1_1_z_10_b',
    name: '1.1.1.z.10 Fluid Balance Logs',
    collectionName: 'fluid_balance_logs',
    icon: Droplets,
    subtitle: 'Form 1.1.1.z.10-B',
    description: 'Intake and output monitoring for fluid balance',
    fields: [
      { key: 'episode_id', label: 'Episode ID', type: 'string', required: false },
      { key: 'log_date', label: 'Log Date*', type: 'date', required: true },
      { key: 'oral_intake_ml', label: 'Oral Intake (mL)', type: 'number', required: false, defaultValue: '0' },
      { key: 'iv_intake_ml', label: 'IV Intake (mL)', type: 'number', required: false, defaultValue: '0' },
      { key: 'urine_output_ml', label: 'Urine Output (mL)', type: 'number', required: false, defaultValue: '0' },
      { key: 'drainage_output_ml', label: 'Drainage Output (mL)', type: 'number', required: false, defaultValue: '0' },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_10_c: {
    id: 'Form_1_1_1_z_10_c',
    name: '1.1.1.z.10 Vitals Deterioration Alerts',
    collectionName: 'vitals_deterioration_alerts',
    icon: AlertTriangle,
    subtitle: 'Form 1.1.1.z.10-C',
    description: 'Alerts and actions taken for clinical deterioration',
    fields: [
      { key: 'vitals_id', label: 'Vitals Record ID*', type: 'string', required: true },
      { key: 'alert_level', label: 'Alert Level*', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
      { key: 'action_taken', label: 'Action Taken', type: 'textarea', required: false },
      { key: 'acknowledged_by', label: 'Acknowledged By', type: 'string', required: false },
      { key: 'resolved_at', label: 'Resolved At', type: 'date-time', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_11_a: {
    id: 'Form_1_1_1_z_11_a',
    name: '1.1.1.z.11 Oxygen Prescription',
    collectionName: 'oxygen_prescriptions',
    icon: Wind,
    subtitle: 'Form 1.1.1.z.11-A',
    description: 'Oxygen therapy prescription and target parameters',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'prescribed_at', label: 'Prescribed At*', type: 'date-time', required: true },
      { key: 'device_type', label: 'Device Type*', type: 'select', required: true, options: ['Nasal Cannula', 'Venturi Mask', 'Non-Rebreather', 'CPAP', 'Other specific'] },
      { key: 'flow_rate_lpm', label: 'Flow Rate (LPM)', type: 'number', required: false },
      { key: 'target_spo2_min', label: 'Target SpO2 Min (%)', type: 'number', required: false },
      { key: 'target_spo2_max', label: 'Target SpO2 Max (%)', type: 'number', required: false },
      { key: 'titration_instructions', label: 'Titration Instructions', type: 'textarea', required: false },
      { key: 'clinical_rationale', label: 'Clinical Rationale', type: 'textarea', required: false },
      { key: 'prescribing_physician', label: 'Prescribing Physician', type: 'string', required: false },
      { key: 'is_active', label: 'Is Active?', type: 'checkbox', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_11_b: {
    id: 'Form_1_1_1_z_11_b',
    name: '1.1.1.z.11 Oxygen Titration Log',
    collectionName: 'oxygen_titration_logs',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.11-B',
    description: 'Log of oxygen titration and patient monitoring',
    fields: [
      { key: 'prescription_id', label: 'Prescription ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN', type: 'string', required: false },
      { key: 'recorded_at', label: 'Recorded At*', type: 'date-time', required: true },
      { key: 'current_flow_rate', label: 'Current Flow Rate (LPM)', type: 'number', required: false },
      { key: 'patient_spo2_reading', label: 'Patient SpO2 (%)', type: 'number', required: false },
      { key: 'respiratory_effort', label: 'Respiratory Effort', type: 'select', required: false, options: ['Normal', 'Mild Distress', 'Severe Distress'] },
      { key: 'mental_status', label: 'Mental Status', type: 'select', required: false, options: ['Alert', 'Confused', 'Lethargic'] },
      { key: 'action_taken', label: 'Action Taken', type: 'textarea', required: false },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_11_c: {
    id: 'Form_1_1_1_z_11_c',
    name: '1.1.1.z.11.a Hospital Service Catalog',
    collectionName: 'hospital_service_catalog',
    icon: BookOpen,
    subtitle: 'Form 1.1.1.z.11-C',
    description: 'Catalog of hospital services and standard pricing',
    fields: [
      { key: 'service_name', label: 'Service Name*', type: 'string', required: true },
      { key: 'category', label: 'Category', type: 'select', required: false, options: ['Pharmacy', 'Surgical', 'Bed Fee', 'O2', 'Other'] },
      { key: 'unit_price', label: 'Unit Price*', type: 'number', required: true },
      { key: 'billing_unit', label: 'Billing Unit', type: 'select', required: false, options: ['Hour', 'Day', 'Unit', 'Other'] }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_11_d: {
    id: 'Form_1_1_1_z_11_d',
    name: '1.1.1.z.11.a Oxygen Payment Request',
    collectionName: 'payment_requests',
    icon: CreditCard,
    subtitle: 'Form 1.1.1.z.11-D',
    description: 'Request for patient payment for clinical services',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'source_module', label: 'Source Module*', type: 'select', required: true, options: ['Oxygen Therapy', 'Surgery', 'Consultation', 'Other specific'] },
      { key: 'other_source_module', label: 'Other Source Module', type: 'string', required: false },
      { key: 'total_amount_used_liter', label: 'Total amount used Liter', type: 'number', required: false },
      { key: 'total_amount', label: 'Total Amount*', type: 'number', required: true },
      { key: 'payment_method', label: 'Payment Method*', type: 'select', required: true, options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'] },
      { key: 'other_payment_method', label: 'Other Payment Method', type: 'string', required: false },
      { key: 'requests_by', label: 'Requests By', type: 'string', required: false },
      { key: 'date_and_time', label: 'Date and Time*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_11_e: {
    id: 'Form_1_1_1_z_11_e',
    name: '1.1.1.z.11.a Oxygen Payment Verification',
    collectionName: 'payment_transactions',
    icon: Receipt,
    subtitle: 'Form 1.1.1.z.11-E',
    description: 'Recording of payment transactions',
    fields: [
      { key: 'request_id', label: 'Payment Request ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN', type: 'string', required: false },
      { key: 'amount_paid', label: 'Amount Paid*', type: 'number', required: true },
      { key: 'payment_method', label: 'Payment Method*', type: 'select', required: true, options: ['cash', 'insurance', 'prison', 'police', 'low income', 'exempted', 'other specific'] },
      { key: 'other_specific', label: 'Other specific', type: 'string', required: false },
      { key: 'approved_by', label: 'Approved by', type: 'string', required: false },
      { key: 'paid_at', label: 'Paid At*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_12_a: {
    id: 'Form_1_1_1_z_12_a',
    name: '1.1.1.z.12 Dental Encounter',
    collectionName: 'dental_encounters',
    icon: Smile,
    subtitle: 'Form 1.1.1.z.12-A',
    description: 'Dental encounter clinical record, chief complaint, and periodontal assessment',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'visit_date', label: 'Visit Date/Time*', type: 'date-time', required: true },
      { key: 'chief_complaint', label: 'Chief Complaint', type: 'textarea', required: false },
      { key: 'periodontal_status', label: 'Periodontal Status', type: 'select', required: false, options: ['Healthy', 'Gingivitis', 'Periodontitis', 'Other'] },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_12_b: {
    id: 'Form_1_1_1_z_12_b',
    name: '1.1.1.z.12 Dental Tooth Charting',
    collectionName: 'dental_tooth_charting',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.12-B',
    description: 'Detailed tooth-level charting, surfaces, and conditions',
    fields: [
      { key: 'encounter_id', label: 'Dental Encounter ID*', type: 'string', required: true },
      { key: 'tooth_number', label: 'Tooth Number (1-32)*', type: 'number', required: true },
      { key: 'surface', label: 'Surface (e.g. O, M, D, B, L)*', type: 'string', required: true },
      { key: 'condition_code', label: 'Condition Code*', type: 'select', required: true, options: ['Decayed', 'Missing', 'Filled', 'Crown', 'Healthy', 'Bridge'] },
      { key: 'clinical_notes', label: 'Clinical Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_12_c: {
    id: 'Form_1_1_1_z_12_c',
    name: '1.1.1.z.12 Dental Procedures',
    collectionName: 'dental_procedures',
    icon: Scissors,
    subtitle: 'Form 1.1.1.z.12-C',
    description: 'Dental procedures, materials, and cost details',
    fields: [
      { key: 'encounter_id', label: 'Dental Encounter ID*', type: 'string', required: true },
      { key: 'procedure_name', label: 'Procedure Name*', type: 'string', required: true },
      { key: 'tooth_number', label: 'Tooth Number', type: 'number', required: false },
      { key: 'material_used', label: 'Material Used', type: 'string', required: false },
      { key: 'duration_minutes', label: 'Duration (Minutes)', type: 'number', required: false },
      { key: 'cost_amount', label: 'Cost Amount', type: 'number', required: false },
      { key: 'performed_by', label: 'Performed By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_12_d: {
    id: 'Form_1_1_1_z_12_d',
    name: '1.1.1.z.12 Dental Treatment Plans',
    collectionName: 'dental_treatment_plans',
    icon: ClipboardList,
    subtitle: 'Form 1.1.1.z.12-D',
    description: 'Longitudinal treatment planning, priorities, and status',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'plan_description', label: 'Plan Description', type: 'textarea', required: false },
      { key: 'priority', label: 'Priority*', type: 'select', required: true, options: ['Urgent', 'Routine', 'Elective'] },
      { key: 'status', label: 'Status*', type: 'select', required: true, options: ['Planned', 'In-Progress', 'Completed'] },
      { key: 'planned_start_date', label: 'Planned Start Date', type: 'date', required: false },
      { key: 'estimated_completion_date', label: 'Estimated Completion Date', type: 'date', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_13_a: {
    id: 'Form_1_1_1_z_13_a',
    name: '1.1.1.z.13 Ophthalmology Encounter',
    collectionName: 'ophthal_encounters',
    icon: Eye,
    subtitle: 'Form 1.1.1.z.13-A',
    description: 'Ophthalmology encounter clinical record and visual assessment findings',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'visit_date', label: 'Visit Date/Time*', type: 'date-time', required: true },
      { key: 'chief_complaint', label: 'Chief Complaint', type: 'textarea', required: false },
      { key: 'anterior_segment_findings', label: 'Anterior Segment Findings (Cornea/Iris)', type: 'textarea', required: false },
      { key: 'posterior_segment_findings', label: 'Posterior Segment Findings (Retina/Optic Nerve)', type: 'textarea', required: false },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_13_b: {
    id: 'Form_1_1_1_z_13_b',
    name: '1.1.1.z.13 Ophthalmology Vitals',
    collectionName: 'ophthal_vitals',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.13-B',
    description: 'Ophthalmic specific vitals including Visual Acuity, IOP, and Pinhole Test',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID*', type: 'string', required: true },
      { key: 'od_acuity', label: 'Visual Acuity OD (Right Eye)', type: 'string', required: false },
      { key: 'os_acuity', label: 'Visual Acuity OS (Left Eye)', type: 'string', required: false },
      { key: 'iop_od', label: 'Intraocular Pressure OD (mmHg)', type: 'number', required: false },
      { key: 'iop_os', label: 'Intraocular Pressure OS (mmHg)', type: 'number', required: false },
      { key: 'ph_od', label: 'Pinhole Test OD (Right)', type: 'string', required: false },
      { key: 'ph_os', label: 'Pinhole Test OS (Left)', type: 'string', required: false },
      { key: 'clinical_notes', label: 'Clinical Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_13_c: {
    id: 'Form_1_1_1_z_13_c',
    name: '1.1.1.z.13 Ophthalmology Prescription',
    collectionName: 'ophthal_prescriptions',
    icon: FileText,
    subtitle: 'Form 1.1.1.z.13-C',
    description: 'Detailed eyeglass or contact lens prescription values',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID*', type: 'string', required: true },
      { key: 'od_sphere', label: 'OD Sphere (SPH)', type: 'number', required: false },
      { key: 'od_cylinder', label: 'OD Cylinder (CYL)', type: 'number', required: false },
      { key: 'od_axis', label: 'OD Axis', type: 'number', required: false },
      { key: 'od_add', label: 'OD Add', type: 'number', required: false },
      { key: 'os_sphere', label: 'OS Sphere (SPH)', type: 'number', required: false },
      { key: 'os_cylinder', label: 'OS Cylinder (CYL)', type: 'number', required: false },
      { key: 'os_axis', label: 'OS Axis', type: 'number', required: false },
      { key: 'os_add', label: 'OS Add', type: 'number', required: false },
      { key: 'pupillary_distance', label: 'Pupillary Distance (mm)', type: 'number', required: false },
      { key: 'prescription_notes', label: 'Prescription Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_13_d: {
    id: 'Form_1_1_1_z_13_d',
    name: '1.1.1.z.13 Ophthalmology Procedures',
    collectionName: 'ophthal_procedures',
    icon: Scissors,
    subtitle: 'Form 1.1.1.z.13-D',
    description: 'Ophthalmic surgical or clinical procedures',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID*', type: 'string', required: true },
      { key: 'procedure_name', label: 'Procedure Name*', type: 'string', required: true },
      { key: 'eye_involved', label: 'Eye Involved', type: 'select', required: false, options: ['OD', 'OS', 'OU'] },
      { key: 'anesthesia_type', label: 'Anesthesia Type', type: 'string', required: false },
      { key: 'surgical_findings', label: 'Surgical Findings', type: 'textarea', required: false },
      { key: 'implant_details', label: 'Implant Details (e.g. IOL Power)', type: 'textarea', required: false },
      { key: 'performed_by', label: 'Performed By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_14_a: {
    id: 'Form_1_1_1_z_14_a',
    name: '1.1.1.z.14 Physiatry Encounter',
    collectionName: 'physiatry_encounters',
    icon: Accessibility,
    subtitle: 'Form 1.1.1.z.14-A',
    description: 'Physical Medicine and Rehabilitation clinical encounter baseline',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'visit_date', label: 'Visit Date/Time*', type: 'date-time', required: true },
      { key: 'primary_impairment', label: 'Primary Impairment', type: 'textarea', required: false },
      { key: 'functional_goals', label: 'Functional Goals (SMART)', type: 'textarea', required: false },
      { key: 'pain_level_current', label: 'Pain Level (0-10)', type: 'number', required: false },
      { key: 'cognitive_status', label: 'Cognitive Status', type: 'select', required: false, options: ['Oriented', 'Confused'] },
      { key: 'mood_status', label: 'Mood/Psychosocial Status', type: 'string', required: false },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_14_b: {
    id: 'Form_1_1_1_z_14_b',
    name: '1.1.1.z.14 Functional Assessment',
    collectionName: 'functional_assessments',
    icon: ClipboardList,
    subtitle: 'Form 1.1.1.z.14-B',
    description: 'Mobility and activities of daily living functional scales',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID*', type: 'string', required: true },
      { key: 'assessment_date', label: 'Assessment Date*', type: 'date', required: true },
      { key: 'assessment_type', label: 'Assessment Type (e.g. FIM, Barthel)', type: 'string', required: false },
      { key: 'total_score', label: 'Total Score', type: 'number', required: false },
      { key: 'max_possible_score', label: 'Max Possible Score', type: 'number', required: false },
      { key: 'ambulation_status', label: 'Ambulation Status', type: 'select', required: false, options: ['Independent', 'Supervised', 'Dependent', 'Wheelchair', 'Other'] },
      { key: 'clinical_notes', label: 'Clinical Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_14_c: {
    id: 'Form_1_1_1_z_14_c',
    name: '1.1.1.z.14 Rehab Therapy Log',
    collectionName: 'rehab_therapy_logs',
    icon: Award,
    subtitle: 'Form 1.1.1.z.14-C',
    description: 'Active Physical, Occupational, and Speech Therapy session outcomes',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID*', type: 'string', required: true },
      { key: 'session_date', label: 'Session Date/Time*', type: 'date-time', required: true },
      { key: 'therapy_type', label: 'Therapy Type', type: 'select', required: false, options: ['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Other'] },
      { key: 'focus_area', label: 'Focus Area (e.g. Gait, Fine Motor)', type: 'string', required: false },
      { key: 'session_outcome', label: 'Session Outcome', type: 'select', required: false, options: ['Improved', 'Stagnant', 'Regression'] },
      { key: 'therapist_name', label: 'Therapist Name', type: 'string', required: false },
      { key: 'clinical_notes', label: 'Clinical Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_14_d: {
    id: 'Form_1_1_1_z_14_d',
    name: '1.1.1.z.14 Assistive Devices',
    collectionName: 'assistive_devices',
    icon: Accessibility,
    subtitle: 'Form 1.1.1.z.14-D',
    description: 'Orthotics, prosthetics, and mobility assistive devices registry',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'device_name', label: 'Device Name*', type: 'string', required: true },
      { key: 'date_issued', label: 'Date Issued', type: 'date', required: false },
      { key: 'fitting_status', label: 'Fitting Status', type: 'select', required: false, options: ['Measured', 'Fitted', 'Follow-up', 'Other'] },
      { key: 'cost_to_patient', label: 'Cost to Patient', type: 'number', required: false },
      { key: 'is_returned', label: 'Is Returned?', type: 'checkbox', required: true },
      { key: 'notes', label: 'Clinical/Fitting Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_15_a: {
    id: 'Form_1_1_1_z_15_a',
    name: '1.1.1.z.15 ART Enrollment',
    collectionName: 'art_enrollment',
    icon: Heart,
    subtitle: 'Form 1.1.1.z.15-A',
    description: 'HIV baseline confirmation and Clinical ART Enrollment details',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'enrollment_date', label: 'Enrollment Date*', type: 'date', required: true },
      { key: 'hiv_confirmation_date', label: 'HIV Confirmation Date', type: 'date', required: false },
      { key: 'who_stage', label: 'WHO Clinical Stage (1-4)', type: 'number', required: false },
      { key: 'baseline_cd4_count', label: 'Baseline CD4 Count', type: 'number', required: false },
      { key: 'functional_status', label: 'Functional Status', type: 'select', required: false, options: ['Working', 'Ambulatory', 'Bedridden', 'Other'] },
      { key: 'enrollment_type', label: 'Enrollment Type', type: 'select', required: false, options: ['New', 'Transfer-in', 'Other'] },
      { key: 'is_active', label: 'Active in Care?', type: 'checkbox', required: true },
      { key: 'notes', label: 'Enrollment Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_15_b: {
    id: 'Form_1_1_1_z_15_b',
    name: '1.1.1.z.15 ART Regimen Logs',
    collectionName: 'art_regimen_logs',
    icon: Pill,
    subtitle: 'Form 1.1.1.z.15-B',
    description: 'Antiretroviral treatment regimens and treatment lines history',
    fields: [
      { key: 'enrollment_id', label: 'ART Enrollment ID*', type: 'string', required: true },
      { key: 'regimen_name', label: 'Regimen Name (e.g. TDF+3TC+DTG)*', type: 'string', required: true },
      { key: 'line_of_treatment', label: 'Line of Treatment (1, 2, or 3)', type: 'number', required: false },
      { key: 'start_date', label: 'Start Date*', type: 'date', required: true },
      { key: 'end_date', label: 'End Date', type: 'date', required: false },
      { key: 'reason_for_switch', label: 'Reason for Regimen Switch', type: 'textarea', required: false },
      { key: 'prescribed_by', label: 'Prescribed By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_15_c: {
    id: 'Form_1_1_1_z_15_c',
    name: '1.1.1.z.15 ART Lab Monitoring',
    collectionName: 'art_lab_monitoring',
    icon: FlaskConical,
    subtitle: 'Form 1.1.1.z.15-C',
    description: 'Immunological (CD4) and Virological (Viral Load) tracking tests',
    fields: [
      { key: 'enrollment_id', label: 'ART Enrollment ID*', type: 'string', required: true },
      { key: 'test_date', label: 'Test Date*', type: 'date', required: true },
      { key: 'test_type', label: 'Test Type*', type: 'select', required: true, options: ['Viral Load', 'CD4 Count', 'Other'] },
      { key: 'result_value', label: 'Result Value*', type: 'string', required: true },
      { key: 'is_suppressed', label: 'Is Virologically Suppressed?', type: 'checkbox', required: false },
      { key: 'next_test_due_date', label: 'Next Test Due Date', type: 'date', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_15_d: {
    id: 'Form_1_1_1_z_15_d',
    name: '1.1.1.z.15 ART Follow-up Visits',
    collectionName: 'art_followup_visits',
    icon: Calendar,
    subtitle: 'Form 1.1.1.z.15-D',
    description: 'Longitudinal clinical assessment, adherence scoring, and drug refills',
    fields: [
      { key: 'enrollment_id', label: 'ART Enrollment ID*', type: 'string', required: true },
      { key: 'appointment_date', label: 'Appointment Date', type: 'date', required: false },
      { key: 'attendance_status', label: 'Attendance Status', type: 'select', required: false, options: ['Attended', 'Missed', 'Rescheduled', 'Other'] },
      { key: 'adherence_level', label: 'Adherence Level', type: 'select', required: false, options: ['Good', 'Fair', 'Poor', 'Other'] },
      { key: 'medication_refill_days', label: 'Medication Refill Days (Count)', type: 'number', required: false },
      { key: 'provider_name', label: 'Provider Name', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_16_a: {
    id: 'Form_1_1_1_z_16_a',
    name: '1.1.1.z.16 TB Case Enrollment',
    collectionName: 'tb_case_enrollments',
    icon: Wind,
    subtitle: 'Form 1.1.1.z.16-A',
    description: 'Tuberculosis standard WHO clinical case classifications and enrollment baseline',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'enrollment_date', label: 'Enrollment Date*', type: 'date', required: true },
      { key: 'case_type', label: 'Case Type', type: 'select', required: false, options: ['New', 'Relapse', 'After Default', 'Transfer-in', 'Other'] },
      { key: 'disease_site', label: 'Disease Site', type: 'select', required: false, options: ['Pulmonary', 'Extra-Pulmonary', 'Other'] },
      { key: 'weight_kg', label: 'Baseline Weight (kg)', type: 'number', required: false },
      { key: 'hiv_status', label: 'HIV Status', type: 'select', required: false, options: ['Positive', 'Negative', 'Unknown'] },
      { key: 'current_status', label: 'Current Status', type: 'select', required: false, options: ['On Treatment', 'Cured', 'Completed', 'Died', 'Lost', 'Other'] },
      { key: 'is_active', label: 'Active in Care?', type: 'checkbox', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_16_b: {
    id: 'Form_1_1_1_z_16_b',
    name: '1.1.1.z.16 TB Diagnostics',
    collectionName: 'tb_diagnostics',
    icon: FlaskConical,
    subtitle: 'Form 1.1.1.z.16-B',
    description: 'TB clinical diagnostics including GeneXpert, Chest X-Rays, and microscopy',
    fields: [
      { key: 'case_id', label: 'TB Case Enrollment ID*', type: 'string', required: true },
      { key: 'sample_date', label: 'Sample Date*', type: 'date', required: true },
      { key: 'test_type', label: 'Test Type*', type: 'select', required: true, options: ['Smear Microscopy', 'GeneXpert (MTB/RIF)', 'Chest X-Ray', 'Other'] },
      { key: 'result_status', label: 'Result Status*', type: 'select', required: true, options: ['Negative', 'Positive', 'Rif-Resistant', 'Indeterminate', 'Other'] },
      { key: 'lab_notes', label: 'Laboratory/Clinical Notes', type: 'textarea', required: false },
      { key: 'verified_by', label: 'Verified/Approved By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_16_c: {
    id: 'Form_1_1_1_z_16_c',
    name: '1.1.1.z.16 TB Treatment Logs',
    collectionName: 'tb_treatment_logs',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.16-C',
    description: 'Treatment phases tracking, DOTS adherence monitoring, and vital adjustments',
    fields: [
      { key: 'case_id', label: 'TB Case Enrollment ID*', type: 'string', required: true },
      { key: 'visit_date', label: 'Visit Date*', type: 'date', required: true },
      { key: 'current_phase', label: 'Current Phase', type: 'select', required: false, options: ['Intensive', 'Continuation', 'Other'] },
      { key: 'weight_kg', label: 'Current Weight (kg)*', type: 'number', required: true },
      { key: 'adherence_type', label: 'Adherence/DOTS Type', type: 'select', required: false, options: ['DOTS (Observed)', 'Self-Administered', 'Other'] },
      { key: 'side_effects', label: 'Side Effects Observed', type: 'textarea', required: false },
      { key: 'next_appointment_date', label: 'Next Appointment Date', type: 'date', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_16_d: {
    id: 'Form_1_1_1_z_16_d',
    name: '1.1.1.z.16 TB Treatment Outcomes',
    collectionName: 'tb_treatment_outcomes',
    icon: ShieldCheck,
    subtitle: 'Form 1.1.1.z.16-D',
    description: 'Tuberculosis clinical treatment outcomes declaration',
    fields: [
      { key: 'case_id', label: 'TB Case Enrollment ID*', type: 'string', required: true },
      { key: 'outcome_date', label: 'Outcome Date*', type: 'date', required: true },
      { key: 'outcome_category', label: 'Outcome Category*', type: 'select', required: true, options: ['Cured', 'Treatment Completed', 'Treatment Failure', 'Died', 'Lost to Follow-up', 'Other'] },
      { key: 'final_remarks', label: 'Final Medical Remarks', type: 'textarea', required: false },
      { key: 'recorded_by', label: 'Recorded By', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_17_a: {
    id: 'Form_1_1_1_z_17_a',
    name: '1.1.1.z.17 Chronic Disease Registry',
    collectionName: 'chronic_disease_registry',
    icon: BookOpen,
    subtitle: 'Form 1.1.1.z.17-A',
    description: 'Registry of OPD patients with active chronic clinical conditions',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'condition_type', label: 'Condition Type*', type: 'string', required: true },
      { key: 'diagnosis_date', label: 'Diagnosis Date', type: 'date', required: false },
      { key: 'baseline_severity', label: 'Baseline Severity', type: 'select', required: false, options: ['Mild', 'Moderate', 'Severe', 'Other'] },
      { key: 'current_status', label: 'Current Status', type: 'select', required: true, options: ['Active', 'Remission', 'Transferred', 'Other'] },
      { key: 'primary_care_provider', label: 'Primary Care Provider', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_17_b: {
    id: 'Form_1_1_1_z_17_b',
    name: '1.1.1.z.17 Chronic OPD Encounters',
    collectionName: 'chronic_opd_encounters',
    icon: Stethoscope,
    subtitle: 'Form 1.1.1.z.17-B',
    description: 'OPD active clinical assessment and focused vitals checking',
    fields: [
      { key: 'registry_id', label: 'Registry ID*', type: 'string', required: true },
      { key: 'visit_date', label: 'Visit Date/Time*', type: 'date-time', required: true },
      { key: 'systolic_bp', label: 'Systolic Blood Pressure (mmHg)', type: 'number', required: false },
      { key: 'diastolic_bp', label: 'Diastolic Blood Pressure (mmHg)', type: 'number', required: false },
      { key: 'random_blood_sugar', label: 'Random Blood Sugar (mg/dL)', type: 'number', required: false },
      { key: 'weight_kg', label: 'Current Weight (kg)', type: 'number', required: false },
      { key: 'clinical_notes', label: 'Clinical Assessment Notes', type: 'textarea', required: false },
      { key: 'is_stable', label: 'Is Clinically Stable?', type: 'checkbox', required: true },
      { key: 'next_follow_up_date', label: 'Next Follow-Up Date', type: 'date', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_17_c: {
    id: 'Form_1_1_1_z_17_c',
    name: '1.1.1.z.17 Chronic Lab Monitoring',
    collectionName: 'chronic_lab_monitoring',
    icon: FlaskConical,
    subtitle: 'Form 1.1.1.z.17-C',
    description: 'Chronic disease lab results, reference range comparison, and target check',
    fields: [
      { key: 'encounter_id', label: 'Encounter ID*', type: 'string', required: true },
      { key: 'test_type', label: 'Test Type*', type: 'select', required: true, options: ['HbA1c', 'Lipid Profile', 'Creatinine', 'Other'] },
      { key: 'result_value', label: 'Result Value*', type: 'number', required: true },
      { key: 'reference_range', label: 'Reference Range', type: 'string', required: false },
      { key: 'is_at_target', label: 'Is result within target?', type: 'checkbox', required: false },
      { key: 'recorded_at', label: 'Recorded Date/Time*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_17_d: {
    id: 'Form_1_1_1_z_17_d',
    name: '1.1.1.z.17 Chronic Medication Refills',
    collectionName: 'chronic_medication_refills',
    icon: Pill,
    subtitle: 'Form 1.1.1.z.17-D',
    description: 'Medication refills tracking and adherence check-in scoring',
    fields: [
      { key: 'registry_id', label: 'Registry ID*', type: 'string', required: true },
      { key: 'medication_name', label: 'Medication Name*', type: 'string', required: true },
      { key: 'dosage', label: 'Dosage', type: 'string', required: false },
      { key: 'quantity_dispensed', label: 'Quantity Dispensed*', type: 'number', required: true },
      { key: 'adherence_score', label: 'Adherence Score (1-10)*', type: 'number', required: true },
      { key: 'side_effects_reported', label: 'Side Effects Reported', type: 'textarea', required: false },
      { key: 'refill_date', label: 'Refill Date*', type: 'date', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_18_a: {
    id: 'Form_1_1_1_z_18_a',
    name: '1.1.1.z.18 Cervical Cancer Screening',
    collectionName: 'cervical_cancer_screenings',
    icon: Eye,
    subtitle: 'Form 1.1.1.z.18-A',
    description: 'Cervical cancer prevention, screening methods, and visual findings',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'screening_date', label: 'Screening Date*', type: 'date', required: true },
      { key: 'screening_method', label: 'Screening Method', type: 'select', required: false, options: ['VIA', 'VILI', 'Pap Smear', 'HPV DNA', 'Other'] },
      { key: 'visual_result', label: 'Visual Result (VIA/VILI)', type: 'select', required: false, options: ['Normal', 'Acetowhite Lesion', 'Suspicious for Cancer', 'Other'] },
      { key: 'disposition', label: 'Clinical Disposition', type: 'select', required: false, options: ['Screen Negative', 'Eligible for Treatment', 'Referral Required', 'Other'] },
      { key: 'provider_name', label: 'Provider Name', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_18_b: {
    id: 'Form_1_1_1_z_18_b',
    name: '1.1.1.z.18 Cervical Cancer Pathology',
    collectionName: 'cervical_cancer_pathology',
    icon: FlaskConical,
    subtitle: 'Form 1.1.1.z.18-B',
    description: 'Cervical cytology (Bethesda system) and biopsy histopathology laboratory reports',
    fields: [
      { key: 'screening_id', label: 'Screening Record ID*', type: 'string', required: true },
      { key: 'sample_collection_date', label: 'Sample Collection Date', type: 'date', required: false },
      { key: 'lab_report_date', label: 'Lab Report Date', type: 'date', required: false },
      { key: 'cytology_result', label: 'Cytology Result (Bethesda)', type: 'select', required: false, options: ['Normal', 'ASC-US', 'LSIL', 'HSIL', 'SCC', 'Other'] },
      { key: 'biopsy_result', label: 'Biopsy Result (Histopathology Details)', type: 'textarea', required: false },
      { key: 'lab_reference_number', label: 'Lab Reference Number', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_18_c: {
    id: 'Form_1_1_1_z_18_c',
    name: '1.1.1.z.18 Cervical Cancer Treatment',
    collectionName: 'cervical_cancer_treatments',
    icon: Scissors,
    subtitle: 'Form 1.1.1.z.18-C',
    description: 'Precancerous lesions ablation or excision surgical treatments',
    fields: [
      { key: 'screening_id', label: 'Screening Record ID*', type: 'string', required: true },
      { key: 'procedure_name', label: 'Procedure/Treatment Name*', type: 'select', required: true, options: ['Thermal Ablation', 'Cryotherapy', 'LEEP', 'Cold Knife Conization', 'Other'] },
      { key: 'procedure_date', label: 'Procedure Date', type: 'date', required: false },
      { key: 'complications_noted', label: 'Complications Noted', type: 'textarea', required: false },
      { key: 'post_op_instructions', label: 'Post-Op Instructions', type: 'textarea', required: false },
      { key: 'performed_by', label: 'Performed By (Clinician/Surgeon)', type: 'string', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_18_d: {
    id: 'Form_1_1_1_z_18_d',
    name: '1.1.1.z.18 Cervical Cancer Surveillance',
    collectionName: 'cervical_cancer_surveillance',
    icon: ShieldCheck,
    subtitle: 'Form 1.1.1.z.18-D',
    description: 'Longitudinal follow-up registry, next screening surveillance tracking',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'last_screening_result', label: 'Last Screening Result', type: 'string', required: false },
      { key: 'next_due_date', label: 'Next Screening Due Date', type: 'date', required: false },
      { key: 'surveillance_status', label: 'Surveillance Status*', type: 'select', required: true, options: ['Active', 'Discharged', 'Lost to Follow-up', 'Other'] },
      { key: 'notes', label: 'Clinical Follow-up Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_a: {
    id: 'Form_1_1_1_z_19_a',
    name: '1.1.1.z.19 Surgical Consent Forms',
    collectionName: 'surgical_consent_forms',
    icon: FileText,
    subtitle: 'Form 1.1.1.z.19-A',
    description: 'Surgical Consent Forms to document and track patient consent for surgical procedures',
    fields: [
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'surgery_booking_id', label: 'Surgery Booking ID (Link to OR)', type: 'string', required: false },
      { key: 'procedure_name', label: 'Procedure Name*', type: 'string', required: true },
      { key: 'risks_discussed', label: 'Risks Discussed', type: 'textarea', placeholder: 'e.g., Bleeding, Infection, Anesthesia complications', required: false },
      { key: 'alternatives_discussed', label: 'Alternatives Discussed', type: 'textarea', placeholder: 'e.g., Conservative management', required: false },
      { key: 'status', label: 'Status*', type: 'select', required: true, options: ['Draft', 'Signed', 'Withdrawn', 'Expired'], defaultValue: 'Draft' }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_b: {
    id: 'Form_1_1_1_z_19_b',
    name: '1.1.1.z.19 Surgical Consent Signatures',
    collectionName: 'surgical_consent_signatures',
    icon: ShieldCheck,
    subtitle: 'Form 1.1.1.z.19-B',
    description: 'Verification of digital signatures and signatory details for surgical consent',
    fields: [
      { key: 'consent_id', label: 'Consent Form ID*', type: 'string', required: true },
      { key: 'signatory_name', label: 'Signatory Name*', type: 'string', required: true },
      { key: 'signatory_role', label: 'Signatory Role*', type: 'select', required: true, options: ['Patient', 'Guardian', 'Surgeon', 'Witness'] },
      { key: 'signature_hash', label: 'Signature Hash*', type: 'string', required: true },
      { key: 'ip_address', label: 'IP Address', type: 'string', required: false },
      { key: 'signed_at', label: 'Signed At*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_c: {
    id: 'Form_1_1_1_z_19_c',
    name: '1.1.1.z.19.a Surgical Safety Checklist',
    collectionName: 'surgical_safety_checklist',
    icon: ClipboardList,
    subtitle: 'Form 1.1.1.z.19.a-C',
    description: 'Surgical Safety Checklist to confirm teams, timings, and overall completeness of checklists',
    fields: [
      { key: 'consent_id', label: 'Consent Form ID*', type: 'string', required: true },
      { key: 'surgery_start_time', label: 'Surgery Start Time', type: 'date-time', required: false },
      { key: 'surgery_end_time', label: 'Surgery End Time', type: 'date-time', required: false },
      { key: 'lead_surgeon', label: 'Lead Surgeon', type: 'string', required: false },
      { key: 'anesthesiologist', label: 'Anesthesiologist', type: 'string', required: false },
      { key: 'is_completed', label: 'Is Completed', type: 'checkbox', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_d: {
    id: 'Form_1_1_1_z_19_d',
    name: '1.1.1.z.19.a Checklist Phase Sign-In',
    collectionName: 'checklist_phase_signin',
    icon: Clock,
    subtitle: 'Form 1.1.1.z.19.a-D',
    description: 'Phase Sign-In: Confirms patient identity, surgical site marking, consent, and anesthesia safety checks before induction',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'patient_identity_confirmed', label: 'Patient Identity Confirmed', type: 'checkbox', required: false },
      { key: 'site_marked', label: 'Site Marked', type: 'checkbox', required: false },
      { key: 'consent_obtained', label: 'Consent Obtained', type: 'checkbox', required: false },
      { key: 'anesthesia_safety_check', label: 'Anesthesia Safety Check', type: 'checkbox', required: false },
      { key: 'pulse_oximeter_functioning', label: 'Pulse Oximeter Functioning', type: 'checkbox', required: false },
      { key: 'verified_by', label: 'Verified By (Anesthesiologist/Nurse)*', type: 'string', required: true },
      { key: 'verified_at', label: 'Verified At*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_e: {
    id: 'Form_1_1_1_z_19_e',
    name: '1.1.1.z.19.a Checklist Phase Time-Out',
    collectionName: 'checklist_phase_timeout',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.19.a-E',
    description: 'Phase Time-Out: Confirms team introduction, procedure, site, antibiotic prophylaxis, and essential imaging before incision',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'team_members_introduced', label: 'Team Members Introduced', type: 'checkbox', required: false },
      { key: 'patient_site_procedure_confirmed', label: 'Patient, Site, & Procedure Confirmed', type: 'checkbox', required: false },
      { key: 'antibiotic_prophylaxis_given', label: 'Antibiotic Prophylaxis Given', type: 'checkbox', required: false },
      { key: 'essential_imaging_displayed', label: 'Essential Imaging Displayed', type: 'checkbox', required: false },
      { key: 'verified_by', label: 'Verified By (Surgeon/Lead Nurse)*', type: 'string', required: true },
      { key: 'verified_at', label: 'Verified At*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_f: {
    id: 'Form_1_1_1_z_19_f',
    name: '1.1.1.z.19.a Checklist Phase Sign-Out',
    collectionName: 'checklist_phase_signout',
    icon: ShieldCheck,
    subtitle: 'Form 1.1.1.z.19.a-F',
    description: 'Phase Sign-Out: Confirms procedure name, instrument counts, specimen labeling, and equipment checks before leaving OR',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'procedure_name_confirmed', label: 'Procedure Name Confirmed', type: 'checkbox', required: false },
      { key: 'instrument_count_correct', label: 'Instrument Count Correct (Sponges/Needles/Instruments)', type: 'checkbox', required: false },
      { key: 'specimens_labeled', label: 'Specimens Labeled', type: 'checkbox', required: false },
      { key: 'equipment_problems_addressed', label: 'Equipment Problems Addressed', type: 'checkbox', required: false },
      { key: 'verified_by', label: 'Verified By*', type: 'string', required: true },
      { key: 'verified_at', label: 'Verified At*', type: 'date-time', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_g: {
    id: 'Form_1_1_1_z_19_g',
    name: '1.1.1.z.19.b Post-Op PACU Log',
    collectionName: 'post_op_pacu_log',
    icon: Activity,
    subtitle: 'Form 1.1.1.z.19.b-G',
    description: 'Post-operative PACU log tracking immediate stability and hemodynamic status in recovery',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'recorded_at', label: 'Recorded At*', type: 'date-time', required: true },
      { key: 'consciousness_score', label: 'Consciousness Score (GCS)*', type: 'number', required: true },
      { key: 'pain_level', label: 'Pain Level (0-10)*', type: 'number', required: true },
      { key: 'nausea_vomiting_status', label: 'Nausea/Vomiting Status', type: 'select', required: false, options: ['None', 'Mild', 'Severe'] },
      { key: 'iv_site_status', label: 'IV Site Status', type: 'select', required: false, options: ['Patency', 'Leaking', 'Inflamed'] },
      { key: 'surgical_site_drainage', label: 'Surgical Site Drainage', type: 'select', required: false, options: ['None', 'Minimal', 'Saturated'] },
      { key: 'nurse_assessment', label: 'Nurse Assessment Notes', type: 'textarea', required: false }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_h: {
    id: 'Form_1_1_1_z_19_h',
    name: '1.1.1.z.19.b Post-Op Orders',
    collectionName: 'post_op_orders',
    icon: Pill,
    subtitle: 'Form 1.1.1.z.19.b-H',
    description: 'Post-operative clinical care instructions, activity, diet, and monitoring schedules',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'order_date', label: 'Order Date*', type: 'date', required: true },
      { key: 'activity_level', label: 'Activity Level', type: 'select', required: false, options: ['Bed Rest', 'Dangle', 'Ambulatory'] },
      { key: 'diet_order', label: 'Diet Order', type: 'select', required: false, options: ['NPO', 'Clear Liquids', 'Soft Diet', 'Regular'] },
      { key: 'dvt_prophylaxis', label: 'DVT Prophylaxis Required', type: 'checkbox', required: false },
      { key: 'vitals_frequency', label: 'Vitals Frequency', type: 'select', required: false, options: ['Q4H', 'Q8H', 'Continuous', 'Other'] },
      { key: 'dressing_change_frequency', label: 'Dressing Change Frequency', type: 'string', required: false },
      { key: 'ordered_by', label: 'Ordered By*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_i: {
    id: 'Form_1_1_1_z_19_i',
    name: '1.1.1.z.19.b Post-Op Wound Care (REEDA)',
    collectionName: 'post_op_wound_care',
    icon: Heart,
    subtitle: 'Form 1.1.1.z.19.b-I',
    description: 'Post-operative wound evaluation using the REEDA Scale (Redness, Edema, Ecchymosis, Discharge, Approximation)',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'assessment_date', label: 'Assessment Date*', type: 'date-time', required: true },
      { key: 'redness', label: 'Redness Present', type: 'checkbox', required: false },
      { key: 'edema', label: 'Edema Present', type: 'checkbox', required: false },
      { key: 'discharge_present', label: 'Discharge Present', type: 'checkbox', required: false },
      { key: 'approximation_intact', label: 'Approximation Intact', type: 'checkbox', required: false },
      { key: 'dressing_type', label: 'Dressing Type', type: 'string', required: false },
      { key: 'culture_swab_taken', label: 'Culture Swab Taken', type: 'checkbox', required: false },
      { key: 'recorded_by', label: 'Recorded By*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_j: {
    id: 'Form_1_1_1_z_19_j',
    name: '1.1.1.z.19.b Post-Op Complications',
    collectionName: 'post_op_complications',
    icon: AlertTriangle,
    subtitle: 'Form 1.1.1.z.19.b-J',
    description: 'Logging and tracking of surgical or respiratory complications and interventions',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'event_date', label: 'Event Date*', type: 'date-time', required: true },
      { key: 'complication_type', label: 'Complication Type*', type: 'select', required: true, options: ['Hemorrhage', 'SSI', 'DVT', 'Respiratory', 'Anesthesia', 'Other'] },
      { key: 'severity_level', label: 'Severity Level*', type: 'select', required: true, options: ['Minor', 'Moderate', 'Severe/Life-Threatening'] },
      { key: 'intervention_taken', label: 'Intervention Taken', type: 'textarea', required: false },
      { key: 'outcome', label: 'Outcome*', type: 'select', required: true, options: ['Resolved', 'Improved', 'Transferred to ICU', 'Unchanged'] }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_19_k: {
    id: 'Form_1_1_1_z_19_k',
    name: '1.1.1.z.19.b Discharge Summaries',
    collectionName: 'discharge_summaries',
    icon: FileText,
    subtitle: 'Form 1.1.1.z.19.b-K',
    description: 'Comprehensive surgical discharge notes, medication reconciliation, and follow-up warnings',
    fields: [
      { key: 'checklist_id', label: 'Checklist ID*', type: 'string', required: true },
      { key: 'discharge_date', label: 'Discharge Date*', type: 'date', required: true },
      { key: 'summary_notes', label: 'Summary Notes', type: 'textarea', required: false },
      { key: 'medication_reconciliation', label: 'Medication Reconciliation', type: 'textarea', required: false },
      { key: 'follow_up_instructions', label: 'Follow-Up Instructions', type: 'textarea', required: false },
      { key: 'return_to_hospital_signs', label: 'Return to Hospital Signs/Warnings', type: 'textarea', placeholder: 'e.g., Fever > 38C, Heavy bleeding', required: false },
      { key: 'discharged_by', label: 'Discharged By*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_a_b: {
    id: 'Form_1_1_1_z_a_b',
    name: '1.1.1.z.a.b INVENTORY',
    collectionName: 'form_1_1_1_z_a_b',
    icon: Calendar,
    subtitle: 'Inventory Management',
    description: 'Manage items schema tables and forms for inventory.',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'item_id', label: 'Item ID', type: 'string', required: true },
      { key: 'item_name', label: 'Item Name', type: 'string', required: true },
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'unit_price', label: 'Unit Price', type: 'number' },
      { key: 'supplier', label: 'Supplier', type: 'string' },
      { key: 'last_restocked', label: 'Last Restocked Date', type: 'date' }
    ],
    defaultSeed: []
  },
  Form_1_1_1_z_a_c: {
    id: 'Form_1_1_1_z_a_c',
    name: '1.1.1.z.a.c MEDICAL SUPPLY',
    collectionName: 'form_1_1_1_z_a_c',
    icon: Calendar,
    subtitle: 'Medical Supply Management',
    description: 'Manage items schema tables and forms for medical supplies.',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'supply_id', label: 'Supply ID', type: 'string', required: true },
      { key: 'supply_name', label: 'Supply Name', type: 'string', required: true },
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { key: 'supplier', label: 'Supplier', type: 'string' },
      { key: 'batch_number', label: 'Batch Number', type: 'string' }
    ],
    defaultSeed: []
  }
};
