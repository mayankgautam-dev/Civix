import React, { useState, useEffect } from 'react';
import { LocationData, Screen, UserRole, CivicReport, UserProfile, ReportStatus, Notification, Language, Comment } from './types';
import { Dashboard } from './components/Dashboard';
import { ReportFlow } from './components/ReportFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { MyReports } from './components/MyReports';
import { EmergencyScreen } from './components/EmergencyScreen';
import { GamificationScreen } from './components/GamificationScreen';
import { MapView } from './components/MapView';
import { NotificationsScreen } from './components/NotificationsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CityAssistant } from './components/CityAssistant';
import { LoginScreen } from './components/LoginScreen';

// Local Storage Service (replacing Firebase)
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  createDefaultUser,
  updateStoredUser,
  getAllReports,
  getUserReports,
  saveReport,
  updateReportStatus,
  updateReportUpvotes,
  addReportComment,
  getUserNotifications,
  saveNotification,
  initializeDemoData
} from './services/localStorageService';

// Citizen screens
const CITIZEN_SCREENS: Screen[] = ['DASHBOARD', 'REPORTING', 'MY_REPORTS', 'GAMIFICATION', 'MAP_VIEW', 'NOTIFICATIONS', 'SETTINGS', 'CITY_ASSISTANT', 'EMERGENCY'];

// Admin screens
const ADMIN_SCREENS: Screen[] = ['ADMIN_DASHBOARD', 'NOTIFICATIONS', 'SETTINGS'];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize on mount
  useEffect(() => {
    // Initialize demo data
    initializeDemoData();

    // Check for existing session
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      loadDataForUser(storedUser);
      setCurrentScreen(storedUser.role === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'DASHBOARD');
    }
  }, []);

  // Load data based on user role
  const loadDataForUser = (userProfile: UserProfile) => {
    if (userProfile.role === 'ADMIN') {
      // Admins see all reports
      setReports(getAllReports());
    } else {
      // Citizens see all reports (can view community reports)
      setReports(getAllReports());
    }

    // Load notifications
    setNotifications(getUserNotifications(userProfile.id, userProfile.role));
  };

  // Location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        () => { /* Location permission pending or denied */ },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Dark mode
  useEffect(() => {
    if (user?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.darkMode]);

  // Screen navigation with role enforcement
  const navigateToScreen = (screen: Screen) => {
    if (!user) return;

    if (user.role === 'CITIZEN' && !CITIZEN_SCREENS.includes(screen)) {
      return;
    }
    if (user.role === 'ADMIN' && !ADMIN_SCREENS.includes(screen)) {
      setCurrentScreen('ADMIN_DASHBOARD');
      return;
    }
    setCurrentScreen(screen);
  };

  // Login handler
  const handleLogin = (role: UserRole) => {
    const newUser = createDefaultUser(role);
    setStoredUser(newUser);
    setUser(newUser);
    loadDataForUser(newUser);
    setCurrentScreen(role === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'DASHBOARD');
  };

  // Logout handler
  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    setReports([]);
    setNotifications([]);
    setCurrentScreen('LOGIN');
  };

  // Save report handler
  const handleSaveReport = (newReport: CivicReport) => {
    if (!user || user.role !== 'CITIZEN') return;

    // Save to localStorage
    const reportId = saveReport({
      ...newReport,
      userId: user.id
    });

    // Award points
    const earnedPoints = 10;
    const updatedUser = updateStoredUser({ points: user.points + earnedPoints });
    if (updatedUser) setUser(updatedUser);

    // Create notification
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'REWARD',
      title: 'Report Submitted!',
      message: `+${earnedPoints} Karma Points earned!`,
      timestamp: new Date(),
      read: false,
      targetRole: 'CITIZEN',
      userId: user.id
    };
    saveNotification(notification);

    // Refresh reports list
    setReports(getAllReports());
    setNotifications(getUserNotifications(user.id, user.role));

    // Navigate back
    setCurrentScreen('DASHBOARD');
  };

  // Update status handler (Admin only)
  const handleUpdateStatus = (reportId: string, newStatus: ReportStatus) => {
    if (!user || user.role !== 'ADMIN') return;

    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    updateReportStatus(reportId, newStatus, user.id);

    // Create notification for report owner
    if (newStatus === 'RESOLVED') {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'STATUS_UPDATE',
        title: 'Issue Resolved! 🎉',
        message: `Your report has been resolved.`,
        timestamp: new Date(),
        read: false,
        reportId,
        targetRole: 'CITIZEN',
        userId: report.userId
      };
      saveNotification(notification);
    }

    // Refresh reports
    setReports(getAllReports());
  };

  // Upvote handler
  const handleUpvote = (reportId: string) => {
    if (!user) return;

    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const hasUpvoted = report.upvotedBy.includes(user.id);
    const newUpvotedBy = hasUpvoted
      ? report.upvotedBy.filter(id => id !== user.id)
      : [...report.upvotedBy, user.id];

    updateReportUpvotes(reportId, newUpvotedBy.length, newUpvotedBy);
    setReports(getAllReports());
  };

  // Comment handler
  const handleAddComment = (reportId: string, text: string) => {
    if (!user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      reportId,
      userId: user.id,
      userName: user.name,
      text,
      timestamp: new Date()
    };

    addReportComment(reportId, comment);
    setReports(getAllReports());
  };

  // Reward redemption
  const handleRedeemReward = (reward: { title: string; cost: number }) => {
    if (!user || user.points < reward.cost) return;

    const updatedUser = updateStoredUser({ points: user.points - reward.cost });
    if (updatedUser) setUser(updatedUser);

    const notification: Notification = {
      id: Date.now().toString(),
      type: 'REWARD',
      title: 'Reward Redeemed!',
      message: `"${reward.title}" coupon code sent.`,
      timestamp: new Date(),
      read: false,
      targetRole: 'CITIZEN',
      userId: user.id
    };
    saveNotification(notification);
    setNotifications(getUserNotifications(user.id, user.role));
  };

  // Notification handlers
  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Settings handlers
  const handleToggleDarkMode = () => {
    if (!user) return;
    const updatedUser = updateStoredUser({ darkMode: !user.darkMode });
    if (updatedUser) setUser(updatedUser);
  };

  const handleChangeLanguage = (lang: Language) => {
    if (!user) return;
    const updatedUser = updateStoredUser({ language: lang });
    if (updatedUser) setUser(updatedUser);
  };

  // Filter visible notifications
  const visibleNotifications = notifications.filter(n =>
    !n.targetRole || n.targetRole === 'ALL' || n.targetRole === user?.role
  );
  const unreadNotificationsCount = visibleNotifications.filter(n => !n.read).length;

  // Login screen
  if (currentScreen === 'LOGIN' || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`w-full h-screen bg-gray-50 relative overflow-hidden ${user.darkMode ? 'dark' : ''}`}>

      {/* Citizen Dashboard */}
      {currentScreen === 'DASHBOARD' && user.role === 'CITIZEN' && (
        <Dashboard
          user={user}
          onReportClick={() => navigateToScreen('REPORTING')}
          onAdminClick={() => { }}
          onMyReportsClick={() => navigateToScreen('MY_REPORTS')}
          onRewardsClick={() => navigateToScreen('GAMIFICATION')}
          onMapClick={() => navigateToScreen('MAP_VIEW')}
          onNotificationsClick={() => navigateToScreen('NOTIFICATIONS')}
          onSettingsClick={() => navigateToScreen('SETTINGS')}
          onCityAssistantClick={() => navigateToScreen('CITY_ASSISTANT')}
          onLogout={handleLogout}
          location={location}
          reports={reports}
          onUpvote={handleUpvote}
          unreadNotifications={unreadNotificationsCount}
        />
      )}

      {/* Report Flow */}
      {currentScreen === 'REPORTING' && user.role === 'CITIZEN' && (
        <ReportFlow
          location={location}
          userId={user.id}
          onClose={() => navigateToScreen('DASHBOARD')}
          onSave={handleSaveReport}
        />
      )}

      {/* My Reports */}
      {currentScreen === 'MY_REPORTS' && user.role === 'CITIZEN' && (
        <MyReports
          reports={reports.filter(r => r.userId === user.id)}
          userId={user.id}
          onBack={() => navigateToScreen('DASHBOARD')}
          onUpvote={handleUpvote}
          onAddComment={handleAddComment}
          currentUserId={user.id}
        />
      )}

      {/* Gamification */}
      {currentScreen === 'GAMIFICATION' && user.role === 'CITIZEN' && (
        <GamificationScreen
          user={user}
          onBack={() => navigateToScreen('DASHBOARD')}
          onRedeem={handleRedeemReward}
        />
      )}

      {/* Admin Dashboard */}
      {(currentScreen === 'ADMIN_DASHBOARD' || currentScreen === 'DASHBOARD') && user.role === 'ADMIN' && (
        <AdminDashboard
          reports={reports}
          onBack={handleLogout}
          onUpdateStatus={handleUpdateStatus}
          darkMode={user.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          language={user.language}
          onChangeLanguage={handleChangeLanguage}
        />
      )}

      {/* Emergency */}
      {currentScreen === 'EMERGENCY' && user.role === 'CITIZEN' && (
        <EmergencyScreen
          location={location}
          onBack={() => navigateToScreen('DASHBOARD')}
        />
      )}

      {/* Map View */}
      {currentScreen === 'MAP_VIEW' && user.role === 'CITIZEN' && (
        <MapView
          reports={reports}
          userLocation={location}
          onBack={() => navigateToScreen('DASHBOARD')}
        />
      )}

      {/* Notifications */}
      {currentScreen === 'NOTIFICATIONS' && (
        <NotificationsScreen
          notifications={visibleNotifications}
          onBack={() => navigateToScreen(user.role === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'DASHBOARD')}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      )}

      {/* Settings */}
      {currentScreen === 'SETTINGS' && (
        <SettingsScreen
          user={user}
          onBack={() => navigateToScreen(user.role === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'DASHBOARD')}
          onToggleDarkMode={handleToggleDarkMode}
          onChangeLanguage={handleChangeLanguage}
          onLogout={handleLogout}
        />
      )}

      {/* City Assistant */}
      {currentScreen === 'CITY_ASSISTANT' && user.role === 'CITIZEN' && (
        <CityAssistant
          onBack={() => navigateToScreen('DASHBOARD')}
          user={user}
        />
      )}

      {/* SOS Button */}
      {currentScreen === 'DASHBOARD' && user.role === 'CITIZEN' && (
        <div className="absolute bottom-6 right-6 z-50">
          <button
            onClick={() => navigateToScreen('EMERGENCY')}
            className="w-16 h-16 rounded-full bg-red-600 text-white shadow-xl flex items-center justify-center animate-pulse hover:bg-red-700 border-4 border-red-100 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="font-bold text-xs uppercase tracking-wider">SOS</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;