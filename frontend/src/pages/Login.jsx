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
      setError(err.message || 'Error de autenticación');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-blend-overlay">
      <div className="w-full max-w-md px-4">
        <Card className="backdrop-blur-sm bg-slate-900/90 border-slate-700 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-2xl mb-4 shadow-lg shadow-indigo-500/30">
              I
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sistema de Inventario</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Número de Empleado o Gafete"
              name="employee_input"
              value={credentials.employee_input}
              onChange={handleChange}
              placeholder="Escanea o escribe tu número"
              required
              autoFocus
              className="dark"
            />
            
            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="dark"
            />

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-3 text-base shadow-lg shadow-indigo-500/25"
              disabled={busy}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center font-medium uppercase tracking-wider mb-3">
              Roles del Sistema
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Admin
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Líder / Operador
              </div>
              <div className="flex items-center gap-2 col-span-2 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Invitado (Solo lectura)
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
