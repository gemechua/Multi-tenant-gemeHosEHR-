const fs = require('fs');
['src/data/ehr_schema/legacy.ts', 'src/data/ehr_schema/module1.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/, defaultValue: new Date\(\)\.toISOString\(\)/g, '');
  fs.writeFileSync(file, content);
});
