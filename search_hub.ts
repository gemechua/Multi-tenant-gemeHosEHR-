import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function searchHub() {
  const colRef = collection(db, 'form_1_1_1_2');
  const snapshot = await getDocs(colRef);
  console.log(`Checking form_1_1_1_2: found ${snapshot.size} records.`);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.patient_name === 'Zulfadli said' || data.name === 'Zulfadli said' || data.patient_mrn === '123456') {
      console.log(`FOUND in form_1_1_1_2: DocID=${doc.id}, Name=${data.patient_name || data.name}, MRN=${data.patient_mrn}`);
    }
  });
}

searchHub();
