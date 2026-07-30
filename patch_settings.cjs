const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsTab.tsx', 'utf-8');

const importReplacement = `import {
  Settings, Moon, Sun, Monitor, CheckCircle, Clock, Camera, Mic,
  Activity, ShieldAlert, RefreshCw, CheckCircle2, AlertCircle, Sliders, Play, X,
  Database, Bell, BellOff
} from 'lucide-react';`;

let newContent = content.replace(/import \{[\s\S]*?\} from 'lucide-react';/, importReplacement);

const stateReplacement = `  const [activeSubTab, setActiveSubTab] = useState<'general' | 'attendance'>('general');

  const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
    return localStorage.getItem('ehr_autosave_heartbeat_enabled') !== 'false';
  });

  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('ehr_audio_notifications_enabled') === 'true';
  });

  const toggleAutosave = () => {
    const newVal = !autosaveEnabled;
    setAutosaveEnabled(newVal);
    localStorage.setItem('ehr_autosave_heartbeat_enabled', String(newVal));
    addToast?.('info', newVal ? 'Auto-save and heartbeat enabled' : 'Auto-save and heartbeat disabled');
  };

  const toggleAudio = () => {
    const newVal = !audioEnabled;
    setAudioEnabled(newVal);
    localStorage.setItem('ehr_audio_notifications_enabled', String(newVal));
    addToast?.('info', newVal ? 'Audio notifications enabled' : 'Audio notifications disabled');
  };`;

newContent = newContent.replace("const [activeSubTab, setActiveSubTab] = useState<'general' | 'attendance'>('general');", stateReplacement);

const settingsUIReplacement = `              </div>
            </section>

            {/* Offline Sync & Auto-Save */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Database size={16} className="text-indigo-600" /> SYSTEM HEARTBEAT & SYNC
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Periodic Heartbeat & Auto-Save</h4>
                  <p className="text-xs text-gray-500 mt-1">Enable or disable the 5-minute background database auto-save interval and network heartbeat.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAutosave}
                  className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 \${
                    autosaveEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }\`}
                >
                  <span
                    className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                      autosaveEnabled ? 'translate-x-6' : 'translate-x-1'
                    }\`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    System Audio Notifications
                    {audioEnabled ? <Bell size={14} className="text-indigo-600" /> : <BellOff size={14} className="text-gray-400" />}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">Play subtle sound alerts on critical record updates or offline status changes.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 \${
                    audioEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }\`}
                >
                  <span
                    className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                      audioEnabled ? 'translate-x-6' : 'translate-x-1'
                    }\`}
                  />
                </button>
              </div>
            </section>

            {/* Camera & Media Hardware Diagnostics Section */}`;

newContent = newContent.replace("              </div>\n            </section>\n\n            {/* Camera & Media Hardware Diagnostics Section */}", settingsUIReplacement);

fs.writeFileSync('src/components/SettingsTab.tsx', newContent);
