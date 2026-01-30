import React from 'react';
import { UserProfile } from '../types';

interface SettingsScreenProps {
    user: UserProfile;
    onBack: () => void;
    onToggleDarkMode: () => void;
    onChangeLanguage: (lang: 'en' | 'hi') => void;
    onLogout?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
    user,
    onBack,
    onToggleDarkMode,
    onChangeLanguage,
    onLogout
}) => {
    const t = (en: string, hi: string) => user.language === 'hi' ? hi : en;

    const settingsGroups = [
        {
            title: t('Appearance', 'दिखावट'),
            icon: '🎨',
            items: [
                {
                    icon: '🌙',
                    label: t('Dark Mode', 'डार्क मोड'),
                    description: t('Reduce eye strain at night', 'रात में आंखों का तनाव कम करें'),
                    type: 'toggle' as const,
                    value: user.darkMode,
                    onToggle: onToggleDarkMode
                }
            ]
        },
        {
            title: t('Language', 'भाषा'),
            icon: '🌐',
            items: [
                {
                    icon: '🇬🇧',
                    label: 'English',
                    type: 'radio' as const,
                    value: user.language === 'en',
                    onSelect: () => onChangeLanguage('en')
                },
                {
                    icon: '🇮🇳',
                    label: 'हिंदी',
                    type: 'radio' as const,
                    value: user.language === 'hi',
                    onSelect: () => onChangeLanguage('hi')
                }
            ]
        }
    ];

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            {/* Premium Header with Gradient */}
            <header className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-5 py-6 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="p-2.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/5"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-xl text-white">{t('Settings', 'सेटिंग्स')}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{t('Customize your experience', 'अपना अनुभव अनुकूलित करें')}</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-6">
                {/* Premium Profile Card */}
                <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="relative">
                            <div className="w-18 h-18 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                                {(user.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{user.name || t('Citizen', 'नागरिक')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/30">{user.role}</span>
                                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1">
                                    <span>⭐</span> {user.points} {t('pts', 'अंक')}
                                </span>
                            </div>
                        </div>
                        <button className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                            <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Settings Groups */}
                {settingsGroups.map((group, gIdx) => (
                    <section key={gIdx} className="animate-fade-in-up" style={{ animationDelay: `${gIdx * 0.05}s` }}>
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="text-sm">{group.icon}</span>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {group.title}
                            </h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                            {group.items.map((item, iIdx) => (
                                <div
                                    key={iIdx}
                                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                    onClick={item.type === 'radio' ? item.onSelect : undefined}
                                    role={item.type === 'radio' ? 'button' : undefined}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xl">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                                            {item.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {item.type === 'toggle' && (
                                        <button
                                            onClick={item.onToggle}
                                            className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${item.value 
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                                                : 'bg-gray-200 dark:bg-slate-600'
                                            }`}
                                        >
                                            <div
                                                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${item.value ? 'translate-x-7' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    )}

                                    {item.type === 'radio' && (
                                        <div
                                            className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${item.value
                                                ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-indigo-500'
                                                : 'border-gray-300 dark:border-slate-500'
                                                }`}
                                        >
                                            {item.value && (
                                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* About Section */}
                <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="text-sm">ℹ️</span>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('About', 'के बारे में')}
                        </h3>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <span className="text-lg">📱</span>
                                </div>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">{t('Version', 'संस्करण')}</span>
                            </div>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">2.0.0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                    <span className="text-lg">🏗️</span>
                                </div>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">{t('Build', 'बिल्ड')}</span>
                            </div>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">CIVIX-2026</span>
                        </div>
                    </div>
                </section>

                {/* Quick Links */}
                <section className="animate-fade-in-up" style={{ animationDelay: '0.18s' }}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="text-sm">🔗</span>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('Quick Links', 'त्वरित लिंक')}
                        </h3>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                        {[
                            { icon: '📄', label: t('Privacy Policy', 'गोपनीयता नीति') },
                            { icon: '📋', label: t('Terms of Service', 'सेवा की शर्तें') },
                            { icon: '💬', label: t('Help & Support', 'सहायता') },
                            { icon: '⭐', label: t('Rate the App', 'ऐप को रेट करें') }
                        ].map((link, idx) => (
                            <button key={idx} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{link.icon}</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{link.label}</span>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Logout Button */}
                {onLogout && (
                    <section className="animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
                        <button
                            onClick={onLogout}
                            className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-2xl hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {t('Sign Out', 'साइन आउट')}
                        </button>
                    </section>
                )}

                {/* Footer - Premium Branding */}
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">C</div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Civix</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Made with ❤️ for Smarter Cities</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">© 2026 Civix Platform</p>
                </div>
            </main>
        </div>
    );
};
