const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  const serviceAccount = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  const db = admin.firestore();
  
  const snapshot = await db.collection('financial_ledger').get();
  console.log(`Found ${snapshot.size} records.`);
  
  let batch = db.batch();
  let count = 0;
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
    count++;
    if (count % 500 === 0) {
      batch.commit();
      batch = db.batch();
    }
  });
  await batch.commit();
  console.log("Deleted all financial_ledger records.");
  
  // also check clinical_encounters or patients ?
  
  process.exit(0);
}
run();
