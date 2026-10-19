// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import api, { setAuthToken } from '../api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { trLocal } from '../i18n/index.js';

export default function Login() {
  const [credentials, setCredentials] = useState({ employee_input: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message || trLocal('login_error_default'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      
      <div className="w-full max-w-sm">
        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{trLocal('login_title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{trLocal('login_subtitle')}</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 px-3 py-2 rounded-md border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={trLocal('login_employee_label')}
              type="text"
              name="employee_input"
              value={credentials.employee_input}
              onChange={handleChange}
              placeholder={trLocal('login_employee_placeholder')}
              required
              autoFocus
            />

            <Input
              label={trLocal('login_password_label')}
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" loading={busy}>
              {trLocal('login_submit')}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{trLocal('login_roles_title')}</p>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li>{trLocal('role_admin')}</li>
              <li>{trLocal('role_leader')}</li>
              <li>{trLocal('role_guest')}</li>
            </ul>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <p><span className="font-medium text-slate-600 dark:text-slate-300">F-OP-SMT-008</span> — Matriz de Refacciones</p>
            <p>Ing. Edgar Alberto Guajardo Castro</p>
            <p>Dev. Marcelo Bazaldua Morales</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
            
