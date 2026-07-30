const fs = require('fs');

function replaceInFile(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');

    // For strings like 'Patient intake forms'
    content = content.replace(/intake form/gi, match => {
        if (match === 'intake form') return 'add items form';
        if (match === 'Intake Form') return 'Add Items Form';
        if (match === 'Intake form') return 'Add items form';
        return 'add items form';
    });
    
    // For strings like 'intake_forms'
    content = content.replace(/intake_form/g, 'add_items_form');
    
    content = content.replace(/IntakeForm/g, 'AddItemsForm');

    // For other 'Intake' occurrences
    content = content.replace(/Intake/g, 'AddItems');
    content = content.replace(/intake/g, 'add_items');

    fs.writeFileSync(filename, content);
}

replaceInFile('src/data/ehr_schema/module1.ts');
replaceInFile('src/data/ehr_schema/legacy.ts');
console.log('Renamed in schema files');
