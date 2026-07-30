const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthGateway.tsx', 'utf-8');

content = content.replace(/                <button \n                  onClick=\{.*?setMode\('forgot'\).*?\n                  className=".*?"\n                >\n                  Forgot Passcode\?\n                <\/button>/, '');

fs.writeFileSync('src/components/UserAuthGateway.tsx', content);
