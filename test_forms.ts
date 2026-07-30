import { PATIENT_MODULE_ENTITIES } from './src/data/ehr_schema/module1';
const forms = Object.values(PATIENT_MODULE_ENTITIES).filter(e => e.id.startsWith('Form_1_1_1'));
console.log(forms.map(f => f.name).join('\n'));
