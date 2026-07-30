const fs = require('fs');

function replaceInFile(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');

    // Rename 'Intake Form' to 'Add Items Form'
    content = content.replace(/Intake Form/g, 'Add Items Form');
    content = content.replace(/intake form/g, 'add items form');
    content = content.replace(/Intake form/g, 'Add items form');

    // Rename 'IntakeForm' to 'AddItemsForm'
    content = content.replace(/IntakeForm/g, 'AddItemsForm');
    
    // Rename 'intake_form' to 'add_items_form'
    content = content.replace(/intake_form/g, 'add_items_form');

    // For other 'Intake' occurrences
    content = content.replace(/Intake/g, 'AddItems');
    content = content.replace(/intake/g, 'add_items');
    
    // Fix camelCase
    content = content.replace(/AddItems/g, 'AddItems');

    fs.writeFileSync(filename, content);
}

replaceInFile('src/data/ehr_schema/module1.ts');
replaceInFile('src/data/ehr_schema/legacy.ts');

console.log('Renamed in schema files');
