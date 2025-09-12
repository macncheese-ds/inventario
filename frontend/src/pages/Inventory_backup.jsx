import React, { useEffect, useState } from 'react';
import { FaCog } from 'react-icons/fa';
import { api, setAuthToken } from '../api.js';
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

function UsuariosAdmin({ onClose }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editRol, setEditRol] = useState({});
  
  useEffect(() => {
    setLoading(true);
    api.get('/users')
      .then(r => setUsuarios(r.data))
      .catch(() => setError('Error cargando usuarios'))
      .finally(() => setLoading(false));
  }, []);

  function handleRolChange(username, newRol) {
    setEditRol(r => ({ ...r, [username]: newRol }));
  }

  async function guardarRol(username) {
    const nuevoRol = editRol[username];
    if (!nuevoRol) return;
    try {
      await api.put(`/users/${username}`, { rol: nuevoRol });
      setUsuarios(us => us.map(u => u.username === username ? { ...u, rol: nuevoRol } : u));
      setEditRol(r => ({ ...r, [username]: undefined }));
    } catch {
      setError('Error actualizando rol');
    }
  }

  async function eliminarUsuario(username) {
    setConfirmDelete(username);
  }

  async function confirmarEliminar() {
    if (!confirmDelete) return;
    await api.delete(`/users/${confirmDelete}`);
    setUsuarios(usuarios.filter(u => u.username !== confirmDelete));
    setConfirmDelete(null);
  }

  function cancelarEliminar() {
    setConfirmDelete(null);
  }

  return (
    <div>
      <h4 className="font-semibold mb-2">Usuarios registrados</h4>
      {loading && <div className="text-gray-500">Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <table className="min-w-full text-xs mb-4">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-2 py-1">Usuario</th>
              <th className="px-2 py-1">Nombre</th>
              <th className="px-2 py-1">Rol</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.username} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-2 py-1">{u.username}</td>
                <td className="px-2 py-1">{u.nombre}</td>
                <td className="px-2 py-1">
                  <select
                    value={editRol[u.username] !== undefined ? editRol[u.username] : u.rol}
                    onChange={e => handleRolChange(u.username, e.target.value)}
                    className="rounded border px-2 py-1 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
                  >
                    <option value="admin">admin</option>
                    <option value="operador">operador</option>
                    <option value="guest">guest</option>
                  </select>
                  {editRol[u.username] !== undefined && editRol[u.username] !== u.rol && (
                    <button onClick={() => guardarRol(u.username)} className="ml-2 text-blue-600 hover:underline">Guardar</button>
                  )}
                </td>
                <td className="px-2 py-1 text-right">
                  <button onClick={() => eliminarUsuario(u.username)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700">
            <div className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">¿Eliminar usuario?</div>
            <div className="mb-4 text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar el usuario <b>{confirmDelete}</b>?
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={cancelarEliminar} className="rounded-lg border px-4 py-2 dark:border-gray-700">Cancelar</button>
              <button onClick={confirmarEliminar} className="rounded-lg bg-red-700 text-white px-4 py-2 dark:bg-red-400 dark:text-red-900">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="rounded-lg border px-4 py-2 dark:border-gray-700">Cerrar</button>
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
            🌙/☀️
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

function ItemRow({ item, role, onEdit, onDelete }) {
  const qtyClass =
    item.cantidad < item.min
      ? 'text-red-600 font-semibold'
      : item.cantidad > item.max
      ? 'text-yellow-600 font-semibold'
      : '';
  
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="px-3 py-2">{item.ndp}</td>
      <td className="px-3 py-2">{item.articulo}</td>
      <td className="px-3 py-2">{item.equipo}</td>
      <td className="px-3 py-2">{item.gaveta}</td>
      <td className="px-3 py-2">{item.nivel}</td>
      <td className={`px-3 py-2 ${qtyClass}`}>{item.cantidad}</td>
      <td className="px-3 py-2">{item.min}</td>
      <td className="px-3 py-2">{item.max}</td>
      <td className="px-3 py-2">{item.tde}</td>
      <td className="px-3 py-2">
        {item.link ? (
          <div className="w-24 h-24 overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 flex items-center justify-center">
            <img src={item.link} alt="img" className="object-contain max-h-24 max-w-24" />
          </div>
        ) : null}
      </td>
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
  
  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
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
          <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.gaveta} onChange={e => upd('gaveta', e.target.value)} required>
            {gavetas.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm">Nivel</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.nivel} onChange={e => upd('nivel', e.target.value)} />
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
          <label className="text-sm">Link de imagen</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700" value={form.link} onChange={e => upd('link', e.target.value)} placeholder="https://..." />
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

export default function Inventory() {
  const [token] = useState(localStorage.getItem('token'));
  const [user] = useState(() => (token ? jwtDecode(token) : null));
  const [gavetas, setGavetas] = useState([]);
  const [activeGaveta, setActiveGaveta] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [turno, setTurno] = useState('');

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
      setItems(data.data);
      setTotal(data.total);
    } catch (e) {
      setItems([]);
      setTotal(0);
    }
    setLoading(false);
  }
  
  useEffect(() => { loadGavetas(); }, []);
  useEffect(() => { loadItems(); }, [activeGaveta, q]);

  async function handleSave(item) {
    try {
      if (item.id) {
        await api.put(`/items/${item.id}`, item);
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
    if (window.confirm('¿Seguro que deseas eliminar este ítem?')) {
      api.delete(`/items/${item.id}`).then(loadItems);
    }
  }

  // Calcular gavetas con resultados
  const safeItems = Array.isArray(items) ? items : [];
  const safeGavetas = Array.isArray(gavetas) ? gavetas : [];
  const hayBusqueda = q && q.trim() !== '';
  // Para resaltar correctamente, necesitamos saber para cada gaveta si hay resultados en items para esa gaveta
  const gavetasConResultadosBusqueda = hayBusqueda
    ? safeGavetas.filter(g => safeItems.some(it => it.gaveta === g))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header user={user} onLogout={logout} onOpenPassword={() => setShowPasswordModal(true)} />
      <main className="max-w-7xl mx-auto w-full px-4 py-6">
        <div className="mb-2 text-right text-sm text-blue-900 dark:text-blue-200 font-semibold">
          Turno actual: <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">{turno}</span>
        </div>
        {/* Gavetas */}
        <div className="flex gap-2 overflow-x-auto mb-2">
          {safeGavetas.map((g) => {
            const tieneResultados = hayBusqueda && gavetasConResultadosBusqueda.includes(g);
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
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="rounded-xl bg-gray-900 text-white px-4 py-2 dark:bg-gray-100 dark:text-gray-900"
            >
              Agregar
            </button>
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
                <th className="text-left px-3 py-2">Imagen</th>
                {(user?.rol === 'admin' || user?.rol === 'operador') && <th className="px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {!loading && Array.isArray(items) && items.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  role={user?.rol}
                  onEdit={user?.rol === 'admin' || user?.rol === 'operador' ? (item) => setModal({ mode: 'edit', item }) : undefined}
                  onDelete={user?.rol === 'admin' || user?.rol === 'operador' ? handleDelete : undefined}
                />
              ))}
            </tbody>
          </table>
          {loading && <div className="p-6 text-center text-gray-500">Cargando...</div>}
          {!loading && Array.isArray(items) && items.length === 0 && <div className="p-6 text-center text-gray-500">Sin resultados</div>}
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
              <UsuariosAdmin onClose={() => setModal(null)} />
            ) : (
              <ItemForm initial={modal.item} onCancel={() => setModal(null)} onSave={handleSave} gavetas={gavetas} />
            )}
          </div>
        </div>
      )}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
