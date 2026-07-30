
export interface AuditCriterion {
  id: string;
  criterion: string;
  weight: number;
}

export interface AuditStandard {
  id: string;
  standard: string;
  criteria: AuditCriterion[];
}

export interface AuditChapter {
  id: number;
  title: string;
  standards: AuditStandard[];
}

export const AUDIT_SCHEMA: AuditChapter[] = [
  {
    id: 1,
    title: "Hospital Leadership, Management and Governance",
    standards: [
      {
        id: "1.1",
        standard: "The hospital has a functional Governing Board mandated to provide strategic leadership.",
        criteria: [
          { id: "1.1.1", criterion: "Verify that the board is legally established and members are officially assigned from their respective office", weight: 2 },
          { id: "1.1.2", criterion: "Check the board members composition is in compliance with the directive (community representative, gender composition)", weight: 2 },
          { id: "1.1.3", criterion: "Check the hospital has set a clear vision and mission of the hospital", weight: 2 },
          { id: "1.1.4", criterion: "Check the board provides oversight and supports the hospital’s management committee, ensuring that it has the resources and guidance needed to discharge its responsibilities.", weight: 2 },
          { id: "1.1.5", criterion: "Check the board provides clear direction in alignment with the mission, vision, and strategic goals of the health sector", weight: 3 }
        ]
      },
      {
        id: "1.2",
        standard: "The hospital has functional management Committee that runs the overall function of the hospital",
        criteria: [
          { id: "1.2.1", criterion: "Check the hospital has a functional management committee that advice the CEO/CED of the hospital in running the overall hospital activities", weight: 2 },
          { id: "1.2.2", criterion: "Check the management committee has an implementation and a monitoring plan", weight: 3 },
          { id: "1.2.3", criterion: "Check the management committee meets regularly and passes decision on issues of concern (Review the Minutes)", weight: 2 },
          { id: "1.2.4", criterion: "Verify the management committee runs its activities in line with the set objectives and the direction given by the hospital board (Review Minutes of Board meeting)", weight: 2 },
          { id: "1.2.5", criterion: "Check the management committee acts in the best interest of patients", weight: 2 }
        ]
      },
      {
        id: "1.3",
        standard: "The hospital increases resource generation and improves efficiency",
        criteria: [
          { id: "1.3.1", criterion: "Check the management committee has long-term and operation plan to increase the hospitals revenue from diverse sources over time.", weight: 2 },
          { id: "1.3.2", criterion: "Ensure the board and management committee engages the community and other stakeholders to increase the hospital resource", weight: 2 },
          { id: "1.3.3", criterion: "Check internal revenue of the hospital shows increasing trend", weight: 2 },
          { id: "1.3.4", criterion: "Ensure the board critically reviews both the growth and efficient use of the hospital’s resources", weight: 2 }
        ]
      },
      {
        id: "1.4",
        standard: "The hospital establishes accountability mechanisms",
        criteria: [
          { id: "1.4.1", criterion: "Check the board discharges its responsibilities in full compliance with the government’s laws, rules and regulations", weight: 2 },
          { id: "1.4.2", criterion: "Check board remains accountable to the community and engages in open dialogue with stakeholders", weight: 2 },
          { id: "1.4.3", criterion: "Check the hospital implements GGI", weight: 2 },
          { id: "1.4.4", criterion: "Check the hospital implements citizen charter", weight: 2 },
          { id: "1.4.5", criterion: "Check the board conducts self-evaluation and review its performance", weight: 2 },
          { id: "1.4.6", criterion: "Confirm the board has minutes on self-evaluation and actions taken", weight: 2 },
          { id: "1.4.7", criterion: "Obtain a minute of a meeting held on self-assessment (Conducted every six month)", weight: 1 }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Liaison, Referral and Social Services",
    standards: [
      {
        id: "2.1",
        standard: "The Hospital has established liaison, referral and social service management structures",
        criteria: [
          { id: "2.1.1", criterion: "The hospital has reception service near at the gate with trained staff and job aid (stretcher/wheelchair)", weight: 3 },
          { id: "2.1.2", criterion: "Liaison unit has dedicated phone line, computer, and internet connection", weight: 3 },
          { id: "2.1.3", criterion: "Check for availability of separate or integrated social service unit", weight: 2 },
          { id: "2.1.4", criterion: "Check availability of adequate number of social workers based on hospital tier", weight: 2 }
        ]
      },
      {
        id: "2.2",
        standard: "The hospitals provide 24/7 a liaison, referral and social services throughout the year.",
        criteria: [
          { id: "2.2.1", criterion: "Observe, interview and triangulate report for 24/7 liaison service", weight: 3 },
          { id: "2.2.2", criterion: "Observe, interview and triangulate report for 24/7 referral service", weight: 3 },
          { id: "2.2.3", criterion: "Observe, interview and triangulate report for 24/7 social service", weight: 3 }
        ]
      },
      {
        id: "2.3",
        standard: "There is a known and adhered written protocol for admission and discharge of patients.",
        criteria: [
          { id: "2.3.1", criterion: "Check for hospital specific admission and discharge protocol", weight: 2 },
          { id: "2.3.2", criterion: "Check availability and practice of protocol in selected units (ER, IPD, ICU)", weight: 2 },
          { id: "2.3.3", criterion: "Interview staff for knowledge and adherence to protocol", weight: 2 },
          { id: "2.3.4", criterion: "Check all admissions and discharges pass through Liaison", weight: 2 },
          { id: "2.3.5", criterion: "Liaison office regularly checks IPD card completeness", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Health Information Management System (HMIS)",
    standards: [
      {
        id: "3.1",
        standard: "The hospital has dedicated space for HMIS office and archive",
        criteria: [
          { id: "3.1.1", criterion: "Check availability of HMIS office with basic furniture", weight: 2 },
          { id: "3.1.2", criterion: "Check availability of standard data archive room", weight: 2 },
          { id: "3.1.3", criterion: "Archive room has shelf, lockable cabinets and fire extinguisher", weight: 2 },
          { id: "3.1.4", criterion: "Archive is organized according to year and months", weight: 2 }
        ]
      },
      {
        id: "3.2",
        standard: "HMIS unit is staffed with trained health informatics professionals",
        criteria: [
          { id: "3.2.1", criterion: "Check staffing level against organogram", weight: 3 },
          { id: "3.2.2", criterion: "Check if staff are trained on current HMIS version", weight: 4 },
          { id: "3.2.3", criterion: "Verify presence of dedicated HMIS focal person", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Medical Record Management",
    standards: [
      {
        id: "4.1",
        standard: "The hospital has functional medical record management Unit",
        criteria: [
          { id: "4.1.1", criterion: "Assigned MR unit focal, registration officers and runners with JD as per the standard.", weight: 3 },
          { id: "4.1.2", criterion: "The MR unit head is accountable to the HMIS director.", weight: 2 },
          { id: "4.1.3", criterion: "Has annual, quarterly and monthly plan", weight: 2 },
          { id: "4.1.4", criterion: "Has a regular weekly meeting among case team members", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "Nursing and Midwifery Care",
    standards: [
      {
        id: "5.1",
        standard: "The hospital provides quality nursing and midwifery care services.",
        criteria: [
          { id: "5.1.1", criterion: "Nursing and midwifery care is led by a qualified and assigned head.", weight: 2 },
          { id: "5.1.2", criterion: "Presence of a functional nursing and midwifery committee.", weight: 2 },
          { id: "5.1.3", criterion: "Availability of updated nursing and midwifery care protocols and guidelines.", weight: 3 },
          { id: "5.1.4", criterion: "Regular monitoring of nursing care standards and patient satisfaction.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "Medical Services",
    standards: [
      {
        id: "6.1",
        standard: "The hospital ensures quality medical consultation and treatment services.",
        criteria: [
          { id: "6.1.1", criterion: "Medical services are led by a qualified medical director or head.", weight: 2 },
          { id: "6.1.2", criterion: "Standard treatment guidelines (STG) are available and utilized.", weight: 3 },
          { id: "6.1.3", criterion: "Morning sessions and clinical seminars are conducted regularly.", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Surgical and Anesthesia Services",
    standards: [
      {
        id: "7.1",
        standard: "The hospital provides safe and standardized surgical and anesthesia care.",
        criteria: [
          { id: "7.1.1", criterion: "Utilization of the WHO Surgical Safety Checklist for all operations.", weight: 5 },
          { id: "7.1.2", criterion: "Availability of essential surgical sets and anesthesia equipment.", weight: 3 },
          { id: "7.1.3", criterion: "Proper documentation of preoperative, operative, and postoperative care.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "Maternal, Neonatal and Child Health (MNCH) Services",
    standards: [
      {
        id: "8.1",
        standard: "The hospital provides comprehensive MNCH services including BEmONC/CEmONC.",
        criteria: [
          { id: "8.1.1", criterion: "24/7 availability of emergency obstetric and newborn care services.", weight: 5 },
          { id: "8.1.2", criterion: "Proper utilization of partograph for monitoring labor.", weight: 4 },
          { id: "8.1.3", criterion: "Availability of neonatal intensive care unit (NICU) with necessary equipment.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Pharmacy Services",
    standards: [
      {
        id: "9.1",
        standard: "The hospital ensures reliable supply and rational use of medicines.",
        criteria: [
          { id: "9.1.1", criterion: "Functionality of the Drug and Therapeutic Committee (DTC).", weight: 3 },
          { id: "9.1.2", criterion: "Implementation of Auditable Pharmaceutical Transactions and Services (APTS).", weight: 4 },
          { id: "9.1.3", criterion: "Maintain essential medicine list (EML) and monitor stock-outs.", weight: 3 }
        ]
      },
      {
        id: "9.2",
        standard: "Safe and proper storage of pharmaceuticals",
        criteria: [
          { id: "9.2.1", criterion: "Storage area is clean, well-ventilated and secured", weight: 2 },
          { id: "9.2.2", criterion: "Cold chain management with temperature monitoring log", weight: 4 },
          { id: "9.2.3", criterion: "Proper arrangement of medicines (FEFO/FIFO)", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "Laboratory Services",
    standards: [
      {
        id: "10.1",
        standard: "The hospital provides accurate and timely diagnostic laboratory services.",
        criteria: [
          { id: "10.1.1", criterion: "Implementation of Laboratory Quality Management System (LQMS).", weight: 4 },
          { id: "10.1.2", criterion: "Participation in External Quality Assurance (EQA) programs.", weight: 3 },
          { id: "10.1.3", criterion: "Adherence to safety protocols and proper waste management.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 11,
    title: "Diagnostic Imaging Services",
    standards: [
      {
        id: "11.1",
        standard: "The hospital provides safe and quality diagnostic imaging services.",
        criteria: [
          { id: "11.1.1", criterion: "Availability of functional X-ray, Ultrasound, and other imaging modalities.", weight: 3 },
          { id: "11.1.2", criterion: "Implementation of radiation safety measures and personal monitoring (TLD).", weight: 4 },
          { id: "11.1.3", criterion: "Proper archiving and reporting of imaging results.", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 12,
    title: "Infection Prevention and Control (IPC)",
    standards: [
      {
        id: "12.1",
        standard: "The hospital implements robust IPC practices to ensure patient and staff safety.",
        criteria: [
          { id: "12.1.1", criterion: "Availability of functional IPC committee and designated IPC focal person.", weight: 3 },
          { id: "12.1.2", criterion: "Consistent availability of water, soap, and alcohol-based hand rub at points of care.", weight: 5 },
          { id: "12.1.3", criterion: "Proper segregation, collection, and disposal of medical waste.", weight: 4 },
          { id: "12.1.4", criterion: "Availability and proper use of Personal Protective Equipment (PPE)", weight: 4 }
        ]
      },
      {
        id: "12.2",
        standard: "Safe management of medical waste and sharps",
        criteria: [
          { id: "12.2.1", criterion: "Availability of color-coded bins and puncture-proof sharps boxes", weight: 3 },
          { id: "12.2.2", criterion: "Functional incinerator or alternative waste treatment system", weight: 5 },
          { id: "12.2.3", criterion: "Staff are trained on waste management protocols", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 13,
    title: "Environmental Health and Safety",
    standards: [
      {
        id: "13.1",
        standard: "The hospital maintains a clean and safe environment for patients, staff, and visitors.",
        criteria: [
          { id: "13.1.1", criterion: "Regular cleaning and disinfection of hospital premises according to schedule.", weight: 3 },
          { id: "13.1.2", criterion: "Functional laundry and linen management services.", weight: 2 },
          { id: "13.1.3", criterion: "Availability of clean and gender-segregated toilets and latrines.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 14,
    title: "Hospital Facility and Equipment Management",
    standards: [
      {
        id: "14.1",
        standard: "The hospital ensures infrastructure and equipment are well-maintained and functional.",
        criteria: [
          { id: "14.1.1", criterion: "Implementation of Preventive Maintenance (PM) for medical equipment.", weight: 4 },
          { id: "14.1.2", criterion: "Functionality of standby generator and reliable power supply system.", weight: 3 },
          { id: "14.1.3", criterion: "Adequate space and layout according to hospital standards.", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 15,
    title: "Human Resource Management",
    standards: [
      {
        id: "15.1",
        standard: "The hospital manages human resources effectively to ensure service quality.",
        criteria: [
          { id: "15.1.1", criterion: "Staffing levels are in accordance with the hospital's standard organogram.", weight: 3 },
          { id: "15.1.2", criterion: "Regular performance appraisal and feedback for all staff.", weight: 2 },
          { id: "15.1.3", criterion: "Implementation of staff motivation and retention strategies.", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 16,
    title: "Financial Management",
    standards: [
      {
        id: "16.1",
        standard: "The hospital ensures transparent and efficient financial management.",
        criteria: [
          { id: "16.1.1", criterion: "Availability of approved annual budget and procurement plan.", weight: 3 },
          { id: "16.1.2", criterion: "Regular financial auditing and reporting (internal and external).", weight: 3 },
          { id: "16.1.3", criterion: "Effective hospital revenue retention and utilization mechanism.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 17,
    title: "Quality Management and Patient Safety",
    standards: [
      {
        id: "17.1",
        standard: "The hospital has a functional quality management system.",
        criteria: [
          { id: "17.1.1", criterion: "Presence of a functional Quality Management Unit and Committee.", weight: 3 },
          { id: "17.1.2", criterion: "Regular monitoring of clinical quality indicators.", weight: 3 },
          { id: "17.1.3", criterion: "Establishment of a system for reporting and managing medical errors and adverse events.", weight: 4 }
        ]
      }
    ]
  },
  {
    id: 18,
    title: "Quality Management and Patient Safety",
    standards: [
      {
        id: "18.1",
        standard: "The hospital has a functional quality management system.",
        criteria: [
          { id: "18.1.1", criterion: "Presence of a functional Quality Management Unit and Committee.", weight: 3 },
          { id: "18.1.2", criterion: "Regular monitoring of clinical quality indicators.", weight: 3 },
          { id: "18.1.3", criterion: "Establishment of a system for reporting and managing medical errors and adverse events.", weight: 4 }
        ]
      }
    ]
  },
  {
    id: 19,
    title: "Clinical Governance and Audit",
    standards: [
      {
        id: "19.1",
        standard: "The hospital implements clinical governance and regular clinical audits.",
        criteria: [
          { id: "19.1.1", criterion: "Conducting regular clinical audits (e.g., chart audits, mortality audits).", weight: 4 },
          { id: "19.1.2", criterion: "Implementation of evidence-based clinical guidelines and pathways.", weight: 3 },
          { id: "19.1.3", criterion: "Continuous Professional Development (CPD) programs for clinical staff.", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 20,
    title: "Hospital Disaster Management and Emergency Preparedness",
    standards: [
      {
        id: "20.1",
        standard: "The hospital is prepared for disasters and public health emergencies.",
        criteria: [
          { id: "20.1.1", criterion: "Availability of an updated Hospital Disaster Preparedness and Response Plan.", weight: 4 },
          { id: "20.1.2", criterion: "Regular conduct of disaster drills and staff training.", weight: 3 },
          { id: "20.1.3", criterion: "Availability of emergency stock (buffer stock) of essential supplies.", weight: 3 }
        ]
      }
    ]
  },
  {
    id: 21,
    title: "Health Insurance Service",
    standards: [
      {
        id: "21.1",
        standard: "The hospital provides effective health insurance services (e.g., CBHI).",
        criteria: [
          { id: "21.1.1", criterion: "Establishment of a dedicated health insurance focal point/office.", weight: 2 },
          { id: "21.1.2", criterion: "Timely submission of insurance claims and reimbursement tracking.", weight: 3 },
          { id: "21.1.3", criterion: "Ensuring insured patients receive all necessary services without out-of-pocket payment.", weight: 4 }
        ]
      }
    ]
  },
  {
    id: 22,
    title: "Outpatient Services",
    standards: [
      {
        id: "22.1",
        standard: "The hospital provides organized and efficient outpatient care.",
        criteria: [
          { id: "22.1.1", criterion: "Implementation of an appointment system and triage for outpatient visits.", weight: 3 },
          { id: "22.1.2", criterion: "Monitoring and reducing outpatient waiting time.", weight: 3 },
          { id: "22.1.3", criterion: "Availability of specialized clinics according to hospital tier.", weight: 2 }
        ]
      }
    ]
  },
  {
    id: 23,
    title: "Emergency and Injury Care Services Management",
    standards: [
      {
        id: "23.1",
        standard: "The hospital shall have emergency medical service department led by professional.",
        criteria: [
          { id: "23.1.1", criterion: "24/7 Triage service with trained staff", weight: 4 },
          { id: "23.1.2", criterion: "Availability of essential emergency medicines and supplies", weight: 3 },
          { id: "23.1.3", criterion: "Functional resuscitation area with monitor and defibrillator", weight: 3 }
        ]
      }
    ]
  }
];
