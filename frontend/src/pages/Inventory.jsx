import React, { useEffect, useState, useRef } from 'react';
import ImageUploader from '../components/ImageUploader.jsx';
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
      {loading && <div className="text-gray-500">Cargando historial...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-2 py-1">Fecha/Hora</th>
                <th className="px-2 py-1">Usuario</th>
                <th className="px-2 py-1">Acción</th>
                <th className="px-2 py-1">Detalle anterior</th>
                <th className="px-2 py-1">Detalle nuevo</th>
                <th className="px-2 py-1">Turno</th>
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
                    <td className="px-2 py-1 whitespace-nowrap">{new Date(h.fecha_hora).toLocaleString()}</td>
                    <td className="px-2 py-1">{h.username}</td>
                    <td className="px-2 py-1">{ACCION_LABELS[h.accion] || h.accion}</td>
                    <td className="px-2 py-1 max-w-xs">{adetalleContent}</td>
                    <td className="px-2 py-1 max-w-xs">{detalleContent}</td>
                    <td className="px-2 py-1">{h.turno}</td>
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

  function handleEditUser(user) {
    setEditingUser({
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      originalRol: user.rol
    });
  }

  function handleRolChange(newRol) {
    setEditingUser(prev => ({
      ...prev,
      rol: newRol
    }));
  }

  function handleSaveUser() {
    if (!editingUser) return;
    
    // Si no cambió el rol, no hacer nada
    if (editingUser.rol === editingUser.originalRol) {
      setEditingUser(null);
      return;
    }

    // Usar el sistema de prompt de contraseña
    onPasswordPrompt({
      action: 'edit-user',
      context: {
        username: editingUser.username,
        rol: editingUser.rol,
        onSuccess: () => {
          // Actualizar la lista local
          setUsuarios(prev => prev.map(u => 
            u.username === editingUser.username 
              ? { ...u, rol: editingUser.rol }
              : u
          ));
          setEditingUser(null);
          loadUsuarios(); // Recargar para estar seguro
        }
      }
    });
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
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Administrar Usuarios</h4>
        <button
          onClick={loadUsuarios}
          className="text-sm text-blue-600 hover:underline"
        >
          Actualizar
        </button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-gray-500">No hay usuarios registrados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.username} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">{user.username}</td>
                  <td className="px-3 py-2">{user.nombre}</td>
                  <td className="px-3 py-2">
                    {editingUser?.username === user.username ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingUser.rol}
                          onChange={e => handleRolChange(e.target.value)}
                          className="rounded border px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
                        >
                          <option value="admin">admin</option>
                          <option value="operador">operador</option>
                          <option value="guest">guest</option>
                        </select>
                        <button
                          onClick={handleSaveUser}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:underline text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.rol === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                        user.rol === 'operador' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
                        {user.rol}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editingUser?.username === user.username ? null : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700">
            <div className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">
              Confirmar eliminación
            </div>
            <div className="mb-6 text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar el usuario <strong>{confirmDelete}</strong>?
              <br />
              <span className="text-sm text-gray-500">Esta acción no se puede deshacer.</span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón de cerrar */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function Header({ user, onLogout, onOpenPassword }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Inventario</span>
          <span className="text-xs text-gray-500 hidden sm:inline">| Gestión de Gavetas</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">
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
            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
            title="Cambiar tema"
          >
            Tema
          </button>
          <button
            onClick={onOpenPassword}
            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
            title="Cambiar contraseña"
          >
            <FaCog />
          </button>
          <button
            onClick={onLogout}
            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

function ItemRow({ item, role, onEdit, onDelete, onDoubleClick }) {
  const qtyClass =
    item.cantidad < item.min
      ? 'text-red-600 font-semibold'
      : item.cantidad > item.max
      ? 'text-yellow-600 font-semibold'
      : '';
  
  return (
    <tr onDoubleClick={() => onDoubleClick && onDoubleClick(item)} className="border-b border-gray-200 dark:border-gray-700 cursor-pointer">
      <td className="px-3 py-2">{item.ndp}</td>
      <td className="px-3 py-2">{item.articulo}</td>
      <td className="px-3 py-2">{item.equipo}</td>
      <td className="px-3 py-2">{item.gaveta}</td>
      <td className="px-3 py-2">{item.nivel}</td>
      <td className={`px-3 py-2 ${qtyClass}`}>{item.cantidad}</td>
      <td className="px-3 py-2">{item.min}</td>
      <td className="px-3 py-2">{item.max}</td>
      <td className="px-3 py-2">{item.tde}</td>
      {/* imagen removida de la lista; se muestra en la tarjeta de detalle al hacer doble clic */}
      {(role === 'admin' || role === 'operador') && (
        <td className="px-3 py-2 text-right">
          <button onClick={() => onEdit(item)} className="text-blue-600 hover:underline mr-2" disabled={role === 'guest'}>Editar</button>
          <button onClick={() => onDelete(item)} className="text-red-600 hover:underline" disabled={role === 'guest'}>Eliminar</button>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm">N° Parte</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.ndp} onChange={e => upd('ndp', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm">Artículo</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.articulo} onChange={e => upd('articulo', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm">Equipo</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.equipo} onChange={e => upd('equipo', e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Gaveta</label>
          <input list="gavetas-list" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.gaveta} onChange={e => upd('gaveta', e.target.value)} required />
          <datalist id="gavetas-list">
            {gavetas.map(g => <option key={g} value={g}>{g}</option>)}
          </datalist>
        </div>
        <div>
          <label className="text-sm">Nivel</label>
          <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.nivel} onChange={e => upd('nivel', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm">Cantidad</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.cantidad} onChange={e => upd('cantidad', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-sm">Mín</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.min} onChange={e => upd('min', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-sm">Máx</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.max} onChange={e => upd('max', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-sm">TDE</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.tde} onChange={e => upd('tde', Number(e.target.value))} min={0} />
        </div>
        <div className="sm:col-span-3">
          <label className="text-sm">Subir imagen</label>
          <ImageUploader currentImage={form.link} onImageChange={handleImageChange} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 dark:border-gray-700">Cancelar</button>
        <button type="submit" className="rounded-lg bg-gray-900 text-white px-3 py-2 dark:bg-gray-100 dark:text-gray-900">Guardar</button>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleChange} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Contraseña actual</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={new1} onChange={e => setNew1(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Repetir nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={new2} onChange={e => setNew2(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-3 py-2 dark:border-gray-700">Cerrar</button>
            <button type="submit" className="rounded-lg bg-blue-900 text-white px-3 py-2 dark:bg-blue-100 dark:text-blue-900" disabled={loading}>Guardar</button>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">{label}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(password); }} className="space-y-3">
          <input type="password" className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={password} onChange={e => setPassword(e.target.value)} autoFocus required />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-3 py-2 dark:border-gray-700">Cancelar</button>
            <button type="submit" className="rounded-lg bg-blue-900 text-white px-3 py-2 dark:bg-blue-100 dark:text-blue-900" disabled={loading}>Aceptar</button>
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
    // if r is just an IP or hostname possibly prefixed with / (e.g. '10.229.52.84' or '/10.229.52.84'), add protocol
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
      const { data } = await api.get('/items', { params: { gaveta: activeGaveta, q } });
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header user={user} onLogout={logout} onOpenPassword={() => setShowPasswordModal(true)} />
      <main className="max-w-7xl mx-auto w-full px-4 py-6">
        <div className="mb-2 text-right text-sm text-blue-900 dark:text-blue-200 font-semibold">
          Turno actual: <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">{turno}</span>
        </div>
        {/* Gavetas */}
        <div className="flex gap-2 overflow-x-auto mb-2">
          {gavetas.map((g) => {
            const tieneResultados = false; // Cambiar lógica si es necesario
            let btnClass = 'px-4 py-2 rounded-full border dark:border-gray-700 transition-colors duration-200 ';
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
        <div className="flex items-center gap-2 mb-4 justify-end">
          {user?.rol === 'admin' && (
            <>
              <button
                onClick={() => setModal({ mode: 'historial' })}
                className="rounded-xl bg-blue-900 text-white px-4 py-2 dark:bg-blue-400 dark:text-blue-900 font-semibold border border-blue-900 dark:border-blue-400"
              >
                Ver historial
              </button>
              <button
                onClick={() => setModal({ mode: 'usuarios' })}
                className="rounded-xl bg-green-900 text-white px-4 py-2 dark:bg-green-400 dark:text-green-900 font-semibold border border-green-900 dark:border-green-400"
              >
                Administrar usuarios
              </button>
            </>
          )}
          {(user?.rol === 'admin' || user?.rol === 'operador') && (
            <>
              <button
                onClick={handleExportExcel}
                className="rounded-xl bg-orange-900 text-white px-4 py-2 dark:bg-orange-400 dark:text-orange-900 font-semibold border border-orange-900 dark:border-orange-400"
                title="Exportar datos a Excel"
              >
                Exportar Excel
              </button>
              <button
                onClick={() => setModal({ mode: 'add' })}
                className="rounded-xl bg-gray-900 text-white px-4 py-2 dark:bg-gray-100 dark:text-gray-900"
              >
                Agregar
              </button>
            </>
          )}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (N° parte, artículo, equipo)"
            className="w-72 max-w-full rounded-xl border px-3 py-2 dark:bg-gray-800 dark:border-gray-700 ml-auto"
            style={{ marginLeft: 'auto' }}
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-3 py-2">N° Parte</th>
                <th className="text-left px-3 py-2">Artículo</th>
                <th className="text-left px-3 py-2">Equipo</th>
                <th className="text-left px-3 py-2">Gaveta</th>
                <th className="text-left px-3 py-2">Nivel</th>
                <th className="text-left px-3 py-2">Cantidad</th>
                <th className="text-left px-3 py-2">Mín</th>
                <th className="text-left px-3 py-2">Máx</th>
                <th className="text-left px-3 py-2">TDE</th>
                {/* Imagen column removed from list view */}
                {(user?.rol === 'admin' || user?.rol === 'operador') && <th className="px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {!loading && Array.isArray(itemsOrdenados) && itemsOrdenados.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  role={user?.rol}
                  onEdit={user?.rol === 'admin' || user?.rol === 'operador' ? (item) => setModal({ mode: 'edit', item }) : undefined}
                  onDelete={user?.rol === 'admin' || user?.rol === 'operador' ? handleDelete : undefined}
                  onDoubleClick={(item) => { setModal({ mode: 'detail', item }); }}
                />
              ))}
            </tbody>
          </table>
          {loading && <div className="p-6 text-center text-gray-500">Cargando...</div>}
          {!loading && Array.isArray(itemsOrdenados) && itemsOrdenados.length === 0 && <div className="p-6 text-center text-gray-500">Sin resultados</div>}
        </div>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Total: <b>{total}</b>
        </div>
      </main>
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl p-5 border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {modal.mode === 'edit' ? 'Editar' : modal.mode === 'historial' ? 'Historial de acciones' : modal.mode === 'usuarios' ? 'Administrar usuarios' : 'Agregar ítem'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
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
                  <h4 className="text-lg font-semibold">{modal.item.articulo} (N° {modal.item.ndp})</h4>
                  <p className="text-sm text-gray-600">Equipo: {modal.item.equipo} — Gaveta: {modal.item.gaveta} — Nivel: {modal.item.nivel}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
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
                          className="max-h-80 object-contain" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="max-h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"
                          style={{display: 'none'}}
                        >
                          <span>Error cargando imagen</span>
                        </div>
                      </>
                    ) : (
                      <div className="max-h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <span>Sin imagen disponible</span>
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
               pwPrompt.action === 'edit-user' ? 'Contraseña de administrador para editar usuario' :
               pwPrompt.action === 'delete-user' ? 'Contraseña de administrador para eliminar usuario' : 'Contraseña'}
        loading={pwLoading}
        error={pwError}
      />
    </div>
  );
}
