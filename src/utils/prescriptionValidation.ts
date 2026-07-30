export const VALID_DOSES = [
  '500mg', '250mg', '125mg', '100mg', '200mg', '20mg', '40mg', '400mg', '1gm', '2gm', 'other specific'
];

export const VALID_ROUTES = [
  'PO', 'IV', 'IM', 'suppository', 'other specific'
];

export const VALID_FREQUENCIES = [
  'stat', 'BID', 'TID', 'QID', 'once', 'PRN', 'other specific'
];

export interface PrescriptionValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates an outpatient prescription payload against the EHR data schema.
 * Checks required fields and ensures dose, route, and frequency match valid options.
 */
export function validateOutpatientPrescription(data: Record<string, any>): PrescriptionValidationResult {
  return validatePrescriptionSchema(data, '1.1.1.m');
}

/**
 * Validates a prescription payload against the specified schema (1.1.1.m, 1.1.1.t, 1.1.1.z.2).
 * Verifies required fields, dose/route/frequency valid options, conditional 'other_specific' fields,
 * and multi-medication lists.
 */
export function validatePrescriptionSchema(
  data: Record<string, any>,
  schemaId?: string
): PrescriptionValidationResult {
  const errors: Record<string, string> = {};
  const schema = schemaId || data.schema_id || data.form_id || '1.1.1.m';

  // Common required fields
  if (!data.hospital_id) {
    errors.hospital_id = 'Hospital ID is required.';
  }

  if (!data.patient_mrn && !data.mrn && !data.patient_id) {
    errors.patient_mrn = 'Patient MRN is required.';
  }

  // Schema-specific checks
  if (schema === '1.1.1.t' || schema === 'Form_1_1_1_t') {
    if (!data.ward_name) {
      errors.ward_name = 'Ward Name is required for admitted patient prescription requests.';
    }
    if (!data.management_or_treatment_for && !data.diagnosis) {
      errors.management_or_treatment_for = 'Management or treatment For is required.';
    }
  } else if (schema === '1.1.1.z.2' || schema === 'Form_1_1_1_z_2') {
    if (!data.discharge_prescription && !data.prescribed_drugs && (!data.medications || data.medications.length === 0)) {
      errors.discharge_prescription = 'Discharge Outpatient Medications / Prescribed Drugs is required.';
    }
  } else {
    // 1.1.1.m (Outpatient Prescription Submitted)
    if (!data.management_or_treatment_for && !data.diagnosed) {
      errors.management_or_treatment_for = 'Management or treatment For is required.';
    }
  }

  // Multi-medication array or single medication check
  if (Array.isArray(data.medications) && data.medications.length > 0) {
    data.medications.forEach((med: any, idx: number) => {
      const rowNum = idx + 1;
      if (!med.prescribed_drugs && !med.name) {
        errors[`medication_${idx}_name`] = `Medication #${rowNum}: Drug name is required.`;
      }
      if (!med.dose) {
        errors[`medication_${idx}_dose`] = `Medication #${rowNum}: Dose is required.`;
      } else if (!VALID_DOSES.includes(med.dose)) {
        errors[`medication_${idx}_dose`] = `Medication #${rowNum}: Invalid dose "${med.dose}".`;
      } else if (med.dose === 'other specific' && !med.dose_other_specific?.trim()) {
        errors[`medication_${idx}_dose_other`] = `Medication #${rowNum}: Please specify other dose.`;
      }

      if (!med.route) {
        errors[`medication_${idx}_route`] = `Medication #${rowNum}: Route is required.`;
      } else if (!VALID_ROUTES.includes(med.route)) {
        errors[`medication_${idx}_route`] = `Medication #${rowNum}: Invalid route "${med.route}".`;
      } else if (med.route === 'other specific' && !med.route_other_specific?.trim()) {
        errors[`medication_${idx}_route_other`] = `Medication #${rowNum}: Please specify other route.`;
      }

      if (!med.frequency) {
        errors[`medication_${idx}_frequency`] = `Medication #${rowNum}: Frequency is required.`;
      } else if (!VALID_FREQUENCIES.includes(med.frequency)) {
        errors[`medication_${idx}_frequency`] = `Medication #${rowNum}: Invalid frequency "${med.frequency}".`;
      } else if (med.frequency === 'other specific' && !med.frequency_other_specific?.trim()) {
        errors[`medication_${idx}_frequency_other`] = `Medication #${rowNum}: Please specify other frequency.`;
      }
    });
  } else {
    // Single medication fields
    if (!data.prescribed_drugs && !data.discharge_prescription) {
      errors.prescribed_drugs = 'Name of medication is required.';
    }

    if (data.dose) {
      if (!VALID_DOSES.includes(data.dose)) {
        errors.dose = `Invalid dose "${data.dose}". Must be one of: ${VALID_DOSES.join(', ')}.`;
      } else if (data.dose === 'other specific' && !data.dose_other_specific?.trim()) {
        errors.dose_other_specific = 'Please specify the other dose.';
      }
    } else if (schema !== '1.1.1.z.2') {
      errors.dose = 'Dose is required.';
    }

    if (data.route) {
      if (!VALID_ROUTES.includes(data.route)) {
        errors.route = `Invalid route "${data.route}". Must be one of: ${VALID_ROUTES.join(', ')}.`;
      } else if (data.route === 'other specific' && !data.route_other_specific?.trim()) {
        errors.route_other_specific = 'Please specify the other route.';
      }
    } else if (schema !== '1.1.1.z.2') {
      errors.route = 'Route is required.';
    }

    if (data.frequency) {
      if (!VALID_FREQUENCIES.includes(data.frequency)) {
        errors.frequency = `Invalid frequency "${data.frequency}". Must be one of: ${VALID_FREQUENCIES.join(', ')}.`;
      } else if (data.frequency === 'other specific' && !data.frequency_other_specific?.trim()) {
        errors.frequency_other_specific = 'Please specify the other frequency.';
      }
    } else if (schema !== '1.1.1.z.2') {
      errors.frequency = 'Frequency per day is required.';
    }
  }

  if (schema !== '1.1.1.z.2') {
    if (!data.prescribed_by) {
      errors.prescribed_by = 'Prescribed by is required.';
    }
    if (!data.approved_by) {
      errors.approved_by = 'Approved by is required.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
