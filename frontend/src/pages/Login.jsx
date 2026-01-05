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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md px-4 relative z-10">
        <Card variant="glass" className="backdrop-blur-xl bg-slate-900/70 border-slate-700/50 shadow-2xl shadow-indigo-500/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-3xl mb-6 shadow-lg shadow-indigo-500/40 animate-float">
              I
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight">Sistema de Inventario</h1>
            <p className="text-slate-400 mt-3 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Numero de Empleado o Gafete</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contrasena</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-4 text-base mt-6"
              loading={busy}
            >
              Iniciar Sesion
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center font-semibold uppercase tracking-wider mb-4">
              Roles del Sistema
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
                Administrador
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></span>
                Lider / Operador
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 text-slate-400 col-span-2 justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Invitado (Solo lectura)
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
