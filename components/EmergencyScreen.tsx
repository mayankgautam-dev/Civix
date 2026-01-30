import React, { useState } from 'react';
import { LocationData } from '../types';

interface EmergencyScreenProps {
  location: LocationData | null;
  onBack: () => void;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ location, onBack }) => {
  const [callingService, setCallingService] = useState<string | null>(null);

  const emergencyServices = [
    {
      id: 'police',
      name: 'Police',
      number: '100',
      icon: '🚔',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      shadow: 'shadow-blue-500/30',
      description: 'Law enforcement & crime'
    },
    {
      id: 'ambulance',
      name: 'Ambulance',
      number: '108',
      icon: '🚑',
      gradient: 'from-red-500 via-red-600 to-rose-700',
      shadow: 'shadow-red-500/30',
      description: 'Medical emergencies'
    },
    {
      id: 'fire',
      name: 'Fire Brigade',
      number: '101',
      icon: '🚒',
      gradient: 'from-orange-500 via-orange-600 to-amber-700',
      shadow: 'shadow-orange-500/30',
      description: 'Fire & rescue'
    },
    {
      id: 'women',
      name: 'Women Helpline',
      number: '181',
      icon: '👩',
      gradient: 'from-pink-500 via-pink-600 to-rose-700',
      shadow: 'shadow-pink-500/30',
      description: 'Women safety'
    },
  ];

  const additionalContacts = [
    { name: 'Child Helpline', number: '1098', icon: '👶', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Road Accident', number: '1073', icon: '🚗', color: 'bg-amber-500/20 text-amber-400' },
    { name: 'Disaster Mgmt', number: '1070', icon: '🌊', color: 'bg-cyan-500/20 text-cyan-400' },
    { name: 'Smart City Control', number: '1800-267-9333', icon: '🏙️', color: 'bg-emerald-500/20 text-emerald-400' },
  ];

  const handleCall = (number: string, serviceId: string) => {
    setCallingService(serviceId);
    setTimeout(() => {
      window.location.href = `tel:${number}`;
      setCallingService(null);
    }, 300);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white">
      {/* Premium Header with animated background */}
      <header className="relative overflow-hidden px-5 pt-6 pb-10">
        {/* Animated emergency gradients */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/80 via-slate-950 to-slate-950" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-500/10 rounded-full blur-[80px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNNDAgMEgwdjQwaDQwVjB6TTEgMWgzOHYzOEgxVjF6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={onBack} 
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/5 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Emergency Mode</span>
            </div>
            
            <div className="w-10" />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-white to-red-200 bg-clip-text text-transparent">
              Need Help?
            </h1>
            <p className="text-slate-400 text-sm">Tap any service to call instantly</p>
          </div>

          {location && (
            <div className="mt-5 mx-auto w-fit flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-400 font-medium">
                📍 Location sharing active
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Emergency Buttons */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24 -mt-2">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {emergencyServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleCall(service.number, service.id)}
              disabled={callingService === service.id}
              className={`relative overflow-hidden bg-gradient-to-br ${service.gradient} rounded-3xl p-5 text-left shadow-xl ${service.shadow} active:scale-[0.97] transition-all duration-200 group ${callingService === service.id ? 'animate-pulse' : ''}`}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              
              {/* Icon badge */}
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-3xl">{service.icon}</span>
                </div>
                
                <h3 className="font-bold text-lg mb-0.5">{service.name}</h3>
                <p className="text-white/60 text-xs mb-4">{service.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-2xl tracking-tight">{service.number}</span>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Additional Contacts */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1.5 h-4 bg-slate-700 rounded-full"></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Other Helplines
            </h3>
          </div>
          <div className="space-y-3">
            {additionalContacts.map((contact, idx) => (
              <button
                key={idx}
                onClick={() => handleCall(contact.number, contact.name)}
                className="w-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-700 hover:bg-slate-800/80 transition-all active:scale-[0.99] group"
              >
                <div className={`w-12 h-12 ${contact.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {contact.icon}
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-white">{contact.name}</h4>
                  <p className="text-sm text-slate-400 font-mono">{contact.number}</p>
                </div>
                <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Safety Note */}
        <div className="mt-8 p-5 bg-gradient-to-r from-amber-950/50 to-orange-950/50 border border-amber-900/30 rounded-2xl backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h4 className="font-bold text-amber-400 text-sm mb-1">Important Notice</h4>
              <p className="text-xs text-amber-400/70 leading-relaxed">
                Emergency services are for genuine emergencies only. Misuse may result in legal action. Your location is automatically shared when you call for faster response.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-6"></div>
      </main>
    </div>
  );
};
