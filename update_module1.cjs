const fs = require('fs');
let file = fs.readFileSync('src/data/ehr_schema/module1.ts', 'utf8');

// We will use a regex to inject common fields into the `fields: [` array for every entity, but make sure we don't duplicate them.
let inFields = false;
const entities = file.split('fields: [');
let updatedFile = entities[0];

const commonFields = `
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string' },
      { key: 'date', label: 'Date/Time', type: 'date-time', defaultValue: new Date().toISOString() },`;

for (let i = 1; i < entities.length; i++) {
  let block = entities[i];
  if (!block.includes("'hospital_id'")) {
    updatedFile += `fields: [${commonFields}` + block;
  } else {
    updatedFile += `fields: [` + block;
  }
}

// Write the file back
fs.writeFileSync('src/data/ehr_schema/module1.ts', updatedFile);
