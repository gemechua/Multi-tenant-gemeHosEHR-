import { PATIENT_MODULE_ENTITIES } from './src/data/ehr_schema/module1';

const allForms = Object.values(PATIENT_MODULE_ENTITIES)
  .filter(e => e.id.startsWith('Form_1_1_1'))
  .map(f => {
    const parts = f.name.split(' ');
    const code = parts[0];
    const title = parts.slice(1).join(' ');
    return {
      name: code.length <= 15 ? code : "FORM",
      subtitle: title,
      targetId: f.id,
      fullName: f.name.toLowerCase()
    };
  });

const paymentForms = allForms.filter(f => f.fullName.includes('payment') || f.fullName.includes('verification') || f.fullName.includes('cashier'));
const labForms = allForms.filter(f => !paymentForms.includes(f) && (f.fullName.includes('lab ') || f.fullName.includes('laboratory') || f.fullName.includes('diagnostic')));
const radForms = allForms.filter(f => !paymentForms.includes(f) && (f.fullName.includes('rad ') || f.fullName.includes('radiology') || f.fullName.includes('imaging')));
const pharmacyForms = allForms.filter(f => !paymentForms.includes(f) && (f.fullName.includes('prescription') || f.fullName.includes('medication') || f.fullName.includes('pharmacy') || f.fullName.includes('refill') || f.fullName.includes('drug')));
const surgeryForms = allForms.filter(f => !paymentForms.includes(f) && !pharmacyForms.includes(f) && !labForms.includes(f) && !radForms.includes(f) && (f.fullName.includes('surger') || f.fullName.includes('surgical') || f.fullName.includes('operat') || f.fullName.includes('or ') || f.fullName.includes('post-op') || f.fullName.includes('pacu') || f.fullName.includes('anesthesia') || f.fullName.includes('theatre')));
const triageForms = allForms.filter(f => !paymentForms.includes(f) && !surgeryForms.includes(f) && (f.fullName.includes('triage') || f.fullName.includes('vital') || f.fullName.includes('hemodynamic') || f.fullName.includes('oxygen') || f.fullName.includes('fluid') || f.fullName.includes('screening')));
const receptionForms = allForms.filter(f => !paymentForms.includes(f) && !triageForms.includes(f) && (f.fullName.includes('registration') || f.fullName.includes('liaison') || f.fullName.includes('book') || f.fullName.includes('appointment') || f.fullName.includes('enrollment')));
const maternityForms = allForms.filter(f => !paymentForms.includes(f) && !surgeryForms.includes(f) && !receptionForms.includes(f) && (f.fullName.includes('maternity') || f.fullName.includes('anc ') || f.fullName.includes('labor') || f.fullName.includes('birth') || f.fullName.includes('newborn') || f.fullName.includes('neonat') || f.fullName.includes('fp ') || f.fullName.includes('gyn') || f.fullName.includes('pac ') || f.fullName.includes('postnatal') || f.fullName.includes('pediatric')));
const inpatientForms = allForms.filter(f => !paymentForms.includes(f) && !surgeryForms.includes(f) && !maternityForms.includes(f) && !pharmacyForms.includes(f) && !labForms.includes(f) && !radForms.includes(f) && !receptionForms.includes(f) && !triageForms.includes(f) && (f.fullName.includes('inpatient') || f.fullName.includes('ward') || f.fullName.includes('admission') || f.fullName.includes('discharge') || f.fullName.includes('icu')));
const inventoryForms = allForms.filter(f => !paymentForms.includes(f) && (f.fullName.includes('supply') || f.fullName.includes('asset') || f.fullName.includes('stock') || f.fullName.includes('requisition') || f.fullName.includes('inventory')));

const clinicalForms = allForms.filter(f => 
  !paymentForms.includes(f) && 
  !labForms.includes(f) && 
  !radForms.includes(f) && 
  !pharmacyForms.includes(f) && 
  !surgeryForms.includes(f) && 
  !triageForms.includes(f) && 
  !receptionForms.includes(f) && 
  !maternityForms.includes(f) && 
  !inpatientForms.includes(f) && 
  !inventoryForms.includes(f)
);

console.log('Payment', paymentForms.length);
console.log('Lab', labForms.length);
console.log('Rad', radForms.length);
console.log('Pharmacy', pharmacyForms.length);
console.log('Surgery', surgeryForms.length);
console.log('Triage', triageForms.length);
console.log('Reception', receptionForms.length);
console.log('Maternity', maternityForms.length);
console.log('Inpatient', inpatientForms.length);
console.log('Inventory', inventoryForms.length);
console.log('Clinical', clinicalForms.length);

