// Local Storage Service - Replaces Firebase
import { UserProfile, CivicReport, Notification, ReportStatus, Language, UserRole } from '../types';

const STORAGE_KEYS = {
    USER: 'civix_user',
    REPORTS: 'civix_reports',
    NOTIFICATIONS: 'civix_notifications'
};

// ==================== USER OPERATIONS ====================

export const getStoredUser = (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
};

export const setStoredUser = (user: UserProfile): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearStoredUser = (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
};

export const createDefaultUser = (role: UserRole): UserProfile => {
    const id = role === 'ADMIN' ? 'admin-001' : `citizen-${Date.now()}`;
    return {
        id,
        name: role === 'ADMIN' ? 'Admin User' : 'Citizen User',
        phone: '',
        email: role === 'ADMIN' ? 'admin@civix.local' : 'citizen@civix.local',
        role,
        points: role === 'CITIZEN' ? 50 : 0,
        badges: ['New Member'],
        referralCode: 'CIVIX' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        referralCount: 0,
        language: 'en' as Language,
        darkMode: false,
        ward: 'Ward 1',
        notificationsEnabled: true
    };
};

export const updateStoredUser = (updates: Partial<UserProfile>): UserProfile | null => {
    const user = getStoredUser();
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    setStoredUser(updatedUser);
    return updatedUser;
};

// ==================== REPORT OPERATIONS ====================

export const getAllReports = (): CivicReport[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!data) return [];

    const reports = JSON.parse(data);
    // Convert date strings back to Date objects
    return reports.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
        statusHistory: r.statusHistory.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp)
        })),
        comments: (r.comments || []).map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp)
        }))
    }));
};

export const getUserReports = (userId: string): CivicReport[] => {
    return getAllReports().filter(r => r.userId === userId);
};

export const saveReport = (report: CivicReport): string => {
    const reports = getAllReports();
    const id = `report-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newReport = { ...report, id };
    reports.unshift(newReport); // Add to beginning
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return id;
};

export const updateReportStatus = (
    reportId: string,
    status: ReportStatus,
    updatedBy: string,
    comment?: string
): void => {
    const reports = getAllReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) return;

    reports[index].status = status;
    reports[index].statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy,
        comment: comment || `Status changed to ${status}`
    });

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
};

export const updateReportUpvotes = (
    reportId: string,
    upvotes: number,
    upvotedBy: string[]
): void => {
    const reports = getAllReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) return;

    reports[index].upvotes = upvotes;
    reports[index].upvotedBy = upvotedBy;

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
};

export const addReportComment = (
    reportId: string,
    comment: { id: string; reportId: string; userId: string; userName: string; text: string; timestamp: Date }
): void => {
    const reports = getAllReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) return;

    reports[index].comments.push(comment);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
};

// ==================== NOTIFICATION OPERATIONS ====================

export const getAllNotifications = (): Notification[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) return [];

    const notifications = JSON.parse(data);
    return notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
    }));
};

export const getUserNotifications = (userId: string, role: UserRole): Notification[] => {
    return getAllNotifications().filter(n =>
        n.userId === userId ||
        n.userId === 'BROADCAST' ||
        n.targetRole === 'ALL' ||
        n.targetRole === role
    );
};

export const saveNotification = (notification: Notification): string => {
    const notifications = getAllNotifications();
    notifications.unshift(notification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return notification.id;
};

export const markNotificationRead = (id: string): void => {
    const notifications = getAllNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].read = true;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
};

// Broadcast notification to all users (stored in localStorage)
export const broadcastNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string => {
    const id = `broadcast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fullNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        read: false,
        userId: 'BROADCAST'
    };
    return saveNotification(fullNotification);
};

// Add notification for a specific user (for status updates)
export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fullNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date()
    };
    return saveNotification(fullNotification);
};

// Get broadcast notifications for admin logs
export const getAdminNotifications = (): Notification[] => {
    return getAllNotifications().filter(n => 
        n.targetRole === 'ADMIN' || 
        n.targetRole === 'ALL' ||
        n.userId === 'BROADCAST'
    );
};

// ==================== DEMO DATA ====================

export const initializeDemoData = (): void => {
    // Only initialize if no reports exist
    if (getAllReports().length > 0) return;

    const demoReports: CivicReport[] = [
        {
            id: 'demo-1',
            userId: 'citizen-demo',
            images: [],
            description: 'Large pothole on Lake Palace Road causing traffic issues',
            location: { latitude: 24.5854, longitude: 73.6800, accuracy: 10, timestamp: Date.now() },
            address: 'Lake Palace Road, Udaipur',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            status: 'SUBMITTED',
            statusHistory: [{ status: 'SUBMITTED', timestamp: new Date(Date.now() - 86400000), updatedBy: 'citizen-demo', comment: 'Initial report' }],
            analysis: { category: 'Road & Infrastructure', urgency: 'High', department: 'PWD Udaipur', officialSummary: 'Pothole repair needed', estimatedAction: '3-5 days' },
            upvotes: 12,
            upvotedBy: [],
            comments: []
        },
        {
            id: 'demo-2',
            userId: 'citizen-demo',
            images: [],
            description: 'Garbage not collected for 3 days in Sector 14',
            location: { latitude: 24.5721, longitude: 73.7092, accuracy: 10, timestamp: Date.now() },
            address: 'Sector 14, Udaipur',
            timestamp: new Date(Date.now() - 172800000), // 2 days ago
            status: 'IN_PROGRESS',
            statusHistory: [
                { status: 'SUBMITTED', timestamp: new Date(Date.now() - 172800000), updatedBy: 'citizen-demo', comment: 'Initial report' },
                { status: 'IN_PROGRESS', timestamp: new Date(Date.now() - 43200000), updatedBy: 'admin-001', comment: 'Assigned to sanitation team' }
            ],
            analysis: { category: 'Sanitation', urgency: 'Medium', department: 'Nagar Nigam', officialSummary: 'Waste collection pending', estimatedAction: '1-2 days' },
            upvotes: 8,
            upvotedBy: [],
            comments: []
        },
        {
            id: 'demo-3',
            userId: 'citizen-other',
            images: [],
            description: 'Street light not working near City Palace',
            location: { latitude: 24.5764, longitude: 73.6902, accuracy: 10, timestamp: Date.now() },
            address: 'Near City Palace, Udaipur',
            timestamp: new Date(Date.now() - 259200000), // 3 days ago
            status: 'RESOLVED',
            statusHistory: [
                { status: 'SUBMITTED', timestamp: new Date(Date.now() - 259200000), updatedBy: 'citizen-other', comment: 'Initial report' },
                { status: 'IN_PROGRESS', timestamp: new Date(Date.now() - 172800000), updatedBy: 'admin-001', comment: 'Electrician dispatched' },
                { status: 'RESOLVED', timestamp: new Date(Date.now() - 86400000), updatedBy: 'admin-001', comment: 'Light repaired and functional' }
            ],
            analysis: { category: 'Electricity', urgency: 'Medium', department: 'AVVNL Udaipur', officialSummary: 'Street light repair', estimatedAction: 'Completed' },
            upvotes: 5,
            upvotedBy: [],
            comments: []
        }
    ];

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(demoReports));
};
