import React, { useState, useEffect, useMemo } from 'react';
import { LocationData, UserProfile, CityVitals, CivicReport, ReportStatus } from '../types';
import { fetchRealTimeVitals } from '../services/geminiService';

interface DashboardProps {
  user: UserProfile;
  onReportClick: () => void;
  onAdminClick: () => void;
  onMyReportsClick: () => void;
  onRewardsClick: () => void;
  onMapClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  onCityAssistantClick: () => void;
  // REMOVED: onSwitchRole - Role switching not allowed in production
  onLogout?: () => void;
  location: LocationData | null;
  reports?: CivicReport[];
  onUpdateStatus?: (id: string, status: ReportStatus) => void;
  onUpvote?: (id: string) => void;
  unreadNotifications?: number;
}

// Progress Ring Component for Gamification
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
  progress,
  size = 80,
  strokeWidth = 6
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        stroke="currentColor"
        className="text-gray-100 dark:text-slate-700"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        className="progress-ring-circle"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onReportClick,
  onAdminClick,
  onMyReportsClick,
  onRewardsClick,
  onMapClick,
  onNotificationsClick,
  onSettingsClick,
  onCityAssistantClick,
  // onSwitchRole removed - role is immutable
  location,
  reports = [],
  onUpvote,
  unreadNotifications = 0
}) => {
  const [time, setTime] = useState(new Date());
  const [vitals, setVitals] = useState<CityVitals | null>(null);

  const t = (en: string, hi: string) => user.language === 'hi' ? hi : en;

  // Admin Analytics
  const stats = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'RESOLVED').length;
    const active = total - resolved;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const depts: Record<string, number> = { 'Nagar Nigam': 0, 'UIT': 0, 'PHED': 0, 'Other': 0 };
    reports.forEach(r => {
      const d = r.analysis?.department || '';
      if (d.includes('Nagar Nigam')) depts['Nagar Nigam']++;
      else if (d.includes('UIT')) depts['UIT']++;
      else if (d.includes('PHED') || d.includes('Water')) depts['PHED']++;
      else depts['Other']++;
    });

    return { total, resolved, active, resolutionRate, depts };
  }, [reports]);

  // Trending Reports (sorted by most recent)
  const trendingReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 4);
  }, [reports]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadVitals = async () => {
      try {
        const data = await fetchRealTimeVitals();
        setVitals(data);
      } catch {
        // Silently fail - vitals will show defaults
      }
    };
    loadVitals();
    const interval = setInterval(loadVitals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate user tier based on points
  const getUserTier = () => {
    if (user.points >= 1000) return { name: 'Gold', color: 'text-amber-500', bg: 'bg-amber-50', icon: '🏆' };
    if (user.points >= 500) return { name: 'Silver', color: 'text-slate-500', bg: 'bg-slate-50', icon: '🥈' };
    return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-50', icon: '🥉' };
  };
  const tier = getUserTier();

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">

      {/* ============ HEADER ============ */}
      <header className="px-6 pt-6 pb-4 bg-gradient-to-b from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with Status Ring */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 p-0.5 shadow-lg shadow-primary-500/25">
                <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&bold=true`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <span className="text-[10px]">✓</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Welcome back</span>
                <span className="text-xs">👋</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {user.name.split(' ')[0]}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-500 dark:text-gray-400">{location ? 'Udaipur, Rajasthan' : 'Locating...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Points Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full border border-amber-200/50 dark:border-amber-700/30">
              <span className="text-sm">⭐</span>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{user.points}</span>
            </div>
            
            {/* Notification Button */}
            <button 
              onClick={onNotificationsClick} 
              className="relative w-11 h-11 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center border border-gray-100 dark:border-slate-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            
            {/* Settings Button */}
            <button 
              onClick={onSettingsClick} 
              className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center border border-gray-100 dark:border-slate-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 space-y-8 px-6">

        {/* --- 1. DAILY BRIEF (Weather & status) --- */}
        <section className="animate-fade-in-up">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -translate-x-10 translate-y-10"></div>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Top Row - Date & Weather */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                    {time.toLocaleDateString([], { weekday: 'long' })}
                  </p>
                  <p className="text-white/90 text-sm">
                    {time.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{vitals?.condition === 'Sunny' ? '☀️' : vitals?.condition === 'Cloudy' ? '☁️' : '🌤️'}</div>
                  <div className="text-right">
                    <div className="text-3xl font-bold tracking-tight">{vitals?.temperature || '--'}</div>
                    <div className="text-xs text-slate-400">{vitals?.condition || 'Clear'}</div>
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* AQI */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${Number(vitals?.aqi) <= 50 ? 'bg-emerald-400' : Number(vitals?.aqi) <= 100 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Air Quality</span>
                  </div>
                  <div className="text-xl font-bold">{vitals?.aqi || '--'}</div>
                  <div className="text-[10px] text-slate-500">AQI Index</div>
                </div>
                
                {/* Traffic */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${vitals?.traffic === 'Low' ? 'bg-emerald-400' : vitals?.traffic === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Traffic</span>
                  </div>
                  <div className="text-xl font-bold">{vitals?.traffic || '--'}</div>
                  <div className="text-[10px] text-slate-500">City Roads</div>
                </div>
                
                {/* Water */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${vitals?.waterStatus === 'Normal' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Water</span>
                  </div>
                  <div className="text-xl font-bold">{vitals?.waterStatus === 'Normal' ? 'OK' : 'Low'}</div>
                  <div className="text-[10px] text-slate-500">Supply</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== CITIZEN VIEW ========== */}
        {user.role === 'CITIZEN' && (
          <div className="space-y-8 animate-fade-in-up stagger-1">

            {/* --- 2. HERO ACTION (Report) --- */}
            <button
              onClick={onReportClick}
              className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 p-6 text-left group shadow-xl shadow-primary-500/20 hover:shadow-2xl hover:shadow-primary-500/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10 group-hover:translate-x-5 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl -translate-x-5 translate-y-5"></div>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Quick Action</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">{t('Report Issue', 'समस्या रिपोर्ट करें')}</h2>
                  <p className="text-white/70 text-sm">{t('Snap, describe & submit in 30 seconds', 'फोटो लें, बताएं और जमा करें')}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg className="w-7 h-7 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {/* Bottom Stats */}
              <div className="relative z-10 flex items-center gap-4 mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📸</span>
                  <span className="text-white/70 text-xs">Photo Evidence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🤖</span>
                  <span className="text-white/70 text-xs">AI Analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⚡</span>
                  <span className="text-white/70 text-xs">Instant Submit</span>
                </div>
              </div>
            </button>

            {/* --- Quick Action Cards --- */}
            <div className="grid grid-cols-2 gap-4">
              {/* AI Assistant */}
              <button 
                onClick={onCityAssistantClick} 
                className="group bg-white dark:bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">AI Assistant</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ask anything about city services</p>
              </button>
              
              {/* Live Map */}
              <button 
                onClick={onMapClick} 
                className="group bg-white dark:bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🗺️</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Live Map</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">View all reported issues</p>
              </button>
              
              {/* My Reports */}
              <button 
                onClick={onMyReportsClick} 
                className="group bg-white dark:bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">My Reports</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Track your submissions</p>
              </button>
              
              {/* Rewards */}
              <button 
                onClick={onRewardsClick} 
                className="group bg-white dark:bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-700/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Rewards</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.points} karma points</p>
              </button>
            </div>

            {/* --- 3. TRENDING (Horizontal Scroll) --- */}
            {trendingReports.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Community Reports</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recent issues in your area</p>
                  </div>
                  <button onClick={onMapClick} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                    View all
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 snap-x snap-mandatory">
                  {trendingReports.map((report, idx) => (
                    <div 
                      key={report.id} 
                      className="min-w-[280px] bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700/50 flex-shrink-0 snap-start hover:shadow-lg transition-shadow"
                    >
                      {/* Image Section */}
                      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800">
                        {report.images && report.images.length > 0 ? (
                          <img src={report.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-50">🏙️</span>
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                            report.status === 'RESOLVED' ? 'bg-emerald-500/90 text-white' :
                            report.status === 'IN_PROGRESS' ? 'bg-amber-500/90 text-white' :
                            'bg-blue-500/90 text-white'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        {/* Urgency Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                            report.analysis?.urgency === 'Critical' ? 'bg-red-500/90 text-white' :
                            report.analysis?.urgency === 'High' ? 'bg-orange-500/90 text-white' :
                            'bg-slate-800/70 text-white'
                          }`}>
                            {report.analysis?.urgency || 'Normal'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 truncate">
                          {report.analysis?.category || 'Issue Reported'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {report.address || 'Udaipur'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-400">
                            {new Date(report.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">👍 {report.upvotes}</span>
                            <span className="flex items-center gap-1">💬 {report.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- 4. MY IMPACT --- */}
            <button onClick={onRewardsClick} className="w-full relative overflow-hidden rounded-2xl text-left group">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -translate-x-5 translate-y-5"></div>
              </div>
              
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-4">
                  {/* Progress Ring with Icon */}
                  <div className="relative">
                    <ProgressRing progress={tier.progress || (user.points % 100)} size={70} strokeWidth={5} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">{tier.icon}</span>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${tier.color}`}>{tier.name}</span>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-slate-400 text-xs">Rank #{Math.floor(Math.random() * 50) + 1}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{user.points.toLocaleString()}</span>
                      <span className="text-sm text-slate-500">karma points</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-amber-500 rounded-full transition-all" 
                          style={{ width: `${Math.min((user.points % 500) / 5, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500">{500 - (user.points % 500)} to next tier</span>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

          </div>
        )}

        {/* ========== ADMIN VIEW ========== */}
        {user.role === 'ADMIN' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* ... Admin content stays similar but wrapped in cleaner layout ... */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-lg border border-dashed border-gray-300 dark:border-slate-600">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                ⚡
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h2>
              <p className="text-gray-500 mb-6">Access the full command center to manage city operations.</p>

              <button
                onClick={onAdminClick}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-premium"
              >
                Launch Command Center
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 dark:bg-slate-800 p-5 rounded-2xl">
                <div className="text-3xl font-bold text-indigo-600 mb-1">{stats.active}</div>
                <div className="text-xs font-bold text-gray-500 uppercase">Active Issues</div>
              </div>
              <div className="bg-emerald-50 dark:bg-slate-800 p-5 rounded-2xl">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.resolutionRate}%</div>
                <div className="text-xs font-bold text-gray-500 uppercase">Resolution Rate</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};