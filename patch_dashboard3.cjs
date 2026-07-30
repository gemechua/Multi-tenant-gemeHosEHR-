const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

content = content.replace(
  "import { SyncHistoryModal, SyncQueueItem } from './SyncHistoryModal';",
  "import SyncHistoryModal, { SyncQueueItem } from './SyncHistoryModal';"
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
