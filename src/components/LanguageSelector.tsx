import React, { useState } from 'react';

const LANGUAGES = [
  { group: 'ETHIOPIAN', languages: ['Amharic', 'Oromo', 'Tigrinya', 'Somali', 'Afar', 'Sidamo', 'Wolaytta', 'Hadiyya', 'Gamo', 'Kaffa', 'Benishangul', 'Harari', 'Silte', 'Kebena', 'Alaba', 'Dawro', 'Gedeo', 'Konso', 'Burji', 'Argobba', 'Me\'en', 'Mursi', 'Suri', 'Anuak', 'Nuer'] },
  { group: 'INTERNATIONAL', languages: ['English', 'French', 'Spanish', 'Mandarin', 'Arabic', 'Russian', 'Hindi', 'Portuguese', 'Bengali', 'German', 'Japanese', 'Korean', 'Italian', 'Dutch', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Persian', 'Ukrainian', 'Polish', 'Swedish', 'Greek'] }
];

interface Props {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export default function LanguageSelector({ selectedLanguages, onChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      onChange(selectedLanguages.filter(l => l !== lang));
    } else {
      onChange([...selectedLanguages, lang]);
    }
  };

  const selectAll = () => {
    const all = LANGUAGES.flatMap(g => g.languages);
    onChange(all);
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredLanguages = LANGUAGES.map(group => ({
    ...group,
    languages: group.languages.filter(l => l && l.toLowerCase().includes((searchTerm || '').toLowerCase()))
  })).filter(group => group.languages.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search languages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>
      
      {filteredLanguages.map(group => (
        <div key={group.group} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-700 tracking-wider uppercase">{group.group} LANGUAGES</h4>
            <span className="text-[10px] font-semibold text-gray-400">
              {group.languages.filter(l => selectedLanguages.includes(l)).length} / {group.languages.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {group.languages.map(lang => {
              const isSelected = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{lang}</span>
                  {isSelected && <span className="text-[10px] font-black">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

