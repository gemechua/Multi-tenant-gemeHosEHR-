const fs = require('fs');
let code = fs.readFileSync('src/components/DataExplorer.tsx', 'utf8');

const targetStr = `        {selectedEntityId !== 'DivisionShortcuts' && (
          <div className="px-6 py-2 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button 
              onClick={() => setSelectedEntityId('DivisionShortcuts')}
              className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase hover:bg-blue-50 px-2 py-1 rounded-lg transition-all border border-blue-100 hover:border-blue-200 shadow-3xs"
            >
              <Zap size={12} />
              <span>Division Shortcuts Hub</span>
            </button>
            <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-gray-100 text-gray-500 rounded">
                {React.createElement(selectedEntity.icon, { size: 10 })}
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedEntity.name}</span>
            </div>
          </div>
        )}`;

const replacement = `        <div className="px-6 py-2 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-gray-100 text-gray-500 rounded">
              {React.createElement(selectedEntity.icon, { size: 10 })}
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedEntity.name}</span>
          </div>
        </div>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('src/components/DataExplorer.tsx', code);
    console.log("Removed Division Shortcuts Hub!");
} else {
    console.log("Not found! exact match failed.");
}
