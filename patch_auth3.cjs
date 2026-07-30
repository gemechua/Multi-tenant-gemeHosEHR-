const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthGateway.tsx', 'utf-8');

// Remove Passcode validation for Sign In
content = content.replace(/    if \(userData\.passcode !== passcode\) \{[\s\S]*?return;\n    \}/, 
`    // Passcode validation removed for biometric login`);

// Remove Passcode validation for length
content = content.replace(/    if \(passcode\.length < 4\) \{[\s\S]*?return;\n    \}/, 
`    // Passcode validation removed for biometric login`);

fs.writeFileSync('src/components/UserAuthGateway.tsx', content);
