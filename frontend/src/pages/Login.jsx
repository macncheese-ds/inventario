// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import api, { setAuthToken } from '../api.js';

export default function Login() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('operador');
  const [registro, setRegistro] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setOk('');
    if (registro) {
      // Registro de usuario con validación de admin
      try {
        await api.post('/users/register', { 
          username, 
          password, 
          nombre, 
          rol, 
          adminUsername: adminUser, 
          adminPassword: adminPass 
        });
        setOk('Usuario registrado. Ahora puedes iniciar sesión.');
        setRegistro(false);
        setU(''); setP(''); setNombre(''); setAdminPass(''); setAdminUser(''); setRol('operador');
      } catch (e) {
        const message = e.response?.data?.message || 'Error registrando usuario.';
        setError(message);
      }
    } else {
      // Login
      try {
        const { data } = await api.post('/auth/login', { username, password });
        localStorage.setItem('token', data.token);
        setAuthToken(data.token);
        window.location.href = '/';
      } catch {
        setError('Usuario o contraseña incorrectos');
      }
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border rounded-2xl p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <h1 className="text-xl font-semibold mb-4">{registro ? 'Registrar usuario' : 'Iniciar sesión'}</h1>
        <div className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            placeholder="Usuario"
            value={username}
            onChange={e => setU(e.target.value)}
          />
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            placeholder="Contraseña"
            value={password}
            onChange={e => setP(e.target.value)}
          />
          {registro && (
            <>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                placeholder="Nombre completo"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                value={rol}
                onChange={e => setRol(e.target.value)}
              >
                <option value="operador">Operador</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                placeholder="Usuario admin para registrar"
                value={adminUser}
                onChange={e => setAdminUser(e.target.value)}
              />
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                placeholder="Contraseña de admin para registrar"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
              />
            </>
          )}
          {error && <div className="text-red-600 text-sm dark:text-red-400">{error}</div>}
          {ok && <div className="text-green-600 text-sm dark:text-green-400">{ok}</div>}
          <button className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 dark:bg-gray-100 dark:text-gray-900">
            {registro ? 'Registrar' : 'Entrar'}
          </button>
          <button
            type="button"
            className="w-full text-xs text-blue-700 underline mt-2 dark:text-blue-400"
            onClick={() => { setRegistro(r => !r); setError(''); setOk(''); }}
          >
            {registro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </form>
    </div>
  );
}
