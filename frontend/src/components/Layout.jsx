import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api.js';
import Button from './ui/Button.jsx';

export default function Layout({ children, fullWidth = false }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    window.location.href = '/login';
  };

  const containerClass = fullWidth 
    ? "w-full px-4 sm:px-6 lg:px-8" 
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-30 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30">
        <div className={containerClass}>
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
                  I
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Inventario
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Sistema de Control
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {(user.nombre || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user.nombre || user.username}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {user.rol} {user.area && `- ${user.area}`}
                    </span>
                  </div>
                </div>
              )}
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-sm"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`${containerClass} py-8 animate-fade-in`}>
        {children}
      </main>
    </div>
  );
}
