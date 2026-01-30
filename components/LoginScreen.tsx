import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Mesh */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-md w-full">
        
        {/* Logo Section */}
        <div className="mb-12">
          {/* Animated Logo Container */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/30 animate-spin" style={{ animationDuration: '8s' }}></div>
            {/* Inner Container */}
            <div className="absolute inset-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25 flex items-center justify-center">
              <div className="text-5xl">🏛️</div>
            </div>
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl -z-10"></div>
          </div>
          
          {/* Brand Name */}
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white tracking-tight mb-2">
            CIVIX
          </h1>
          <div className="flex items-center justify-center gap-2 text-blue-400/80">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-blue-400/50"></div>
            <p className="text-sm font-semibold uppercase tracking-widest">
              Udaipur Smart City
            </p>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-blue-400/50"></div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-slate-400 text-lg mb-12 leading-relaxed">
          <span className="text-white font-semibold">Report.</span> <span className="text-blue-400">Earn.</span> <span className="text-purple-400">Transform.</span>
          <br />
          <span className="text-sm">Your voice shapes the city of tomorrow.</span>
        </p>

        {/* Login Cards */}
        <div className="space-y-4 w-full">
          
          {/* Citizen Login */}
          <button
            onClick={() => onLogin('CITIZEN')}
            onMouseEnter={() => setHoveredRole('CITIZEN')}
            onMouseLeave={() => setHoveredRole(null)}
            className="group w-full relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl transition-all duration-300 ${
              hoveredRole === 'CITIZEN' ? 'scale-105 opacity-100' : 'scale-100 opacity-90'
            }`}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                  <span className="text-3xl">👤</span>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">Citizen Portal</div>
                  <div className="text-emerald-100/70 text-sm">Report issues & earn rewards</div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Admin Login */}
          <button
            onClick={() => onLogin('ADMIN')}
            onMouseEnter={() => setHoveredRole('ADMIN')}
            onMouseLeave={() => setHoveredRole(null)}
            className="group w-full relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl transition-all duration-300 ${
              hoveredRole === 'ADMIN' ? 'scale-105 opacity-100' : 'scale-100 opacity-90'
            }`}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/10 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                  <span className="text-3xl">⚡</span>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">Admin Console</div>
                  <div className="text-amber-100/70 text-sm">Manage & resolve city issues</div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Demo Mode Badge */}
        <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-slate-400 text-sm font-medium">Demo Mode • No Account Required</span>
        </div>

        {/* Features Preview */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">📸</div>
            <div className="text-xs text-slate-500">Photo Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-xs text-slate-500">AI Analysis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-xs text-slate-500">Earn Rewards</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-slate-600 text-xs">
          Built with ❤️ for Udaipur Smart City Initiative
        </p>
      </div>
    </div>
  );
};
