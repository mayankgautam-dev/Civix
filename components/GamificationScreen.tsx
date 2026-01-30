import React, { useState } from 'react';
import { UserProfile } from '../types';

interface GamificationScreenProps {
  user: UserProfile;
  onBack: () => void;
  onShare?: () => void;
  onRedeem?: (reward: { title: string; cost: number }) => void;
}

// Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
  progress,
  size = 100,
  strokeWidth = 8
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        stroke="currentColor"
        className="text-slate-700"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke="url(#progressGrad)"
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
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const GamificationScreen: React.FC<GamificationScreenProps> = ({ user, onBack, onShare, onRedeem }) => {
  const [activeTab, setActiveTab] = useState<'REWARDS' | 'LEADERBOARD' | 'CHALLENGES'>('REWARDS');

  // Calculate tier
  const getTier = () => {
    if (user.points >= 1000) return { name: 'Gold Champion', icon: '🏆', color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20', next: null, progress: 100 };
    if (user.points >= 500) return { name: 'Silver Guardian', icon: '🥈', color: 'text-slate-300', bg: 'from-slate-400/20 to-slate-500/20', next: 1000, progress: ((user.points - 500) / 500) * 100 };
    return { name: 'Bronze Pioneer', icon: '🥉', color: 'text-orange-400', bg: 'from-orange-400/20 to-amber-500/20', next: 500, progress: (user.points / 500) * 100 };
  };
  const tier = getTier();

  // Mock Data
  const leaderboard = [
    { name: 'Priya Sharma', points: 2340, avatar: '👩‍💼', ward: 'Hiran Magri' },
    { name: 'Raj Kumar', points: 1890, avatar: '👨‍💻', ward: 'Fatehpura' },
    { name: 'Anita Meena', points: 1650, avatar: '👩‍🔬', ward: 'Chetak Circle' },
    { name: user.name || 'You', points: user.points, avatar: '👤', ward: 'Your Ward', isUser: true },
    { name: 'Vikram Singh', points: 980, avatar: '👨‍🎓', ward: 'Sector 14' },
  ].sort((a, b) => b.points - a.points);

  const challenges = [
    { title: 'First Report', desc: 'Submit your first civic report', reward: 50, icon: '📝', done: true },
    { title: 'Neighborhood Watch', desc: 'Report 5 issues in your area', reward: 100, icon: '👀', progress: 3, total: 5 },
    { title: 'Community Leader', desc: 'Get 10 upvotes on your reports', reward: 150, icon: '⭐', progress: 7, total: 10 },
    { title: 'Streak Master', desc: 'Report issues 7 days in a row', reward: 200, icon: '🔥', progress: 2, total: 7 },
  ];

  const rewards = [
    { title: 'City Bus Pass Discount', cost: 150, icon: '🚌', available: true },
    { title: 'City Palace Entry Discount', cost: 200, icon: '🏰', available: true },
    { title: 'Sajjangarh Biological Park – 2 Tickets', cost: 300, icon: '🦁', available: user.points >= 300 },
    { title: 'Lake Pichola Boat Ride – 30 min', cost: 400, icon: '⛵', available: user.points >= 400 },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="relative z-10 px-5 pt-5 pb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-xl text-white">Rewards Hub</h1>
            <button onClick={onShare} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* User Impact Card */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.bg} border border-white/10 p-6`}>
            <div className="flex items-center gap-5">
              {/* Progress Ring with Tier Icon */}
              <div className="relative">
                <ProgressRing progress={tier.progress} size={100} strokeWidth={6} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">{tier.icon}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${tier.color}`}>{tier.name}</span>
                  <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/60 font-medium">Rank #42</span>
                </div>
                <h2 className="font-bold text-white text-lg mb-1">{user.name || 'Citizen'}</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400">{user.points.toLocaleString()}</span>
                  <span className="text-sm text-slate-400">karma</span>
                </div>
                {tier.next && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progress to {tier.next >= 1000 ? 'Gold' : 'Silver'}</span>
                      <span>{tier.next - user.points} pts to go</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-cyan-400 rounded-full transition-all" 
                        style={{ width: `${tier.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Buttons */}
      <div className="px-5 py-4 bg-slate-900/50 border-b border-slate-800">
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
          {(['REWARDS', 'CHALLENGES', 'LEADERBOARD'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab === 'REWARDS' && <span className="text-base">🎁</span>}
              {tab === 'CHALLENGES' && <span className="text-base">🎯</span>}
              {tab === 'LEADERBOARD' && <span className="text-base">📊</span>}
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 pb-24">
        {/* REWARDS TAB */}
        {activeTab === 'REWARDS' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-white">Available Rewards</h3>
                <p className="text-xs text-slate-500">Redeem your karma points for perks</p>
              </div>
              <div className="px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                <span className="text-sm font-bold text-amber-400">⭐ {user.points} pts</span>
              </div>
            </div>
            
            {rewards.map((reward, idx) => {
              const canRedeem = user.points >= reward.cost;
              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border transition-all ${
                    canRedeem 
                      ? 'bg-slate-800/80 border-slate-700 hover:border-primary-500/50' 
                      : 'bg-slate-800/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      canRedeem ? 'bg-gradient-to-br from-primary-500/20 to-indigo-500/20' : 'bg-slate-700/50'
                    }`}>
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-0.5">{reward.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-400">{reward.cost} pts</span>
                        {!canRedeem && (
                          <span className="text-[10px] text-red-400">Need {reward.cost - user.points} more</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => canRedeem && onRedeem?.(reward)}
                      disabled={!canRedeem}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        canRedeem
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-primary-500/25 active:scale-95'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {canRedeem ? 'Redeem' : '🔒 Locked'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'CHALLENGES' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-white">Active Challenges</h3>
                <p className="text-xs text-slate-500">Complete challenges for bonus points</p>
              </div>
            </div>
            
            {challenges.map((challenge, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden rounded-2xl border transition-all ${
                  challenge.done 
                    ? 'bg-emerald-900/20 border-emerald-700/30' 
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      challenge.done ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                    }`}>
                      {challenge.done ? '✅' : challenge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold truncate ${challenge.done ? 'text-emerald-400' : 'text-white'}`}>
                          {challenge.title}
                        </h3>
                        <span className="shrink-0 px-2 py-1 bg-amber-500/20 rounded-lg text-xs font-bold text-amber-400">
                          +{challenge.reward} pts
                        </span>
                        {challenge.done && (
                          <span className="shrink-0 px-2 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                            ✓ COMPLETED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{challenge.desc}</p>
                      
                      {!challenge.done && challenge.progress !== undefined && (
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                            <span>Progress</span>
                            <span className="font-bold text-primary-400">{challenge.progress}/{challenge.total}</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-cyan-400 rounded-full transition-all"
                              style={{ width: `${(challenge.progress / challenge.total!) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'LEADERBOARD' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white">Top Contributors</h3>
                <p className="text-xs text-slate-500">Udaipur's most active citizens</p>
              </div>
            </div>
            
            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-2 mb-6 pt-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400/30 to-slate-500/30 border border-slate-400/30 flex items-center justify-center mb-2">
                  <span className="text-2xl">{leaderboard[1]?.avatar || '👤'}</span>
                </div>
                <div className="text-center">
                  <span className="text-xl">🥈</span>
                  <p className="text-xs font-bold text-white truncate w-20">{leaderboard[1]?.name?.split(' ')[0] || '-'}</p>
                  <p className="text-[10px] text-slate-400">{leaderboard[1]?.points?.toLocaleString() || 0}</p>
                </div>
                <div className="w-20 h-16 bg-gradient-to-t from-slate-600/50 to-slate-500/30 rounded-t-lg mt-2"></div>
              </div>
              
              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 border-2 border-amber-400/50 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/20">
                  <span className="text-3xl">{leaderboard[0]?.avatar || '👤'}</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl">🥇</span>
                  <p className="text-sm font-bold text-white truncate w-24">{leaderboard[0]?.name?.split(' ')[0] || '-'}</p>
                  <p className="text-xs text-amber-400 font-bold">{leaderboard[0]?.points?.toLocaleString() || 0}</p>
                </div>
                <div className="w-24 h-24 bg-gradient-to-t from-amber-600/30 to-amber-500/20 rounded-t-lg mt-2"></div>
              </div>
              
              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400/30 to-amber-500/30 border border-orange-400/30 flex items-center justify-center mb-2">
                  <span className="text-2xl">{leaderboard[2]?.avatar || '👤'}</span>
                </div>
                <div className="text-center">
                  <span className="text-xl">🥉</span>
                  <p className="text-xs font-bold text-white truncate w-20">{leaderboard[2]?.name?.split(' ')[0] || '-'}</p>
                  <p className="text-[10px] text-slate-400">{leaderboard[2]?.points?.toLocaleString() || 0}</p>
                </div>
                <div className="w-20 h-12 bg-gradient-to-t from-orange-600/30 to-orange-500/20 rounded-t-lg mt-2"></div>
              </div>
            </div>
            
            {/* Rest of Leaderboard */}
            <div className="space-y-2">
              {leaderboard.slice(3).map((person, idx) => {
                const actualRank = idx + 4;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 flex items-center gap-4 transition-all ${
                      (person as any).isUser
                        ? 'bg-primary-900/30 border border-primary-700/50'
                        : 'bg-slate-800/50 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 text-sm font-bold text-slate-400">
                      #{actualRank}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-lg">
                      {person.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${
                        (person as any).isUser ? 'text-primary-400' : 'text-white'
                      }`}>
                        {person.name} {(person as any).isUser && <span className="text-xs">(You)</span>}
                      </h3>
                      <p className="text-xs text-slate-500">{person.ward}</p>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{person.points.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-500">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};