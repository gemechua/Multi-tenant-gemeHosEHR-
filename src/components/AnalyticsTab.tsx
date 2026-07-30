import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Database, Globe, Activity, Clock, ShieldCheck, 
  Wifi, ArrowUpRight, ArrowDownRight, Play, RefreshCw, Sparkles, HelpCircle,
  TrendingUp, HardDrive, Cpu, Layers, Shield
} from 'lucide-react';
import OfflineStatus from './OfflineStatus';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid, Legend, Cell, PieChart, Pie,
  LineChart, Line
} from 'recharts';

type TimeRange = '24h' | '7d' | '30d';

interface AnalyticsDataPoint {
  time: string;
  admissions: number;
  syncs: number;
  queries: number;
}

interface DemoDataPoint {
  name: string;
  value: number;
  color: string;
}

export default function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [maxRetries, setMaxRetries] = useState(5);
  const [baseInterval, setBaseInterval] = useState(1000);
  const [activeTab, setActiveTab] = useState<'Overview' | 'OfflineStatus'>('Overview');
  const [isPublished, setIsPublished] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const [dbSuccessRate, setDbSuccessRate] = useState(99.9);
  const [systemUptime, setSystemUptime] = useState(99.98);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Time Series Data (Zeroed for baseline initialization)
  const [chartData, setChartData] = useState<AnalyticsDataPoint[]>([
    { time: 'Mon', admissions: 0, syncs: 0, queries: 0 },
    { time: 'Tue', admissions: 0, syncs: 0, queries: 0 },
    { time: 'Wed', admissions: 0, syncs: 0, queries: 0 },
    { time: 'Thu', admissions: 0, syncs: 0, queries: 0 },
    { time: 'Fri', admissions: 0, syncs: 0, queries: 0 },
    { time: 'Sat', admissions: 0, syncs: 0, queries: 0 },
    { time: 'Sun', admissions: 0, syncs: 0, queries: 0 },
  ]);

  // Demographic / Specialty Data (Zeroed for baseline initialization)
  const specialtyData: DemoDataPoint[] = [
    { name: 'Pediatrics', value: 0, color: '#3b82f6' },
    { name: 'General Medicine', value: 0, color: '#10b981' },
    { name: 'Cardiology', value: 0, color: '#8b5cf6' },
    { name: 'Gynecology', value: 0, color: '#ec4899' },
    { name: 'Emergency', value: 0, color: '#f59e0b' },
  ];

  const loginTrendData = [
    { day: 'Day 1', logins: 0 },
    { day: 'Day 2', logins: 0 },
    { day: 'Day 3', logins: 0 },
    { day: 'Day 4', logins: 0 },
    { day: 'Day 5', logins: 0 },
    { day: 'Day 6', logins: 0 },
    { day: 'Day 7', logins: 0 },
    { day: 'Day 8', logins: 0 },
    { day: 'Day 9', logins: 0 },
    { day: 'Day 10', logins: 0 },
    { day: 'Day 11', logins: 0 },
    { day: 'Day 12', logins: 0 },
    { day: 'Day 13', logins: 0 },
    { day: 'Day 14', logins: 0 },
    { day: 'Day 15', logins: 0 },
    { day: 'Day 16', logins: 0 },
    { day: 'Day 17', logins: 0 },
    { day: 'Day 18', logins: 0 },
    { day: 'Day 19', logins: 0 },
    { day: 'Day 20', logins: 0 },
    { day: 'Day 21', logins: 0 },
    { day: 'Day 22', logins: 0 },
    { day: 'Day 23', logins: 0 },
    { day: 'Day 24', logins: 0 },
    { day: 'Day 25', logins: 0 },
    { day: 'Day 26', logins: 0 },
    { day: 'Day 27', logins: 0 },
    { day: 'Day 28', logins: 0 },
    { day: 'Day 29', logins: 0 },
    { day: 'Day 30', logins: 0 }
  ];

  const auditTrailData = [
    { day: 'Day 1', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 2', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 3', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 4', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 5', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 6', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 7', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 8', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 9', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 10', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 11', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 12', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 13', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 14', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 15', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 16', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 17', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 18', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 19', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 20', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 21', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 22', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 23', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 24', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 25', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 26', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 27', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 28', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 29', adminChanges: 0, loginSpikes: 0 },
    { day: 'Day 30', adminChanges: 0, loginSpikes: 0 }
  ];

  // Dynamic real-time traffic simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPublished) {
      // Initialize with baseline live visitors
      setLiveVisitors(Math.floor(Math.random() * 8) + 3);
      setActiveSessionCount(Math.floor(Math.random() * 4) + 2);

      interval = setInterval(() => {
        setLiveVisitors(prev => {
          const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const nextVal = Math.max(1, prev + delta);
          return nextVal;
        });
        setActiveSessionCount(prev => {
          const delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
          return Math.max(1, prev + delta);
        });
        // Jitter other clinical system telemetry
        setDbSuccessRate(prev => {
          const shift = (Math.random() * 0.1 - 0.05);
          return parseFloat(Math.min(100, Math.max(99.4, prev + shift)).toFixed(2));
        });
      }, 4000);
    } else {
      setLiveVisitors(0);
      setActiveSessionCount(0);
    }

    return () => clearInterval(interval);
  }, [isPublished]);

  // Handle simulation trigger
  const handleTogglePublish = () => {
    if (!isPublished) {
      setIsPublished(true);
      setIsSimulating(true);
      setTimeout(() => setIsSimulating(false), 800);
    } else {
      setIsPublished(false);
    }
  };

  // Switch timeframe content
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range === '24h') {
      setChartData([
        { time: '00:00', admissions: 0, syncs: 0, queries: 0 },
        { time: '04:00', admissions: 0, syncs: 0, queries: 0 },
        { time: '08:00', admissions: 0, syncs: 0, queries: 0 },
        { time: '12:00', admissions: 0, syncs: 0, queries: 0 },
        { time: '16:00', admissions: 0, syncs: 0, queries: 0 },
        { time: '20:00', admissions: 0, syncs: 0, queries: 0 },
      ]);
    } else if (range === '7d') {
      setChartData([
        { time: 'Mon', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Tue', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Wed', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Thu', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Fri', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Sat', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Sun', admissions: 0, syncs: 0, queries: 0 },
      ]);
    } else {
      setChartData([
        { time: 'Week 1', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Week 2', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Week 3', admissions: 0, syncs: 0, queries: 0 },
        { time: 'Week 4', admissions: 0, syncs: 0, queries: 0 },
      ]);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12" id="analytics_container">
      {/* 1. Header Banner & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
            <BarChart2 className="text-blue-600 animate-pulse" size={24} />
            <span>Clinical Analytics & Telemetry</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Real-time usage audits, demographic charts, and database sync health matrices.</p>
        </div>

        {/* Time selector tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          {(['Overview', 'OfflineStatus'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-950 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              {tab === 'Overview' ? 'Overview' : 'Offline Status'}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeRange === range 
                  ? 'bg-white text-gray-950 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Content */}
      {activeTab === 'Overview' ? (
        <div className='space-y-8'>
          <div className="bg-white rounded-2xl border border-gray-250 p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-stretch gap-6">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
            
            <div className="space-y-4 flex-1 md:pl-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPublished ? 'bg-emerald-500 animate-ping' : 'bg-gray-300'}`}></span>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-400">
                  {isPublished ? 'Live Session Tracker' : 'Offline Engine Staged'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-bold text-gray-500 block">Analytics</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-gray-950 tracking-tight transition-all duration-300">
                    {liveVisitors}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">Live visitors</span>
                </div>
                <p className="text-xs text-gray-400 font-medium pt-1">
                  {isPublished 
                    ? 'Collecting real-time metadata across active clinics, emergency registers, and doctor terminals.' 
                    : 'Publish your app to start collecting data.'
                  }
                </p>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-col justify-center gap-2.5 w-full md:w-64 shrink-0 bg-gray-50/50 p-4 rounded-xl border border-gray-150/80">
              <button
                onClick={handleTogglePublish}
                disabled={isSimulating}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPublished 
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                    : 'bg-gray-950 text-white hover:bg-gray-850'
                }`}
              >
                {isSimulating ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : isPublished ? (
                  <span>Unpublish & Standby</span>
                ) : (
                  <span>Publish App Live</span>
                )}
              </button>
              
              <button
                disabled={!isPublished}
                onClick={() => {
                  setLiveVisitors(prev => prev + Math.floor(Math.random() * 5) + 3);
                  setActiveSessionCount(prev => prev + 2);
                  alert("Simulated clinic logins! Live visitors and telemetry adjusted.");
                }}
                className={`w-full py-2 px-3 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isPublished 
                    ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-100 bg-gray-50 text-gray-300 pointer-events-none'
                }`}
              >
                <Play size={11} />
                <span>Simulate Live Traffic</span>
              </button>
            </div>
          </div>

          {/* 3. Live Diagnostics / System Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Terminals</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Wifi size={10} /> Online
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-gray-950 tracking-tight">
                  {isPublished ? activeSessionCount + 4 : '1'}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <span className="text-emerald-500 font-semibold flex items-center">
                    <ArrowUpRight size={10} /> +12%
                  </span>
                  <span>vs last hour</span>
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sync Health</span>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  Synchronized
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-gray-950 tracking-tight">
                  {isPublished ? `${dbSuccessRate}%` : '99.9%'}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <span className="text-emerald-500 font-semibold flex items-center">
                    <ArrowUpRight size={10} /> 0.05%
                  </span>
                  <span>db write safety</span>
                </p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uptime Rate</span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  High Availability
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-gray-950 tracking-tight">{systemUptime}%</h3>
                <p className="text-[10px] text-gray-400 mt-1">Multi-regional health node sync</p>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Queue Latency</span>
                <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  Normal
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-gray-950 tracking-tight">14ms</h3>
                <p className="text-[10px] text-gray-400 mt-1">Average patient payload compile</p>
              </div>
            </div>
          </div>
          
          {/* ... etc ... */}
        </div>
      ) : (
        <OfflineStatus maxRetries={maxRetries} setMaxRetries={setMaxRetries} baseInterval={baseInterval} setBaseInterval={setBaseInterval} />
      )}

      {/* 4. Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Col span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">Patient Admissions & Sync Load</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Track secure EHR transactions across the system.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Admissions</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Sync Transactions</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSyncs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="admissions" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdmissions)" />
                <Area type="monotone" dataKey="syncs" stroke="#818cf8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSyncs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Specialty Breakdown (Col span 1) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">Cases by Specialty</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Demographics partition across clinics.</p>
            </div>

            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {specialtyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-xl font-bold text-gray-900">0</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Total Cases</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 pt-2">
              {specialtyData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4b. 30-Day Daily User Logins Line Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-1.5">
              <TrendingUp className="text-emerald-500" size={18} />
              <span>Daily User Logins Trend (Last 30 Days)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Provides the Director with routine account maintenance insights and clinical access trend audits.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active Login Sessions</span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loginTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} tickFormatter={(v) => v.replace('Day ', 'D')} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: '#34d399' }}
              />
              <Line 
                type="monotone" 
                dataKey="logins" 
                name="Daily Logins"
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4c. Audit Trail (30-Day Dual Line Chart) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-1.5">
              <Shield className="text-indigo-600 animate-pulse" size={18} />
              <span>System-Wide Audit Trail (Last 30 Days)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Dual-line analysis tracking administrative configuration changes mapped against clinical login spikes.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
              <span>Admin Changes</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span>Login Spikes</span>
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={auditTrailData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} tickFormatter={(v) => v.replace('Day ', 'D')} />
              <YAxis yAxisId="left" stroke="#4f46e5" fontSize={11} tickLine={false} label={{ value: 'Admin Changes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '9px', fill: '#4f46e5', fontWeight: 'bold' } }} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} tickLine={false} label={{ value: 'Login Spikes', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '9px', fill: '#3b82f6', fontWeight: 'bold' } }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="adminChanges" 
                name="Admin Changes"
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ffffff', stroke: '#4f46e5', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="loginSpikes" 
                name="Login Spikes"
                stroke="#3b82f6" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Geographic Network Health Distribution */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900">Hospital Node Distribution</h3>
            <p className="text-xs text-gray-500">Live connection topology across the health network nodes.</p>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            All Nodes Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-150 rounded-xl bg-gray-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">Primary Hospital Terminal</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-gray-400">Main Hospital EHR Node with complete master DB snapshot, syncing flawlessly.</p>
            <div className="text-[10px] font-mono text-gray-500 flex justify-between pt-1">
              <span>Ping: 8ms</span>
              <span>Load: 2.1%</span>
            </div>
          </div>

          <div className="p-4 border border-gray-150 rounded-xl bg-gray-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">Sheek Umer Aliye Clinic</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-gray-400">Offline-first diagnostic node serving active patient health records.</p>
            <div className="text-[10px] font-mono text-gray-500 flex justify-between pt-1">
              <span>Ping: 22ms</span>
              <span>Load: 0.8%</span>
            </div>
          </div>

          <div className="p-4 border border-gray-150 rounded-xl bg-gray-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">Regional Laboratory Node</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-gray-400">High-throughput diagnostics node handling medical, test, and query records.</p>
            <div className="text-[10px] font-mono text-gray-500 flex justify-between pt-1">
              <span>Ping: 14ms</span>
              <span>Load: 1.4%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
