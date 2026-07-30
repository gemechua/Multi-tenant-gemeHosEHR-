const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  "const isEnabled = localStorage.getItem('batch_auto_save') === 'true';", 
  "const isEnabled = localStorage.getItem('ehr_autosave_heartbeat_enabled') !== 'false';"
);

fs.writeFileSync('src/App.tsx', content);
