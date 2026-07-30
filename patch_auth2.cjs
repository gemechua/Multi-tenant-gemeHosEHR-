const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthGateway.tsx', 'utf-8');

// Remove Passcode validation
content = content.replace(/    if \(user\.passcode !== passcode\) \{[\s\S]*?return;\n    \}/, 
`    // Passcode validation removed for biometric login
    /* if (user.passcode !== passcode) {
      setError('Invalid passcode.');
      setLoading(false);
      return;
    } */`);

content = content.replace(/    if \(passcode !== confirmPasscode\) \{[\s\S]*?return;\n    \}/, 
`    // Passcode validation removed for biometric login
    /* if (passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      setLoading(false);
      return;
    } */`);

content = content.replace(/          \{\(mode === 'signup' \|\| mode === 'signin'\) && \([\s\S]*?Choose a passcode[\s\S]*?<\/div>\n          \)\}/, "");

content = content.replace(/          \{mode === 'signup' && \([\s\S]*?Confirm New Passcode[\s\S]*?<\/div>\n          \)\}/, "");

fs.writeFileSync('src/components/UserAuthGateway.tsx', content);
