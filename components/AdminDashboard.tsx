import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CivicReport, ReportStatus, Notification, Language, CityVitals } from '../types';
import { broadcastNotification, addNotification } from '../services/localStorageService';
import { fetchRealTimeVitals } from '../services/geminiService';

declare const L: any;

interface AdminDashboardProps {
  reports: CivicReport[];
  onBack: () => void;
  onUpdateStatus: (reportId: string, newStatus: ReportStatus) => void;
  userName?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
}

type Tab = 'HOME' | 'REPORTS' | 'MAP' | 'BROADCAST' | 'SETTINGS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  onBack,
  onUpdateStatus,
  userName = 'Admin',
  darkMode,
  onToggleDarkMode,
  language,
  onChangeLanguage
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [time, setTime] = useState(new Date());
  const [vitals, setVitals] = useState<CityVitals | null>(null);
  
  // Translation helper
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapFilter, setMapFilter] = useState<'ALL' | 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'CITIZEN'>('ALL');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Load vitals and time
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

  // Initialize map when MAP tab is active
  useEffect(() => {
    if (activeTab !== 'MAP' || !mapRef.current || mapInstance.current) return;

    const UDAIPUR_CENTER = { lat: 24.5854, lng: 73.7125 };
    
    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([UDAIPUR_CENTER.lat, UDAIPUR_CENTER.lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeTab]);

  // Update map markers
  useEffect(() => {
    if (!mapInstance.current || activeTab !== 'MAP') return;

    // Clear existing markers
    mapInstance.current.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        mapInstance.current.removeLayer(layer);
      }
    });

    const filteredReports = mapFilter === 'ALL' ? reports : reports.filter(r => r.status === mapFilter);

    filteredReports.forEach(report => {
      if (!report.location) return;

      const statusColors: Record<string, { fill: string; border: string }> = {
        'SUBMITTED': { fill: '#3b82f6', border: '#bfdbfe' },
        'IN_PROGRESS': { fill: '#f59e0b', border: '#fef3c7' },
        'RESOLVED': { fill: '#10b981', border: '#d1fae5' },
        'REJECTED': { fill: '#ef4444', border: '#fee2e2' }
      };

      const colors = statusColors[report.status] || statusColors['SUBMITTED'];

      const marker = L.circleMarker([report.location.latitude, report.location.longitude], {
        radius: report.analysis?.urgency === 'Critical' ? 12 : 8,
        fillColor: colors.fill,
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(mapInstance.current);

      marker.on('click', () => {
        setSelectedReport(report);
      });

      // Add popup
      marker.bindPopup(`
        <div style="min-width: 150px;">
          <strong>${report.analysis?.category || 'Issue'}</strong><br/>
          <small>${report.status.replace('_', ' ')}</small><br/>
          <small>📍 ${report.address?.split(',')[0] || 'Unknown'}</small>
        </div>
      `);
    });
  }, [reports, mapFilter, activeTab]);

  // --- Statistics ---
  const stats = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'RESOLVED').length;
    const inProgress = reports.filter(r => r.status === 'IN_PROGRESS').length;
    const submitted = reports.filter(r => r.status === 'SUBMITTED').length;
    const rejected = reports.filter(r => r.status === 'REJECTED').length;
    const critical = reports.filter(r => r.analysis?.urgency === 'Critical').length;
    const high = reports.filter(r => r.analysis?.urgency === 'High').length;
    const normal = reports.filter(r => r.analysis?.urgency === 'Normal' || !r.analysis?.urgency).length;
    
    const categories: Record<string, number> = {};
    reports.forEach(r => {
      const cat = r.analysis?.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return { total, resolved, inProgress, submitted, rejected, critical, high, normal, categories };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (filterStatus === 'ALL') return reports;
    return reports.filter(r => r.status === filterStatus);
  }, [reports, filterStatus]);

  // --- Handlers ---
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    onUpdateStatus(reportId, newStatus);
    
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const statusMessages: Record<ReportStatus, string> = {
        'SUBMITTED': 'Your report has been received',
        'IN_PROGRESS': 'Good news! Your report is now being worked on by our team',
        'RESOLVED': 'Your reported issue has been resolved. Thank you for helping improve our city!',
        'REJECTED': 'Your report could not be processed. Please contact support for details.'
      };
      
      addNotification({
        userId: report.userId,
        type: 'STATUS_UPDATE',
        title: `Report ${newStatus.replace('_', ' ')}`,
        message: statusMessages[newStatus],
        priority: newStatus === 'RESOLVED' ? 'high' : 'normal',
        read: false
      });
    }
    
    setSelectedReport(null);
  };

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcastSending(true);
    try {
      broadcastNotification({
        type: 'CITY_ALERT',
        title: broadcastTitle,
        message: broadcastMessage,
        targetRole: broadcastTarget,
        priority: 'high'
      } as any);
      
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch {
      // Broadcast failed - show error to user
      setBroadcastSuccess(false);
    } finally {
      setBroadcastSending(false);
    }
  };

  // Donut Chart Component
  const DonutChart = ({ data, colors }: { data: { label: string; value: number }[], colors: string[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-slate-400 py-8">No data</div>;
    
    let cumulativePercent = 0;

    return (
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            {data.map((item, i) => {
              const percent = (item.value / total) * 100;
              const dashArray = `${percent} ${100 - percent}`;
              const dashOffset = 25 - cumulativePercent;
              cumulativePercent += percent;
              return (
                <circle
                  key={i}
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="3.8"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{total}</span>
            <span className="text-[10px] text-slate-500">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.filter(d => d.value > 0).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></div>
              <span className="flex-1 text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Progress Bar Component  
  const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );

  // Report Detail Modal
  const ReportDetailModal = () => {
    if (!selectedReport) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
        <div 
          className={`w-full max-w-lg ${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-t-3xl max-h-[85vh] overflow-auto`}
          onClick={e => e.stopPropagation()}
        >
          <div className="relative h-44">
            {selectedReport.images && selectedReport.images.length > 0 ? (
              <img src={selectedReport.images[0]} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
                <span className="text-5xl">🏙️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <button 
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white text-sm"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wide">
                {selectedReport.analysis?.category || 'General'}
              </span>
              <p className="text-white/80 text-sm mt-2 line-clamp-2">{selectedReport.description}</p>
            </div>
          </div>
          
          <div className={`p-5 space-y-4 ${darkMode ? 'text-white' : ''}`}>
            <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                selectedReport.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-900/50' :
                selectedReport.status === 'IN_PROGRESS' ? 'bg-amber-100 dark:bg-amber-900/50' :
                selectedReport.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-blue-100 dark:bg-blue-900/50'
              }`}>
                {selectedReport.status === 'RESOLVED' ? '✅' : selectedReport.status === 'IN_PROGRESS' ? '⚙️' : selectedReport.status === 'REJECTED' ? '❌' : '📥'}
              </span>
              <div className="flex-1">
                <div className="font-bold text-sm">{selectedReport.status.replace('_', ' ')}</div>
                <div className="text-[11px] text-slate-500">{new Date(selectedReport.timestamp).toLocaleDateString()}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                selectedReport.analysis?.urgency === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                selectedReport.analysis?.urgency === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 
                'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              }`}>{selectedReport.analysis?.urgency || 'Normal'}</span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <span>📍</span>
              <span className="text-slate-600 dark:text-slate-300 text-xs">{selectedReport.address || 'Location not specified'}</span>
            </div>
            
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Update Status</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { status: 'IN_PROGRESS' as ReportStatus, icon: '⚙️', label: 'In Progress', bg: 'bg-amber-500', activeBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300' },
                  { status: 'RESOLVED' as ReportStatus, icon: '✅', label: 'Resolved', bg: 'bg-emerald-500', activeBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' },
                  { status: 'REJECTED' as ReportStatus, icon: '❌', label: 'Rejected', bg: 'bg-red-500', activeBg: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' },
                  { status: 'SUBMITTED' as ReportStatus, icon: '📥', label: 'Reset', bg: 'bg-blue-500', activeBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' }
                ].map(item => (
                  <button
                    key={item.status}
                    onClick={() => handleStatusChange(selectedReport.id, item.status)}
                    disabled={selectedReport.status === item.status}
                    className={`p-3 rounded-xl font-bold text-xs transition-all ${
                      selectedReport.status === item.status 
                        ? item.activeBg + ' cursor-default' 
                        : item.bg + ' text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const statusColors: Record<string, string> = {
    'SUBMITTED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'IN_PROGRESS': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    'RESOLVED': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    'REJECTED': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50'} font-sans overflow-hidden`}>
      
      {/* ============ HEADER (Citizen Style) ============ */}
      <header className={`px-5 pt-5 pb-4 ${darkMode ? 'bg-slate-900' : 'bg-white'} z-30`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/25">
                <div className={`w-full h-full rounded-[14px] ${darkMode ? 'bg-slate-800' : 'bg-white'} flex items-center justify-center overflow-hidden`}>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <span className="text-[8px]">✓</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium text-slate-400">Welcome back</span>
                <span className="text-xs">👋</span>
              </div>
              <h1 className="text-lg font-bold leading-tight">{userName}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded font-bold">ADMIN</span>
                <span className="text-[10px] text-slate-400">• Udaipur</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} flex items-center justify-center transition-all`}
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Daily Brief Card (like citizen) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl -translate-x-6 translate-y-6"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                  {time.toLocaleDateString([], { weekday: 'long' })}
                </p>
                <p className="text-white/90 text-xs">
                  {time.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-3xl">{vitals?.condition === 'Sunny' ? '☀️' : vitals?.condition === 'Cloudy' ? '☁️' : '🌤️'}</div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{vitals?.temperature || '--'}</div>
                  <div className="text-[10px] text-slate-400">{vitals?.condition || 'Clear'}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${Number(vitals?.aqi) <= 50 ? 'bg-emerald-400' : Number(vitals?.aqi) <= 100 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">{t('Air Quality', 'वायु गुणवत्ता')}</span>
                </div>
                <div className="text-lg font-bold">{vitals?.aqi || '--'}</div>
                <div className="text-[9px] text-slate-500">{t('AQI Index', 'AQI सूचकांक')}</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${vitals?.traffic === 'Low' ? 'bg-emerald-400' : vitals?.traffic === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">{t('Traffic', 'यातायात')}</span>
                </div>
                <div className="text-lg font-bold">{vitals?.traffic || '--'}</div>
                <div className="text-[9px] text-slate-500">{t('City Roads', 'शहर की सड़कें')}</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${vitals?.waterStatus === 'Normal' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">{t('Water', 'पानी')}</span>
                </div>
                <div className="text-lg font-bold">{vitals?.waterStatus === 'Normal' ? 'OK' : 'Low'}</div>
                <div className="text-[9px] text-slate-500">{t('Supply', 'आपूर्ति')}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 overflow-auto pb-20">
        
        {/* HOME TAB */}
        {activeTab === 'HOME' && (
          <div className="p-4 space-y-4">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-lg">📋</div>
                  <div>
                    <div className="text-2xl font-black">{stats.total}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{t('Total Reports', 'कुल रिपोर्ट')}</div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-lg">⏳</div>
                  <div>
                    <div className="text-2xl font-black text-amber-500">{stats.submitted}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{t('Pending', 'लंबित')}</div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-lg">✅</div>
                  <div>
                    <div className="text-2xl font-black text-emerald-500">{stats.resolved}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{t('Resolved', 'समाधान')}</div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-lg">🔥</div>
                  <div>
                    <div className="text-2xl font-black text-red-500">{stats.critical}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{t('Critical', 'गंभीर')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Chart */}
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span> {t('Status Overview', 'स्थिति अवलोकन')}
              </h3>
              <DonutChart 
                data={[
                  { label: 'Pending', value: stats.submitted },
                  { label: 'In Progress', value: stats.inProgress },
                  { label: 'Resolved', value: stats.resolved },
                  { label: 'Rejected', value: stats.rejected }
                ]}
                colors={['#3b82f6', '#f59e0b', '#10b981', '#ef4444']}
              />
            </div>

            {/* Priority Breakdown */}
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-lg">🎯</span> {t('Priority Levels', 'प्राथमिकता स्तर')}
              </h3>
              <div className="space-y-3">
                <ProgressBar label="Critical" value={stats.critical} max={stats.total} color="#ef4444" />
                <ProgressBar label="High" value={stats.high} max={stats.total} color="#f97316" />
                <ProgressBar label="Normal" value={stats.normal} max={stats.total} color="#3b82f6" />
              </div>
            </div>

            {/* Recent Pending */}
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-lg">⏳</span> {t('Needs Attention', 'ध्यान आवश्यक')}
                </h3>
                <button 
                  onClick={() => { setActiveTab('REPORTS'); setFilterStatus('SUBMITTED'); }}
                  className="text-xs font-bold text-indigo-500"
                >
                  {t('View All →', 'सभी देखें →')}
                </button>
              </div>
              <div className="space-y-2">
                {reports.filter(r => r.status === 'SUBMITTED').slice(0, 3).map(report => (
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'} cursor-pointer transition-all flex items-center gap-3`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 overflow-hidden flex-shrink-0">
                      {report.images?.[0] ? (
                        <img src={report.images[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">🏙️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{report.analysis?.category || 'Issue'}</div>
                      <div className="text-[10px] text-slate-500 truncate">{report.address?.split(',')[0]}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      report.analysis?.urgency === 'Critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                      report.analysis?.urgency === 'High' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                    }`}>{report.analysis?.urgency || 'Normal'}</span>
                  </div>
                ))}
                {reports.filter(r => r.status === 'SUBMITTED').length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <span className="text-3xl">🎉</span>
                    <p className="text-sm mt-2">All caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'REPORTS' && (
          <div className="p-4 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {(['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    filterStatus === status
                      ? 'bg-indigo-500 text-white'
                      : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {status === 'ALL' ? `All (${reports.length})` : 
                   status === 'SUBMITTED' ? `Pending (${stats.submitted})` :
                   status === 'IN_PROGRESS' ? `Progress (${stats.inProgress})` :
                   status === 'RESOLVED' ? `Done (${stats.resolved})` : `Rejected (${stats.rejected})`}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredReports.length === 0 ? (
                <div className={`p-8 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'} text-center`}>
                  <span className="text-4xl">📭</span>
                  <p className="mt-2 text-slate-500">No reports found</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800/80 hover:bg-slate-800' : 'bg-white hover:bg-slate-50'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'} cursor-pointer transition-all`}
                  >
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {report.images?.[0] ? (
                          <img src={report.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🏙️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-sm truncate">{report.analysis?.category || 'Issue'}</div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 ${statusColors[report.status]}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{report.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                          <span>📍 {report.address?.split(',')[0] || 'Unknown'}</span>
                          <span>•</span>
                          <span className={report.analysis?.urgency === 'Critical' ? 'text-red-500' : report.analysis?.urgency === 'High' ? 'text-orange-500' : ''}>
                            {report.analysis?.urgency || 'Normal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'MAP' && (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-3 ${darkMode ? 'bg-slate-800' : 'bg-white'} border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {(['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setMapFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      mapFilter === status
                        ? 'bg-indigo-500 text-white'
                        : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {status === 'ALL' ? '🗺️ All' : 
                     status === 'SUBMITTED' ? '📥 Pending' :
                     status === 'IN_PROGRESS' ? '⚙️ Progress' : '✅ Done'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div ref={mapRef} className="absolute inset-0" />
              
              {/* Legend */}
              <div className={`absolute bottom-4 left-4 ${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-3 shadow-lg border ${darkMode ? 'border-slate-700' : 'border-slate-100'} z-10`}>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Pending', color: '#3b82f6' },
                    { label: 'In Progress', color: '#f59e0b' },
                    { label: 'Resolved', color: '#10b981' }
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Count Badge */}
              <div className={`absolute top-4 right-4 ${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl px-3 py-2 shadow-lg border ${darkMode ? 'border-slate-700' : 'border-slate-100'} z-10`}>
                <div className="text-lg font-black">{mapFilter === 'ALL' ? reports.length : reports.filter(r => r.status === mapFilter).length}</div>
                <div className="text-[9px] text-slate-500">Reports</div>
              </div>
            </div>
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'BROADCAST' && (
          <div className="p-4 space-y-4">
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                  📡
                </div>
                <div>
                  <h2 className="font-bold">City Broadcast</h2>
                  <p className="text-xs text-slate-500">Send alerts to citizens</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500">TARGET</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'ALL', icon: '👥', label: 'Everyone' },
                      { value: 'CITIZEN', icon: '🧑‍🤝‍🧑', label: 'Citizens Only' }
                    ].map(item => (
                      <button
                        key={item.value}
                        onClick={() => setBroadcastTarget(item.value as 'ALL' | 'CITIZEN')}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          broadcastTarget === item.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : darkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <div className="font-bold text-xs mt-1">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500">TITLE</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Alert title..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                    } outline-none transition-all`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500">MESSAGE</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                    } outline-none transition-all`}
                  ></textarea>
                </div>

                <button
                  onClick={handleSendBroadcast}
                  disabled={broadcastSending || !broadcastTitle || !broadcastMessage}
                  className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] ${
                    broadcastSuccess 
                      ? 'bg-emerald-500' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                  } disabled:opacity-50`}
                >
                  {broadcastSending ? '📡 Sending...' : broadcastSuccess ? '✅ Sent!' : '📢 Send Broadcast'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
          <div className="p-4 space-y-4">
            {/* Profile Card */}
            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{userName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded font-bold">ADMINISTRATOR</span>
                    <span className="text-[10px] text-slate-400">• Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Options */}
            <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              {/* Dark Mode */}
              <div className={`flex items-center justify-between p-4 ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg">🌙</div>
                  <div>
                    <div className="font-bold text-sm">{t('Dark Mode', 'डार्क मोड')}</div>
                    <div className="text-[10px] text-slate-500">{t('Reduce eye strain', 'आँखों को आराम दें')}</div>
                  </div>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className={`w-12 h-7 rounded-full transition-all relative ${darkMode ? 'bg-indigo-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow ${darkMode ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Language */}
              <div className={`flex items-center justify-between p-4 ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg">🌐</div>
                  <div>
                    <div className="font-bold text-sm">{t('Language', 'भाषा')}</div>
                    <div className="text-[10px] text-slate-500">{t('App language', 'ऐप की भाषा')}</div>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => onChangeLanguage(e.target.value as Language)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'} border outline-none`}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>

              {/* System Status */}
              <div className={`flex items-center justify-between p-4`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-lg">✅</div>
                  <div>
                    <div className="font-bold text-sm">{t('System Status', 'सिस्टम स्थिति')}</div>
                    <div className="text-[10px] text-emerald-500">{t('All systems operational', 'सभी सिस्टम चालू हैं')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-emerald-500">Online</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className="font-bold text-sm mb-3">📊 Session Stats</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="text-xl font-black text-indigo-500">{stats.total}</div>
                  <div className="text-[9px] text-slate-500">Reports</div>
                </div>
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="text-xl font-black text-emerald-500">{stats.resolved}</div>
                  <div className="text-[9px] text-slate-500">Resolved</div>
                </div>
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="text-xl font-black text-amber-500">{stats.submitted}</div>
                  <div className="text-[9px] text-slate-500">Pending</div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onBack}
              className="w-full py-3.5 rounded-xl font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm transition-all active:scale-[0.98]"
            >
              🚪 {t('Sign Out', 'साइन आउट')}
            </button>
          </div>
        )}
      </main>

      {/* ============ BOTTOM NAVIGATION ============ */}
      <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} z-20`}>
        <div className="flex justify-around py-1.5">
          {[
            { tab: 'HOME' as Tab, icon: '🏠', label: t('Home', 'होम') },
            { tab: 'REPORTS' as Tab, icon: '📋', label: t('Reports', 'रिपोर्ट') },
            { tab: 'MAP' as Tab, icon: '🗺️', label: t('Map', 'नक्शा') },
            { tab: 'BROADCAST' as Tab, icon: '📢', label: t('Alert', 'अलर्ट') },
            { tab: 'SETTINGS' as Tab, icon: '⚙️', label: t('Settings', 'सेटिंग्स') }
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
                activeTab === item.tab
                  ? 'text-indigo-500'
                  : 'text-slate-400'
              }`}
            >
              <span className={`text-lg mb-0.5 transition-transform ${activeTab === item.tab ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-bold ${activeTab === item.tab ? 'text-indigo-500' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Report Detail Modal */}
      <ReportDetailModal />
    </div>
  );
};
