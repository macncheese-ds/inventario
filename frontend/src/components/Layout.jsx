import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api.js';
import { trLocal } from '../i18n/index.js';
import { getTheme, toggleTheme } from '../theme.js';
import Button from './ui/Button.jsx';

export default function Layout({ children, fullWidth = false }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(getTheme());

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className={containerClass}>
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-baseline gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
                <span className="font-semibold text-lg text-slate-900 dark:text-white">
                  {trLocal('inventory')}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {trLocal('app_subtitle')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user.nombre || user.username}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user.rol} {user.area && `- ${user.area}`}
                  </span>
                </div>
              )}
              <Button 
                variant="ghost" 
                onClick={() => setTheme(toggleTheme())}
                className="text-sm"
                title={trLocal('theme_label')}
              >
                {theme === 'dark' ? trLocal('theme_dark') : trLocal('theme_light')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-sm"
              >
                {trLocal('logout')}
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
