const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importReplacement = `import { useAudioNotification } from './hooks/useAudioNotification';\nimport UserAuthGateway from './components/UserAuthGateway';`;
content = content.replace("import UserAuthGateway from './components/UserAuthGateway';", importReplacement);

const hookReplacement = `  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const { playSound } = useAudioNotification();`;
content = content.replace("  const [showQRScannerModal, setShowQRScannerModal] = useState(false);", hookReplacement);

const handleConnectionChange = `    const handleConnectionChange = () => {
      const isNowOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const manualSimulated = localStorage.getItem('ehr_simulated_offline_manual') === 'true';

      if (isNowOnline) {
        if (!manualSimulated) {
          localStorage.removeItem('ehr_simulated_offline');
          setIsSystemOffline(false);
        }
        addToast('success', '✓ Network Connected: Device is online. Synchronizing data...');
        playSound('online');
        handleSync();
      } else {
        setIsSystemOffline(true);
        addToast('info', '⚠️ Network Disconnected: Device is in offline mode.');
        playSound('offline');
      }
      runHeartbeat();
    };`;

content = content.replace(/    const handleConnectionChange = \(\) => {[\s\S]*?    };\n/, handleConnectionChange + "\n");

const batchAutoSave = `    const handleBatchAutoSave = (e: any) => {
      addToast('info', 'Autosaving... Changes successfully committed to background sync queue');
      playSound('success');
    };`;
content = content.replace(/    const handleBatchAutoSave = \(e: any\) => {[\s\S]*?    };\n/, batchAutoSave + "\n");

fs.writeFileSync('src/App.tsx', content);
