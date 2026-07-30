const fs = require('fs');
let content = fs.readFileSync('src/components/SyncHistoryModal.tsx', 'utf-8');

content = content.replace(
  "export function SyncHistoryModal({ isOpen, onClose, queue }: SyncHistoryModalProps) {",
  "export default function SyncHistoryModal({ isOpen, onClose, queue = [] }: SyncHistoryModalProps) {"
);
content = content.replace(
  "queue: SyncQueueItem[];",
  "queue?: SyncQueueItem[];"
);

fs.writeFileSync('src/components/SyncHistoryModal.tsx', content);
