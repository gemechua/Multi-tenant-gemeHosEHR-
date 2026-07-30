import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Database, BarChart3, Megaphone, 
  Globe, Plug, Shield, Code, Bot, Zap, FileText, Braces, Settings, ShieldCheck,
  Search, ChevronDown, ChevronRight, Lock, Home as HomeIcon, Info,
  Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Building, Briefcase, FileSpreadsheet, ClipboardList,
  Activity, DollarSign, Camera, FlaskConical, Pill, BookOpen
} from 'lucide-react';
import { Language, translate } from '../lib/translations';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { validatePasscodeSignup } from '../lib/passcodeValidation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  activeHospital: any;
  onLogoutHospital: () => void;
  userRole?: 'owner' | 'user';
  currentLanguage?: Language;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed,
  activeHospital,
  onLogoutHospital,
  userRole = 'user',
  currentLanguage = 'en'
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(true);
  const [isLogbookExpanded, setIsLogbookExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<string[] | null>(null);
  const [signupPasscode, setSignupPasscode] = useState('');
  const [selectedRoleView, setSelectedRoleView] = useState<string>(() => {
    return localStorage.getItem('ehr_sidebar_role_view_department') || 'all';
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleRoleViewChange = (deptId: string) => {
    setSelectedRoleView(deptId);
    localStorage.setItem('ehr_sidebar_role_view_department', deptId);
  };

  const ROLE_VIEW_OPTIONS = [
    { id: 'all', label: 'All Departments (Full Access)', icon: Building, desc: 'Complete operational module suite' },
    { id: 'clinical', label: 'Clinical & Medical Care', icon: Activity, desc: 'OPD, IPD, Triage & Patient Services' },
    { id: 'pharmacy', label: 'Pharmacy & Dispensary', icon: FileText, desc: 'Medication, Stock & Dispensary' },
    { id: 'finance', label: 'Finance & Billing', icon: DollarSign, desc: 'Hospital Accounts, Cashier & Claims' },
    { id: 'hr', label: 'Human Resources (HR)', icon: Users, desc: 'Staffing, Evaluation & HR Records' },
    { id: 'facilities', label: 'Facilities & Biomedical', icon: Settings, desc: 'Environmental, Equipment & Bio-Med' },
    { id: 'security', label: 'Security & Guard Ops', icon: Shield, desc: 'Gate Control, Safety & Security Logs' },
    { id: 'admin', label: 'Administration & Executive', icon: ShieldCheck, desc: 'Governance, Audits & Platform Admin' },
  ];

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const docSnap = await getDoc(doc(db, 'user_settings', auth.currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.enabledCategories) setEnabledCategories(data.enabledCategories);
          if (data.signupPasscode) setSignupPasscode(data.signupPasscode);
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    };
    fetchUserSettings();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;
    const isFull = document.fullscreenElement || doc.webkitFullscreenElement;

    if (!isFull) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err: any) => {
          console.error(`Error attempting to enable fullscreen: ${err?.message}`);
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else {
        console.warn('Fullscreen API is not supported in this browser or iframe.');
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err: any) => {
          console.error(`Error attempting to exit fullscreen: ${err?.message}`);
        });
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  const handleSearchIconClick = () => {
    setIsSidebarCollapsed(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, show: true, departments: ['all', 'clinical', 'pharmacy', 'finance', 'hr', 'facilities', 'security', 'admin'] },
    { name: 'System Information', icon: Info, show: userRole === 'owner', departments: ['all', 'admin'] },
    { name: 'Data & Explorer', icon: Database, show: true, departments: ['all', 'clinical', 'pharmacy', 'finance', 'hr', 'facilities', 'security', 'admin'] },
    { 
      name: 'Register Logbook Register Table (Editable Format)', 
      icon: BookOpen, 
      show: true, 
      hasSubmenu: true,
      departments: ['all', 'clinical', 'admin'],
      submenu: [
        { name: 'Register Logbook Register Table (Editable Format)' },
        { name: 'HOSPITAL SERVICE ASSESSMENT AUDIT (CHAPTERS 1-23)' },
        { name: 'Departmental Report Hub' }
      ]
    },
    { name: 'Module 3: Health Service IS', icon: Database, show: true, departments: ['all', 'clinical', 'pharmacy', 'admin'] },
    { name: 'Module 4: Quality Improvement', icon: BarChart3, show: true, departments: ['all', 'clinical', 'admin'] },
    { name: 'Module 5: Environmental Health', icon: Activity, show: true, departments: ['all', 'facilities', 'admin'] },
    { name: 'Module 7: Human Resource Management', icon: Users, show: true, departments: ['all', 'hr', 'admin'] },
    { name: 'Module 9: Facility Equipment', icon: Settings, show: true, departments: ['all', 'facilities', 'admin'] },
    { name: 'Module 10: Bio Medical', icon: Activity, show: true, departments: ['all', 'facilities', 'clinical', 'admin'] },
    { name: 'Module 11: Pharmacy', icon: FileText, show: true, departments: ['all', 'pharmacy', 'clinical', 'admin'] },
    { name: 'Finance Department', icon: DollarSign, show: true, departments: ['all', 'finance', 'admin'] },
    { name: 'Module 12: Security Guard', icon: Shield, show: true, departments: ['all', 'security', 'admin'] },
    { name: 'Planning Module (Strategic & Operational)', icon: ClipboardList, show: true, departments: ['all', 'finance', 'admin'] },
    { name: 'Settings', icon: Settings, show: true, departments: ['all', 'clinical', 'pharmacy', 'finance', 'hr', 'facilities', 'security', 'admin'] },
    { name: 'Admin Dashboard', icon: ShieldCheck, show: true, departments: ['all', 'admin'] },
    { name: 'Users', icon: Users, show: true, departments: ['all', 'hr', 'admin'] },
    { 
      name: 'Privacy', 
      icon: Lock, 
      hasSubmenu: true, 
      show: userRole === 'owner',
      departments: ['all', 'admin'],
      submenu: [
        { name: 'System Information' },
        { name: 'Policy' },
        { name: 'Data Access' },
        { name: 'Backups' },
        { name: 'Analytics' },
        { name: 'SEO & GEO' },
        { name: 'Social content' },
        { name: 'Domains' },
        { name: 'Integrations' },
        { name: 'Security' },
        { name: 'Code' },
        { name: 'Agents' },
        { name: 'Automations' },
        { name: 'Logs' },
        { name: 'API' }
      ] 
    },
    { name: 'License Manager', icon: Shield, show: userRole === 'owner', departments: ['all', 'admin'] },
  ];

  // Filter items based on sidebar search, userRole, AND selected Role-View department
  const filteredItems = menuItems.filter(item => {
    // Only display links that are permitted for the current userRole
    if (!item.show) return false;

    // Filter by selected Role-View department
    if (selectedRoleView !== 'all' && item.departments) {
      if (!item.departments.includes(selectedRoleView)) {
        return false;
      }
    }

    // If it's a module item and enabledCategories is configured, check if enabled
    const moduleNames = [
      'Module 3: Health Service IS',
      'Module 4: Quality Improvement',
      'Module 5: Environmental Health',
      'Module 7: Human Resource Management',
      'Module 9: Facility Equipment',
      'Module 10: Bio Medical',
      'Module 11: Pharmacy',
      'Finance Department',
      'Module 12: Security Guard',
      'Planning Module (Strategic & Operational)',
      'Admin Dashboard',
      'Users'
    ];
    if (moduleNames.includes(item.name) && userRole !== 'owner') {
      const isValid = validatePasscodeSignup(userRole, signupPasscode, item.name, enabledCategories || []);
      if (!isValid) return false;
    }

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (matchesSearch) return true;

    if (item.hasSubmenu && item.submenu) {
      return item.submenu.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Default show if no search query
    if (!searchQuery) return true;

    return false;
  });

  const handleItemClick = (name: string) => {
    if (name === 'Privacy') {
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setIsPrivacyExpanded(true);
      } else {
        setIsPrivacyExpanded(!isPrivacyExpanded);
      }
    } else if (name === 'Register Logbook Register Table (Editable Format)') {
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setIsLogbookExpanded(true);
      } else {
        setIsLogbookExpanded(!isLogbookExpanded);
      }
      setActiveTab('Register Logbook Register Table (Editable Format)');
    } else {
      setActiveTab(name);
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen flex flex-col sticky top-0 overflow-y-auto shrink-0 transition-all duration-300 ${
      isSidebarCollapsed ? 'w-20 px-3 py-4' : 'w-64 p-4'
    }`}>
      {/* Application Logo & Header controls */}
      <div className={`flex items-center justify-between mb-5 ${isSidebarCollapsed ? 'flex-col gap-3' : 'px-2'}`}>
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-indigo-600/30 shrink-0">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none truncate">
                EHR OS
              </h1>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate block mt-0.5">
                Hospital Enterprise
              </span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-indigo-600/30 mx-auto mb-1">
            <Activity size={20} />
          </div>
        )}
        <div className={`flex items-center gap-1 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
          {/* Screen Size Minimize / Maximize (Fullscreen Toggle) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Minimize Screen Size" : "Maximize Screen Size (Fullscreen)"}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            id="fullscreen-toggle"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          {/* Side Nav Minimize / Maximize (Collapse Toggle) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Maximize Side Navigation" : "Minimize Side Navigation"}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            id="sidebar-toggle"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* Role-View Department Filter Widget */}
      {isSidebarCollapsed ? (
        <div className="mx-auto mb-3 text-center">
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            title={`Role-View Active: ${ROLE_VIEW_OPTIONS.find(r => r.id === selectedRoleView)?.label}. Click to expand & filter.`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-3xs relative ${
              selectedRoleView !== 'all'
                ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200/60'
            }`}
          >
            {(() => {
              const ActiveIcon = ROLE_VIEW_OPTIONS.find(r => r.id === selectedRoleView)?.icon || Building;
              return <ActiveIcon size={18} />;
            })()}
            {selectedRoleView !== 'all' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>
        </div>
      ) : (
        <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-2.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Role-View Filter
            </label>
            {selectedRoleView !== 'all' && (
              <button
                onClick={() => handleRoleViewChange('all')}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                title="Reset filter to show all modules"
              >
                ✕ Reset
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedRoleView}
              onChange={(e) => handleRoleViewChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-extrabold text-xs py-2 px-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-3xs cursor-pointer appearance-none pr-8"
            >
              {ROLE_VIEW_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 px-0.5">
            <span className="truncate max-w-[150px]">
              {ROLE_VIEW_OPTIONS.find(r => r.id === selectedRoleView)?.desc}
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
              {filteredItems.length} modules
            </span>
          </div>
        </div>
      )}

      {/* Sidebar Search */}
      {isSidebarCollapsed ? (
        <button
          onClick={handleSearchIconClick}
          title="Search navigation items"
          className="mx-auto mb-5 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-200 rounded-xl transition-all flex items-center justify-center w-10 h-10 cursor-pointer shadow-sm"
        >
          <Search size={16} />
        </button>
      ) : (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-gray-200 dark:focus:border-slate-700 focus:ring-1 focus:ring-gray-200 dark:focus:ring-slate-700 transition-colors"
          />
        </div>
      )}

      {/* Navigation list */}
      <div className="space-y-1 flex-1">
        {filteredItems.map((item) => {
          const isItemActive = activeTab === item.name || 
            (item.hasSubmenu && item.submenu?.some(sub => sub.name === activeTab));
          
          return (
            <div key={item.name} className="space-y-1">
              {/* Main Button */}
              <button
                onClick={() => handleItemClick(item.name)}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center transition-all duration-200 ${
                  isSidebarCollapsed 
                    ? 'justify-center p-2.5 mx-auto w-11 h-11 rounded-xl' 
                    : 'justify-between w-full p-2.5 rounded-lg text-sm'
                } ${
                  isItemActive 
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isItemActive ? 'text-gray-950 dark:text-white' : 'text-gray-400 dark:text-gray-500'} />
                  {!isSidebarCollapsed && <span>{translate(item.name, currentLanguage)}</span>}
                </div>

                {!isSidebarCollapsed && item.hasSubmenu && (
                  <div className="flex items-center gap-1.5">
                    {item.name === 'Privacy' 
                      ? (isPrivacyExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />)
                      : item.name === 'Register Logbook Register Table (Editable Format)'
                      ? (isLogbookExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />)
                      : null
                    }
                  </div>
                )}
              </button>

              {/* Submenu */}
              {!isSidebarCollapsed && item.hasSubmenu && (
                <div className={`pl-9 space-y-1 ${
                  (item.name === 'Privacy' && isPrivacyExpanded) ||
                  (item.name === 'Register Logbook Register Table (Editable Format)' && isLogbookExpanded)
                    ? 'block' 
                    : 'hidden'
                }`}>
                  {item.submenu?.map(sub => {
                    const isSubActive = activeTab === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setActiveTab(sub.name)}
                        className={`block w-full text-left py-1.5 px-2 text-xs rounded transition-colors ${
                          isSubActive
                            ? 'text-gray-950 dark:text-white font-semibold bg-gray-50 dark:bg-slate-800'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-250 hover:bg-gray-50/50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {translate(sub.name, currentLanguage)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tenant Session Status Segment Footer */}
      <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-auto space-y-2">
        {activeHospital ? (
          isSidebarCollapsed ? (
            <button 
              onClick={onLogoutHospital}
              title={`Active Tenant: ${activeHospital.name} (${activeHospital.hospital_unique_number}). Click to Exit Session.`}
              className="mx-auto w-10 h-10 bg-blue-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-blue-100 dark:border-slate-700 hover:border-rose-150 rounded-xl transition-all flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-rose-600 cursor-pointer shadow-3xs"
            >
              <Building size={16} />
            </button>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex gap-2 items-start">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
                  <Building size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                    {activeHospital.name}
                  </h4>
                  <p className="text-[9px] text-blue-600 dark:text-blue-400 font-mono font-extrabold tracking-wider uppercase mt-0.5">
                    {activeHospital.hospital_unique_number}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogoutHospital}
                className="w-full py-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/35 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-rose-100 dark:hover:border-rose-900 rounded-lg transition-all text-center cursor-pointer uppercase tracking-wider"
              >
                Switch Institution
              </button>
            </div>
          )
        ) : (
          isSidebarCollapsed ? (
            <div className="mx-auto w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400" title="Full Platform Access (Owner bypass mode)">
              <Shield size={16} />
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl space-y-1">
              <div className="flex gap-2 items-center">
                <Shield size={12} className="text-slate-500 dark:text-slate-400" />
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">System Owner Bypass</span>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                Full database access. Showing all hospital records combined.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
