const fs = require('fs');
const file = fs.readFileSync('src/data/ehr_schema/module1.ts', 'utf8');

// We will use a regex to inject common fields into the `fields: [` array for every entity
// common fields:
const commonFields = `
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string' },
      { key: 'date', label: 'Date/Time', type: 'date-time' },`;

let updatedFile = file.replace(/fields:\s*\[/g, `fields: [${commonFields}`);

// Clean up any potential duplicates if 'hospital_id' or 'patient_mrn' were already there
// Actually, it's safer to parse the JS, or just do a smart replace.

fs.writeFileSync('src/data/ehr_schema/module1.ts.new', updatedFile);
