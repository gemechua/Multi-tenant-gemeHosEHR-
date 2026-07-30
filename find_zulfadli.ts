import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { ENTITIES_CONFIG } from './src/data/schema';

async function findZulfadli() {
  const collectionNames = Object.values(ENTITIES_CONFIG).map(e => e.collectionName);
  const uniqueCollections = Array.from(new Set(collectionNames));
  
  console.log(`Checking ${uniqueCollections.length} unique collections...`);
  
  let found = 0;
  
  for (const colName of uniqueCollections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const strData = JSON.stringify(data);
        if (strData.includes('Zulfadli') || strData.includes('Unknown Patient')) {
          console.log(`FOUND in ${colName}: DocID=${doc.id}, Name=${data.patient_name || data.name || data.full_name}`);
          found++;
        }
      });
    } catch (e) {
      // Ignore errors for collections that might not exist or be accessible
    }
  }
  console.log(`Finished scan. Found ${found} potential matches.`);
}

findZulfadli();
