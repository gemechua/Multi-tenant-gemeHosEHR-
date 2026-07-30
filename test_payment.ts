import { PATIENT_MODULE_ENTITIES } from './src/data/ehr_schema/module1';
const forms = Object.values(PATIENT_MODULE_ENTITIES).filter(e => e.id.startsWith('Form_1_1_1'));
const paymentForms = forms.filter(f => f.name.toLowerCase().includes('payment') || f.name.toLowerCase().includes('verification') || f.name.toLowerCase().includes('cashier'));
console.log(paymentForms.map(f => f.name).join('\n'));
