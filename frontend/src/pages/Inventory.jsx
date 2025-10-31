import React, { useEffect, useState, useRef } from 'react';
import ImageUploader from '../components/ImageUploader.jsx';
import LoginModal from '../components/LoginModal.jsx';
import { FaCog } from 'react-icons/fa';
import api, { setAuthToken } from '../api.js';
import { jwtDecode } from 'jwt-decode';
import { toggleTheme } from '../theme.js';

// Utils
function parseDetalle(detalle) {
  try {
    return JSON.parse(detalle);
  } catch {
    return detalle;
  }
}

// Role permissions helper
const ROLES = {
  SUPER_ADMIN: ['The Goat'],                    // Nivel más alto - acceso total
  HIGH_ADMIN: ['Administrador', 'Ingeniero'],   // Administradores - acceso total
  OPERATOR: ['Operador', 'Tecnico'],            // Operadores - pueden editar
  GUEST: ['Invitado']                           // Solo lectura
};

function canEdit(rol) {
  // The Goat, Administrador, Ingeniero, Operador, Tecnico pueden editar
  return [...ROLES.SUPER_ADMIN, ...ROLES.HIGH_ADMIN, ...ROLES.OPERATOR].includes(rol);
}

function canAdminister(rol) {
  // The Goat, Administrador, Ingeniero pueden administrar
  return [...ROLES.SUPER_ADMIN, ...ROLES.HIGH_ADMIN].includes(rol);
}

function isGuest(rol) {
  // Solo Invitado es read-only
  return ROLES.GUEST.includes(rol);
}

function diffObj(prev, curr) {
  if (!prev || !curr) return null;
  const diffs = [];
  for (const k of Object.keys(curr)) {
    if (prev[k] !== undefined && prev[k] !== curr[k]) {
      diffs.push(`${k}: ${prev[k]} → ${curr[k]}`);
    }
  }
  return diffs.length ? diffs : null;
}

const ACCION_LABELS = {
  'INSERT': 'Agregar',
  'DELETE': 'Eliminar',
  'UPDATE': 'Editar',
  'DECREMENT': 'Usar/Restar 1',
  'PRESTAMO': 'Préstamo',
  'DEVOLUCION': 'Devolución',
  'USER_ADD': 'Agregar usuario',
  'USER_DELETE': 'Eliminar usuario',
  'USER_UPDATE': 'Editar usuario',
};

function Historial() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setLoading(true);
    api.get('/historial')
      .then(r => setHistorial(r.data))
      .catch(e => setError('Error cargando historial'))
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <div className="space-y-2">
      {loading && <div className="text-gray-500 text-sm">Cargando historial...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-1 sm:px-2 py-1 text-left">Fecha/Hora</th>
                <th className="px-1 sm:px-2 py-1 text-left">Usuario</th>
                <th className="px-1 sm:px-2 py-1 text-left">Acción</th>
                <th className="px-1 sm:px-2 py-1 text-left hidden md:table-cell">Detalle anterior</th>
                <th className="px-1 sm:px-2 py-1 text-left">Detalle nuevo</th>
                <th className="px-1 sm:px-2 py-1 text-left hidden lg:table-cell">Turno</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => {
                const detalle = parseDetalle(h.detalle);
                const adetalle = parseDetalle(h.adetalle);
                let detalleContent = null;
                let adetalleContent = null;
                
                if (typeof detalle === 'object' && detalle !== null) {
                  detalleContent = (
                    <ul className="list-disc pl-4">
                      {Object.entries(detalle).map(([k, v]) => (
                        <li key={k}><b>{k}:</b> {String(v)}</li>
                      ))}
                    </ul>
                  );
                } else {
                  detalleContent = <span>{String(detalle)}</span>;
                }
                
                if (typeof adetalle === 'object' && adetalle !== null) {
                  adetalleContent = (
                    <ul className="list-disc pl-4">
                      {Object.entries(adetalle).map(([k, v]) => (
                        <li key={k}><b>{k}:</b> {String(v)}</li>
                      ))}
                    </ul>
                  );
                } else {
                  adetalleContent = <span>{String(adetalle)}</span>;
                }
                
                return (
                  <tr key={h.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-1 sm:px-2 py-1 whitespace-nowrap text-xs">{new Date(h.fecha_hora).toLocaleString()}</td>
                    <td className="px-1 sm:px-2 py-1 text-xs">{h.username}</td>
                    <td className="px-1 sm:px-2 py-1 text-xs">{ACCION_LABELS[h.accion] || h.accion}</td>
                    <td className="px-1 sm:px-2 py-1 max-w-xs text-xs hidden md:table-cell">{adetalleContent}</td>
                    <td className="px-1 sm:px-2 py-1 max-w-xs text-xs">{detalleContent}</td>
                    <td className="px-1 sm:px-2 py-1 text-xs hidden lg:table-cell">{h.turno}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsuariosAdmin({ onClose, onPasswordPrompt }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
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
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      setUsuarios(response.data);
    } catch (e) {
      setError('Error cargando usuarios');
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAdd(e) {
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
      await loadUsuarios();
    } catch (err) {
      setFormError(err.message || 'Error creando usuario');
    } finally {
      setFormBusy(false);
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleEditUser(user) {
    setEditingUser({
      username: user.username,
      nombre: user.nombre,
      usuario: user.usuario || '',
      num_empleado: user.username,
      password: '',
      rol: user.rol,
      originalUsername: user.username
    });
  }

  function handleEditChange(e) {
    setEditingUser(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  async function handleSaveUser() {
    if (!editingUser) return;
    
    setFormBusy(true);
    setFormError('');
    
    try {
      // Preparar datos para enviar
      const updateData = {
        nombre: editingUser.nombre,
        usuario: editingUser.usuario || null,
        num_empleado: editingUser.num_empleado,
        rol: editingUser.rol
      };
      
      // Solo incluir password si se proporcionó uno nuevo
      if (editingUser.password) {
        updateData.password = editingUser.password;
      }
      
      await api.put(`/users/${editingUser.originalUsername}`, updateData);
      setEditingUser(null);
      await loadUsuarios();
    } catch (err) {
      setFormError(err.message || 'Error actualizando usuario');
    } finally {
      setFormBusy(false);
    }
  }

  function handleDeleteUser(username) {
    setConfirmDelete(username);
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;

    // Usar el sistema de prompt de contraseña
    onPasswordPrompt({
      action: 'delete-user',
      context: {
        username: confirmDelete,
        onSuccess: () => {
          setUsuarios(prev => prev.filter(u => u.username !== confirmDelete));
          setConfirmDelete(null);
          loadUsuarios(); // Recargar para estar seguro
        }
      }
    });
  }

  function handleCancelDelete() {
    setConfirmDelete(null);
  }

  function handleCancelEdit() {
    setEditingUser(null);
  }

  if (loading) return <div className="text-gray-500">Cargando usuarios...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h4 className="font-semibold text-sm sm:text-base">Administrar Usuarios</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm font-medium min-h-[36px]"
          >
            + Agregar Usuario
          </button>
          <button
            onClick={loadUsuarios}
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[36px]"
          >
            Actualizar
          </button>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-gray-500 text-sm">No hay usuarios registrados</div>
      ) : (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-2 sm:px-3 py-2 text-left">Usuario</th>
                <th className="px-2 sm:px-3 py-2 text-left hidden sm:table-cell">Nombre</th>
                <th className="px-2 sm:px-3 py-2 text-left">Rol</th>
                <th className="px-2 sm:px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.username} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-2 sm:px-3 py-2 font-medium">{user.username}</td>
                  <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{user.nombre}</td>
                  <td className="px-2 sm:px-3 py-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      canAdminister(user.rol) ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' :
                      canEdit(user.rol) ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs whitespace-nowrap min-h-[36px]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs whitespace-nowrap min-h-[36px]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700">
            <div className="mb-4 text-base sm:text-lg font-semibold text-red-700 dark:text-red-400">
              Confirmar eliminación
            </div>
            <div className="mb-6 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar el usuario <strong>{confirmDelete}</strong>?
              <br />
              <span className="text-xs sm:text-sm text-gray-500">Esta acción no se puede deshacer.</span>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm min-h-[44px]"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-4">Agregar Nuevo Usuario</h3>
            
            {formError && (
              <div className="bg-red-900/20 border border-red-500 text-red-600 dark:text-red-400 p-2 rounded mb-4 text-xs sm:text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Usuario (opcional)
                  </label>
                  <input
                    type="text"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Número de Empleado *
                  </label>
                  <input
                    type="text"
                    name="num_empleado"
                    value={formData.num_empleado}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 1234A"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={4}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  >
                    <option value="The Goat">The Goat</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Ingeniero">Ingeniero</option>
                    <option value="Operador">Operador</option>
                    <option value="Tecnico">Tecnico</option>
                    <option value="Invitado">Invitado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                    setFormData({
                      nombre: '',
                      usuario: '',
                      num_empleado: '',
                      password: '',
                      rol: 'Operador'
                    });
                  }}
                  disabled={formBusy}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  {formBusy ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-4">Editar Usuario</h3>
            
            {formError && (
              <div className="bg-red-900/20 border border-red-500 text-red-600 dark:text-red-400 p-2 rounded mb-4 text-xs sm:text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={editingUser.nombre}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Usuario (opcional)
                  </label>
                  <input
                    type="text"
                    name="usuario"
                    value={editingUser.usuario}
                    onChange={handleEditChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Número de Empleado *
                  </label>
                  <input
                    type="text"
                    name="num_empleado"
                    value={editingUser.num_empleado}
                    onChange={handleEditChange}
                    required
                    placeholder="Ej: 1234A"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Nueva Contraseña (dejar vacío para no cambiar)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={editingUser.password}
                    onChange={handleEditChange}
                    minLength={4}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={editingUser.rol}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  >
                    <option value="The Goat">The Goat</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Ingeniero">Ingeniero</option>
                    <option value="Operador">Operador</option>
                    <option value="Tecnico">Tecnico</option>
                    <option value="Invitado">Invitado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setFormError('');
                  }}
                  disabled={formBusy}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  {formBusy ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Botón de cerrar */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm min-h-[44px]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PrestamosPanel({ prestamos, onDevolver, onClose, loading }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-200">
            Préstamos Activos ({prestamos.length})
          </h3>
          <button
            onClick={onClose}
            className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-xl"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">Cargando préstamos...</div>
        ) : prestamos.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">No hay préstamos activos</div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-blue-100 dark:bg-blue-900/40">
                <tr>
                  <th className="px-2 py-2 text-left">Empleado</th>
                  <th className="px-2 py-2 text-left hidden sm:table-cell">N° Empleado</th>
                  <th className="px-2 py-2 text-left">Artículo</th>
                  <th className="px-2 py-2 text-left hidden md:table-cell">NDP</th>
                  <th className="px-2 py-2 text-left hidden md:table-cell">Gaveta</th>
                  <th className="px-2 py-2 text-left hidden lg:table-cell">Prestado por</th>
                  <th className="px-2 py-2 text-left hidden xl:table-cell">Fecha</th>
                  <th className="px-2 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map((p) => (
                  <tr key={p.id} className="border-b border-blue-200 dark:border-blue-800">
                    <td className="px-2 py-2">{p.empleado}</td>
                    <td className="px-2 py-2 hidden sm:table-cell">{p.num_empleado}</td>
                    <td className="px-2 py-2">{p.articulo}</td>
                    <td className="px-2 py-2 hidden md:table-cell">{p.ndp}</td>
                    <td className="px-2 py-2 hidden md:table-cell">{p.gaveta}</td>
                    <td className="px-2 py-2 hidden lg:table-cell">{p.empleado1}</td>
                    <td className="px-2 py-2 hidden xl:table-cell">
                      {p.fecha_prestamo ? new Date(p.fecha_prestamo).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => onDevolver(p)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-h-[36px]"
                      >
                        Devolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ user, onLogout, onOpenPassword, onOpenPrestamos }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-semibold">Inventario</span>
            <span className="text-xs text-gray-500 hidden md:inline">| Gestión de Gavetas</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {user?.nombre ? (
                <>
                  <b>{user.rol}</b> - {user.nombre}
                </>
              ) : (
                <>Rol: <b>{user.rol}</b></>
              )}
            </span>
            <button
              onClick={toggleTheme}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 text-xs sm:text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cambiar tema"
            >
              <span className="hidden sm:inline">Tema</span>
              <span className="sm:hidden">🌓</span>
            </button>
            <button
              onClick={onOpenPassword}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cambiar contraseña"
            >
              <FaCog />
            </button>
            <button
              onClick={onOpenPrestamos}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 text-xs sm:text-sm min-h-[44px]"
            >
              Préstamos
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 text-xs sm:text-sm min-h-[44px]"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ItemRow({ item, role, onEdit, onDelete, onDoubleClick, onDecrement, onPrestar }) {
  const qtyClass =
    item.cantidad < item.min
      ? 'text-red-600 font-semibold'
      : item.cantidad > item.max
      ? 'text-yellow-600 font-semibold'
      : '';
  
  return (
    <tr onDoubleClick={() => onDoubleClick && onDoubleClick(item)} className="border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm">{item.ndp}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm">{item.articulo}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm hidden md:table-cell">{item.equipo}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm">{item.gaveta}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm">{item.nivel}</td>
      <td className={`px-2 sm:px-3 py-2 text-xs sm:text-sm ${qtyClass}`}>
        <div className="flex items-center gap-1 sm:gap-2">
          <span>{item.cantidad}</span>
          {canEdit(role) && item.cantidad > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDecrement(item); }} 
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded font-bold min-h-[28px] min-w-[28px]"
              title="Usar 1 unidad (restar 1)"
            >
              -1
            </button>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm hidden lg:table-cell">{item.min}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm hidden lg:table-cell">{item.max}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm hidden xl:table-cell">{item.tde}</td>
      {/* imagen removida de la lista; se muestra en la tarjeta de detalle al hacer doble clic */}
      {canEdit(role) && (
        <td className="px-2 sm:px-3 py-2 text-right">
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-end">
            <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="text-blue-600 hover:underline text-xs sm:text-sm whitespace-nowrap min-h-[36px]" disabled={!canEdit(role)}>Editar</button>
            <button onClick={(e) => { e.stopPropagation(); onPrestar(item); }} className="text-purple-600 hover:underline text-xs sm:text-sm whitespace-nowrap min-h-[36px]" disabled={!canEdit(role) || item.cantidad <= 0}>Prestar</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="text-red-600 hover:underline text-xs sm:text-sm whitespace-nowrap min-h-[36px]" disabled={!canEdit(role)}>Eliminar</button>
          </div>
        </td>
      )}
    </tr>
  );
}

function ItemForm({ initial, onCancel, onSave, gavetas }) {
  const [form, setForm] = useState(
    initial || {
      ndp: '', articulo: '', equipo: '', gaveta: gavetas[0] || '', nivel: '', cantidad: 0, min: 0, max: 0, tde: 0, link: ''
    }
  );
  
  useEffect(() => {
    if (!initial && gavetas.length) setForm(f => ({ ...f, gaveta: gavetas[0] }));
  }, [gavetas, initial]);
  
  function upd(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function handleImageChange(fullUrl) {
    setForm(f => ({ ...f, link: fullUrl }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(form, false, initial);
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="text-xs sm:text-sm block mb-1">N° Parte</label>
          <input className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.ndp} onChange={e => upd('ndp', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Artículo</label>
          <input className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.articulo} onChange={e => upd('articulo', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Equipo</label>
          <input className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.equipo} onChange={e => upd('equipo', e.target.value)} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Gaveta</label>
          <input list="gavetas-list" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.gaveta} onChange={e => upd('gaveta', e.target.value)} required />
          <datalist id="gavetas-list">
            {gavetas.map(g => <option key={g} value={g}>{g}</option>)}
          </datalist>
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Nivel</label>
          <input type="number" min={1} className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.nivel} onChange={e => upd('nivel', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Cantidad</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.cantidad} onChange={e => upd('cantidad', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Mín</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.min} onChange={e => upd('min', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">Máx</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.max} onChange={e => upd('max', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">TDE</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={form.tde} onChange={e => upd('tde', Number(e.target.value))} min={0} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs sm:text-sm block mb-1">Subir imagen</label>
          <ImageUploader currentImage={form.link} onImageChange={handleImageChange} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2.5 dark:border-gray-700 text-sm min-h-[44px]">Cancelar</button>
        <button type="submit" className="rounded-lg bg-gray-900 text-white px-4 py-2.5 dark:bg-gray-100 dark:text-gray-900 text-sm min-h-[44px]">Guardar</button>
      </div>
    </form>
  );
}

// Modal para cambio de contraseña
function PasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [new1, setNew1] = useState('');
  const [new2, setNew2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    if (!current || !new1 || !new2) { 
      setError('Completa todos los campos'); 
      return; 
    }
    if (new1 !== new2) { 
      setError('Las contraseñas nuevas no coinciden'); 
      return; 
    }
    setLoading(true);
    try {
      await api.post('/users/change-password', { current, newPassword: new1 });
      setSuccess('Contraseña cambiada correctamente');
      setCurrent(''); 
      setNew1(''); 
      setNew2('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al cambiar contraseña');
    }
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleChange} className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm mb-1">Contraseña actual</label>
            <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs sm:text-sm mb-1">Nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={new1} onChange={e => setNew1(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs sm:text-sm mb-1">Repetir nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={new2} onChange={e => setNew2(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-xs sm:text-sm">{error}</div>}
          {success && <div className="text-green-600 text-xs sm:text-sm">{success}</div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 dark:border-gray-700 text-sm min-h-[44px]">Cerrar</button>
            <button type="submit" className="rounded-lg bg-blue-900 text-white px-4 py-2.5 dark:bg-blue-100 dark:text-blue-900 text-sm min-h-[44px]" disabled={loading}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal reutilizable para pedir contraseña
function PasswordPromptModal({ open, onClose, onSubmit, label = 'Contraseña', loading = false, error = '' }) {
  const [password, setPassword] = useState('');
  useEffect(() => { if (!open) setPassword(''); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold mb-4">{label}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(password); }} className="space-y-3">
          <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm" value={password} onChange={e => setPassword(e.target.value)} autoFocus required />
          {error && <div className="text-red-600 text-xs sm:text-sm">{error}</div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 dark:border-gray-700 text-sm min-h-[44px]">Cancelar</button>
            <button type="submit" className="rounded-lg bg-blue-900 text-white px-4 py-2.5 dark:bg-blue-100 dark:text-blue-900 text-sm min-h-[44px]" disabled={loading}>Aceptar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para préstamo
function PrestarModal({ open, item, onClose, onSubmit, turno, currentUser }) {
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    if (!open) {
      setShowScanner(false);
      setError('');
      setEmployeeInfo(null);
      setLoading(false);
      setAdminPassword('');
    } else {
      // Show scanner immediately when modal opens
      setShowScanner(true);
    }
  }, [open]);

  async function handleEmployeeScan(credentials) {
    setLoading(true);
    setError('');
    try {
      // Lookup employee info using the scanned badge
      const info = await api.lookupUser(credentials.employee_input);
      setEmployeeInfo(info);
      setShowScanner(false);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Empleado no encontrado');
      // keep scanner visible to let user retry
      setShowScanner(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!employeeInfo) throw new Error('Empleado no seleccionado');
      await onSubmit({
        employee_input: employeeInfo.num_empleado,
        admin_employee_input: currentUser.username,
        admin_password: adminPassword,
        item_id: item.id,
        turno
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al procesar préstamo');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {showScanner && (
        <LoginModal
          visible={true}
          onClose={() => { setShowScanner(false); onClose(); }}
          onConfirm={handleEmployeeScan}
          busy={loading}
          requirePassword={false} // Only scan badge, no password needed
        />
      )}

      {!showScanner && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Prestar Artículo</h3>
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              <p><b>Artículo:</b> {item?.articulo}</p>
              <p><b>NDP:</b> {item?.ndp}</p>
              <p><b>Cantidad disponible:</b> {item?.cantidad}</p>
            </div>

            {employeeInfo ? (
              <form onSubmit={handleConfirm} className="space-y-3">
                <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm">
                  <p><b>Empleado:</b> {employeeInfo.nombre}</p>
                  <p><b>N° Empleado:</b> {employeeInfo.num_empleado}</p>
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium">Ingresa tu contraseña de sesión para confirmar (serás el prestador)</label>
                  <input
                    type="password"
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                    required
                  />
                </div>

                {error && <div className="text-red-600 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</div>}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowScanner(true); setEmployeeInfo(null); setAdminPassword(''); setError(''); }}
                    className="rounded-lg border px-4 py-2.5 dark:border-gray-700 text-sm min-h-[44px]"
                  >
                    ← Escanear Otro
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-purple-600 text-white px-4 py-2.5 dark:bg-purple-500 text-sm min-h-[44px]"
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : 'Confirmar Préstamo'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                {loading ? 'Procesando...' : 'Escanea el gafete del empleado'}
              </div>
            )}

            {error && !employeeInfo && (
              <div className="mt-3 text-red-600 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">
                {error}
                <button
                  onClick={() => { setShowScanner(true); setError(''); }}
                  className="block w-full mt-2 text-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Modal para devolución
function DevolverModal({ open, prestamo, onClose, onSubmit, turno, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // send the prestamo object so backend can identify by num_empleado or id
      await onSubmit({
        prestamo,
        admin_employee_input: currentUser.username,
        admin_password: password,
        turno
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al procesar devolución');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Devolver Artículo</h3>

        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
          <p><b>Empleado:</b> {prestamo?.empleado}</p>
          <p><b>N° Empleado:</b> {prestamo?.num_empleado}</p>
          <p><b>Artículo:</b> {prestamo?.articulo}</p>
          <p><b>Prestado por:</b> {prestamo?.empleado1}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1 font-medium">Ingresa tu contraseña para confirmar la devolución</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              autoFocus
              required
            />
          </div>

          {error && <div className="text-red-600 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</div>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 dark:border-gray-700 text-sm min-h-[44px]">Cancelar</button>
            <button type="submit" className="rounded-lg bg-green-600 text-white px-4 py-2.5 dark:bg-green-500 text-sm min-h-[44px]" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [token] = useState(localStorage.getItem('token'));
  const [user] = useState(() => (token ? jwtDecode(token) : null));
  const activityTimer = useRef(null);
  const TIMEOUT = 5 * 60 * 1000; // 5 minutos
  const resetTimer = () => {
    if (activityTimer.current) clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(() => {
      setAuthToken(null);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }, TIMEOUT);
  };
  useEffect(() => {
    const events = ['mousemove','mousedown','keypress','touchstart','click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    // limpiar timers y listeners
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (activityTimer.current) clearTimeout(activityTimer.current);
    };
  }, []);

  // Si se cierra la pestaña/ventana, cerrar sesión inmediatamente
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // limpiar token y forzar redirect al login en next tick
      setAuthToken(null);
      localStorage.removeItem('token');
      // Note: no mostrar diálogo, solo limpiar
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
  const [gavetas, setGavetas] = useState([]);
  const [activeGaveta, setActiveGaveta] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [turno, setTurno] = useState('');
  // Estado para modales de contraseña
  const [pwPrompt, setPwPrompt] = useState({ open: false, action: null, context: null });
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  
  // Estados para filtros por columna
  const [filtroNdp, setFiltroNdp] = useState('');
  const [filtroArticulo, setFiltroArticulo] = useState('');
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [filtroGaveta, setFiltroGaveta] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');

  // Estados para préstamos
  const [showPrestamos, setShowPrestamos] = useState(false);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamosLoading, setPrestamosLoading] = useState(false);
  const [prestarModal, setPrestarModal] = useState({ open: false, item: null });
  const [devolverModal, setDevolverModal] = useState({ open: false, prestamo: null });

  function logout() {
    setAuthToken(null);
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  // Calcular turno actual
  function calcularTurno() {
    const now = new Date();
    const dia = now.getDay(); // 0=domingo, 1=lunes, ...
    const hora = now.getHours();
    if ((dia >= 1 && dia <= 4) && (hora >= 8 && hora < 20)) return 'Primero';
    if (((dia === 3 || dia === 4 || dia === 5 || dia === 6) && (hora >= 20 || hora < 8))) return 'Segundo';
    if (((dia === 1 || dia === 2) && (hora >= 20 || hora < 8)) || ((dia === 5 || dia === 6) && (hora >= 8 && hora < 20))) return 'Mixto';
    return 'N/A';
  }
  
  useEffect(() => {
    setTurno(calcularTurno());
    const interval = setInterval(() => setTurno(calcularTurno()), 60000);
    return () => clearInterval(interval);
  }, []);
  // Normalize API base robustly (accepts full url or relative like '/api')
  function normalizeApiBase(raw) {
    let r = raw ? raw.replace(/\/api$/, '') : '';
    // ensure protocol has exactly two slashes (fix cases like 'http:/host')
    r = r.replace(/^(https?:)\/+/, '$1//');
    // if r is just an IP or hostname possibly prefixed with / (e.g. '10.229.52.220' or '/10.229.52.220'), add protocol
    const ipHostMatch = r.match(/^\/*((?:\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/);
    if (ipHostMatch) {
      const host = ipHostMatch[1] + (ipHostMatch[2] || '');
      r = window.location.protocol + '//' + host + (ipHostMatch[3] || '');
    }
    try {
      const u = new URL(r);
      return (u.origin + u.pathname).replace(/\/$/, '');
    } catch (e) {
      if (r.startsWith('/')) return (window.location.origin + r).replace(/\/$/, '');
      return window.location.origin;
    }
  }
  const apiBase = normalizeApiBase(import.meta.env.VITE_API_URL || '');

  // Función simplificada para construir URLs de imágenes (como en skillmatrix)
  function resolveImageUrl(link) {
    if (!link) return null;
    if (link.startsWith('http://') || link.startsWith('https://')) return link;
    
    // Limpiar cualquier prefijo de IP duplicado
    let cleanPath = link;
    if (link.includes('/uploads/')) {
      // Extraer solo la parte después de uploads
      const uploadIndex = link.indexOf('/uploads/');
      cleanPath = link.substring(uploadIndex);
    }
    
    // Asegurar que comience con /
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    
    // Usar la base de la API sin '/api'
    const baseUrl = apiBase.replace('/api', '');
    return baseUrl + cleanPath;
  }

  async function loadGavetas() {
    try {
      const { data } = await api.get('/gavetas');
      setGavetas(data);
      if (data && data.length > 0) {
        setActiveGaveta(data[0]);
      }
    } catch (e) {
      console.error('Error loading gavetas:', e);
    }
  }
  
  async function loadItems() {
    if (activeGaveta === null && !q) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      // If there's a search query, search globally (all gavetas)
      // Otherwise, filter by selected gaveta
      const params = q ? { q } : { gaveta: activeGaveta };
      const { data } = await api.get('/items', { params });
      // Normalizar link de imagen a URL absoluta para evitar cargar /uploads/... desde el origen del frontend
      const normalized = (data.data || []).map(it => ({
        ...it,
        link: it.link ? (it.link.startsWith('http') ? it.link : resolveImageUrl(it.link)) : it.link
      }));
      setItems(normalized);
      setTotal(data.total);
    } catch (e) {
      setItems([]);
      setTotal(0);
    }
    setLoading(false);
  }
  
  useEffect(() => { loadGavetas(); }, []);
  useEffect(() => { loadItems(); }, [activeGaveta, q]);

  // item: either plain object or FormData; isForm indicates FormData
  async function handleSave(item, isForm = false, initial = null) {
    if (initial && initial.id) {
      // edición: pedir contraseña
      // guardamos también el link anterior para poder eliminar el archivo si se reemplaza
      setPwPrompt({ open: true, action: 'edit-item', context: { payload: item, id: initial.id, prevLink: initial.link } });
      return;
    }
    try {
      if (isForm) {
        // axios in api supports form data automatically
        await api.post('/items', item);
      } else {
        await api.post('/items', item);
      }
      setModal(null);
      loadItems();
    } catch (e) {
      console.error('Error saving item:', e);
    }
  }
  
  function handleDelete(item) {
    setPwPrompt({ open: true, action: 'delete-item', context: item });
  }

  function handleDecrement(item) {
    setPwPrompt({ open: true, action: 'decrement-item', context: item });
  }

  function handlePrestar(item) {
    if (item.cantidad <= 0) {
      alert('No hay unidades disponibles para prestar');
      return;
    }
    setPrestarModal({ open: true, item });
  }

  async function handlePrestarSubmit(data) {
    try {
      await api.post('/prestamos', data);
      await loadItems();
      await loadPrestamos();
      setPrestarModal({ open: false, item: null });
    } catch (e) {
      throw e;
    }
  }

  function handleDevolver(prestamo) {
    setDevolverModal({ open: true, prestamo });
  }

  async function handleDevolverSubmit(data) {
    try {
      await api.post(`/prestamos/${data.prestamo.num_empleado}/devolver`, {
        admin_employee_input: data.admin_employee_input,
        admin_password: data.admin_password
      });
      await loadItems();
      await loadPrestamos();
      setDevolverModal({ open: false, prestamo: null });
    } catch (e) {
      throw e;
    }
  }

  async function loadPrestamos() {
    setPrestamosLoading(true);
    try {
      const { data } = await api.get('/prestamos');
      setPrestamos(data);
    } catch (e) {
      console.error('Error loading prestamos:', e);
      setPrestamos([]);
    } finally {
      setPrestamosLoading(false);
    }
  }

  useEffect(() => {
    if (showPrestamos) {
      loadPrestamos();
    }
  }, [showPrestamos]);

  async function handlePwSubmit(password) {
    setPwLoading(true);
    setPwError('');
    try {
      if (pwPrompt.action === 'edit-item') {
        const { payload, id, prevLink } = pwPrompt.context;
        const obj = { ...payload, password };
        await api.put(`/items/${id}`, obj);
        // si existía una imagen anterior y ahora hay una nueva distinta, eliminar la anterior
        try {
          const newLink = payload.link || '';
          if (prevLink && newLink && prevLink !== newLink) {
            // extraer filename
            const prevFilename = prevLink.split('/').pop();
            await api.delete(`/upload/delete/${prevFilename}`);
          }
        } catch (err) {
          console.warn('No se pudo eliminar archivo anterior:', err);
        }
        setModal(null);
        loadItems();
      } else if (pwPrompt.action === 'delete-item') {
        const { id } = pwPrompt.context;
        await api.delete(`/items/${id}`, { data: { password } });
        loadItems();
      } else if (pwPrompt.action === 'decrement-item') {
        const { id } = pwPrompt.context;
        await api.patch(`/items/${id}/decrement`, { password, turno });
        loadItems();
      } else if (pwPrompt.action === 'edit-user') {
        const { username, rol, onSuccess } = pwPrompt.context;
        await api.put(`/users/${username}`, { rol, adminPassword: password });
        if (onSuccess) onSuccess();
      } else if (pwPrompt.action === 'delete-user') {
        const { username, onSuccess } = pwPrompt.context;
        await api.delete(`/users/${username}`, { data: { adminPassword: password } });
        if (onSuccess) onSuccess();
      }
      setPwPrompt({ open: false, action: null, context: null });
    } catch (e) {
      setPwError(e?.response?.data?.message || 'Contraseña incorrecta');
    }
    setPwLoading(false);
  }

  // Función para exportar a Excel
  async function handleExportExcel() {
    try {
      const params = {};
      if (activeGaveta !== null) params.gaveta = activeGaveta;
      if (q) params.q = q;

      const response = await api.get('/items/export/excel', { 
        params,
        responseType: 'blob'
      });
      
      // Crear blob y descargar archivo
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre de archivo con fecha
      const today = new Date().toISOString().slice(0, 10);
      const gavetaText = activeGaveta !== null ? `_gaveta${activeGaveta}` : '';
      const searchText = q ? `_filtrado` : '';
      link.download = `inventario${gavetaText}${searchText}_${today}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error exportando a Excel:', e);
      alert('Error exportando datos a Excel');
    }
  }

  // Ordenar items por nivel ascendente (de menor a mayor)
  const itemsOrdenados = [...items].sort((a, b) => {
    const nivelA = a.nivel || 0;
    const nivelB = b.nivel || 0;
    return nivelA - nivelB;
  });

  // Aplicar filtros por columna
  const itemsFiltrados = itemsOrdenados.filter(item => {
    const matchNdp = !filtroNdp || (item.ndp && item.ndp.toLowerCase().includes(filtroNdp.toLowerCase()));
    const matchArticulo = !filtroArticulo || (item.articulo && item.articulo.toLowerCase().includes(filtroArticulo.toLowerCase()));
    const matchEquipo = !filtroEquipo || (item.equipo && item.equipo.toLowerCase().includes(filtroEquipo.toLowerCase()));
    const matchGaveta = !filtroGaveta || (item.gaveta && item.gaveta.toString().includes(filtroGaveta));
    const matchNivel = !filtroNivel || (item.nivel && item.nivel.toString().includes(filtroNivel));
    
    return matchNdp && matchArticulo && matchEquipo && matchGaveta && matchNivel;
  });

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroNdp('');
    setFiltroArticulo('');
    setFiltroEquipo('');
    setFiltroGaveta('');
    setFiltroNivel('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header 
        user={user} 
        onLogout={logout} 
        onOpenPassword={() => setShowPasswordModal(true)}
        onOpenPrestamos={() => setShowPrestamos(!showPrestamos)}
      />
      {showPrestamos && (
        <PrestamosPanel
          prestamos={prestamos}
          onDevolver={handleDevolver}
          onClose={() => setShowPrestamos(false)}
          loading={prestamosLoading}
        />
      )}
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-3 sm:py-6">
        <div className="mb-2 text-right text-xs sm:text-sm text-blue-900 dark:text-blue-200 font-semibold">
          Turno: <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">{turno}</span>
        </div>
        {/* Gavetas */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto mb-3 pb-2">
          {gavetas.map((g) => {
            const tieneResultados = false; // Cambiar lógica si es necesario
            let btnClass = 'px-3 sm:px-4 py-2 rounded-full border dark:border-gray-700 transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap min-h-[44px] ';
            if (g === activeGaveta) {
              btnClass += 'bg-white text-gray-900 dark:bg-gray-100 dark:text-gray-900';
            } else if (tieneResultados) {
              btnClass += 'bg-green-200 text-green-900 border-green-400 dark:bg-green-300 dark:text-green-900 dark:border-green-400 animate-pulse';
            } else {
              btnClass += 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100';
            }
            return (
              <button
                key={g}
                onClick={() => setActiveGaveta(g)}
                className={btnClass}
              >
                Gaveta {g}
              </button>
            );
          })}
        </div>
        {/* Botones y barra de búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {canAdminister(user?.rol) && (
              <>
                <button
                  onClick={() => setModal({ mode: 'historial' })}
                  className="rounded-xl bg-blue-900 text-white px-3 sm:px-4 py-2 dark:bg-blue-400 dark:text-blue-900 font-semibold border border-blue-900 dark:border-blue-400 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Ver historial</span>
                  <span className="sm:hidden">Historial</span>
                </button>
                <button
                  onClick={() => setModal({ mode: 'usuarios' })}
                  className="rounded-xl bg-green-900 text-white px-3 sm:px-4 py-2 dark:bg-green-400 dark:text-green-900 font-semibold border border-green-900 dark:border-green-400 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Administrar usuarios</span>
                  <span className="sm:hidden">Usuarios</span>
                </button>
              </>
            )}
            {canEdit(user?.rol) && (
              <>
                <button
                  onClick={handleExportExcel}
                  className="rounded-xl bg-orange-900 text-white px-3 sm:px-4 py-2 dark:bg-orange-400 dark:text-orange-900 font-semibold border border-orange-900 dark:border-orange-400 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none"
                  title="Exportar datos a Excel"
                >
                  <span className="hidden sm:inline">Exportar Excel</span>
                  <span className="sm:hidden">Excel</span>
                </button>
                <button
                  onClick={() => setModal({ mode: 'add' })}
                  className="rounded-xl bg-gray-900 text-white px-3 sm:px-4 py-2 dark:bg-gray-100 dark:text-gray-900 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none"
                >
                  + Agregar
                </button>
              </>
            )}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (N° parte, artículo, equipo)"
            className="w-full sm:w-72 rounded-xl border px-3 py-2 dark:bg-gray-800 dark:border-gray-700 sm:ml-auto text-sm min-h-[44px]"
          />
        </div>
        <div className="mb-2 flex justify-end">
          {(filtroNdp || filtroArticulo || filtroEquipo || filtroGaveta || filtroNivel) && (
            <button
              onClick={limpiarFiltros}
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[36px]"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">N° Parte</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">Artículo</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden md:table-cell">Equipo</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">Gaveta</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">Nivel</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">Cant.</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden lg:table-cell">Mín</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden lg:table-cell">Máx</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden xl:table-cell">TDE</th>
                {/* Imagen column removed from list view */}
                {canEdit(user?.rol) && <th className="px-2 sm:px-3 py-2"></th>}
              </tr>
              <tr>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroNdp}
                    onChange={(e) => setFiltroNdp(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroArticulo}
                    onChange={(e) => setFiltroArticulo(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1 hidden md:table-cell">
                  <input
                    type="text"
                    value={filtroEquipo}
                    onChange={(e) => setFiltroEquipo(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroGaveta}
                    onChange={(e) => setFiltroGaveta(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroNivel}
                    onChange={(e) => setFiltroNivel(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1"></th>
                <th className="px-1 sm:px-2 py-1 hidden lg:table-cell"></th>
                <th className="px-1 sm:px-2 py-1 hidden lg:table-cell"></th>
                <th className="px-1 sm:px-2 py-1 hidden xl:table-cell"></th>
                {(user?.rol === 'admin' || user?.rol === 'operador') && <th className="px-1 sm:px-2 py-1"></th>}
              </tr>
            </thead>
            <tbody>
              {!loading && Array.isArray(itemsFiltrados) && itemsFiltrados.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  role={user?.rol}
                  onEdit={canEdit(user?.rol) ? (item) => setModal({ mode: 'edit', item }) : undefined}
                  onDelete={canEdit(user?.rol) ? handleDelete : undefined}
                  onDecrement={canEdit(user?.rol) ? handleDecrement : undefined}
                  onPrestar={canEdit(user?.rol) ? handlePrestar : undefined}
                  onDoubleClick={(item) => { setModal({ mode: 'detail', item }); }}
                />
              ))}
            </tbody>
          </table>
          {loading && <div className="p-4 sm:p-6 text-center text-gray-500 text-sm">Cargando...</div>}
          {!loading && Array.isArray(itemsFiltrados) && itemsFiltrados.length === 0 && <div className="p-4 sm:p-6 text-center text-gray-500 text-sm">Sin resultados</div>}
        </div>
        <div className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Total: <b>{total}</b> | Mostrando: <b>{itemsFiltrados.length}</b>
        </div>
      </main>
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 border dark:border-gray-700 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold">
                {modal.mode === 'edit' ? 'Editar' : modal.mode === 'historial' ? 'Historial de acciones' : modal.mode === 'usuarios' ? 'Administrar usuarios' : 'Agregar ítem'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl w-10 h-10 flex items-center justify-center min-h-[44px] min-w-[44px]">
                ✕
              </button>
            </div>
            {modal.mode === 'historial' ? (
              <Historial />
            ) : modal.mode === 'usuarios' ? (
              <UsuariosAdmin 
                onClose={() => setModal(null)} 
                onPasswordPrompt={(promptData) => {
                  setModal(null); // Cerrar modal de usuarios
                  setPwPrompt({
                    open: true,
                    action: promptData.action,
                    context: promptData.context
                  });
                }}
              />
            ) : modal.mode === 'detail' ? (
              // detalle de ítem (tarjeta con imagen si existe)
              <div>
                <div className="mb-3">
                  <h4 className="text-base sm:text-lg font-semibold">{modal.item.articulo} (N° {modal.item.ndp})</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Equipo: {modal.item.equipo} — Gaveta: {modal.item.gaveta} — Nivel: {modal.item.nivel}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-sm">
                    <p><b>Cantidad:</b> {modal.item.cantidad}</p>
                    <p><b>Mín:</b> {modal.item.min}</p>
                    <p><b>Máx:</b> {modal.item.max}</p>
                    <p className="mt-2"><b>TDE:</b> {modal.item.tde}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    {modal.item.link ? (
                      <>
                        <img 
                          src={resolveImageUrl(modal.item.link)} 
                          alt={modal.item.articulo} 
                          className="max-h-60 sm:max-h-80 object-contain" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="max-h-60 sm:max-h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded"
                          style={{display: 'none'}}
                        >
                          <span className="text-xs sm:text-sm p-4">Error cargando imagen</span>
                        </div>
                      </>
                    ) : (
                      <div className="max-h-60 sm:max-h-80 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded p-8">
                        <span className="text-xs sm:text-sm">Sin imagen disponible</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <ItemForm initial={modal.item} onCancel={() => setModal(null)} onSave={handleSave} gavetas={gavetas} />
            )}
          </div>
        </div>
      )}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      <PasswordPromptModal
        open={pwPrompt.open}
        onClose={() => { setPwPrompt({ open: false, action: null, context: null }); setPwError(''); setPwLoading(false); }}
        onSubmit={handlePwSubmit}
        label={pwPrompt.action === 'edit-item' ? 'Confirma tu contraseña para editar' :
               pwPrompt.action === 'delete-item' ? 'Confirma tu contraseña para eliminar' :
               pwPrompt.action === 'decrement-item' ? `Confirma tu contraseña para usar 1 unidad de ${pwPrompt.context?.articulo || 'este artículo'}` :
               pwPrompt.action === 'edit-user' ? 'Contraseña de administrador para editar usuario' :
               pwPrompt.action === 'delete-user' ? 'Contraseña de administrador para eliminar usuario' : 'Contraseña'}
        loading={pwLoading}
        error={pwError}
      />
      <PrestarModal
        open={prestarModal.open}
        item={prestarModal.item}
        onClose={() => setPrestarModal({ open: false, item: null })}
        onSubmit={handlePrestarSubmit}
        turno={turno}
        currentUser={user}
      />
      <DevolverModal
        open={devolverModal.open}
        prestamo={devolverModal.prestamo}
        onClose={() => setDevolverModal({ open: false, prestamo: null })}
        onSubmit={handleDevolverSubmit}
        turno={turno}
        currentUser={user}
      />
    </div>
  );
}
