import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkCollections() {
  const colls = ['hr_attendance_records', 'hr_learning_upgrades', 'hr_staff_registry', 'hr_action_plans'];
  for (const c of colls) {
    const snap = await getDocs(collection(db, c));
    console.log(`Collection ${c}: ${snap.size} docs`);
    snap.docs.forEach(d => console.log('  doc:', d.id, d.data().tenantId));
  }
}

checkCollections().then(() => process.exit(0));
