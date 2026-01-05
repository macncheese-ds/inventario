// frontend/src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import api from '../api.js';
import Layout from '../components/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

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
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Administrar Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestiona el acceso y roles del personal</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
        >
          + Agregar Usuario
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando usuarios...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Nombre</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Usuario</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Num. Empleado</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Rol</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Permiso Inventario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.nombre}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.username || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{user.num_empleado || user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ['Ingeniero', 'Administrador'].includes(user.rol) ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        ['Lider', 'Operador', 'Supervisor', 'Tecnico'].includes(user.rol) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        ['AOI', 'Mantenimiento', 'Modula', 'Magazines', 'Calidad', 'Soporte', 'Recursos Humanos', 'Tool Room'].includes(user.rol) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.inventarioRol === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        user.inventarioRol === 'operador' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
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
      </Card>

      {/* Modal para agregar usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Agregar Nuevo Usuario</h2>
            
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre Completo *"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />

              <Input
                label="Usuario (opcional)"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
              />

              <Input
                label="Número de Empleado *"
                type="number"
                name="num_empleado"
                value={formData.num_empleado}
                onChange={handleChange}
                required
              />

              <Input
                label="Contraseña *"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={4}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol *
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 shadow-sm"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Ingeniero">Ingeniero</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Lider">Lider</option>
                  <option value="Operador">Operador</option>
                  <option value="Tecnico">Tecnico</option>
                  <option value="AOI">AOI</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Modula">Modula</option>
                  <option value="Magazines">Magazines</option>
                  <option value="Calidad">Calidad</option>
                  <option value="Soporte">Soporte</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Tool Room">Tool Room</option>
                  <option value="Invitado">Invitado</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                  }}
                  disabled={formBusy}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={formBusy}
                  className="flex-1"
                >
                  {formBusy ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  );
}
