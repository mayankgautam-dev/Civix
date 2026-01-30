import React from 'react';

interface Notification {
    id: string;
    type: 'STATUS_UPDATE' | 'UPVOTE' | 'COMMENT' | 'REWARD' | 'SYSTEM' | 'CITY_ALERT' | 'NEW_REPORT';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    reportId?: string;
    priority?: 'normal' | 'high' | 'emergency';
}

interface NotificationsScreenProps {
    notifications: Notification[];
    onBack: () => void;
    onNotificationClick?: (notification: Notification) => void;
    onMarkAllRead?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
    notifications,
    onBack,
    onNotificationClick,
    onMarkAllRead
}) => {
    const getNotificationIcon = (type: string, priority?: string) => {
        switch (type) {
            case 'STATUS_UPDATE': return { icon: '🔄', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600' };
            case 'UPVOTE': return { icon: '👍', bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' };
            case 'COMMENT': return { icon: '💬', bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600' };
            case 'REWARD': return { icon: '🎁', bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600' };
            case 'CITY_ALERT': return { 
                icon: priority === 'emergency' ? '🚨' : '📢', 
                bg: priority === 'emergency' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30', 
                color: priority === 'emergency' ? 'text-red-600' : 'text-indigo-600' 
            };
            case 'NEW_REPORT': return { icon: '📥', bg: 'bg-cyan-100 dark:bg-cyan-900/30', color: 'text-cyan-600' };
            case 'SYSTEM': return { icon: '⚙️', bg: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-600' };
            default: return { icon: '🔔', bg: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-600' };
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const sortedNotifications = [...notifications].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="font-bold text-xl text-gray-900 dark:text-white">Notifications</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-primary-600">{unreadCount} unread</p>
                            )}
                        </div>
                    </div>

                    {unreadCount > 0 && onMarkAllRead && (
                        <button
                            onClick={onMarkAllRead}
                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-4">
                            🔔
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No Notifications</h3>
                        <p className="text-sm text-gray-500">You're all caught up! Check back later.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {sortedNotifications.map((notification, idx) => {
                            const iconConfig = getNotificationIcon(notification.type, notification.priority);
                            const isHighPriority = notification.priority === 'high' || notification.priority === 'emergency';
                            return (
                                <button
                                    key={notification.id}
                                    onClick={() => onNotificationClick?.(notification)}
                                    className={`w-full p-5 flex gap-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors animate-fade-in-up ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                                        } ${isHighPriority && !notification.read ? 'border-l-4 border-red-500' : ''}`}
                                    style={{ animationDelay: `${Math.min(idx * 0.03, 0.2)}s` }}
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconConfig.bg}`}>
                                        <span className="text-xl">{iconConfig.icon}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`font-semibold truncate ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-gray-400">
                                            {formatTime(notification.timestamp)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};
