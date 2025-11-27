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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
        <div className={containerClass}>
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  I
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                  Inventario
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.nombre || user.username}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user.rol}
                  </span>
                </div>
              )}
              <Button 
                variant="secondary" 
                onClick={handleLogout}
                className="text-sm"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`${containerClass} py-8`}>
        {children}
      </main>
    </div>
  );
}
