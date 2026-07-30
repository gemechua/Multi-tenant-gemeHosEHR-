const fs = require('fs');

function processFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    let blocks = content.split('fields: [');
    let out = blocks[0];
    
    for (let i = 1; i < blocks.length; i++) {
        let block = blocks[i];
        let newFields = '';
        if (!block.includes("key: 'hospital_id'")) {
            newFields += `\n      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },`;
        }
        if (!block.includes("key: 'patient_mrn'") && !block.includes("key: 'mrn'")) {
            newFields += `\n      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', required: true },`;
        }
        if (!block.includes("key: 'patient_name'") && !block.includes("key: 'full_name'")) {
            newFields += `\n      { key: 'patient_name', label: 'Patient Name', type: 'string' },`;
        }
        if (!block.includes("key: 'date'") && !block.includes("key: 'timestamp'") && !block.includes("date_given") && !block.includes("admission_date") && !block.includes("appointment_date") && !block.includes("dob") && !block.includes("dischargeDate")) {
            newFields += `\n      { key: 'date', label: 'Date/Time', type: 'date-time' },`;
        }
        
        // Find the end of the fields array to inject at the beginning
        out += `fields: [${newFields}` + block;
    }
    
    fs.writeFileSync(filename, out);
}

processFile('src/data/ehr_schema/legacy.ts');
processFile('src/data/ehr_schema/module1.ts');
console.log('Schemas fixed');
