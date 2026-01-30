export type Screen =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'REPORTING'
  | 'EMERGENCY'
  | 'SUCCESS'
  | 'ADMIN_DASHBOARD'
  | 'MY_REPORTS'
  | 'GAMIFICATION'
  | 'MAP_VIEW'
  | 'NOTIFICATIONS'
  | 'CITY_ASSISTANT'
  | 'SETTINGS';

export type UserRole = 'CITIZEN' | 'ADMIN';

export type ReportStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type Language = 'en' | 'hi';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface AIReportAnalysis {
  category: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  department: string;
  officialSummary: string;
  estimatedAction: string;
}

export interface ReportStatusUpdate {
  status: ReportStatus;
  timestamp: Date;
  updatedBy: string;
  comment?: string;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  replies?: Comment[];
}

export interface CivicReport {
  id: string;
  userId: string;
  images: string[];
  videoUrl?: string; // NEW: Video support
  description: string;
  location: LocationData | null;
  address?: string;
  timestamp: Date;
  status: ReportStatus;
  statusHistory: ReportStatusUpdate[];
  analysis?: AIReportAnalysis;
  upvotes: number;
  upvotedBy: string[]; // NEW: Track who upvoted
  comments: Comment[]; // NEW: Comments on report
  isRecurring?: boolean; // NEW: Recurring issue flag
  estimatedResolutionDate?: Date; // NEW: ETA
  beforeImage?: string; // NEW: Before/after comparison
  afterImage?: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  icon: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string; // NEW: Added email
  role: UserRole;
  points: number;
  badges: string[];
  // NEW fields
  referralCode: string;
  referralCount: number;
  language: Language;
  darkMode: boolean;
  ward?: string; // Area/ward for leaderboard filtering
  notificationsEnabled: boolean;
}

export interface Notification {
  id: string;
  type: 'STATUS_UPDATE' | 'CITY_ALERT' | 'REWARD' | 'COMMENT' | 'UPVOTE' | 'NEW_REPORT';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  reportId?: string;
  priority?: 'normal' | 'high' | 'emergency';
  targetRole: 'CITIZEN' | 'ADMIN' | 'ALL';
  userId?: string; // Optional: specific user target
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
  targetCount: number;
  currentProgress: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface TransportInfo {
  routeNumber: string;
  routeName: string;
  status: 'On Time' | 'Delayed' | 'Cancelled';
  nextArrival: string;
}

export interface ParkingSpot {
  id: string;
  name: string;
  availableSpots: number;
  totalSpots: number;
  distance: string;
}

export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  groundingChunks?: GroundingChunk[];
}

export interface CityVitals {
  temperature: string;
  condition: string;
  aqi: string;
  traffic: 'Low' | 'Medium' | 'High';
  waterStatus: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  timeAgo: string;
  category: 'Udaipur' | 'Rajasthan' | 'India';
}

// Translations for multi-language support
export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}