const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthGateway.tsx', 'utf-8');

// Modify the handleSignIn function to work without an identifier
const handleSignInOld = `    try {
      const usersRef = collection(db, 'users');
      // Query by email OR mobile_number
      let q = query(
        usersRef,
        where('hospital_id', '==', bypassTenant),
        where('email', '==', identifier.trim())
      );
      
      let snap = await getDocs(q);
      
      if (snap.empty) {
        // Try mobile number
        q = query(
          usersRef,
          where('hospital_id', '==', bypassTenant),
          where('mobile_number', '==', identifier.trim())
        );
        snap = await getDocs(q);
      }

      if (snap.empty) {
        setError('No account found with this identifier in this organization.');
        setLoading(false);
        return;
      }`;

const handleSignInNew = `    try {
      const usersRef = collection(db, 'users');
      let snap;
      
      if (identifier.trim() !== '') {
        let q = query(
          usersRef,
          where('hospital_id', '==', bypassTenant),
          where('email', '==', identifier.trim())
        );
        snap = await getDocs(q);
        
        if (snap.empty) {
          q = query(
            usersRef,
            where('hospital_id', '==', bypassTenant),
            where('mobile_number', '==', identifier.trim())
          );
          snap = await getDocs(q);
        }
      } else {
        // Biometric-only login without identifier: get any user for this hospital
        const q = query(
          usersRef,
          where('hospital_id', '==', bypassTenant)
        );
        snap = await getDocs(q);
      }

      if (snap.empty) {
        setError('No account found. Please register an account first.');
        setLoading(false);
        return;
      }`;

content = content.replace(handleSignInOld, handleSignInNew);

// Make the identifier field optional on signin and remove "required" attribute
// We can just hide the identifier field entirely for sign in to make it pure biometric
content = content.replace(/\{\(mode === 'signup' \|\| mode === 'signin' \|\| mode === 'forgot'\) && \(/, 
`{(mode === 'signup' || mode === 'forgot') && (`);

// Hide the "Forgot Passcode?" button if it's still there
content = content.replace(/<button[^>]*>\s*Forgot Passcode\?\s*<\/button>/g, '');

fs.writeFileSync('src/components/UserAuthGateway.tsx', content);
