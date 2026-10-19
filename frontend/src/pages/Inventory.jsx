import React, { useEffect, useState, useRef } from 'react';
import ImageUploader from '../components/ImageUploader.jsx';
import LoginModal from '../components/LoginModal.jsx';
import QuantityPromptModal from '../components/QuantityPromptModal.jsx';
import QRModal from '../components/QRModal.jsx';
import QRBulkModal from '../components/QRBulkModal.jsx';
import api, { setAuthToken } from '../api.js';
import { jwtDecode } from 'jwt-decode';
import Layout from '../components/Layout.jsx';
import NotificationsModal from '../components/NotificationsModal.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

import { trLocal, localeFor, getLang } from '../i18n/index.js';
import { prepareAutoTranslate, useDataTranslation } from '../i18n/autotranslate.js';

// Formatos comunes
function formatCurrency(value) {
  try {
    const n = Number(value || 0);
    // Formatear en Pesos Mexicanos (MXN)
    return new Intl.NumberFormat(localeFor(), { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(value);
  }
}

// Utils
function parseDetalle(detalle) {
  try {
    return JSON.parse(detalle);
  } catch {
    return detalle;
  }
}

// Role permissions helper
// Group definitions based on requested policy:
// - FULL_ACCESS: full admin capabilities (manage users, settings, full edit)
// - TOOL_ACCESS: can view data and edit tool-room related items, but NOT manage users
// - GUEST: read-only
const ROLE_GROUPS = {
  FULL_ACCESS: ['Ingeniero', 'Administrador'],
  TOOL_ACCESS: ['AOI', 'Mantenimiento', 'Supervisor', 'Modula', 'Tecnico', 'Magazines', 'Calidad', 'Soporte', 'Lider', 'Operador', 'Recursos Humanos', 'Tool Room'],
  GUEST: ['Invitado']
};

function isGuest(rol) {
  return ROLE_GROUPS.GUEST.includes(rol);
}

// Puede ver historial, exportar y préstamos (todos los FULL_ACCESS, incluyendo ensamble)
function canViewHistory(rol, area) {
  return ROLE_GROUPS.FULL_ACCESS.includes(rol);
}

// Puede administrar usuarios (Administrador/Ingeniero siempre, otros solo si no es ensamble)
function canAdministerUsers(rol, area) {
  // Administrador e Ingeniero pueden usar esta función sin restricción de área
  if (ROLE_GROUPS.FULL_ACCESS.includes(rol)) return true;
  // Para otros roles, bloquear si área es ensamble
  if (area && area.toLowerCase() === 'ensamble') return false;
  return ROLE_GROUPS.FULL_ACCESS.includes(rol);
}

// Puede editar items (agregar/editar/eliminar, decrementar)
function canEditInventory(rol, area) {
  // Si en el futuro quieres bloquear edición para ensamble, agrega aquí la condición.
  return [...ROLE_GROUPS.FULL_ACCESS, ...ROLE_GROUPS.TOOL_ACCESS].includes(rol);
}

// Puede hacer préstamos (Administrador/Ingeniero siempre, otros solo si no es ensamble)
function canLendItems(rol, area) {
  // Administrador e Ingeniero pueden hacer préstamos sin restricción de área
  if (ROLE_GROUPS.FULL_ACCESS.includes(rol)) return true;
  // Para otros roles, bloquear si área es ensamble
  if (area && area.toLowerCase() === 'ensamble') return false;
  return [...ROLE_GROUPS.FULL_ACCESS, ...ROLE_GROUPS.TOOL_ACCESS].includes(rol);
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
      .catch(e => setError(trLocal('error_loading_history')))
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <div className="space-y-4">
      {loading && <div className="text-slate-500 text-sm">Cargando historial...</div>}
      {error && <div className="text-rose-600 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{trLocal('fecha_hora')}</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{trLocal('usuario_label')}</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{trLocal('accion_label')}</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white hidden md:table-cell">{trLocal('detalle_anterior')}</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{trLocal('detalle_nuevo')}</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white hidden lg:table-cell">{trLocal('turno_label')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
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
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{new Date(h.fecha_hora).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{h.username}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ACCION_LABELS[h.accion] || h.accion}</td>
                    <td className="px-4 py-3 max-w-xs text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">{adetalleContent}</td>
                    <td className="px-4 py-3 max-w-xs text-slate-500 dark:text-slate-400 text-xs">{detalleContent}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">{h.turno}</td>
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
  // Obtener usuario actual del token para saber si es Administrador
  const currentAdminUser = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      return jwtDecode(token);
    } catch { return null; }
  })();
  const isAdministrador = currentAdminUser?.rol === 'Administrador';
  const adminArea = currentAdminUser?.area || '';

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    num_empleado: '',
    password: '',
    rol: 'Operador',
    area: isAdministrador ? adminArea : ''
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
        num_empleado: '',
        password: '',
        rol: 'Operador',
        area: ''
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
      num_empleado: user.username,
      password: '',
      rol: user.rol,
      area: user.area || '',
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
        num_empleado: editingUser.num_empleado,
        rol: editingUser.rol,
        area: editingUser.area || null
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

  const usuariosFiltrados = usuarios.filter(user => {
    if (!filtroUsuario) return true;
    const q = filtroUsuario.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.nombre && user.nombre.toLowerCase().includes(q)) ||
      (user.rol && user.rol.toLowerCase().includes(q)) ||
      (user.area && user.area.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="text-slate-500">{trLocal('loading_users')}</div>;
  if (error) return <div className="text-rose-600">{error}</div>;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 pb-4 -mx-6 px-6 -mt-2 pt-2 border-b border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">{trLocal('manage_users')}</h4>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddForm(true)}>
              {trLocal('add_user')}
            </Button>
            <Button variant="secondary" onClick={loadUsuarios}>
              {trLocal('refresh')}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Filtro de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          value={filtroUsuario}
          onChange={e => setFiltroUsuario(e.target.value)}
          placeholder="Buscar por nombre, número de empleado, rol o área..."
          className="w-full text-sm p-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all placeholder:text-slate-400"
        />
      </div>

      {usuariosFiltrados.length === 0 ? (
        <div className="text-slate-500 text-sm">{filtroUsuario ? 'No se encontraron usuarios con ese filtro' : trLocal('no_users')}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Num. Empleado</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white hidden sm:table-cell">Nombre</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Rol</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white hidden md:table-cell">Área</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {usuariosFiltrados.map(user => (
                <tr key={user.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.username}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{user.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      canAdministerUsers(user.rol, user.area) ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
                      canEditInventory(user.rol, user.area) ? 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                    {user.area ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
                        {user.area}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Sin área</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300 text-sm font-medium"
                      >
                        {trLocal('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 text-sm font-medium"
                      >
                        {trLocal('delete')}
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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[70]">
          <Card className="w-full max-w-md border-rose-200 dark:border-rose-900">
            <div className="mb-4 text-lg font-bold text-rose-600 dark:text-rose-400">
              {trLocal('delete_confirm')}
            </div>
            <div className="mb-6 text-slate-600 dark:text-slate-300">
              {trLocal('delete_user_text')} <strong className="text-slate-900 dark:text-white">{confirmDelete}</strong>?
              <br />
              <span className="text-sm text-slate-500 mt-2 block">{trLocal('irreversible_action')}</span>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="secondary" onClick={handleCancelDelete}>
                {trLocal('cancel')}
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
                {trLocal('delete')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal para agregar usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[70]">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{trLocal('add_new_user')}</h3>
            
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <Input label="Nombre Completo *" name="nombre" value={formData.nombre} onChange={handleChange} required />
              <Input label="Número de Empleado *" name="num_empleado" value={formData.num_empleado} onChange={handleChange} required placeholder="Ej: 1234A" />
              <Input label="Contraseña *" type="password" name="password" value={formData.password} onChange={handleChange} required minLength={4} />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol *
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 px-4 py-2.5 shadow-sm transition-colors duration-200"
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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Área
                </label>
                {isAdministrador ? (
                  <div className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-3 py-2 text-sm">
                    {adminArea || 'Sin área'}
                  </div>
                ) : (
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 px-4 py-2.5 shadow-sm transition-colors duration-200"
                  >
                    <option value="">Sin área</option>
                    <option value="SMT">SMT</option>
                    <option value="Ensamble">Ensamble</option>
                  </select>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="secondary" onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                    setFormData({
                      nombre: '',
                      num_empleado: '',
                      password: '',
                      rol: 'Operador',
                      area: ''
                    });
                  }} disabled={formBusy} className="flex-1">
                  {trLocal('cancel')}
                </Button>
                <Button type="submit" disabled={formBusy} className="flex-1">
                  {formBusy ? trLocal('processing') : trLocal('create_user')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal para editar usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[70]">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{trLocal('edit_item')}</h3>
            
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
              <Input label="Nombre Completo *" name="nombre" value={editingUser.nombre} onChange={handleEditChange} required />
              <Input label="Número de Empleado *" name="num_empleado" value={editingUser.num_empleado} onChange={handleEditChange} required placeholder="Ej: 1234A" />
              <Input label="Nueva Contraseña (dejar vacío para no cambiar)" type="password" name="password" value={editingUser.password} onChange={handleEditChange} minLength={4} />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol *
                </label>
                <select
                  name="rol"
                  value={editingUser.rol}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 px-4 py-2.5 shadow-sm transition-colors duration-200"
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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Área
                </label>
                <select
                  name="area"
                  value={editingUser.area}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 px-4 py-2.5 shadow-sm transition-colors duration-200"
                >
                  <option value="">Sin área</option>
                  <option value="SMT">SMT</option>
                  <option value="Ensamble">Ensamble</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="secondary" onClick={() => {
                    setEditingUser(null);
                    setFormError('');
                  }} disabled={formBusy} className="flex-1">
                  {trLocal('cancel')}
                </Button>
                <Button type="submit" disabled={formBusy} className="flex-1">
                  {formBusy ? trLocal('processing') : trLocal('save_changes')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function PrestamosPanel({ prestamos, onDevolver, onClose, loading }) {
  const tr = useDataTranslation();
  return (
    <div className="bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">
              {trLocal('loans_active')} ({prestamos.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150"
          >
            {trLocal('close')}
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-slate-500 text-sm py-8">{trLocal('loading')}</div>
        ) : prestamos.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">{trLocal('no_active_loans')}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-900/30 bg-white dark:bg-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/30">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">Empleado</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 hidden sm:table-cell">N° Empleado</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">Artículo</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 hidden md:table-cell">NDP</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 hidden md:table-cell">Gaveta</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 hidden lg:table-cell">Prestado por</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 hidden xl:table-cell">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900/20">
                {prestamos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.empleado}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{p.num_empleado}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{tr(p.articulo)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{p.ndp}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{p.gaveta}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{p.empleado1}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                      {p.fecha_prestamo ? new Date(p.fecha_prestamo).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        size="sm"
                        onClick={() => onDevolver(p)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {trLocal('return_item')}
                      </Button>
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



function ConsumoCell({ consumo }) {
  if (!consumo) return <span className="text-sm text-slate-400 dark:text-slate-500">-</span>;
  if (consumo.estado !== 'ok') {
    return <span className="text-xs text-slate-500 dark:text-slate-400">{trLocal(`consumo_estado_${consumo.estado}`)}</span>;
  }
  return (
    <span
      className="text-sm font-medium text-slate-700 dark:text-slate-300"
      title={`${trLocal('consumo_estimated_end')}: ${consumo.fecha_agotamiento}`}
    >
      ~{consumo.dias_restantes} {trLocal('days_short')}
    </span>
  );
}

function ConsumoDetail({ consumo }) {
  if (consumo.estado !== 'ok') {
    return <p className="text-sm text-slate-600 dark:text-slate-300">{trLocal(`consumo_estado_${consumo.estado}`)}</p>;
  }
  return (
    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
      <p>{trLocal('consumo_note')}</p>
      <p><b>{trLocal('consumo_period')}:</b> {consumo.periodo_dias} {trLocal('days_short')}</p>
      <p><b>{trLocal('consumo_daily_avg')}:</b> {consumo.promedio_diario}</p>
      <p><b>{trLocal('consumo_observed_days')}:</b> {consumo.dias_observados}</p>
      <p><b>{trLocal('consumo_since')}:</b> {consumo.seguimiento_desde}</p>
      <p><b>{trLocal('consumo_remaining')}:</b> {consumo.dias_restantes} {trLocal('days_short')}</p>
      <p><b>{trLocal('consumo_estimated_end')}:</b> {consumo.fecha_agotamiento}</p>
      {consumo.historial_parcial && <p>{trLocal('consumo_partial')}</p>}
      <p>{trLocal('consumo_units_note')}</p>
    </div>
  );
}

const FILTER_INPUT = 'w-full text-xs px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/30';

function TableSkeleton({ columns, rows = 6 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className="border-b border-slate-100 dark:border-slate-700/50" aria-hidden="true">
      {Array.from({ length: columns }, (_, c) => (
        <td key={c} className="px-4 py-3.5 h-[52px]">
          <div className="h-4 rounded shimmer" />
        </td>
      ))}
    </tr>
  ));
}

function ItemRow({ item, role, area, consumo, onEdit, onDelete, onDoubleClick, onDecrement, onPrestar, onShowQR }) {
  const tr = useDataTranslation();
  // Determine stock status
  const stockStatus = item.cantidad < item.min ? 'low' : item.cantidad > item.max ? 'high' : 'normal';
  const statusBadge = {
    low: 'text-rose-700 dark:text-rose-300',
    high: 'text-amber-700 dark:text-amber-300',
    normal: 'text-slate-900 dark:text-slate-100'
  };
  const actionBtn = 'px-2 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150';
  const isMantenimiento = area === 'Ensamble';
  
  return (
    <tr 
      onDoubleClick={() => onDoubleClick && onDoubleClick(item)} 
      className="group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 cursor-pointer"
    >
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">{item.ndp || '-'}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100" title={item.articulo}>{tr(item.articulo)}</span>
        {Number(item.critico) === 1 && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide text-rose-700 border border-rose-300 dark:text-rose-300 dark:border-rose-800">
            {trLocal('critical_part')}
          </span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{tr(item.equipo) || '-'}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">{item.gaveta}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-500 dark:text-slate-400">{tr(item.nivel) || '-'}</span>
      </td>
      {isMantenimiento && (
        <td className="px-4 py-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">{item.linea || '-'}</span>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${statusBadge[stockStatus]}`}>
            {item.cantidad}
          </span>
          {canEditInventory(role, area) && item.cantidad > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDecrement(item); }} 
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
              title={trLocal('remove_units')}
              aria-label={trLocal('remove_units')}
            >
              -1
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <ConsumoCell consumo={consumo} />
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">{tr(item.tde) || '-'}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(item.precio)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency((Number(item.precio || 0) * Number(item.cantidad || 0)).toFixed(2))}</span>
      </td>
      
      {canEditInventory(role, area) && (
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); onShowQR(item); }}
              className={actionBtn}
              title={trLocal('generate_qr')}
            >
              QR
            </button>
            {canLendItems(role, area) && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrestar(item); }}
                className={actionBtn}
              >
                {trLocal('lend_item')}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className={actionBtn}
            >
              {trLocal('edit')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="px-2 py-1 text-xs font-medium rounded text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40 transition-colors duration-150"
            >
              {trLocal('delete')}
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

function ItemForm({ initial, onCancel, onSave, gavetas, user }) {
  const isMantenimiento = user?.area === 'Ensamble';
  const [form, setForm] = useState(
    initial || {
      ndp: '', articulo: '', equipo: '', gaveta: gavetas[0] || '', nivel: '', cantidad: 0, precio: 0, min: 0, max: 0, tde: 0, link: '', linea: '', critico: 0
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input label={trLocal('part_number')} value={form.ndp} onChange={e => upd('ndp', e.target.value)} />
        <Input label={trLocal('item_label')} value={form.articulo} onChange={e => upd('articulo', e.target.value)} required />
        <Input label={trLocal('equipment')} value={form.equipo} onChange={e => upd('equipo', e.target.value)} />
        
        <div>
          <Input label={trLocal('drawer_label')} list="gavetas-list" value={form.gaveta} onChange={e => upd('gaveta', e.target.value)} required />
          <datalist id="gavetas-list">
            {gavetas.map(g => <option key={g} value={g}>{g}</option>)}
          </datalist>
        </div>

        <Input label={trLocal('level_label')} value={form.nivel} onChange={e => upd('nivel', e.target.value)} placeholder="Ej: 1, A, 2B" />
        <Input label={trLocal('quantity_label')} type="number" min={0} value={form.cantidad} onChange={e => upd('cantidad', Number(e.target.value))} />
        <Input label={trLocal('price_label')} type="number" step="0.01" min={0} value={form.precio} onChange={e => upd('precio', Number(e.target.value))} />
        <Input label={trLocal('min_label')} type="number" min={0} value={form.min} onChange={e => upd('min', Number(e.target.value))} />
        <Input label={trLocal('max_label')} type="number" min={0} value={form.max} onChange={e => upd('max', Number(e.target.value))} />
        <Input label={trLocal('tde_label')} type="number" min={0} value={form.tde} onChange={e => upd('tde', Number(e.target.value))} />
        
        {/* Campo Linea - solo visible para Mantenimiento */}
        {isMantenimiento && (
          <Input label={trLocal('col_line')} value={form.linea || ''} onChange={e => upd('linea', e.target.value)} placeholder="Ej: L1, L2, L3" />
        )}

        <label className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={Number(form.critico) === 1}
            onChange={e => upd('critico', e.target.checked ? 1 : 0)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
          />
          {trLocal('critical_label')}
        </label>
        
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{trLocal('upload_image')}</label>
          <ImageUploader currentImage={form.link} onImageChange={handleImageChange} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="secondary" onClick={onCancel}>{trLocal('cancel')}</Button>
        <Button type="submit">{trLocal('save')}</Button>
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
      setError(trLocal('fill_all_fields'));
      return; 
    }
    if (new1 !== new2) { 
      setError(trLocal('passwords_no_match'));
      return; 
    }
    setLoading(true);
    try {
      await api.post('/users/change-password', { current, newPassword: new1 });
      setSuccess(trLocal('password_changed_success'));
      setCurrent(''); 
      setNew1(''); 
      setNew2('');
    } catch (e) {
      setError(e?.response?.data?.message || trLocal('error_changing_password'));
    }
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{trLocal('change_password')}</h3>
        <form onSubmit={handleChange} className="space-y-4">
          <Input label={trLocal('current_password')} type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
          <Input label={trLocal('new_password')} type="password" value={new1} onChange={e => setNew1(e.target.value)} required />
          <Input label={trLocal('repeat_new_password')} type="password" value={new2} onChange={e => setNew2(e.target.value)} required />
          
          {error && <div className="text-rose-600 text-sm">{error}</div>}
          {success && <div className="text-emerald-600 text-sm">{success}</div>}
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>{trLocal('cancel')}</Button>
            <Button type="submit" disabled={loading}>{trLocal('save')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Modal reutilizable para pedir contraseña
function PasswordPromptModal({ open, onClose, onSubmit, label = 'Contraseña', loading = false, error = '' }) {
  const [password, setPassword] = useState('');
  useEffect(() => { if (!open) setPassword(''); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[80]">
      <Card className="w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{label}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(password); }} className="space-y-4">
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus required placeholder="Ingrese contraseña" />
          {error && <div className="text-rose-600 text-sm">{error}</div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Aceptar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Modal para préstamo — flujo multi-ítem en 3 pasos
// Paso 1: Número de empleado (tipear)
// Paso 2: Selección de ítems (carrito)
// Paso 3: Autorización (Administrador o Ingeniero)
function PrestarModal({ open, item: initialItem, onClose, onSubmit, turno, currentUser, allItems }) {
  const tr = useDataTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Paso 1
  const [numEmpleado, setNumEmpleado] = useState('');
  const [empleadoInfo, setEmpleadoInfo] = useState(null);

  // Paso 2 — carrito
  const [cart, setCart] = useState([]); // [{ item, cantidad }]
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Paso 3 — autorización
  const [authNumEmpleado, setAuthNumEmpleado] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authInfo, setAuthInfo] = useState(null); // confirmed authorizer info

  const inputRef = useRef(null);
  const authRef = useRef(null);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setStep(1);
      setNumEmpleado('');
      setEmpleadoInfo(null);
      setCart(initialItem ? [{ item: initialItem, cantidad: 1 }] : []);
      setSearchQuery('');
      setSearchResults([]);
      setAuthNumEmpleado('');
      setAuthPassword('');
      setAuthInfo(null);
      setError('');
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Si se abre con un ítem inicial y el empleado ya está confirmado (viene de clic directo)
  // Se mantiene step 1 siempre para ser consistente

  // Buscar empleado (paso 1)
  async function handleLookupEmployee(e) {
    e.preventDefault();
    if (!numEmpleado.trim()) return;
    setLoading(true);
    setError('');
    try {
      const info = await api.lookupUser(numEmpleado.trim());
      setEmpleadoInfo(info);
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Empleado no encontrado. Verifica el número.');
    } finally {
      setLoading(false);
    }
  }

  // Agregar ítem al carrito (desde ítem pasado como prop o búsqueda)
  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        // Incrementar cantidad si hay stock
        const nuevaCant = Math.min(existing.cantidad + 1, item.cantidad);
        return prev.map(c => c.item.id === item.id ? { ...c, cantidad: nuevaCant } : c);
      }
      if (item.cantidad <= 0) return prev; // sin stock
      return [...prev, { item, cantidad: 1 }];
    });
  }

  function removeFromCart(itemId) {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  }

  function updateCartQty(itemId, cantidad) {
    setCart(prev => prev.map(c => {
      if (c.item.id !== itemId) return c;
      const max = c.item.cantidad;
      const qty = Math.max(1, Math.min(Number(cantidad) || 1, max));
      return { ...c, cantidad: qty };
    }));
  }

  // Buscar ítems del inventario
  async function handleSearch(q) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.get('/items', { params: { q } });
      setSearchResults((data.data || []).filter(it => it.cantidad > 0));
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  // Paso 2 → 3
  function handleProceedToAuth() {
    if (cart.length === 0) {
      setError('Agrega al menos un artículo al carrito');
      return;
    }
    setError('');
    setStep(3);
    setTimeout(() => authRef.current?.focus(), 120);
  }

  // Verificar autorizador y obtener su info
  async function handleVerifyAuthorizer(e) {
    e.preventDefault();
    if (!authNumEmpleado.trim() || !authPassword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/validate', {
        num_empleado: authNumEmpleado.trim(),
        password: authPassword
      });
      setAuthInfo(data);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Credenciales incorrectas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Enviar préstamo final
  async function handleSubmitPrestamo() {
    if (!authInfo) { setError('Autoriza el préstamo primero'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        employee_input: empleadoInfo.num_empleado,
        items: cart.map(c => ({ item_id: c.item.id, cantidad: c.cantidad })),
        authorizer_num_empleado: authInfo.num_empleado,
        authorizer_password: authPassword
      });
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error al registrar préstamo';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const totalItems = cart.reduce((s, c) => s + c.cantidad, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex flex-col z-[60]">
      {/* ── Header pinned ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Préstamo</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step === s ? 'bg-teal-700 dark:bg-teal-600 text-white' :
                    step > s ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white' :
                    'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>{s}</div>
                  {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
              ))}
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                {step === 1 ? 'Empleado' : step === 2 ? `Artículos${cart.length > 0 ? ` (${cart.length})` : ''}` : 'Autorización'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="px-2.5 py-1 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150">
          {trLocal('close')}
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div className="w-full max-w-2xl">

          {/* ─── PASO 1: Número de empleado ─── */}
          {step === 1 && (
            <form onSubmit={handleLookupEmployee} className="space-y-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Ingresa el número de empleado de la persona que recibirá el préstamo.
                </p>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Número de Empleado
                </label>
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={numEmpleado}
                    onChange={e => setNumEmpleado(e.target.value)}
                    placeholder="Ej: 1234A"
                    required
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors text-base"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
                <Button type="submit" disabled={loading || !numEmpleado.trim()}>
                  {loading ? 'Buscando...' : 'Continuar'}
                </Button>
              </div>
            </form>
          )}

          {/* ─── PASO 2: Carrito de artículos ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Info empleado */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(empleadoInfo?.nombre || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">{empleadoInfo?.nombre}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs">N° {empleadoInfo?.num_empleado}</p>
                </div>
                <button onClick={() => setStep(1)} className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Cambiar</button>
              </div>

              {/* Ítem inicial en carrito si lo hay + carrito actual */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Carrito ({totalItems} unidad{totalItems !== 1 ? 'es' : ''})
                </p>
                {cart.length === 0 ? (
                  <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    Busca y agrega artículos abajo
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {cart.map(({ item, cantidad }) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={item.articulo}>{tr(item.articulo)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.ndp || ''} · Gav. {item.gaveta} · Disp: {item.cantidad}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => updateCartQty(item.id, cantidad - 1)} disabled={cantidad <= 1}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-all">−</button>
                          <input
                            type="number" min={1} max={item.cantidad} value={cantidad}
                            onChange={e => updateCartQty(item.id, e.target.value)}
                            className="w-12 text-center text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-0.5"
                          />
                          <button onClick={() => updateCartQty(item.id, cantidad + 1)} disabled={cantidad >= item.cantidad}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-all">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center transition-all text-lg">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Búsqueda de artículos */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Buscar artículos del inventario</label>
                <div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="N° parte, artículo, equipo..."
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-sm transition-colors"
                  />
                </div>
                {searchLoading && <p className="text-xs text-slate-400 mt-1">Buscando...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map(it => {
                      const inCart = cart.some(c => c.item.id === it.id);
                      return (
                        <div key={it.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={it.articulo}>{tr(it.articulo)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{it.ndp || ''} · Gav. {it.gaveta} · {it.cantidad} disp.</p>
                          </div>
                          <button
                            onClick={() => { addToCart(it); setSearchQuery(''); setSearchResults([]); }}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              inCart
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200'
                                : it.cantidad <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200'
                            }`}
                            disabled={it.cantidad <= 0}
                          >
                            {inCart ? '+ Más' : 'Agregar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-2">
                <Button variant="secondary" onClick={() => { setStep(1); setError(''); }} type="button">Atrás</Button>
                <Button onClick={handleProceedToAuth} disabled={cart.length === 0}>
                  Autorizar ({cart.length} artículo{cart.length !== 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}

          {/* ─── PASO 3: Autorización ─── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Resumen */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm space-y-1">
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Empleado:</span>{' '}{empleadoInfo?.nombre} ({empleadoInfo?.num_empleado})</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Artículos:</span>{' '}{cart.length} ítem{cart.length !== 1 ? 's' : ''} · {totalItems} unidad{totalItems !== 1 ? 'es' : ''}</p>
                <div className="pt-1 space-y-0.5">
                  {cart.map(({ item, cantidad }) => (
                    <p key={item.id} className="text-slate-500 dark:text-slate-400 text-xs">
                      · {tr(item.articulo)} ×{cantidad}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Ingresa las credenciales de un <strong className="text-slate-700 dark:text-slate-300">Administrador</strong> o <strong className="text-slate-700 dark:text-slate-300">Ingeniero</strong> para autorizar este préstamo.
                </p>

                {authInfo ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">Autorizado por {authInfo.nombre}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 text-xs">{authInfo.rol} · N° {authInfo.num_empleado}</p>
                    </div>
                    <button onClick={() => { setAuthInfo(null); setAuthNumEmpleado(''); setAuthPassword(''); }} className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Cambiar</button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyAuthorizer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Número de Empleado del Autorizador</label>
                      <div>
                        <input
                          ref={authRef}
                          type="text"
                          value={authNumEmpleado}
                          onChange={e => setAuthNumEmpleado(e.target.value)}
                          placeholder="Número de empleado"
                          required
                          className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors text-base"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contraseña</label>
                      <div>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          placeholder="············"
                          required
                          className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors text-base"
                        />
                      </div>
                    </div>
                    {error && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
                        {error}
                      </div>
                    )}
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Verificando...' : 'Verificar autorización'}
                    </Button>
                  </form>
                )}
              </div>

              {authInfo && error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button variant="secondary" onClick={() => { setStep(2); setAuthInfo(null); setError(''); }} type="button">Atrás</Button>
                <Button
                  onClick={handleSubmitPrestamo}
                  disabled={!authInfo || loading}
                  className={authInfo ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                >
                  {loading ? 'Registrando...' : 'Confirmar Préstamo'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal para devolución
function DevolverModal({ open, prestamo, onClose, onSubmit, turno, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (!open) {
      setCantidad(1);
      setError('');
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!cantidad || cantidad < 1 || cantidad > (prestamo?.cantidad || 1)) throw new Error('Cantidad inválida');
      await onSubmit({
        prestamo,
        cantidad
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
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[70]">
      <Card className="w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{trLocal('confirm_return')}</h3>

        <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm space-y-1">
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">{trLocal('usuario_label')}:</span> {prestamo?.empleado}</p>
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">N° {trLocal('usuario_label')}:</span> {prestamo?.num_empleado}</p>
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">{trLocal('item_label')}:</span> {prestamo?.articulo}</p>
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">{trLocal('lend_item')} por:</span> {prestamo?.empleado1}</p>
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Cantidad prestada:</span> {prestamo?.cantidad || 1}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Cantidad a devolver" 
            type="number" 
            min={1} 
            max={prestamo?.cantidad || 1} 
            value={cantidad} 
            onChange={e => setCantidad(Number(e.target.value))} 
            required 
          />
          <div className="text-xs text-slate-500 mt-1">Máximo: {prestamo?.cantidad || 1}</div>

          {error && <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 p-2 rounded">{error}</div>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>{trLocal('cancel')}</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? trLocal('processing') : trLocal('confirm_return')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Inventory() {
  const tr = useDataTranslation();
  // --- NUEVO FLUJO: primero pedir cantidad, luego contraseña ---
  const [qtyPrompt, setQtyPrompt] = useState({ open: false, item: null });
  const [pendingQty, setPendingQty] = useState(null);
  const [token] = useState(localStorage.getItem('token'));
  const [user] = useState(() => (token ? jwtDecode(token) : null));
  const [lang, setLang] = useState(() => getLang());
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
  // Notifications for low/no stock
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [activeGaveta, setActiveGaveta] = useState(null);
  const [serverGavetaTotals, setServerGavetaTotals] = useState([]);
  const [consumoMap, setConsumoMap] = useState({});
  const [grandTotalAllState, setGrandTotalAllState] = useState(0);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
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
  const [filtroLinea, setFiltroLinea] = useState('');
  const [showZeroQuantity, setShowZeroQuantity] = useState(false);
  const [soloCriticos, setSoloCriticos] = useState(false);

  // Estados para préstamos
  const [showPrestamos, setShowPrestamos] = useState(false);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamosLoading, setPrestamosLoading] = useState(false);
  const [prestarModal, setPrestarModal] = useState({ open: false, item: null });
  const [devolverModal, setDevolverModal] = useState({ open: false, prestamo: null });
  
  // Estado para QR Code
  const [qrModal, setQrModal] = useState({ open: false, item: null });
  const [qrBulkModal, setQrBulkModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

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

  // Load totals (per gaveta and grand total across all gavetas)
  async function loadTotals() {
    try {
      const { data } = await api.get('/gavetas/totales');
      setServerGavetaTotals(data.gavetaTotals || []);
      setGrandTotalAllState(Number(data.grandTotal || 0));
    } catch (e) {
      console.error('Error loading gaveta totals:', e);
      setServerGavetaTotals([]);
      setGrandTotalAllState(0);
    }
  }
  
  async function loadConsumo() {
    try {
      const { data } = await api.get('/items/consumo');
      setConsumoMap(data.data || {});
    } catch (e) {
      console.error('Error loading consumption estimates:', e);
      setConsumoMap({});
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
    // refresh totals after loading items (keeps header and gaveta totals up-to-date)
    try { loadTotals(); } catch (e) { /* non-blocking */ }
    try { loadConsumo(); } catch (e) { /* non-blocking */ }
  }
  
  useEffect(() => { loadGavetas(); }, []);
  useEffect(() => { loadTotals(); }, []);
  useEffect(() => { loadItems(); }, [activeGaveta, q]);

  // Load notifications (items at/below min or out of stock)
  async function fetchNotifications() {
    setNotifLoading(true);
    setNotifError('');
    try {
      const { data } = await api.get('/items/notifications');
      setNotifications(data.data || []);
    } catch (e) {
      console.error('Error loading notifications', e);
      setNotifError('Error loading notifications');
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }
  useEffect(() => { fetchNotifications(); }, []);

  async function toggleOrdered(id, flag) {
    try {
      await api.patch(`/items/${id}/ordered`, { ordered: !!flag });
      await fetchNotifications();
      await loadItems();
    } catch (e) {
      console.error('Error toggling ordered', e);
      alert('Error updating ordered state');
    }
  }

  // item: either plain object or FormData; isForm indicates FormData
  async function handleSave(item, isForm = false, initial = null) {
    try {
      if (initial && initial.id) {
        // edición: sin contraseña requerida
        await api.put(`/items/${initial.id}`, item);
        // si existía una imagen anterior y ahora hay una nueva distinta, eliminar la anterior
        try {
          const newLink = item.link || '';
          if (initial.link && newLink && initial.link !== newLink) {
            const prevFilename = initial.link.split('/').pop();
            await api.delete(`/upload/delete/${prevFilename}`);
          }
        } catch (err) {
          console.warn('No se pudo eliminar archivo anterior:', err);
        }
      } else {
        // nuevo item
        if (isForm) {
          await api.post('/items', item);
        } else {
          await api.post('/items', item);
        }
      }
      setModal(null);
      loadItems();
    } catch (e) {
      console.error('Error saving item:', e);
    }
  }
  
  async function handleDelete(item) {
    try {
      await api.delete(`/items/${item.id}`);
      loadItems();
    } catch (e) {
      console.error('Error deleting item:', e);
    }
  }

  function handleDecrement(item) {
    setQtyPrompt({ open: true, item });
  }

  async function handleQtySubmit(cantidad) {
    setQtyPrompt({ open: false, item: null });
    try {
      await api.patch(`/items/${qtyPrompt.item.id}/decrement`, { turno, cantidad: cantidad || 1 });
      loadItems();
    } catch (e) {
      console.error('Error decrementing item:', e);
    }
  }

  // Si se cierra el modal de contraseña, limpiar pendingQty
  useEffect(() => {
    if (!pwPrompt.open) setPendingQty(null);
  }, [pwPrompt.open]);

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
        id: data.prestamo.id,
        articulo: data.prestamo.articulo,
        cantidad: data.cantidad
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
      // Password prompts now only used for user management operations
      if (pwPrompt.action === 'edit-user') {
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

  // Función para exportar a Excel (exporta TODAS las gavetas del área del usuario)
  async function handleExportExcel() {
    try {
      const params = {};
      // No enviamos gaveta para exportar TODAS las gavetas del área
      // El backend filtra automáticamente por el área del usuario
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
      
      // Generar nombre de archivo con fecha y área
      const today = new Date().toISOString().slice(0, 10);
      const areaText = user?.area ? `_${user.area}` : '';
      const searchText = q ? `_filtrado` : '';
      link.download = `inventario${areaText}${searchText}_${today}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error exportando a Excel:', e);
      alert('Error exportando datos a Excel');
    }
  }

  // Ordenar items por nivel ascendente (de menor a mayor) - soporta valores alfanuméricos
  const itemsOrdenados = [...items].sort((a, b) => {
    const nivelA = a.nivel ?? '';
    const nivelB = b.nivel ?? '';
    // Intentar comparación numérica si ambos son números
    const numA = Number(nivelA);
    const numB = Number(nivelB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    // Si no son números, usar comparación alfanumérica natural
    return String(nivelA).localeCompare(String(nivelB), 'es', { numeric: true, sensitivity: 'base' });
  });

  // Aplicar filtros por columna
  const itemsFiltrados = itemsOrdenados.filter(item => {
    const matchNdp = !filtroNdp || (item.ndp && item.ndp.toLowerCase().includes(filtroNdp.toLowerCase()));
    const matchArticulo = !filtroArticulo || (item.articulo && item.articulo.toLowerCase().includes(filtroArticulo.toLowerCase()));
    const matchEquipo = !filtroEquipo || (item.equipo && item.equipo.toLowerCase().includes(filtroEquipo.toLowerCase()));
    const matchGaveta = !filtroGaveta || (item.gaveta && item.gaveta.toString().includes(filtroGaveta));
    const matchNivel = !filtroNivel || (item.nivel && item.nivel.toString().includes(filtroNivel));
    const matchLinea = !filtroLinea || (item.linea && item.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    const matchCritico = !soloCriticos || Number(item.critico) === 1;
    
    // Para usuarios del área SMT: ocultar items con cantidad 0
    if (user?.area === 'SMT' && item.cantidad === 0) {
      return false;
    }
    
    return matchNdp && matchArticulo && matchEquipo && matchGaveta && matchNivel && matchLinea && matchCritico;
  });
  
  // Items con cantidad 0 para SMT users (para mostrar en sección separada)
  const itemsZeroQuantity = user?.area === 'SMT' ? itemsOrdenados.filter(item => {
    const matchNdp = !filtroNdp || (item.ndp && item.ndp.toLowerCase().includes(filtroNdp.toLowerCase()));
    const matchArticulo = !filtroArticulo || (item.articulo && item.articulo.toLowerCase().includes(filtroArticulo.toLowerCase()));
    const matchEquipo = !filtroEquipo || (item.equipo && item.equipo.toLowerCase().includes(filtroEquipo.toLowerCase()));
    const matchGaveta = !filtroGaveta || (item.gaveta && item.gaveta.toString().includes(filtroGaveta));
    const matchNivel = !filtroNivel || (item.nivel && item.nivel.toString().includes(filtroNivel));
    const matchLinea = !filtroLinea || (item.linea && item.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    
    const matchCritico = !soloCriticos || Number(item.critico) === 1;

    return item.cantidad === 0 && matchNdp && matchArticulo && matchEquipo && matchGaveta && matchNivel && matchLinea && matchCritico;
  }) : [];

  // Totales por gaveta (traídos desde el backend) y totales generales
  const gavetaTotals = (serverGavetaTotals || []).slice().sort((a, b) => {
    const na = Number(a.gaveta);
    const nb = Number(b.gaveta);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a.gaveta).localeCompare(String(b.gaveta));
  });
  const grandTotalAll = Number(grandTotalAllState || 0);

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroNdp('');
    setFiltroArticulo('');
    setFiltroEquipo('');
    setFiltroGaveta('');
    setFiltroNivel('');
    setFiltroLinea('');
    setSoloCriticos(false);
  };

  return (
    <Layout fullWidth>
      {/* Main Control Header */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top Control Bar: App Settings & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Quick Actions / Modes */}
            {canEditInventory(user?.rol, user?.area) && (
              <Button variant="primary" onClick={() => setModal({ mode: 'add' })} className="whitespace-nowrap">
                {trLocal('agregar')}
              </Button>
            )}
            {canLendItems(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setShowPrestamos(true)}>
                {trLocal('prestamos')}
              </Button>
            )}
            {canViewHistory(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setModal({ mode: 'historial' })}>
                {trLocal('ver_historial')}
              </Button>
            )}
            {canAdministerUsers(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setModal({ mode: 'usuarios' })}>
                {trLocal('administrar_usuarios')}
              </Button>
            )}
            {canViewHistory(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setShowNotifModal(true)} className="relative">
                {trLocal('notifications')}
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {canEditInventory(user?.rol, user?.area) && (
              <Button variant="outline" onClick={() => setQrBulkModal(true)} title={trLocal('qr_bulk')}>
                {trLocal('qr_bulk')}
              </Button>
            )}
            {canViewHistory(user?.rol, user?.area) && (
              <Button variant="outline" onClick={handleExportExcel} title={trLocal('export_excel')}>
                {trLocal('export_excel')}
              </Button>
            )}
            <select
              value={lang}
              aria-label={trLocal('idioma')}
              title={trLocal('idioma')}
              onChange={e => { localStorage.setItem('inv_lang', e.target.value); prepareAutoTranslate(e.target.value); setLang(e.target.value); }}
              className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-2"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
            </select>
            <Button variant="ghost" onClick={() => setShowInfoModal(true)} title={trLocal('system_info')}>
              {trLocal('system_info')}
            </Button>
            <Button variant="ghost" onClick={() => { loadGavetas(); loadItems(); loadTotals(); }} title={trLocal('refresh')}>
              {trLocal('refresh')}
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
          {/* Dropdown Control for Gavetas */}
          <div className="flex w-full lg:w-auto items-center">
            <div className="w-full lg:w-64">
              <select
                value={activeGaveta || ''}
                onChange={(e) => setActiveGaveta(e.target.value)}
                aria-label={trLocal('drawer_label')}
                className="w-full py-2 px-3 rounded-md text-sm font-medium bg-white text-slate-800 border border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 cursor-pointer"
              >
                {gavetas.map((g) => (
                  <option key={g} value={g} className="font-medium bg-white dark:bg-slate-800">
                    {g === 'Todas' ? 'Todas' : g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-96">
            <input
              type="text"
              placeholder={trLocal('search_placeholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{trLocal('turno_prefix')}</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">{turno}</p>
        </Card>
        
        <Card className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{trLocal('totals_by_gaveta')}</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {activeGaveta ? (
                (() => {
                  const sel = gavetaTotals.find(gt => String(gt.gaveta) === String(activeGaveta));
                  return formatCurrency(Number(sel?.total || 0).toFixed(2));
                })()
              ) : '-'}
            </p>
        </Card>

        <Card className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{trLocal('showing_label')}</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">{itemsFiltrados.length} / {total}</p>
        </Card>
      </div>

      <NotificationsModal
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        fetchNotifications={fetchNotifications}
        toggleOrdered={toggleOrdered}
        onOpenItem={(item) => { setModal({ mode: 'detail', item }); setShowNotifModal(false); }}
      />

      {/* Data Table */}
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={soloCriticos}
            onChange={e => setSoloCriticos(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
          />
          {trLocal('critical_only')}
        </label>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('part_number')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('item_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 hidden md:table-cell">{trLocal('equipment')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('drawer_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('level_label')}</th>
                {user?.area === 'Ensamble' && <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('col_line')}</th>}
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('quantity_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('consumption_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('tde_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">{trLocal('price_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">{trLocal('total_label')}</th>
                {canEditInventory(user?.rol, user?.area) && <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">{trLocal('col_actions')}</th>}
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-2 py-2"><input className={FILTER_INPUT} value={filtroNdp} onChange={e => setFiltroNdp(e.target.value)} placeholder={trLocal('filter_placeholder')} /></th>
                <th className="px-2 py-2"><input className={FILTER_INPUT} value={filtroArticulo} onChange={e => setFiltroArticulo(e.target.value)} placeholder={trLocal('filter_placeholder')} /></th>
                <th className="px-2 py-2 hidden md:table-cell"><input className={FILTER_INPUT} value={filtroEquipo} onChange={e => setFiltroEquipo(e.target.value)} placeholder={trLocal('filter_placeholder')} /></th>
                <th className="px-2 py-2"><input className={FILTER_INPUT} value={filtroGaveta} onChange={e => setFiltroGaveta(e.target.value)} placeholder={trLocal('filter_placeholder')} /></th>
                <th className="px-2 py-2"><input className={FILTER_INPUT} value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} placeholder={trLocal('filter_placeholder')} /></th>
                {user?.area === 'Ensamble' && <th className="px-2 py-2"><input className={FILTER_INPUT} value={filtroLinea} onChange={e => setFiltroLinea(e.target.value)} placeholder={trLocal('filter_placeholder')} /></th>}
                <th colSpan={canEditInventory(user?.rol, user?.area) ? 6 : 5}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading && (
                <TableSkeleton columns={10 + (user?.area === 'Ensamble' ? 1 : 0) + (canEditInventory(user?.rol, user?.area) ? 1 : 0)} />
              )}
              {!loading && itemsFiltrados.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  role={user?.rol}
                  area={user?.area}
                  consumo={consumoMap[String(it.id)]}
                  onEdit={canEditInventory(user?.rol, user?.area) ? (item) => setModal({ mode: 'edit', item }) : undefined}
                  onDelete={canEditInventory(user?.rol, user?.area) ? handleDelete : undefined}
                  onDecrement={canEditInventory(user?.rol, user?.area) ? handleDecrement : undefined}
                  onPrestar={canEditInventory(user?.rol, user?.area) ? handlePrestar : undefined}
                  onShowQR={(item) => setQrModal({ open: true, item })}
                  onDoubleClick={(item) => { setModal({ mode: 'detail', item }); }}
                />
              ))}
            </tbody>
          </table>
          {!loading && itemsFiltrados.length === 0 && (
            <div className="p-16 text-center">
              <p className="text-slate-700 dark:text-slate-300 font-medium">{trLocal('no_results')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Zero Quantity Items Section (SMT Users Only) */}
      {user?.area === 'SMT' && itemsZeroQuantity.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowZeroQuantity(!showZeroQuantity)}
            className="w-full flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors duration-150 hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="text-left">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{trLocal('zero_stock_title')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{itemsZeroQuantity.length}</p>
            </div>
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
              {showZeroQuantity ? trLocal('collapse') : trLocal('expand')}
            </span>
          </button>

          {/* Zero Quantity Items Table */}
          {showZeroQuantity && (
            <Card className="overflow-hidden p-0 mt-4">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-amber-50 border-b border-amber-200">
                    <tr>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('part_number')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('item_label')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 hidden md:table-cell">{trLocal('equipment')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('drawer_label')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('level_label')}</th>
                      {user?.area === 'Ensamble' && <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('col_line')}</th>}
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('quantity_label')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('consumption_label')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{trLocal('tde_label')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 text-right">{trLocal('price_label')}</th>
                      <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 text-right">{trLocal('total_label')}</th>
                      {canEditInventory(user?.rol, user?.area) && <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 text-right">{trLocal('col_actions')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-slate-700/50">
                    {itemsZeroQuantity.map((it) => (
                      <ItemRow
                        key={it.id}
                        item={it}
                        role={user?.rol}
                        area={user?.area}
                        consumo={consumoMap[String(it.id)]}
                        onEdit={canEditInventory(user?.rol, user?.area) ? (item) => setModal({ mode: 'edit', item }) : undefined}
                        onDelete={canEditInventory(user?.rol, user?.area) ? handleDelete : undefined}
                        onDecrement={canEditInventory(user?.rol, user?.area) ? handleDecrement : undefined}
                        onPrestar={canEditInventory(user?.rol, user?.area) ? handlePrestar : undefined}
                        onShowQR={(item) => setQrModal({ open: true, item })}
                        onDoubleClick={(item) => { setModal({ mode: 'detail', item }); }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {modal.mode === 'edit' ? trLocal('edit_item') : modal.mode === 'historial' ? trLocal('ver_historial') : modal.mode === 'usuarios' ? trLocal('manage_users') : modal.mode === 'detail' ? trLocal('item_detail') : trLocal('add_item')}
              </h3>
              <button onClick={() => setModal(null)} className="px-2.5 py-1 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150">
                {trLocal('close')}
              </button>
            </div>
             
             {modal.mode === 'historial' ? <Historial /> : 
              modal.mode === 'usuarios' ? <UsuariosAdmin onClose={() => setModal(null)} onPasswordPrompt={(d) => { setModal(null); setPwPrompt({ open: true, ...d }); }} /> :
              modal.mode === 'detail' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white" title={modal.item.articulo}>{tr(modal.item.articulo)}</h4>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p><b>{trLocal('part_number')}:</b> {modal.item.ndp}</p>
                      <p><b>{trLocal('equipment')}:</b> {tr(modal.item.equipo)}</p>
                      <p><b>{trLocal('drawer_label')}:</b> {modal.item.gaveta} / <b>{trLocal('level_label')}:</b> {tr(modal.item.nivel)}</p>
                      <p><b>{trLocal('quantity_label')}:</b> {modal.item.cantidad} ({trLocal('min_label')}: {modal.item.min}, {trLocal('max_label')}: {modal.item.max})</p>
                      <p><b>{trLocal('price_label')}:</b> {formatCurrency(modal.item.precio)}</p>
                      <p><b>{trLocal('tde_label')}:</b> {tr(modal.item.tde) || '-'}</p>
                      {/* Mostrar línea solo si el usuario es del área Ensamble y existe el valor */}
                      {user?.area === 'Ensamble' && modal.item.linea && (
                        <p><b>{trLocal('col_line')}:</b> {modal.item.linea}</p>
                      )}
                      {consumoMap[String(modal.item.id)] && (
                        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                          <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{trLocal('consumption_label')}</h5>
                          <ConsumoDetail consumo={consumoMap[String(modal.item.id)]} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    {modal.item.link ? (
                      <img 
                        src={resolveImageUrl(modal.item.link)} 
                        alt={modal.item.articulo} 
                        className="max-h-64 object-contain" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {!modal.item.link ? (
                      <span className="text-slate-400">{trLocal('no_image')}</span>
                    ) : (
                      <div className="items-center justify-center text-slate-400 text-sm hidden">
                        <span>Error cargando imagen</span>
                      </div>
                    )}
                  </div>
                </div>
              ) :
              <ItemForm initial={modal.item} onCancel={() => setModal(null)} onSave={handleSave} gavetas={gavetas} user={user} />
             }
          </Card>
        </div>
      )}

      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
      <QuantityPromptModal open={qtyPrompt.open} max={qtyPrompt.item?.cantidad || 1} onClose={() => setQtyPrompt({ open: false, item: null })} onSubmit={handleQtySubmit} />
      <PasswordPromptModal open={pwPrompt.open} onClose={() => { setPwPrompt({ open: false, action: null, context: null }); setPwError(''); setPwLoading(false); }} onSubmit={handlePwSubmit} label={pwPrompt.action === 'edit-item' ? trLocal('confirm_password_edit') : pwPrompt.action === 'delete-item' ? trLocal('confirm_password_delete') : pwPrompt.action === 'decrement-item' ? 'Confirmar uso' : pwPrompt.action === 'delete-user' ? trLocal('confirm_password_admin_delete') : 'Confirmar'} loading={pwLoading} error={pwError} />
      <PrestarModal open={prestarModal.open} item={prestarModal.item} onClose={() => setPrestarModal({ open: false, item: null })} onSubmit={handlePrestarSubmit} turno={turno} currentUser={user} allItems={items} />
      <DevolverModal open={devolverModal.open} prestamo={devolverModal.prestamo} onClose={() => setDevolverModal({ open: false, prestamo: null })} onSubmit={handleDevolverSubmit} turno={turno} currentUser={user} />
      <QRModal open={qrModal.open} item={qrModal.item} onClose={() => setQrModal({ open: false, item: null })} />
      
      {showPrestamos && (
        <div className="fixed inset-0 bg-slate-900/70 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{trLocal('loans_active')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {prestamos.length} · {user?.area ? `${user.area}` : ''}
              </p>
            </div>
            <button
              onClick={() => setShowPrestamos(false)}
              className="px-2.5 py-1 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150"
            >
              {trLocal('close')}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {prestamosLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-500 dark:text-slate-400">
                  {trLocal('loading')}
                </div>
              </div>
            ) : prestamos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-slate-700 dark:text-slate-300 font-medium">{trLocal('no_active_loans')}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{user?.area ? `${user.area}` : ''}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">Empleado</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider hidden sm:table-cell">N° Empleado</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">Artículo</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider hidden md:table-cell">NDP</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider hidden md:table-cell">Gaveta</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider hidden lg:table-cell">Prestado por</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider hidden xl:table-cell">Fecha</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {prestamos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{p.empleado}</td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono hidden sm:table-cell">{p.num_empleado}</td>
                        <td className="px-5 py-4 text-slate-800 dark:text-slate-200">
                          <div className="font-medium">{tr(p.articulo)}</div>
                          {p.cantidad > 1 && <div className="text-xs text-slate-400 mt-0.5">×{p.cantidad} unidades</div>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs hidden md:table-cell">{p.ndp || '—'}</td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {p.gaveta ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                              Gav. {p.gaveta}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-sm hidden lg:table-cell">{p.empleado1 || '—'}</td>
                        <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs hidden xl:table-cell">
                          {p.fecha_prestamo ? new Date(p.fecha_prestamo).toLocaleDateString(localeFor(), { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDevolver(p)}
                            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors duration-150"
                          >
                            {trLocal('return_item')}
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
      )}
      
      <QRBulkModal 
        open={qrBulkModal} 
        onClose={() => setQrBulkModal(false)} 
        allItems={items} 

      />

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{trLocal('system_info')}</h3>
              <button onClick={() => setShowInfoModal(false)} className="px-2.5 py-1 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150">
                {trLocal('close')}
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">No. de Control</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-200">F-OP-SMT-008</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Matriz de Refacciones</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ingeniero a Cargo</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Edgar Alberto Guajardo Castro</p>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Desarrollador</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Marcelo Bazaldua Morales</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setShowInfoModal(false)}>{trLocal('close')}</Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
