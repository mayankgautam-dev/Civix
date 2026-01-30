// Firestore Database Service - PRODUCTION VERSION
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserProfile, CivicReport, Notification, ReportStatus, Language, UserRole, AIReportAnalysis } from '../types';

// Collections
const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';
const NOTIFICATIONS_COLLECTION = 'notifications';
const LOGS_COLLECTION = 'logs';

// ==================== AUDIT LOGGING ====================

export const logEvent = async (
    eventType: 'REPORT_CREATED' | 'REPORT_FAILED' | 'UNAUTHORIZED_ACCESS' | 'STATUS_CHANGE' | 'ERROR',
    userId: string,
    details: Record<string, any>
): Promise<void> => {
    try {
        await addDoc(collection(db, LOGS_COLLECTION), {
            eventType,
            userId,
            details,
            timestamp: serverTimestamp(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        });
    } catch (error) {
        console.error('Failed to log event:', error);
    }
};

// ==================== USER OPERATIONS ====================

export const createUserProfile = async (
    userId: string,
    data: Partial<UserProfile>
): Promise<UserProfile> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const existingUser = await getDoc(userRef);

    if (existingUser.exists()) {
        return existingUser.data() as UserProfile;
    }

    // Role determination: ONLY based on predefined admin emails
    // In production, this should be done via Cloud Functions or Admin SDK
    const ADMIN_EMAILS = ['admin@yourdomain.com']; // Add your admin emails here
    const isAdminEmail = data.email && ADMIN_EMAILS.includes(data.email.toLowerCase());
    const role: UserRole = isAdminEmail ? 'ADMIN' : 'CITIZEN';

    const newProfile: UserProfile = {
        id: userId,
        name: data.name || 'Citizen',
        phone: data.phone || '',
        email: data.email || undefined,
        role: role, // Role is set ONLY here, never from client input
        points: 0,
        badges: ['New Member'],
        referralCode: 'CIVIX' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        referralCount: 0,
        language: 'en' as Language,
        darkMode: false,
        ward: data.ward || 'Ward 1',
        notificationsEnabled: true
    };

    await setDoc(userRef, newProfile);
    return newProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
};

export const updateUserProfile = async (
    userId: string,
    data: Partial<UserProfile>
): Promise<void> => {
    // CRITICAL: Strip out role field - cannot be changed from client
    const { role, ...safeData } = data as any;
    if (role !== undefined) {
        console.warn('Attempted to update role from client - blocked');
        await logEvent('UNAUTHORIZED_ACCESS', userId, {
            action: 'ROLE_CHANGE_ATTEMPT',
            attemptedRole: role
        });
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, safeData);
};

export const subscribeToUserProfile = (
    userId: string,
    callback: (user: UserProfile | null) => void
): (() => void) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    return onSnapshot(userRef, (doc) => {
        callback(doc.exists() ? (doc.data() as UserProfile) : null);
    });
};

// ==================== REPORT OPERATIONS ====================

// Convert Firestore data to CivicReport
const convertReportFromFirestore = (data: any): CivicReport => {
    return {
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        statusHistory: (data.statusHistory || []).map((s: any) => ({
            ...s,
            timestamp: s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp)
        })),
        comments: (data.comments || []).map((c: any) => ({
            ...c,
            timestamp: c.timestamp?.toDate ? c.timestamp.toDate() : new Date(c.timestamp)
        }))
    };
};

export interface CreateReportResult {
    success: boolean;
    reportId?: string;
    error?: string;
}

export const createReport = async (
    report: Omit<CivicReport, 'id'>,
    userId: string
): Promise<CreateReportResult> => {
    try {
        // Validate required fields
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (!report.description && (!report.images || report.images.length === 0)) {
            throw new Error('Report must have a description or images');
        }
        if (!report.analysis) {
            throw new Error('AI analysis is required before submission');
        }

        // Use Firestore auto-generated ID for security
        const reportRef = doc(collection(db, REPORTS_COLLECTION));
        const reportId = reportRef.id;

        // Upload images to Firebase Storage and get URLs
        let imageUrls: string[] = [];
        if (report.images && report.images.length > 0) {
            // Dynamic import to avoid circular dependencies
            const { uploadReportImages } = await import('./storageService');
            imageUrls = await uploadReportImages(report.images, reportId);
        }

        const reportData = {
            id: reportId,
            userId: userId, // Enforced server-side
            images: imageUrls, // Store URLs, not base64
            description: report.description || '',
            location: report.location,
            address: report.address || '',
            timestamp: serverTimestamp(), // Server timestamp for integrity
            status: 'SUBMITTED' as ReportStatus, // Always starts as SUBMITTED
            statusHistory: [{
                status: 'SUBMITTED',
                timestamp: Timestamp.now(),
                updatedBy: userId,
                comment: 'Report created'
            }],
            analysis: {
                category: report.analysis.category,
                urgency: report.analysis.urgency,
                department: report.analysis.department,
                officialSummary: report.analysis.officialSummary,
                estimatedAction: report.analysis.estimatedAction
            },
            upvotes: 0,
            upvotedBy: [],
            comments: [],
            isRecurring: report.isRecurring || false,
            createdAt: serverTimestamp()
        };

        await setDoc(reportRef, reportData);

        // Log successful creation
        await logEvent('REPORT_CREATED', userId, {
            reportId,
            category: report.analysis.category,
            urgency: report.analysis.urgency
        });

        return { success: true, reportId };
    } catch (error: any) {
        console.error('Report creation failed:', error);

        // Log failure
        await logEvent('REPORT_FAILED', userId, {
            error: error.message,
            reportData: { description: report.description?.substring(0, 100) }
        });

        return { success: false, error: error.message };
    }
};

// Get reports - filtered by role
export const getReports = async (userId: string, userRole: UserRole): Promise<CivicReport[]> => {
    let reportsQuery;

    if (userRole === 'ADMIN') {
        // Admins see ALL reports
        reportsQuery = query(
            collection(db, REPORTS_COLLECTION),
            orderBy('timestamp', 'desc')
        );
    } else {
        // Citizens see only their own reports
        reportsQuery = query(
            collection(db, REPORTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        );
    }

    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map(doc => convertReportFromFirestore(doc.data()));
};

// Subscribe to reports with role-based filtering
export const subscribeToReports = (
    userId: string,
    userRole: UserRole,
    callback: (reports: CivicReport[]) => void
): (() => void) => {
    let reportsQuery;

    if (userRole === 'ADMIN') {
        // Admins see ALL reports in real-time
        reportsQuery = query(
            collection(db, REPORTS_COLLECTION),
            orderBy('timestamp', 'desc')
        );
    } else {
        // Citizens see only their own reports
        reportsQuery = query(
            collection(db, REPORTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        );
    }

    return onSnapshot(reportsQuery, (snapshot) => {
        const reports = snapshot.docs.map(doc => convertReportFromFirestore(doc.data()));
        callback(reports);
    }, (error) => {
        console.error('Report subscription error:', error);
        callback([]);
    });
};

// Legacy function for backward compatibility - returns all reports
export const subscribeToAllReports = (
    callback: (reports: CivicReport[]) => void
): (() => void) => {
    const reportsQuery = query(
        collection(db, REPORTS_COLLECTION),
        orderBy('timestamp', 'desc')
    );
    return onSnapshot(reportsQuery, (snapshot) => {
        const reports = snapshot.docs.map(doc => convertReportFromFirestore(doc.data()));
        callback(reports);
    });
};

export const getUserReports = async (userId: string): Promise<CivicReport[]> => {
    const reportsQuery = query(
        collection(db, REPORTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map(doc => convertReportFromFirestore(doc.data()));
};

export const updateReportStatus = async (
    reportId: string,
    status: ReportStatus,
    updatedBy: string,
    comment?: string
): Promise<void> => {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
        throw new Error('Report not found');
    }

    const currentData = reportDoc.data();
    const newStatusUpdate = {
        status,
        timestamp: Timestamp.now(),
        updatedBy,
        comment: comment || `Status changed to ${status}`
    };

    await updateDoc(reportRef, {
        status,
        statusHistory: [...(currentData.statusHistory || []), newStatusUpdate]
    });

    // Log status change
    await logEvent('STATUS_CHANGE', updatedBy, {
        reportId,
        oldStatus: currentData.status,
        newStatus: status
    });
};

export const updateReportUpvotes = async (
    reportId: string,
    upvotes: number,
    upvotedBy: string[]
): Promise<void> => {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportRef, { upvotes, upvotedBy });
};

export const addReportComment = async (
    reportId: string,
    comment: { id: string; reportId: string; userId: string; userName: string; text: string; timestamp: Date }
): Promise<void> => {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) return;

    const currentData = reportDoc.data();
    const newComment = {
        ...comment,
        timestamp: Timestamp.fromDate(comment.timestamp)
    };

    await updateDoc(reportRef, {
        comments: [...(currentData.comments || []), newComment]
    });
};

export const deleteReport = async (reportId: string, deletedBy: string): Promise<void> => {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    await deleteDoc(reportRef);

    await logEvent('STATUS_CHANGE', deletedBy, {
        reportId,
        action: 'DELETED'
    });
};

// ==================== NOTIFICATION OPERATIONS ====================

const convertNotificationFromFirestore = (data: any): Notification => {
    return {
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
    };
};

export const createNotification = async (notification: Notification): Promise<string> => {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
    const notifData = {
        ...notification,
        userId: notification.userId || 'BROADCAST',
        timestamp: Timestamp.fromDate(new Date(notification.timestamp))
    };
    await setDoc(notifRef, notifData);
    return notification.id;
};

export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
): (() => void) => {
    // Personal Notifications
    const personalQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    );

    // Broadcast Notifications
    const broadcastQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('targetRole', 'in', ['ALL', 'CITIZEN']),
        where('userId', '==', 'BROADCAST'),
        orderBy('timestamp', 'desc')
    );

    let personalNotifs: Notification[] = [];
    let broadcastNotifs: Notification[] = [];

    const update = () => {
        const combined = [...broadcastNotifs, ...personalNotifs].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
        const unique = Array.from(new Map(combined.map(n => [n.id, n])).values());
        callback(unique);
    };

    const unsubPersonal = onSnapshot(personalQuery, (snapshot) => {
        personalNotifs = snapshot.docs.map(doc => convertNotificationFromFirestore(doc.data()));
        update();
    });

    const unsubBroadcast = onSnapshot(broadcastQuery, (snapshot) => {
        broadcastNotifs = snapshot.docs.map(doc => convertNotificationFromFirestore(doc.data()));
        update();
    });

    return () => {
        unsubPersonal();
        unsubBroadcast();
    };
};

export const subscribeToAdminNotifications = (
    callback: (notifications: Notification[]) => void
): (() => void) => {
    const notifQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('targetRole', 'in', ['ADMIN', 'ALL']),
        orderBy('timestamp', 'desc')
    );
    return onSnapshot(notifQuery, (snapshot) => {
        const notifications = snapshot.docs.map(doc => convertNotificationFromFirestore(doc.data()));
        callback(notifications);
    });
};

export const broadcastNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<string> => {
    const id = Date.now().toString();
    const fullNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        read: false,
        userId: 'BROADCAST'
    };
    return createNotification(fullNotification);
};
