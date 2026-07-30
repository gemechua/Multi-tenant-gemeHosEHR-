export interface Department {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface PreTriageRecord {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  priority_level: 'Green' | 'Yellow' | 'Red';
  chief_complaint: string;
  screening_notes?: string;
  vital_bp?: string;
  vital_pulse?: number;
  vital_temp?: number;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface PatientPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  patient_name: string;
  amount: number;
  payment_reason: string;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_payment_details?: string;
  summary: string;
  payment_date: string;
}

export interface CashierPaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  invoice_number: string;
  payment_status: 'Paid' | 'Pending CBHI Verification' | 'Waiver Approved';
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_payment_details?: string;
  approved_name: string;
  summary: string;
  payment_date: string;
}

export interface PatientLaboratoryPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  lab_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  other_payment_details?: string;
  approved_name: string;
  date?: string;
  payment_date?: string;
}

export interface CashierLaboratoryPaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  lab_bill_amount: number;
  invoice_no: string;
  verified_paid: 'Yes -' | 'No';
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface PatientRadiologyPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  radiology_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date?: string;
  payment_date?: string;
}

export interface PatientLaboratoryInvestigationRequest {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  lab_tests: 'CBC' | 'Urinalysis' | 'Blood Glucose' | 'Lipid Panel' | 'CD4 / Viral Load' | 'GeneXpert TB Test' | 'Widal/Weils-Felix' | 'Other specific' | 'Other';
  other_specific?: string;
  clinical_indications: string;
  requested_by?: string;
  date: string;
}

export interface PatientLaboratoryReportResults {
  id?: string;
  hospital_id: string;
  patient_mrn: string;
  device_ref: string;
  lab_findings?: string;
  lab_findings_result?: string;
  lab_results?: string;
  referral_sheet_photo?: string;
  report_capture?: string;
  submitted_by: string;
  date?: string;
}

export interface PatientRadiologyInvestigationRequest {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  radiology_modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI' | 'other specific';
  other_specific?: string;
  clinical_notes: string;
  requested_by: string;
  date?: string;
}

export interface PatientInpatientRadiologyInvestigationRequest {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  inpatient_radiology_type: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI' | 'Other specific';
  other_specific?: string;
  request_by_name: string;
  date?: string;
}

export interface InpatientNursingCarePlan {
  id?: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  nursing_diagnoses: string;
  patient_prognosis?: 'Improving' | 'Stable' | 'Guarded' | 'Deteriorating' | 'Critical';
  discharge_criteria?: string;
  date: string;
}

export interface OutpatientPrescriptionSubmitted {
  id?: string;
  hospital_id: string;
  patient_mrn: string;
  diagnosed: string;
  prescribed_drugs: string;
  is_chronic?: boolean;
  supply_days?: number;
  prescribed_by: string;
  approved_by: string;
  date: string;
}

export interface AntenatalEpisode {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  lmp_date: string;
  edd: string;
  gravida?: number;
  para?: number;
  is_active: boolean;
  created_at: string;
}

export interface AncVisit {
  id: string;
  episode_id: string;
  anc_visit_no: 'Visit 1' | 'Visit 2' | 'Visit 3' | 'Visit 4' | 'Visit 5' | 'Visit 6' | 'Visit 7' | 'Visit 8';
  visit_date: string;
  gestational_age_weeks: number;
  bp?: string;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  iron_folic_acid_provided: boolean;
  tetanus_toxoid_dose: number;
  clinical_notes?: string;
  next_appointment_date?: string;
  created_at: string;
}

export interface AncVisit3 {
  id: string;
  episode_id: string;
  anc_visit_no: 'Visit 1' | 'Visit 2' | 'Visit 3';
  visit_date: string;
  gestational_age_weeks: number;
  bp?: string;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  iron_folic_acid_provided: boolean;
  tetanus_toxoid_dose: number;
  clinical_notes?: string;
  next_appointment_date?: string;
  created_at: string;
}

export interface AncVisit4 {
  id: string;
  episode_id: string;
  anc_visit_no: 'Visit 1' | 'Visit 2' | 'Visit 3' | 'Visit 4';
  visit_date: string;
  gestational_age_weeks: number;
  bp?: string;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  iron_folic_acid_provided: boolean;
  tetanus_toxoid_dose: number;
  clinical_notes?: string;
  next_appointment_date?: string;
  created_at: string;
}

export interface AncVisit5 {
  id: string;
  episode_id: string;
  anc_visit_no: 'Visit 1' | 'Visit 2' | 'Visit 3' | 'Visit 4' | 'Visit 5';
  visit_date: string;
  gestational_age_weeks: number;
  bp?: string;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  iron_folic_acid_provided: boolean;
  tetanus_toxoid_dose: number;
  clinical_notes?: string;
  next_appointment_date?: string;
  created_at: string;
}

export interface AncVisit6 {
  id: string;
  episode_id: string;
  anc_visit_no: 'Visit 1' | 'Visit 2' | 'Visit 3' | 'Visit 4' | 'Visit 5' | 'Visit 6';
  visit_date: string;
  gestational_age_weeks: number;
  bp?: string;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  iron_folic_acid_provided: boolean;
  tetanus_toxoid_dose: number;
  clinical_notes?: string;
  next_appointment_date?: string;
  created_at: string;
}

export interface AncVisit7 {
  id: string;
  episode_id: string;
  anc_visit_no: 'Visit 1' | 'Visit 2' | 'Visit 3' | 'Visit 4' | 'Visit 5' | 'Visit 6' | 'Visit 7';
  visit_date: string;
  gestational_age_weeks: number;
  bp?: string;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  iron_folic_acid_provided: boolean;
  tetanus_toxoid_dose: number;
  clinical_notes?: string;
  next_appointment_date?: string;
  created_at: string;
}

export interface LaborEpisode {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  admission_date: string;
  gravida?: number;
  para?: number;
  is_active: boolean;
  delivery_outcome?: string;
}

export interface LatentPhaseAssessment {
  id: string;
  episode_id: string;
  assessment_time: string;
  contraction_frequency?: number;
  contraction_duration?: number;
  cervical_dilatation?: number;
  effacement_percent?: number;
  station?: number;
  membrane_status?: string;
  liquor_color?: string;
  maternal_bp?: string;
  maternal_pulse?: number;
  fetal_heart_rate?: number;
  clinical_notes?: string;
  management_decision?: string;
}

export interface ActivePhaseAssessment {
  id: string;
  episode_id: string;
  assessment_time: string;
  cervical_dilatation: number;
  station?: number;
  contraction_frequency?: number;
  contraction_duration?: number;
  maternal_bp?: string;
  maternal_pulse?: number;
  maternal_temp?: number;
  fetal_heart_rate?: number;
  liquor_status?: string;
  liquor_color?: string;
  oxytocin_dosage_mu_min?: number;
  medication_given?: string;
  clinical_notes?: string;
  recorded_by?: string;
}

export interface SecondStageMonitoring {
  id: string;
  episode_id: string;
  assessment_time: string;
  station?: number;
  maternal_effort?: string;
  maternal_bp?: string;
  maternal_pulse?: number;
  fetal_heart_rate?: number;
  maneuvers_performed?: string;
  clinical_notes?: string;
}

export interface DeliveryOutcome {
  id: string;
  episode_id: string;
  birth_time: string;
  mode_of_delivery: string;
  baby_gender?: string;
  baby_weight_grams?: number;
  apgar_1min?: number;
  apgar_5min?: number;
  placenta_status?: string;
  perineal_tear_degree?: string;
  blood_loss_ml?: number;
  recorded_by?: string;
}

export interface ThirdStageAssessment {
  id: string;
  episode_id: string;
  time_of_placental_delivery: string;
  management_method?: 'AMTSL' | 'Expectant';
  uterotonic_administered: boolean;
  controlled_cord_traction: boolean;
  uterine_massage_performed: boolean;
  placenta_condition?: 'Complete' | 'Incomplete' | 'Retained';
  membranes_condition?: 'Intact' | 'Incomplete';
  estimated_blood_loss_ml: number;
  maternal_bp_post_delivery?: string;
  complications?: string;
  recorded_by?: string;
  created_at: string;
}

export interface PostpartumCheck {
  id: string;
  episode_id: string;
  check_date: string;
  check_type: 'Immediate' | '24h' | '1Week' | '6Week' | 'Other';
  maternal_bp?: string;
  maternal_pulse?: number;
  maternal_temp?: number;
  fundal_height_cm?: number;
  lochia_amount?: 'Scant' | 'Moderate' | 'Heavy';
  lochia_color?: 'Rubra' | 'Serosa' | 'Alba';
  wound_status?: 'Clean' | 'Redness' | 'Discharge';
  breast_status?: string;
  breastfeeding_status?: 'Exclusive' | 'Mixed' | 'Formula';
  contraception_provided: boolean;
  clinical_notes?: string;
  recorded_by?: string;
}

export interface CesareanSection {
  id: string;
  episode_id: string;
  registry_id?: string;
  classification: 'Emergency' | 'Elective';
  indication: string;
  decision_time: string;
  incision_time: string;
  anesthesia_type?: string;
  incision_type?: string;
  surgeon_name?: string;
  assistant_name?: string;
  anesthetist_name?: string;
  complications?: string;
  blood_loss_ml: number;
  surgical_notes?: string;
  created_at: string;
}

export interface PostOpRecoveryMonitoring {
  id: string;
  episode_id: string;
  assessment_time: string;
  motor_block_level?: string;
  pain_score_vas?: number;
  vitals_bp?: string;
  vitals_pulse?: number;
  vitals_resp_rate?: number;
  vitals_temp?: number;
  surgical_dressing_status?: string;
  fundus_consistency?: string;
  vaginal_bleeding_amount?: string;
  urine_output_ml?: number;
  recorded_by?: string;
  clinical_notes?: string;
}

export interface PostOpTransferStatus {
  id: string;
  episode_id: string;
  transfer_time: string;
  transfer_from: string;
  transfer_to: string;
  stability_status?: string;
  iv_fluids_status?: string;
  catheter_removed: boolean;
  handover_notes?: string;
  received_by?: string;
}

export interface VaccineMaster {
  id: string;
  vaccine_code: string;
  vaccine_name: string;
  target_disease?: string;
  recommended_age_weeks?: number;
  dose_sequence?: number;
}

export interface PatientImmunization {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  episode_id?: string;
  vaccine_id: string;
  date_administered: string;
  batch_number?: string;
  expiry_date?: string;
  site_administered?: string;
  provider_name?: string;
  status: 'Completed' | 'Refused' | 'Contraindicated';
  next_due_date?: string;
  clinical_notes?: string;
}

export interface AEFIReport {
  id: string;
  immunization_id: string;
  report_date: string;
  reaction_type: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  action_taken?: string;
  reported_by?: string;
}

export interface BirthSummary {
  id: string;
  episode_id: string;
  patient_mrn: string;
  hospital_id?: string;
  birth_time?: string;
  mode_of_delivery?: string;
  baby_weight_grams?: number;
  apgar_5min?: number;
  total_blood_loss?: number;
  surgery_type?: string;
  surgery_indication?: string;
  surgeon_name?: string;
  latest_check_type?: string;
  latest_bp?: string;
  latest_temp?: number;
  latest_fundus_cm?: number;
}

export interface NewbornRegistry {
  id: string;
  episode_id: string;
  baby_index: number;
  gender: string;
  birth_weight_grams?: number;
  gestational_age_at_birth?: number;
  status: 'Alive' | 'Stillborn' | 'Expired';
  created_at: string;
}

export interface NeonatalRoutineCare {
  id: string;
  newborn_id: string;
  assessment_time: string;
  temp_celsius?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  feeding_method?: string;
  urine_output_status?: string;
  stool_status?: string;
  clinical_notes?: string;
}

export interface NICUDailyLog {
  id: string;
  newborn_id: string;
  log_time: string;
  spo2_percent?: number;
  fio2_percentage?: number;
  iv_fluid_rate_ml_hr?: number;
  respiratory_support?: string;
  medications_administered?: string;
  jaundice_level?: string;
  is_septic_workup_done: boolean;
  recorded_by?: string;
}

export interface KMCSession {
  id: string;
  newborn_id: string;
  date_of_session: string;
  skin_to_skin_hours_daily?: number;
  maternal_participation_score?: number;
  current_weight_grams?: number;
  feeding_status?: string;
  is_ready_for_discharge: boolean;
  clinical_notes?: string;
}

export interface AbortionPACEpisode {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  admission_date: string;
  case_type: 'Induced' | 'Spontaneous (Miscarriage)' | 'Septic';
  gestational_age_weeks?: number;
  vitals_bp?: string;
  vitals_temp?: number;
  hb_level?: number;
  is_active: boolean;
  clinical_summary?: string;
}

export interface PACManagementDetail {
  id: string;
  episode_id: string;
  management_method: 'MVA' | 'EVA' | 'Medical (Miso/Mife)' | 'Expectant';
  procedure_date: string;
  anesthesia_type?: string;
  cervical_dilation_cm?: number;
  procedure_complications?: string;
  medication_regimen?: string;
  is_procedure_complete: boolean;
  total_blood_loss_ml?: number;
  performed_by?: string;
}

export interface PACContraceptiveCounseling {
  id: string;
  episode_id: string;
  counseling_date: string;
  counseling_provided: boolean;
  contraceptive_method_selected?: string;
  method_provided_immediately: boolean;
  follow_up_appointment_date?: string;
  notes?: string;
}

export interface FPMethodRegistry {
  id: string;
  method_name: string;
  category?: string;
  standard_duration_months?: number;
}

export interface FPProvisionRecord {
  id: string;
  patient_mrn: string;
  method_id: string;
  provision_date: string;
  expiry_date?: string;
  counseling_provided: boolean;
  provider_name?: string;
  clinical_notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface FPRemovalRecord {
  id: string;
  provision_id: string;
  removal_date: string;
  removal_reason?: string;
  side_effects_noted?: string;
  provider_name?: string;
  clinical_notes?: string;
}

export interface GynEncounter {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis_code?: string;
  clinical_notes?: string;
  treatment_plan?: string;
  prescription_notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  recorded_by?: string;
}

export interface GynSurgery {
  id: string;
  encounter_id: string;
  procedure_name: string;
  surgery_date: string;
  anesthesia_type?: string;
  surgical_findings?: string;
  blood_loss_ml?: number;
  complications?: string;
  surgeon_name?: string;
  created_at: string;
}

export interface GynInvestigation {
  id: string;
  encounter_id: string;
  test_type: string;
  test_date: string;
  result_summary?: string;
  interpretation?: string;
  attached_file_path?: string;
}

export interface SurgicalMasterRegistry {
  id: string;
  patient_mrn: string;
  surgery_date: string;
  specialty?: string;
  procedure_name: string;
  pre_op_diagnosis?: string;
  post_op_diagnosis?: string;
  theatre_id?: string;
  surgeon_name?: string;
  anesthetist_name?: string;
  status: 'Booked' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface SurgicalBooking {
  id: string;
  patient_mrn: string;
  tentative_date: string;
  urgency_level?: 'Elective' | 'Urgent' | 'Emergency';
  scheduled_procedure: string;
  requesting_doctor?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  notes?: string;
}

export interface TheatreTimeLog {
  id: string;
  registry_id: string;
  patient_entry_time?: string;
  anesthesia_start_time?: string;
  incision_time?: string;
  closure_time?: string;
  patient_exit_time?: string;
  complications_noted?: string;
}

export interface CashierRadiologyPaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  invoice_no: string;
  payment_verified: 'yes' | 'No';
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface PatientPrescriptionPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  prescription_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date?: string;
  payment_date?: string;
}

export interface CashierPrescriptionPaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  invoice_no: string;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date?: string;
}

export interface PatientProcedurePayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  procedure_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date?: string;
  payment_date?: string;
}

export interface CashierProcedurePaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  total_amount: number;
  invoice_no: string;
  payment_verified: 'yes' | 'No' | boolean;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_name: string;
  date?: string;
}

export interface PatientInpatientLaboratoryPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  lab_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface CashierInpatientLaboratoryPaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  invoice_no: string;
  payment_verified: 'yes' | 'No';
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface PatientInpatientRadiologyPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  radiology_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'low income' | 'exempted' | 'other';
  other_specific?: string;
  request_by_name: string;
  date: number;
}

export interface CashierInpatientRadiologyPaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  invoice_no: string;
  payment_verified: 'Yes' | 'No';
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'low income' | 'exempted' | 'other';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface PatientORProcedurePayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  procedure_bill_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  approved_name: string;
  payment_date: string;
}

export interface CashierORProcedurePaymentVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  invoice_no: string;
  payment_verified: 'Paid' | 'Insurance Verified' | 'Exempted' | 'other';
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  approved_name: string;
  date: string;
}

export interface PatientLiaisonInpatientPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  admission_deposit: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface CashierLiaisonInpatientDepositVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  admission_deposit: number;
  deposit_invoice: string;
  deposit_verified: string;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface AdmittedPatientPrescriptionPayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  ward_rx_bill: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other_specific?: string;
  approved_name: string;
  date: string;
}

export interface PatientClinicalDiagnosisSummary {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  diagnosis_notes: 'Malaria' | 'Pneumonia' | 'Typhoid Fever' | 'Acute Diarrhea' | 'Hypertension' | 'Diabetes Mellitus' | 'UTI' | 'URTI' | 'Other specifics' | 'Other';
  other_specifics: string | number;
  icd10_code?: string;
  additional_diagnosis_notes?: string;
  other_summary: string;
  date: string;
}

export interface PediatricGrowthRecord {
  id: string;
  patient_mrn: string;
  visit_date: string;
  weight_kg?: number;
  height_cm?: number;
  muac_cm?: number;
  nutritional_status?: string;
  weight_for_age_zscore?: number;
  height_for_age_zscore?: number;
  recorded_by?: string;
}

export interface DevelopmentalScreening {
  id: string;
  patient_mrn: string;
  screening_date: string;
  age_category?: '1-2yr' | '3-5yr' | '6-12yr';
  motor_skills_status?: 'On Track' | 'Delayed';
  speech_language_status?: 'On Track' | 'Delayed';
  social_emotional_status?: 'On Track' | 'Delayed';
  concern_flagged: boolean;
  clinical_notes?: string;
}

export interface PediatricConsultation {
  id: string;
  patient_mrn: string;
  visit_date: string;
  temp_celsius?: number;
  respiratory_rate?: number;
  heart_rate?: number;
  oxygen_saturation?: number;
  chief_complaint?: string;
  diagnosis_icd10?: string;
  treatment_plan?: string;
  medication_prescribed?: string;
  is_referral_required: boolean;
  recorded_by?: string;
}

export interface PediatricImmunizationBooster {
  id: string;
  patient_mrn: string;
  vaccine_name: string;
  date_administered: string;
  batch_number?: string;
  next_due_date?: string;
  is_completed: boolean;
}

export interface ICUAdmission {
  id: string;
  patient_mrn: string;
  admission_time: string;
  admission_reason?: string;
  apache_ii_score?: number;
  sofa_score?: number;
  is_active: boolean;
  bed_number?: string;
  attending_physician?: string;
  recorded_by?: string;
}

export interface ICUVitalsHourly {
  id: string;
  admission_id: string;
  patient_mrn: string;
  timestamp: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  mean_arterial_pressure?: number;
  heart_rate?: number;
  cvp_cmh2o?: number;
  spo2_percent?: number;
  respiratory_rate?: number;
  recorded_by?: string;
}

export interface ICUVentilatorSetting {
  id: string;
  admission_id: string;
  patient_mrn: string;
  timestamp: string;
  vent_mode?: string;
  fio2_percent?: number;
  peep_cmh2o?: number;
  tidal_volume_ml?: number;
  respiratory_rate_set?: number;
  sedation_score_rass?: number;
  recorded_by?: string;
}

export interface ICUDailyAssessment {
  id: string;
  admission_id: string;
  patient_mrn: string;
  assessment_date: string;
  neurological_gcs?: number;
  cardiovascular_notes?: string;
  renal_urine_output_24h?: number;
  nutrition_status?: string;
  plan_of_day?: string;
  recorded_by?: string;
}

export interface IMEncounter {
  id: string;
  patient_mrn: string;
  visit_date: string;
  subjective_history?: string;
  objective_exam?: string;
  assessment_diagnosis?: string;
  plan_management?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate?: number;
  temp_celsius?: number;
  recorded_by?: string;
}

export interface ChronicDiseaseLog {
  id: string;
  patient_mrn: string;
  condition_name: string;
  diagnosis_date?: string;
  hba1c_level?: number;
  glucose_fasting_mgdl?: number;
  cholesterol_ldl_mgdl?: number;
  current_medication_list?: string;
  status: 'Stable' | 'Uncontrolled' | 'Complicated';
  next_follow_up_date?: string;
}

export interface Prescription {
  id: string;
  encounter_id?: string;
  patient_mrn?: string;
  drug_name: string;
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  is_active: boolean;
  prescription_date: string;
}

export interface IMLabResult {
  id: string;
  encounter_id?: string;
  patient_mrn?: string;
  test_name: string;
  result_value: string;
  unit?: string;
  reference_range?: string;
  is_abnormal: boolean;
  recorded_at?: string;
}

export interface VitalSignsRecord {
  id: string;
  episode_id?: string;
  recorded_at: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  spo2_percent?: number;
  fio2_percent?: number;
  temperature_c?: number;
  pain_score?: number;
  consciousness_level?: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';
  recorded_by?: string;
  notes?: string;
}

export interface FluidBalanceLog {
  id: string;
  episode_id?: string;
  log_date: string;
  oral_intake_ml: number;
  iv_intake_ml: number;
  urine_output_ml: number;
  drainage_output_ml: number;
  net_balance_ml: number;
  recorded_by?: string;
}

export interface VitalsDeteriorationAlert {
  id: string;
  vitals_id: string;
  alert_level: 'Low' | 'Medium' | 'High';
  action_taken?: string;
  acknowledged_by?: string;
  resolved_at?: string;
}

export interface OxygenPrescription {
  id: string;
  encounter_id?: string;
  patient_mrn: string;
  prescribed_at: string;
  device_type: 'Nasal Cannula' | 'Venturi Mask' | 'Non-Rebreather' | 'CPAP' | 'Other specific';
  flow_rate_lpm?: number;
  target_spo2_min?: number;
  target_spo2_max?: number;
  titration_instructions?: string;
  is_active: boolean;
  stop_date?: string;
  prescribing_physician?: string;
  clinical_rationale?: string;
}

export interface OxygenTitrationLog {
  id: string;
  prescription_id: string;
  patient_mrn?: string;
  recorded_at: string;
  current_flow_rate?: number;
  patient_spo2_reading?: number;
  respiratory_effort?: 'Normal' | 'Mild Distress' | 'Severe Distress';
  mental_status?: 'Alert' | 'Confused' | 'Lethargic';
  action_taken?: string;
  recorded_by?: string;
}

export interface HospitalServiceCatalog {
  id: string;
  service_name: string;
  category?: 'Pharmacy' | 'Surgical' | 'Bed Fee' | 'O2' | 'Other';
  unit_price: number;
  billing_unit?: 'Hour' | 'Day' | 'Unit' | 'Other';
}

export interface PaymentRequest {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  source_module: 'Oxygen Therapy' | 'Surgery' | 'Consultation' | 'Other specific';
  other_source_module?: string;
  total_amount_used_liter?: number;
  total_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_payment_method?: string;
  requests_by?: string;
  date_and_time: string;
}

export interface PaymentTransaction {
  id: string;
  request_id: string;
  patient_mrn?: string;
  amount_paid: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low income' | 'exempted' | 'other specific';
  other_specific?: string;
  approved_by?: string;
  paid_at: string;
}


export interface DentalEncounter {
  id: string;
  patient_mrn: string;
  visit_date: string;
  chief_complaint?: string;
  periodontal_status?: 'Healthy' | 'Gingivitis' | 'Periodontitis' | 'Other';
  recorded_by?: string;
}

export interface DentalToothCharting {
  id: string;
  encounter_id: string;
  tooth_number: number;
  surface?: string;
  condition_code?: string;
  clinical_notes?: string;
}

export interface DentalProcedure {
  id: string;
  encounter_id: string;
  procedure_name: string;
  tooth_number?: number;
  material_used?: string;
  duration_minutes?: number;
  cost_amount?: number;
  performed_by?: string;
}

export interface DentalTreatmentPlan {
  id: string;
  patient_mrn: string;
  plan_description?: string;
  priority?: 'Urgent' | 'Routine' | 'Elective';
  status: 'Planned' | 'In-Progress' | 'Completed';
  planned_start_date?: string;
  estimated_completion_date?: string;
}

export interface OphthalEncounter {
  id: string;
  patient_mrn: string;
  visit_date: string;
  chief_complaint?: string;
  anterior_segment_findings?: string;
  posterior_segment_findings?: string;
  recorded_by?: string;
}

export interface OphthalVital {
  id: string;
  encounter_id: string;
  od_acuity?: string;
  os_acuity?: string;
  iop_od?: number;
  iop_os?: number;
  ph_od?: string;
  ph_os?: string;
  clinical_notes?: string;
}

export interface OphthalPrescription {
  id: string;
  encounter_id: string;
  od_sphere?: number;
  od_cylinder?: number;
  od_axis?: number;
  od_add?: number;
  os_sphere?: number;
  os_cylinder?: number;
  os_axis?: number;
  os_add?: number;
  pupillary_distance?: number;
  prescription_notes?: string;
}

export interface OphthalProcedure {
  id: string;
  encounter_id: string;
  procedure_name: string;
  eye_involved?: 'OD' | 'OS' | 'OU';
  anesthesia_type?: string;
  surgical_findings?: string;
  implant_details?: string;
  performed_by?: string;
}

export interface PhysiatryEncounter {
  id: string;
  patient_mrn: string;
  visit_date: string;
  primary_impairment?: string;
  functional_goals?: string;
  pain_level_current?: number;
  cognitive_status?: string;
  mood_status?: string;
  recorded_by?: string;
}

export interface FunctionalAssessment {
  id: string;
  encounter_id: string;
  assessment_date: string;
  assessment_type?: string;
  total_score?: number;
  max_possible_score?: number;
  ambulation_status?: 'Independent' | 'Supervised' | 'Dependent' | 'Wheelchair' | 'Other';
  clinical_notes?: string;
}

export interface RehabTherapyLog {
  id: string;
  encounter_id: string;
  session_date: string;
  therapy_type?: 'Physical Therapy' | 'Occupational Therapy' | 'Speech Therapy' | 'Other';
  focus_area?: string;
  session_outcome?: 'Improved' | 'Stagnant' | 'Regression';
  therapist_name?: string;
  clinical_notes?: string;
}

export interface AssistiveDevice {
  id: string;
  patient_mrn: string;
  device_name: string;
  date_issued?: string;
  fitting_status?: 'Measured' | 'Fitted' | 'Follow-up' | 'Other';
  cost_to_patient?: number;
  is_returned: boolean;
  notes?: string;
}

export interface ArtEnrollment {
  id: string;
  patient_mrn: string;
  enrollment_date: string;
  hiv_confirmation_date?: string;
  who_stage?: number;
  baseline_cd4_count?: number;
  functional_status?: 'Working' | 'Ambulatory' | 'Bedridden' | 'Other';
  enrollment_type?: 'New' | 'Transfer-in' | 'Other';
  is_active: boolean;
  notes?: string;
}

export interface ArtRegimenLog {
  id: string;
  enrollment_id: string;
  regimen_name: string;
  line_of_treatment?: number;
  start_date: string;
  end_date?: string;
  reason_for_switch?: string;
  prescribed_by?: string;
}

export interface ArtLabMonitoring {
  id: string;
  enrollment_id: string;
  test_date: string;
  test_type: 'Viral Load' | 'CD4 Count' | 'Other';
  result_value: string;
  is_suppressed?: boolean;
  next_test_due_date?: string;
}

export interface ArtFollowupVisit {
  id: string;
  enrollment_id: string;
  appointment_date?: string;
  attendance_status?: 'Attended' | 'Missed' | 'Rescheduled' | 'Other';
  adherence_level?: 'Good' | 'Fair' | 'Poor' | 'Other';
  medication_refill_days?: number;
  provider_name?: string;
}

export interface TBCaseEnrollment {
  id: string;
  patient_mrn: string;
  enrollment_date: string;
  case_type?: 'New' | 'Relapse' | 'After Default' | 'Transfer-in' | 'Other';
  disease_site?: 'Pulmonary' | 'Extra-Pulmonary' | 'Other';
  weight_kg?: number;
  hiv_status?: 'Positive' | 'Negative' | 'Unknown';
  current_status?: 'On Treatment' | 'Cured' | 'Completed' | 'Died' | 'Lost' | 'Other';
  is_active: boolean;
}

export interface TBDiagnostic {
  id: string;
  case_id: string;
  sample_date: string;
  test_type?: 'Smear Microscopy' | 'GeneXpert (MTB/RIF)' | 'Chest X-Ray' | 'Other';
  result_status?: 'Negative' | 'Positive' | 'Rif-Resistant' | 'Indeterminate' | 'Other';
  lab_notes?: string;
  verified_by?: string;
}

export interface TBTreatmentLog {
  id: string;
  case_id: string;
  visit_date: string;
  current_phase?: 'Intensive' | 'Continuation' | 'Other';
  weight_kg?: number;
  adherence_type?: 'DOTS (Observed)' | 'Self-Administered' | 'Other';
  side_effects?: string;
  next_appointment_date?: string;
}

export interface TBTreatmentOutcome {
  id: string;
  case_id: string;
  outcome_date: string;
  outcome_category: 'Cured' | 'Treatment Completed' | 'Treatment Failure' | 'Died' | 'Lost to Follow-up' | 'Other';
  final_remarks?: string;
  recorded_by?: string;
}

export interface ChronicDiseaseRegistry {
  id: string;
  patient_mrn: string;
  condition_type: string;
  diagnosis_date?: string;
  baseline_severity?: 'Mild' | 'Moderate' | 'Severe' | 'Other';
  current_status: 'Active' | 'Remission' | 'Transferred' | 'Other';
  primary_care_provider?: string;
}

export interface ChronicOpdEncounter {
  id: string;
  registry_id: string;
  visit_date: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  random_blood_sugar?: number;
  weight_kg?: number;
  clinical_notes?: string;
  is_stable: boolean;
  next_follow_up_date?: string;
}

export interface ChronicLabMonitoring {
  id: string;
  encounter_id: string;
  test_type: string;
  result_value: number;
  reference_range?: string;
  is_at_target?: boolean;
  recorded_at: string;
}

export interface ChronicMedicationRefill {
  id: string;
  registry_id: string;
  medication_name: string;
  dosage?: string;
  quantity_dispensed: number;
  adherence_score?: number;
  side_effects_reported?: string;
  refill_date: string;
}

export interface CervicalCancerScreening {
  id: string;
  patient_mrn: string;
  screening_date: string;
  screening_method?: 'VIA' | 'VILI' | 'Pap Smear' | 'HPV DNA' | 'Other';
  visual_result?: 'Normal' | 'Acetowhite Lesion' | 'Suspicious for Cancer' | 'Other';
  disposition?: 'Screen Negative' | 'Eligible for Treatment' | 'Referral Required' | 'Other';
  provider_name?: string;
}

export interface CervicalCancerPathology {
  id: string;
  screening_id: string;
  sample_collection_date?: string;
  lab_report_date?: string;
  cytology_result?: 'Normal' | 'ASC-US' | 'LSIL' | 'HSIL' | 'SCC' | 'Other';
  biopsy_result?: string;
  lab_reference_number?: string;
}

export interface CervicalCancerTreatment {
  id: string;
  screening_id: string;
  procedure_name: string;
  procedure_date?: string;
  complications_noted?: string;
  post_op_instructions?: string;
  performed_by?: string;
}

export interface CervicalCancerSurveillance {
  id: string;
  patient_mrn: string;
  last_screening_result?: string;
  next_due_date?: string;
  surveillance_status: 'Active' | 'Discharged' | 'Lost to Follow-up' | 'Other';
  notes?: string;
}

export interface CashierAdmittedPatientPrescriptionVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  ward_name: string;
  rx_invoice: string;
  ward_rx_bill: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  other?: string;
  approved_name: string;
  date: string;
}

export interface CashierLiaisonDischargeDepositVerification {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  discharge_invoice: string;
  deposit_verified: string;
  amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  approved_name: string;
  date: string;
}

export interface PatientLiaisonDischargePayment {
  id: string;
  hospital_id: string;
  patient_mrn: string;
  admission_deposit: number;
  total_amount: number;
  difference_amount: number;
  remain_amount: number;
  additional_amount: number;
  payment_method: 'cash' | 'insurance' | 'prison' | 'police' | 'low_income' | 'exempted' | 'other';
  approved_name: string;
  date: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mrn: string;
  age: string;
  address: string;
  phone: string;
  referralPaperUrl?: string;
  hospital_id?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  reason: string;
  hospital_id?: string;
}

export interface User {
  id: string;
  email?: string;
  mobile_number?: string;
  passcode: string;
  full_name: string;
  role: 'all roles' | 'director' | 'admin' | 'user' | 'mid-manager' | 'other';
  customRole?: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
  hospital_id?: string;
  permissions?: string[];
  history?: string;
  location_restricted?: boolean;
}

