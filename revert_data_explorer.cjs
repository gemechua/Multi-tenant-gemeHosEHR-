const fs = require('fs');
let code = fs.readFileSync('src/components/DataExplorer.tsx', 'utf8');

const targetStr = `            return (
              <div className="flex flex-col pb-4">
                {filteredSpecial.length > 0 && (
                  <div className="mb-2">`;

const replacement = `            const itemsToRender = [
              ...filteredSpecial.map(v => ({ ...v, isSpecial: true })),
              ...filteredEntities.map(id => ({ ...ENTITIES_CONFIG[id], isSpecial: false }))
            ];

            return itemsToRender.map((item) => {
              const Icon = item.icon;
              const isActive = selectedEntityId === item.id;
              const count = !item.isSpecial ? (stats[item.id] || 0) : 0;

              if (isEntitiesSidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEntityId(item.id);
                      setSearchQuery('');
                      setIsEntitiesSidebarCollapsed(true);
                      setIsSidebarCollapsed?.(true);
                    }}
                    title={\`\${item.name} \${!item.isSpecial ? \`(\${count} records)\` : ''} - \${item.subtitle}\`}
                    className={\`w-full flex flex-col items-center justify-center p-3.5 transition-all relative group \${
                      isActive 
                        ? 'bg-white border-l-4 border-gray-900 shadow-sm' 
                        : 'hover:bg-gray-50/70 border-l-4 border-transparent'
                    }\`}
                  >
                    <div className={\`p-2 rounded-lg shrink-0 \${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}\`}>
                      <Icon size={16} />
                    </div>
                    {!item.isSpecial && count > 0 && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] bg-emerald-500 text-white px-1 rounded-full font-bold leading-none">
                        {count}
                      </span>
                    )}
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md border border-gray-800">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-[9px] text-gray-300">{item.subtitle}</p>
                      {!item.isSpecial && <p className="text-[9px] text-emerald-400 mt-0.5">{count} records</p>}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEntityId(item.id);
                    setSearchQuery('');
                    setIsEntitiesSidebarCollapsed(true);
                    setIsSidebarCollapsed?.(true);
                  }}
                  className={\`w-full text-left p-3.5 flex items-start gap-3 transition-all \${
                    isActive 
                      ? 'bg-white border-l-4 border-gray-900 shadow-sm pl-2.5' 
                      : 'hover:bg-gray-50/70 border-l-4 border-transparent'
                  }\`}
                >
                  <div className={\`p-2 rounded-lg shrink-0 \${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}\`}>
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={\`text-xs font-bold truncate \${isActive ? 'text-gray-950 font-extrabold' : 'text-gray-700'}\`}>
                          {item.name}
                        </span>
                        {!item.isSpecial && item.id.startsWith('Form_1_1_1') && (
                          <span className="flex items-center gap-0.5 px-1 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded border border-indigo-100/50 shrink-0 shadow-3xs" title="Verified for real-time indexing">
                            <Check size={8} strokeWidth={3} />
                            Validated
                          </span>
                        )}
                        {item.isSpecial && (
                          <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded border border-amber-100/50 shrink-0 shadow-3xs">
                            <Sparkles size={8} strokeWidth={3} />
                            HUB
                          </span>
                        )}
                      </div>
                      {!item.isSpecial && (
                        <span className={\`text-[10px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 \${
                          count > 0 
                            ? isActive 
                              ? 'bg-gray-950 text-white border-gray-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-100/50'
                            : 'bg-gray-50 text-gray-400 border-gray-100/50'
                        }\`}>
                          {count}
                        </span>
                      )}
                    </div>
                    <p className={\`text-[10px] mt-0.5 font-medium truncate \${isActive ? 'text-gray-600' : 'text-gray-400'}\`}>
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            });`;

const idx = code.indexOf(targetStr);
if (idx !== -1) {
  // Find where it ends
  const endIdx = code.indexOf('          })()}', idx);
  if (endIdx !== -1) {
    code = code.substring(0, idx) + replacement + '\n' + code.substring(endIdx);
    fs.writeFileSync('src/components/DataExplorer.tsx', code);
    console.log("Reverted!");
  } else {
    console.log("End idx not found");
  }
} else {
  console.log("Target string not found");
}
