// frontend/src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import api from '../api.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    num_empleado: '',
    password: '',
    rol: 'Operador'
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await api.get('/users');
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormBusy(true);
    setFormError('');
    
    try {
      await api.post('/users', formData);
      setShowAddForm(false);
      setFormData({
        nombre: '',
        usuario: '',
        num_empleado: '',
        password: '',
        rol: 'Operador'
      });
      await loadUsers();
    } catch (err) {
      setFormError(err.message || 'Error creando usuario');
    } finally {
      setFormBusy(false);
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold">Administrar Usuarios</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Agregar Usuario
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Cargando usuarios...</div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Num. Empleado</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Permiso Inventario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-750">
                    <td className="px-4 py-3">{user.nombre}</td>
                    <td className="px-4 py-3 text-gray-400">{user.username || '-'}</td>
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ['The Goat', 'Administrador'].includes(user.rol) ? 'bg-purple-900/30 text-purple-300' :
                        ['Lider', 'Operador'].includes(user.rol) ? 'bg-blue-900/30 text-blue-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.inventarioRol === 'admin' ? 'bg-green-900/30 text-green-300' :
                        user.inventarioRol === 'operador' ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {user.inventarioRol}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar Nuevo Usuario</h2>
            
            {formError && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 p-2 rounded mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Usuario (opcional)
                  </label>
                  <input
                    type="text"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número de Empleado *
                  </label>
                  <input
                    type="number"
                    name="num_empleado"
                    value={formData.num_empleado}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Operador">Operador</option>
                    <option value="Lider">Lider</option>
                    <option value="Soporte">Soporte</option>
                    <option value="Administrador">Administrador</option>
                    <option value="The Goat">The Goat</option>
                    <option value="Invitado">Invitado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                  }}
                  disabled={formBusy}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {formBusy ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
