const fs = require('fs');

const alphabet = 'bcdefghijklmnopqrstuvwxyz'.split('');
let newEntities = '';

alphabet.forEach(letter => {
  const id = `Form_1_1_1_${letter}`;
  newEntities += `
  ${id}: {
    id: '${id}',
    name: '1.1.1.${letter} Form',
    collectionName: 'form_1_1_1_${letter}',
    icon: FileText,
    subtitle: 'Form 1.1.1.${letter}',
    description: 'Form 1.1.1.${letter}',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string' },
      { key: 'date', label: 'Date/Time', type: 'date-time' },
      { key: 'data', label: 'Data', type: 'textarea' }
    ],
    defaultSeed: []
  },`;
});

console.log(newEntities);
