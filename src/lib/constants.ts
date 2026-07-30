
export const EHR_MODULES = [
  { key: 'read', label: 'Read Access', desc: 'Base ground rule allowing data visualization and document reading.' },
  { key: 'write', label: 'Write Access', desc: 'Base ground rule allowing data entry and record creation.' },
  { key: 'edit', label: 'Edit Access', desc: 'Base ground rule allowing modification of existing clinical data.' },
  { key: 'delete', label: 'Delete Access', desc: 'Base ground rule allowing permanent removal of clinical records.' },
  { key: 'create_account', label: 'Create Account Access', desc: 'Base ground rule allowing creation of user accounts.' },
  { key: 'register_logbook', label: 'Register Logbook Register Table (Editable Format)', desc: 'Access to the editable Register Logbook register table.' },
  { key: 'consolidated_33_hub', label: 'Consolidated 33-Format Hub', desc: 'Access to the Consolidated 33-Format Hub template.' },
  { key: 'read_patient_records', label: 'Read Patient Records', desc: 'Allows viewing patient demographic files, vital sign sheets, and diagnosis streams.' },
  { key: 'write_clinical_notes', label: 'Write Clinical Notes', desc: 'Allows creating and appending SOAP progress charts, prescriptions, and order entries.' },
  { key: 'manage_billing', label: 'Manage Invoices & Billing', desc: 'Allows calculating ledger fees, editing claims, and checking out medical payments.' },
  { key: 'dispense_medications', label: 'Dispense Medications', desc: 'Allows checking pharmacy inventory, dispensing prescriptions, and updating stock.' },
  { key: 'system_backups_access', label: 'Database Backup Access', desc: 'Allows initiating secure EHR database backup snapshots and integrity checks.' },
  { key: 'audit_logs_view', label: 'Trace Security Audit Logs', desc: 'Allows monitoring staff activity, clock-ins, and critical administrative clinical logs.' },
  { key: 'Admin Dashboard', label: 'Admin Dashboard', desc: 'Access to the Admin Dashboard module.' },
  { key: 'Finance Department', label: 'Finance Department', desc: 'Access to the Finance Department module.' },
  { key: 'Planning Module', label: 'Planning Module', desc: 'Access to the Planning Module (Strategic & Operational).' },
  { key: 'Human Resources', label: 'Human Resources', desc: 'Access to the Human Resources module.' },
  { key: 'Module 3: Health Service IS', label: 'Module 3: Health Service IS', desc: 'Access to Health Service IS.' },
  { key: 'Module 4: Quality Improvement', label: 'Module 4: Quality Improvement', desc: 'Access to Quality Improvement.' },
  { key: 'Module 5: Environmental Health', label: 'Module 5: Environmental Health', desc: 'Access to Environmental Health.' },
  { key: 'Module 9: Facility Equipment', label: 'Module 9: Facility Equipment', desc: 'Access to Facility Equipment.' },
  { key: 'Module 10: Bio Medical', label: 'Module 10: Bio Medical', desc: 'Access to Bio Medical module.' },
  { key: 'Module 11: Pharmacy', label: 'Module 11: Pharmacy', desc: 'Access to Pharmacy module.' },
  { key: 'Module 12: Security Guard', label: 'Module 12: Security Guard', desc: 'Access to Security Guard module.' },
];

export const EHR_ROLES = [
  'all roles',
  'director',
  'admin',
  'user',
  'mid-manager',
  'lower level manager',
  'other'
] as const;

export type EhrRole = typeof EHR_ROLES[number];

// Hospital Geofence Constants (9.032, 38.747 - Main Entrance)
export const HOSPITAL_LAT = 9.032;
export const HOSPITAL_LON = 38.747;
export const ALLOWED_RADIUS_METERS = 500;

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};
