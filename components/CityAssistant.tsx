import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { askCityAssistant } from '../services/geminiService';

interface CityAssistantProps {
    user: UserProfile;
    onBack: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const CityAssistant: React.FC<CityAssistantProps> = ({ user, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Namaste! 🙏 I'm your Civix AI Assistant. I can help you with:\n\n• City services & office hours\n• Utility bill payments\n• Local emergency contacts\n• Public transport information\n• Tourism recommendations\n\nHow can I help you today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const t = (en: string, hi: string) => user.language === 'hi' ? hi : en;

    const quickActions = [
        { label: t('Pay Water Bill', 'पानी का बिल भरें'), icon: '💧', color: 'from-blue-500 to-cyan-500' },
        { label: t('Emergency Numbers', 'आपातकालीन नंबर'), icon: '🚨', color: 'from-red-500 to-rose-500' },
        { label: t('Bus Timings', 'बस का समय'), icon: '🚌', color: 'from-amber-500 to-orange-500' },
        { label: t('Tourist Info', 'पर्यटक जानकारी'), icon: '🏰', color: 'from-purple-500 to-indigo-500' },
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Call Real AI Service
            const responseText = await askCityAssistant(messageText, user.language === 'hi' ? 'hi' : 'en');

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: t("Sorry, I'm having trouble connecting to the city server. Please try again.", "क्षमा करें, सर्वर से संपर्क करने में समस्या आ रही है।"),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            {/* Premium Header */}
            <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-5 py-5 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-50"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="p-2.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <div className="relative">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                            <span className="text-2xl">🤖</span>
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <h1 className="font-bold text-lg">{t('City Assistant', 'शहर सहायक')}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-blue-100 bg-white/10 px-2 py-0.5 rounded-full">{t('AI Powered', 'AI संचालित')}</span>
                            <span className="text-xs text-emerald-300">● {t('Online', 'ऑनलाइन')}</span>
                        </div>
                    </div>
                    
                    <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-md">
                                <span className="text-sm">🤖</span>
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-blue-500/20'
                                : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-md rounded-bl-md border border-gray-100 dark:border-slate-700'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <p className={`text-[10px] mt-2 flex items-center gap-1 ${message.role === 'user' ? 'text-blue-200 justify-end' : 'text-gray-400'}`}>
                                {message.role === 'user' && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start animate-fade-in-up">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-md">
                            <span className="text-sm">🤖</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-5 py-4 shadow-md border border-gray-100 dark:border-slate-700">
                            <div className="flex gap-1.5 items-center">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                                <span className="text-xs text-gray-400 ml-2">{t('Thinking...', 'सोच रहा हूं...')}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('Quick Actions', 'त्वरित कार्य')}</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(action.label)}
                                className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl whitespace-nowrap hover:border-blue-400 dark:hover:border-blue-500 transition-all text-sm shadow-sm hover:shadow-md group"
                            >
                                <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-sm`}>
                                    <span className="text-base">{action.icon}</span>
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Input */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 safe-area-bottom">
                <div className="flex gap-3 items-center">
                    {/* Attachment button */}
                    <button className="p-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>
                    
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('Ask me anything...', 'मुझसे कुछ भी पूछें...')}
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                        />
                        {/* Voice input */}
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    </div>
                    
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        className={`p-3.5 rounded-2xl font-semibold transition-all ${input.trim()
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 active:scale-95'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
