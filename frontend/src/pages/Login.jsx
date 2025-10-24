// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import api, { setAuthToken } from '../api.js';
import LoginModal from '../components/LoginModal.jsx';

export default function Login() {
  const [showModal, setShowModal] = useState(true); // Abierto por defecto
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Aplicar modo oscuro al montar
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  async function handleLogin(credentials) {
    setBusy(true);
    setError('');
    try {
      const data = await api.authenticate(credentials.employee_input, credentials.password);
      localStorage.setItem('token', data.token);
      setAuthToken(data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Error de autenticación');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-900 text-gray-100 p-2 sm:p-4">
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
        <h1 className="text-lg sm:text-xl font-semibold mb-4">Sistema de Inventario</h1>
        <p className="text-sm text-gray-400 mb-4">
          Escanee su gafete desde la PDA para iniciar sesión.
        </p>
        
        {error && (
          <div className="text-red-400 text-xs sm:text-sm mb-3 p-2 bg-red-900/20 rounded">
            {error}
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Roles del sistema:</p>
          <ul className="mt-2 space-y-1">
            <li><strong>The Goat / Administrador:</strong> Acceso total</li>
            <li><strong>Líder / Operador:</strong> Puede editar</li>
            <li><strong>Invitado:</strong> Solo lectura</li>
          </ul>
        </div>
      </div>

      <LoginModal
        visible={showModal}
        onClose={() => {setShowModal(false); setError('');}}
        onConfirm={handleLogin}
        busy={busy}
      />
    </div>
  );
}
