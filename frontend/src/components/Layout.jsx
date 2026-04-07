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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className={containerClass}>
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
                <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-bold text-lg shadow-sm transition-all duration-300">
                  I
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white transition-colors">
                    Inventario
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Sistema de Control
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 text-sm font-bold shadow-sm">
                    {(user.nombre || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user.nombre || user.username}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>

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
