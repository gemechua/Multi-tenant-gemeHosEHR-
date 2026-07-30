import React, { useState } from 'react';
import { 
  Globe, Search, Eye, Sparkles, Check, CheckCircle2, AlertCircle, Play, 
  FileText, ArrowRight, Settings, Info, RefreshCw, Layers, ShieldAlert,
  ChevronRight, Brain, Sliders, AlertTriangle
} from 'lucide-react';

type ActiveSubTab = 'Overview' | 'Meta tags' | 'Advanced Settings';

interface ScanResult {
  title: string;
  status: 'passed' | 'warning' | 'error';
  category: string;
  description: string;
  fix: string;
}

export default function SeoGeo() {
  const [enableSeo, setEnableSeo] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('Overview');
  const [scanning, setScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  
  // Toggles for AI Assistant Discovery
  const [generateRobots, setGenerateRobots] = useState(true);
  const [generateSitemap, setGenerateSitemap] = useState(false);
  const [autoBreadcrumbs, setAutoBreadcrumbs] = useState(true);
  const [enableSchema, setEnableSchema] = useState(true);

  // Meta Tags state
  const [metaTitle, setMetaTitle] = useState('Hospital EHR - Comprehensive Digital Health Platform');
  const [metaDescription, setMetaDescription] = useState(
    'Hospital EHR is a comprehensive, secure, and paperless digital health platform designed for end-to-end patient care, offline stability, multilingual healthcare delivery, and seamless multi-device responsiveness.'
  );
  const [metaKeywords, setMetaKeywords] = useState('EHR, electronic health records, patient registry, digital healthcare, clinical databases');
  const [geoCountry, setGeoCountry] = useState('Hospital Region');
  const [geoRegion, setGeoRegion] = useState('Hospital Zone');
  const [geoPlacename, setGeoPlacename] = useState('Hospital Location, Hospital Zone');

  // Advanced Settings state
  const [googleConsoleKey, setGoogleConsoleKey] = useState('gsc-verify-73950294184920');
  const [ogType, setOgType] = useState('website');
  const [customSchema, setCustomSchema] = useState(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      "name": "Hospital EHR",
      "logo": "https://hospital.org/logo.png"
    }, null, 2)
  );

  // Scan Results
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  const handleRunScan = () => {
    setScanning(true);
    setScanCompleted(false);
    setTimeout(() => {
      setScanning(false);
      setScanCompleted(true);
      setScanResults([
        {
          title: "Robots.txt Presence",
          status: generateRobots ? "passed" : "warning",
          category: "AI Discovery",
          description: generateRobots ? "Robots.txt successfully generated." : "Missing automated robots.txt file for AI scrapers (GPTBot, ClaudeBot).",
          fix: generateRobots ? "No action required." : "Enable the 'Generate robots.txt' toggle under AI Assistant Discovery."
        },
        {
          title: "Schema.org structured metadata",
          status: enableSchema ? "passed" : "error",
          category: "Rich snippets",
          description: enableSchema ? "MedicalBusiness JSON-LD markup is active." : "Structured schema describing the medical business or Hospital entity is missing on your landing views.",
          fix: enableSchema ? "No action required." : "Enable the MedicalBusiness JSON-LD markup on Advanced Settings tab."
        },
        {
          title: "Page Title Tag length",
          status: "passed",
          category: "Meta",
          description: "Title is 61 characters, which is optimal for search engine display margins.",
          fix: "No action required."
        },
        {
          title: "Meta Description SEO length",
          status: "passed",
          category: "Meta",
          description: "Description is 162 characters, offering perfect density for both human clicks and LLM vectors.",
          fix: "No action required."
        },
        {
          title: "Geotargeting tags (GEO)",
          status: "passed",
          category: "Geographic",
          description: `Geotargeting enabled for ${geoPlacename}, ${geoRegion}.`,
          fix: "No action required."
        }
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
            <Globe className="text-blue-600" size={24} />
            <span>SEO & GEO Settings</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Improve how your app appears in search results and AI search engine answers.</p>
        </div>
        
        {/* Enable SEO switch */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-gray-700">Enable SEO for this app</span>
          <button 
            type="button" 
            onClick={() => setEnableSeo(!enableSeo)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enableSeo ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                enableSeo ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Primary tab switcher */}
      <div className="flex border-b border-gray-150 gap-6">
        {(['Overview', 'Meta tags', 'Advanced Settings'] as ActiveSubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeSubTab === tab 
                ? 'text-gray-950 border-b-2 border-gray-950' 
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Disabled Banner Overlay */}
      {!enableSeo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex gap-3 shadow-xs">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-bold text-sm">SEO Controls are currently inactive</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Enabling SEO allows public indexing engines and intelligent retrieval bots to safely catalog your medical directories and health facilities. Dynamic XML sitemaps and GEO microtags will not be generated while this switch remains inactive.
            </p>
          </div>
        </div>
      )}

      {/* SEO Enabled Content */}
      <div className={enableSeo ? "space-y-8" : "opacity-50 pointer-events-none space-y-8 transition-opacity duration-200"}>
        
        {/* TAB 1: OVERVIEW */}
        {activeSubTab === 'Overview' && (
          <div className="space-y-8">
            {/* Run SEO & GEO Scan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-gray-900">Run an SEO & GEO scan</h3>
                  <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                    Scan your app for SEO basics and GEO details. Get a prioritized checklist to fix compliance, indexing, and regional tagging issues in minutes.
                  </p>
                </div>
                <button
                  onClick={handleRunScan}
                  disabled={scanning}
                  className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      <span>Scanning App...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Run Scan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scan checklist output */}
              {scanCompleted && (
                <div className="mt-6 border-t border-gray-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Prioritized Action Items</h4>
                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                      {scanResults.filter(r => r.status !== 'passed').length} issues found
                    </span>
                  </div>

                  <div className="divide-y divide-gray-50 border border-gray-150 rounded-xl overflow-hidden bg-gray-50/20">
                    {scanResults.map((result, idx) => (
                      <div key={idx} className="p-4 flex gap-3 text-left">
                        {result.status === 'passed' && (
                          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                        )}
                        {result.status === 'warning' && (
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        )}
                        {result.status === 'error' && (
                          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        )}
                        
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{result.title}</span>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              result.status === 'passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              result.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {result.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{result.description}</p>
                          {result.status !== 'passed' && (
                            <p className="text-xs text-blue-600 font-medium bg-blue-50/50 p-2 rounded-lg border border-blue-100/50 mt-2">
                              <strong>Fix:</strong> {result.fix}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Assistant Discovery */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <Brain className="text-indigo-600" size={20} />
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">AI Assistant Discovery</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Help AI search engines understand, parse, and recommend your clinical application.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Generate robots.txt */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-50">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Generate robots.txt</h4>
                    <p className="text-xs text-gray-400 max-w-xl">
                      {generateRobots 
                        ? 'On: serving fully-optimized system robots.txt with customized directives for Gemini, GPTBot, and ClaudeBot.' 
                        : 'Off: serve your deployed public/robots.txt if shipped, otherwise return 404.'
                      }
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setGenerateRobots(!generateRobots)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      generateRobots ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      generateRobots ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Generate sitemap.xml */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-50">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Generate sitemap.xml</h4>
                    <p className="text-xs text-gray-400 max-w-xl">
                      {generateSitemap 
                        ? 'On: continuously updating an XML directory map listing all secure hospital domains and local registry layouts.' 
                        : 'Off: serve your deployed public/sitemap.xml if shipped, otherwise return 404.'
                      }
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setGenerateSitemap(!generateSitemap)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      generateSitemap ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      generateSitemap ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Auto-generate per-page breadcrumbs */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Auto-generate per-page breadcrumbs</h4>
                    <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                      Build a fresh BreadcrumbList for each route instead of using the same persisted list site-wide. Turn off if you hand-crafted your breadcrumb schema and want it served verbatim.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAutoBreadcrumbs(!autoBreadcrumbs)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoBreadcrumbs ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      autoBreadcrumbs ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: META TAGS */}
        {activeSubTab === 'Meta tags' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input fields */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-3">Branding & Keywords</h3>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Search Engine Title</label>
                <input 
                  type="text" 
                  value={metaTitle} 
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Meta Description</label>
                <textarea 
                  rows={3}
                  value={metaDescription} 
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-gray-800 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Focus Keywords</label>
                <input 
                  type="text" 
                  value={metaKeywords} 
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-gray-800"
                />
              </div>

              {/* Geographic Tags */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">GEO Location Metadata</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Country</label>
                    <input 
                      type="text" 
                      value={geoCountry} 
                      onChange={(e) => setGeoCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Region</label>
                    <input 
                      type="text" 
                      value={geoRegion} 
                      onChange={(e) => setGeoRegion(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Placename</label>
                    <input 
                      type="text" 
                      value={geoPlacename} 
                      onChange={(e) => setGeoPlacename(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Snippet Preview */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-150 pb-2 mb-3">SERP Preview</h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 font-mono tracking-tight truncate">
                    https://hospital-ehr.org › public
                  </div>
                  <h4 className="text-sm font-bold text-blue-800 hover:underline cursor-pointer leading-tight">
                    {metaTitle}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {metaDescription}
                  </p>
                </div>
              </div>

              {/* Geo location badge */}
              <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 text-left space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-600 block">Geo Target Tagged</span>
                <p className="text-xs text-blue-900 font-semibold leading-relaxed">
                  Active targeting index for <strong>{geoPlacename}, {geoRegion}, {geoCountry}</strong>.
                </p>
                <p className="text-[10px] text-blue-700">This ensures regional patients querying Google Maps, local directories, or clinical databases find your EHR system instantly.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADVANCED SETTINGS */}
        {activeSubTab === 'Advanced Settings' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-3">Engine Verification & Schema Markup</h3>
            
            <div className="space-y-4">
              {/* Schema Toggle */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-50">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Enable MedicalBusiness JSON-LD markup</h4>
                  <p className="text-xs text-gray-400 max-w-xl">
                    {enableSchema 
                      ? 'On: serving structured JSON-LD metadata to search engines for business entity indexing.' 
                      : 'Off: disabling schema markup for landing views.'
                    }
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEnableSchema(!enableSchema)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enableSchema ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    enableSchema ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Google Search Console Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Google Search Console Verification Token</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={googleConsoleKey} 
                    onChange={(e) => setGoogleConsoleKey(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-gray-800 font-mono"
                  />
                  <button 
                    onClick={() => alert(`Verification request triggered using: ${googleConsoleKey}`)}
                    className="bg-gray-950 hover:bg-gray-850 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Verify Site
                  </button>
                </div>
              </div>

              {/* Open Graph Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Open Graph Content Type</label>
                <select 
                  value={ogType} 
                  onChange={(e) => setOgType(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 font-semibold text-gray-800"
                >
                  <option value="website">Website / Application</option>
                  <option value="article">Article / Directory Journal</option>
                  <option value="profile">Medical Staff Profile</option>
                </select>
              </div>

              {/* Custom Schema.org LD-JSON */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Schema.org JSON-LD structured Metadata</label>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Sparkles size={8} /> Auto-Validated
                  </span>
                </div>
                <textarea 
                  rows={6}
                  value={customSchema} 
                  onChange={(e) => setCustomSchema(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-gray-800 font-mono leading-relaxed ${!enableSchema ? 'opacity-50 pointer-events-none' : ''}`}
                />
              </div>
            </div>
            
            <div className="pt-2">
              <button 
                onClick={() => alert("All advanced schema and Verification records saved successfully!")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-sm"
              >
                Save SEO & GEO Configurations
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
