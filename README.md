# 🏛️ Civix - Smart City Citizen Engagement Platform

<div align="center">

![Civix Banner](https://img.shields.io/badge/Civix-Smart%20City%20Platform-blue?style=for-the-badge)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite)](https://vitejs.dev/)

**Empowering Citizens • Streamlining Governance • Building Smarter Cities**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack)

</div>

---

## 📋 Overview

**Civix** is a modern, AI-powered civic engagement platform designed to bridge the gap between citizens and city administration. Built specifically for Udaipur (adaptable to any city), it enables citizens to report civic issues, track their resolution, and access city services seamlessly.

### 🎯 Key Highlights

- 📸 **Smart Reporting**: AI-powered issue detection using Google Gemini
- 🗺️ **Interactive Maps**: Real-time geolocation and issue mapping
- 🎮 **Gamification**: Reward active citizens with points and badges
- 🤖 **AI Assistant**: 24/7 city services chatbot
- 🚨 **Emergency SOS**: Quick emergency reporting with location sharing
- 🌐 **Bilingual**: Full support for English & Hindi (हिंदी)
- 🎨 **Modern UI**: Dark mode, responsive design, premium animations

---

## ✨ Features

### 👥 For Citizens

| Feature | Description |
|---------|-------------|
| 🏘️ **Report Issues** | Capture photos, add voice/text descriptions, auto-location tagging |
| 📊 **Track Reports** | Monitor submitted reports with status updates (Submitted → In Progress → Resolved) |
| 🏆 **Earn Rewards** | Gain points and badges for active civic participation |
| 🗺️ **Map View** | Visualize all city issues on an interactive map with clustering |
| 🔔 **Notifications** | Real-time updates on report status and city announcements |
| 🤖 **AI Assistant** | Get instant answers about city services, emergency contacts, bills, and tourism |
| 🚨 **Emergency SOS** | One-tap emergency reporting with live location sharing |
| 🌙 **Dark Mode** | Eye-friendly interface for day and night usage |

### 🛡️ For Administrators

| Feature | Description |
|---------|-------------|
| 📈 **Admin Dashboard** | Comprehensive overview with analytics and real-time statistics |
| ⚡ **Issue Management** | Review, approve/reject, and track resolution of citizen reports |
| 📢 **Broadcast System** | Send citywide notifications to citizens |
| 🗺️ **City Map** | Monitor all reported issues with filtering and prioritization |
| 📊 **Analytics** | Track resolution rates, response times, and citizen engagement |
| 🔍 **Advanced Filtering** | Filter by status, category, location, and urgency |

---

## 🚀 Demo

### Citizen Interface
- **Dashboard**: Clean, intuitive home screen with quick actions
- **Report Flow**: Camera → AI Analysis → Submit
- **My Reports**: Track all your submissions with status badges
- **Gamification**: View points, badges, and leaderboard

### Admin Interface
- **Command Center**: Real-time city health monitoring
- **Issue Queue**: Prioritized list of pending reports
- **Map View**: Geospatial visualization of city issues
- **Broadcast**: Send notifications to all citizens

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.4** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling (via CDN)

### AI & Services
- **Google Gemini AI** - Image analysis and chatbot
- **Web Speech API** - Voice-to-text for reports
- **Geolocation API** - Auto-location tagging
- **Geocoding API** - Convert coordinates to addresses

### Backend & Storage
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Storage** - Image hosting
- **LocalStorage** - Client-side persistence (demo mode)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Google Gemini API key
- Firebase project (optional for production)

### Step 1: Clone the Repository
```bash
git clone https://github.com/mayankgautam-dev/Civix.git
cd Civix
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Create a `.env` file in the root directory:

```env
GEMINI_API_KEY="add your gemini api"
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
# Add other Firebase config as needed
```

### Step 4: Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app running! 🎉

---

## 🔐 Authentication

### Default Demo Accounts

#### Citizen Login
- **Phone**: Any 10-digit number
- **OTP**: `123456`

#### Admin Login
- **Phone**: `9999999999`
- **OTP**: `123456`

> **Note**: Currently uses demo authentication. Integrate Firebase Auth for production.

---

## 📱 Usage Guide

### For Citizens

1. **Login**: Enter phone number → Enter OTP (123456)
2. **Report Issue**:
   - Tap "Report Issue" from dashboard
   - Capture photo or upload from gallery
   - Add description (voice or text)
   - Review AI analysis → Submit
3. **Track Reports**: View all reports in "My Reports"
4. **Earn Points**: Active reporting earns you points and badges
5. **Get Help**: Use AI Assistant for city services info

### For Administrators

1. **Login**: Use admin credentials (9999999999)
2. **Review Reports**: See all pending reports with details
3. **Take Action**:
   - Approve → Move to "In Progress"
   - Assign priority and category
   - Mark as "Resolved" when fixed
4. **Monitor City**: Use map view and analytics
5. **Broadcast**: Send notifications to citizens

---

## 🗂️ Project Structure

```
Civix/
├── components/
│   ├── AdminDashboard.tsx      # Admin command center
│   ├── CityAssistant.tsx       # AI chatbot interface
│   ├── Dashboard.tsx           # Citizen home screen
│   ├── EmergencyScreen.tsx     # SOS feature
│   ├── GamificationScreen.tsx  # Points and badges
│   ├── LoginScreen.tsx         # Authentication
│   ├── MapView.tsx             # Interactive city map
│   ├── MyReports.tsx           # User's report history
│   ├── NotificationsScreen.tsx # Notification center
│   ├── ReportFlow.tsx          # Issue reporting flow
│   └── SettingsScreen.tsx      # User preferences
├── services/
│   ├── geminiService.ts        # AI analysis and chatbot
│   ├── localStorageService.ts  # Data persistence
│   └── locationService.ts      # Geocoding utilities
├── App.tsx                     # Main app component
├── types.ts                    # TypeScript definitions
├── constants.ts                # App configuration
├── index.tsx                   # App entry point
├── index.html                  # HTML template
├── firebase.json               # Firebase configuration
├── firestore.rules             # Database security rules
├── firestore.indexes.json      # Database indexes
└── package.json                # Dependencies
```

---

## 🎨 Key Features in Detail

### 🤖 AI-Powered Analysis
Uses Google Gemini 1.5 to:
- Analyze uploaded images
- Identify issue type and severity
- Suggest department and estimated resolution time
- Generate actionable titles

### 🎮 Gamification System
- **Points**: 10 per report, 5 per upvote
- **Badges**: Bronze (5 reports), Silver (20), Gold (50), Platinum (100)
- **Leaderboard**: Coming soon!

### 🗣️ Voice Input
- Real-time speech-to-text
- Supports both English and Hindi
- Seamless integration in report flow

### 🌍 Bilingual Support
Complete UI translation between English and हिंदी:
```typescript
const t = (en: string, hi: string) => language === 'hi' ? hi : en;
```

---

## 🔧 Configuration

### City Customization
Edit `constants.ts` to customize for your city:
```typescript
export const CITY_NAME = "Your City Name";
export const EMERGENCY_CONTACTS = {
  police: "100",
  fire: "101",
  ambulance: "108"
};
```

### Firebase Setup
1. Create a Firebase project
2. Enable Firestore and Storage
3. Deploy security rules: `firebase deploy --only firestore:rules`
4. Update environment variables

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase deploy
```

### Deploy to Vercel/Netlify
- Connect your GitHub repo
- Set environment variables
- Deploy with one click!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent issue analysis
- **Firebase** for backend infrastructure
- **React & TypeScript** for robust development
- **Udaipur Smart City** for inspiration

---

## 📞 Contact & Support

<div align="center">

**Made with ❤️ for Smarter Cities**

[![GitHub](https://img.shields.io/badge/GitHub-mayankgautam--dev-181717?style=flat&logo=github)](https://github.com/mayankgautam-dev)
[![Email](https://img.shields.io/badge/Email-Contact-EA4335?style=flat&logo=gmail)](mailto:mayankgautam.dev@gmail.com)

**© 2026 Civix Platform**

</div>

---

### 🌟 Star this repo if you find it useful!

<div align="center">

```
 _____ _       _      
/  __ (_)     (_)     
| /  \/ ___   ___  __ 
| |   | |\ \ / / |/ / 
| \__/\ | \ V /|   <  
 \____/_|  \_/ |_|\_\ 

Empowering Citizens, Building Better Cities
```

</div>
