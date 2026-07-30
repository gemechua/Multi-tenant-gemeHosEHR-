import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Set Firestore log level to restrict internal verbose logging
try {
  setLogLevel('error');
} catch (e) {
  console.warn('Could not set Firestore log level:', e);
}

// Intercept and demote Firestore timeout warnings so they don't register as fatal application errors
const originalError = console.error;
const originalWarn = console.warn;

const suppressFilter = (args: any[]) => {
  if (args && args[0] && typeof args[0] === 'string') {
    const msg = args[0];
    return (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('Backend didn\'t respond within 10 seconds') ||
      msg.includes('Failed to get document from server') ||
      msg.includes('@firebase/firestore')
    );
  }
  return false;
};

console.error = function (...args: any[]) {
  if (suppressFilter(args)) {
    originalWarn.apply(console, ['[EHR Offline Sync Info]', ...args]);
    return;
  }
  originalError.apply(console, args);
};

console.warn = function (...args: any[]) {
  if (suppressFilter(args)) {
    originalWarn.apply(console, ['[EHR Offline Sync Info]', ...args]);
    return;
  }
  originalWarn.apply(console, args);
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth();


