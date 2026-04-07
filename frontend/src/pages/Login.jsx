// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import api, { setAuthToken } from '../api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Login() {
  const [credentials, setCredentials] = useState({ employee_input: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Aplicar modo oscuro al montar
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.authenticate(credentials.employee_input, credentials.password);
      localStorage.setItem('token', data.token);
      setAuthToken(data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Error de autenticacion');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background decorative elements - Minimalist Monochrome */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-slate-200/50 dark:bg-slate-800/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-300/30 dark:bg-slate-900/50 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md px-4 relative z-10">
        <Card variant="glass" className="bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200 dark:shadow-slate-950">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-3xl mb-6 shadow-sm animate-float">
              I
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sistema de Inventario</h1>
            <p className="text-slate-500 mt-3 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm flex items-center gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Numero de Empleado o Gafete</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="employee_input"
                  value={credentials.employee_input}
                  onChange={handleChange}
                  placeholder="Escanea o escribe tu numero"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contrasena</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="............"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-200"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-4 text-base mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white shadow-none"
              loading={busy}
            >
              Iniciar Sesion
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400 text-center font-semibold uppercase tracking-wider mb-4">
              Roles del Sistema
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                Administrador
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Lider / Operador
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 col-span-2 justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                Invitado (Solo lectura)
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-400">F-OP-SMT-008</span> — Matriz de Refacciones</p>
              <p className="text-xs text-slate-500">Ing. Edgar Alberto Guajardo Castro</p>
              <p className="text-xs text-slate-600">Dev. Marcelo Bazaldua Morales</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
