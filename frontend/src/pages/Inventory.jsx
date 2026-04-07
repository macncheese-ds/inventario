import React, { useEffect, useState, useRef } from 'react';
import ImageUploader from '../components/ImageUploader.jsx';
import LoginModal from '../components/LoginModal.jsx';
import QuantityPromptModal from '../components/QuantityPromptModal.jsx';
import QRModal from '../components/QRModal.jsx';
import QRBulkModal from '../components/QRBulkModal.jsx';
import { FaCog } from 'react-icons/fa';
import api, { setAuthToken } from '../api.js';
import { jwtDecode } from 'jwt-decode';
import { toggleTheme } from '../theme.js';
import Layout from '../components/Layout.jsx';
import NotificationsModal from '../components/NotificationsModal.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

// Translations for UI labels (expanded)
const TRANSLATIONS = {
  es: {
    inventory: 'Inventario',
    turno: 'Turno',
    total_general: 'Total general',
    prestamos: 'Préstamos',
    loading_history: 'Cargando historial...',
    error_loading_history: 'Error cargando historial',
  loading_users: 'Cargando usuarios...',
  error_loading_users: 'Error cargando usuarios',
  part_number: 'N° Parte',
  item_label: 'Artículo',
  equipment: 'Equipo',
  drawer_label: 'Gaveta',
  level_label: 'Nivel',
  quantity_label: 'Cantidad',
  price_label: 'Precio',
  min_label: 'Mín',
  max_label: 'Máx',
  tde_label: 'TDE',
  upload_image: 'Subir imagen',
  fecha_hora: 'Fecha/Hora',
  usuario_label: 'Usuario',
  accion_label: 'Acción',
  detalle_anterior: 'Detalle anterior',
  detalle_nuevo: 'Detalle nuevo',
  turno_label: 'Turno',
    manage_users: 'Administrar Usuarios',
    add_user: '+ Agregar Usuario',
    refresh: 'Actualizar',
    add_new_user: 'Agregar Nuevo Usuario',
    create_user: 'Crear Usuario',
    cancel: 'Cancelar',
    delete_confirm: 'Confirmar eliminación',
    delete_user_text: '¿Estás seguro de que deseas eliminar el usuario',
    no_users: 'No hay usuarios registrados',
  irreversible_action: 'Esta acción no se puede deshacer.',
    loans_active: 'Préstamos Activos',
    loading: 'Cargando...',
    no_results: 'Sin resultados',
    totals_by_gaveta: 'Totales por gaveta:',
    select_gaveta: 'Selecciona una gaveta',
    no_data: 'Sin datos',
    ver_historial: 'Ver historial',
    administrar_usuarios: 'Administrar usuarios',
    export_excel: 'Exportar Excel',
    agregar: '+ Agregar',
    search_placeholder: 'Buscar (N° parte, artículo, equipo)',
    clear_filters: 'Limpiar filtros',
    total_label: 'Total',
    showing_label: 'Mostrando',
    change_password: 'Cambiar contraseña',
    save: 'Guardar',
    save_changes: 'Guardar Cambios',
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    return_item: 'Devolver',
    lend_item: 'Prestar',
    no_image: 'Sin imagen disponible',
    error_loading_image: 'Error cargando imagen',
    add_item: 'Agregar ítem',
    edit_item: 'Editar',
    item_detail: 'Detalle de ítem',
    confirm_password_edit: 'Confirma tu contraseña para editar',
    confirm_password_delete: 'Confirma tu contraseña para eliminar',
    confirm_password_decrement: 'Confirma tu contraseña para usar 1 unidad',
    confirm_password_admin_edit: 'Contraseña de administrador para editar usuario',
    confirm_password_admin_delete: 'Contraseña de administrador para eliminar usuario',
    employee_not_found: 'Empleado no encontrado',
    processing: 'Procesando...',
    no_active_loans: 'No hay préstamos activos',
    scan_another: '← Escanear Otro',
    confirm_lend: 'Confirmar Préstamo',
    confirm_return: 'Confirmar Devolución',
    enter_password_confirm: 'Ingresa tu contraseña para confirmar',
  scan_badge: 'Escanea el gafete del empleado',
  try_again: 'Intentar de nuevo',
  no_units_to_lend: 'No hay unidades disponibles para prestar',
    turno_prefix: 'Turno:'
    ,current_password: 'Contraseña actual',
    new_password: 'Nueva contraseña',
    repeat_new_password: 'Repetir nueva contraseña',
    fill_all_fields: 'Completa todos los campos',
    passwords_no_match: 'Las contraseñas nuevas no coinciden',
    password_changed_success: 'Contraseña cambiada correctamente',
    error_changing_password: 'Error al cambiar contraseña'
  },
  en: {
    inventory: 'Inventory',
    turno: 'Shift',
    total_general: 'Grand total',
    prestamos: 'Loans',
    loading_history: 'Loading history...',
    error_loading_history: 'Error loading history',
  loading_users: 'Loading users...',
  error_loading_users: 'Error loading users',
  part_number: 'Part #',
  item_label: 'Item',
  equipment: 'Equipment',
  drawer_label: 'Drawer',
  level_label: 'Level',
  quantity_label: 'Qty',
  price_label: 'Price',
  min_label: 'Min',
  max_label: 'Max',
  tde_label: 'TDE',
  upload_image: 'Upload image',
  fecha_hora: 'Date/Time',
  usuario_label: 'User',
  accion_label: 'Action',
  detalle_anterior: 'Previous detail',
  detalle_nuevo: 'New detail',
  turno_label: 'Shift',
    manage_users: 'Manage Users',
    add_user: '+ Add User',
    refresh: 'Refresh',
    add_new_user: 'Add New User',
    create_user: 'Create User',
    cancel: 'Cancel',
    delete_confirm: 'Confirm deletion',
    delete_user_text: 'Are you sure you want to delete user',
    no_users: 'No users registered',
  irreversible_action: 'This action cannot be undone.',
    loans_active: 'Active Loans',
    loading: 'Loading...',
    no_results: 'No results',
    totals_by_gaveta: 'Totals by drawer:',
    select_gaveta: 'Select a drawer',
    no_data: 'No data',
    ver_historial: 'View history',
    administrar_usuarios: 'Manage users',
    export_excel: 'Export Excel',
    agregar: '+ Add',
    search_placeholder: 'Search (Part #, item, equipment)',
    clear_filters: 'Clear filters',
    total_label: 'Total',
    showing_label: 'Showing',
    change_password: 'Change password',
    save: 'Save',
    save_changes: 'Save Changes',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    return_item: 'Return',
    lend_item: 'Lend',
    no_image: 'No image available',
    error_loading_image: 'Error loading image',
    add_item: 'Add item',
    edit_item: 'Edit',
    item_detail: 'Item detail',
    confirm_password_edit: 'Confirm your password to edit',
    confirm_password_delete: 'Confirm your password to delete',
    confirm_password_decrement: 'Confirm your password to use 1 unit',
    confirm_password_admin_edit: 'Admin password to edit user',
    confirm_password_admin_delete: 'Admin password to delete user',
    employee_not_found: 'Employee not found',
    processing: 'Processing...',
    no_active_loans: 'No active loans',
    scan_another: '← Scan another',
    confirm_lend: 'Confirm Lend',
    confirm_return: 'Confirm Return',
    enter_password_confirm: 'Enter your password to confirm',
  scan_badge: 'Scan the employee badge',
  try_again: 'Try again',
  no_units_to_lend: 'No units available to lend',
    turno_prefix: 'Shift:'
    ,current_password: 'Current password',
    new_password: 'New password',
    repeat_new_password: 'Repeat new password',
    fill_all_fields: 'Complete all fields',
    passwords_no_match: 'New passwords do not match',
    password_changed_success: 'Password changed successfully',
    error_changing_password: 'Error changing password'
  },
  ko: {
    inventory: '재고',
    turno: '근무조',
    total_general: '총 합계',
    prestamos: '대출',
    loading_history: '기록 로드 중...',
    error_loading_history: '기록을 로드하는 중 오류 발생',
  loading_users: '사용자 로드 중...',
  error_loading_users: '사용자를 로드하는 중 오류 발생',
  part_number: '부품 번호',
  item_label: '항목',
  equipment: '장비',
  drawer_label: '서랍',
  level_label: '레벨',
  quantity_label: '수량',
  price_label: '가격',
  min_label: '최소',
  max_label: '최대',
  tde_label: 'TDE',
  upload_image: '이미지 업로드',
  fecha_hora: '날짜/시간',
  usuario_label: '사용자',
  accion_label: '동작',
  detalle_anterior: '이전 세부정보',
  detalle_nuevo: '새 세부정보',
  turno_label: '근무조',
    manage_users: '사용자 관리',
    add_user: '+ 사용자 추가',
    refresh: '새로고침',
    add_new_user: '새 사용자 추가',
    create_user: '사용자 생성',
    cancel: '취소',
    delete_confirm: '삭제 확인',
    delete_user_text: '사용자를 삭제하시겠습니까',
    no_users: '등록된 사용자가 없습니다',
  irreversible_action: '이 작업은 취소할 수 없습니다.',
    loans_active: '대출 중',
    loading: '로딩 중...',
    no_results: '결과가 없습니다',
    totals_by_gaveta: '서랍별 합계:',
    select_gaveta: '서랍을 선택하세요',
    no_data: '데이터 없음',
    ver_historial: '기록 보기',
    administrar_usuarios: '사용자 관리',
    export_excel: '엑셀 내보내기',
    agregar: '+ 추가',
    search_placeholder: '검색 (부품 번호, 항목, 장비)',
    clear_filters: '필터 지우기',
    total_label: '합계',
    showing_label: '표시 중',
    change_password: '비밀번호 변경',
    save: '저장',
    save_changes: '변경 사항 저장',
    create: '생성',
    edit: '편집',
    delete: '삭제',
    return_item: '반납',
    lend_item: '대출',
    no_image: '이미지 없음',
    error_loading_image: '이미지를 불러오는 중 오류 발생',
    add_item: '항목 추가',
    edit_item: '편집',
    item_detail: '항목 상세',
    confirm_password_edit: '편집을 위해 비밀번호를 확인하세요',
    confirm_password_delete: '삭제를 위해 비밀번호를 확인하세요',
    confirm_password_decrement: '1개 사용을 위해 비밀번호를 확인하세요',
    confirm_password_admin_edit: '사용자 편집용 관리자 비밀번호',
    confirm_password_admin_delete: '사용자 삭제용 관리자 비밀번호',
    employee_not_found: '직원을 찾을 수 없음',
    processing: '처리 중...',
    no_active_loans: '활성 대출 없음',
    scan_another: '← 다른 것 스캔',
    confirm_lend: '대출 확인',
    confirm_return: '반납 확인',
    enter_password_confirm: '확인을 위해 비밀번호를 입력하세요',
  scan_badge: '직원 배지를 스캔하세요',
  try_again: '다시 시도',
  no_units_to_lend: '대출 가능한 항목이 없습니다',
    turno_prefix: '근무:'
    ,current_password: '현재 비밀번호',
    new_password: '새 비밀번호',
    repeat_new_password: '새 비밀번호 확인',
    fill_all_fields: '모든 필드를 입력하세요',
    passwords_no_match: '새 비밀번호가 일치하지 않습니다',
    password_changed_success: '비밀번호가 변경되었습니다',
    error_changing_password: '비밀번호 변경 중 오류'
  }
};

const DEFAULT_LANG = 'es';

// Helper translation that reads current language from localStorage when used
function trLocal(key) {
  try {
    const l = (typeof window !== 'undefined') ? (localStorage.getItem('inv_lang') || DEFAULT_LANG) : DEFAULT_LANG;
    return (TRANSLATIONS[l] && TRANSLATIONS[l][key]) ? TRANSLATIONS[l][key] : TRANSLATIONS[DEFAULT_LANG][key];
  } catch (e) {
    return TRANSLATIONS[DEFAULT_LANG][key] || key;
  }
}

// Formatos comunes
function formatCurrency(value) {
  try {
    const n = Number(value || 0);
    // Formatear en Pesos Mexicanos (MXN)
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);
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

// Puede administrar usuarios (FULL_ACCESS pero NO ensamble)
function canAdministerUsers(rol, area) {
  if (area && area.toLowerCase() === 'ensamble') return false;
  return ROLE_GROUPS.FULL_ACCESS.includes(rol);
}

// Puede editar items (agregar/editar/eliminar, decrementar)
function canEditInventory(rol, area) {
  // Si en el futuro quieres bloquear edición para ensamble, agrega aquí la condición.
  return [...ROLE_GROUPS.FULL_ACCESS, ...ROLE_GROUPS.TOOL_ACCESS].includes(rol);
}

// Puede hacer préstamos (NO ensamble)
function canLendItems(rol, area) {
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
    area: ''
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
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
  return (
    <div className="bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">
            {trLocal('loans_active')} ({prestamos.length})
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{p.articulo}</td>
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



function ItemRow({ item, role, area, onEdit, onDelete, onDoubleClick, onDecrement, onPrestar, onShowQR }) {
  // Determine stock status
  const stockStatus = item.cantidad < item.min ? 'low' : item.cantidad > item.max ? 'high' : 'normal';
  const statusStyles = {
    low: 'text-rose-600 dark:text-rose-400',
    high: 'text-amber-600 dark:text-amber-400', 
    normal: 'text-emerald-600 dark:text-emerald-400'
  };
  const statusBadge = {
    low: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
  };
  const isMantenimiento = area === 'Ensamble';
  
  return (
    <tr 
      onDoubleClick={() => onDoubleClick && onDoubleClick(item)} 
      className="group border-b border-slate-100 dark:border-slate-700/50 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-gray-50/30 dark:hover:from-slate-900/10 dark:hover:to-gray-900/10 transition-all duration-200 cursor-pointer"
    >
      <td className="px-4 py-3.5">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">{item.ndp || '-'}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.articulo}</span>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{item.equipo || '-'}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {item.gaveta}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm text-slate-500 dark:text-slate-400">{item.nivel || '-'}</span>
      </td>
      {isMantenimiento && (
        <td className="px-4 py-3.5">
          <span className="text-sm text-slate-500 dark:text-slate-400">{item.linea || '-'}</span>
        </td>
      )}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge[stockStatus]}`}>
            {item.cantidad}
          </span>
          {canEditInventory(role, area) && item.cantidad > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDecrement(item); }} 
              className="opacity-0 group-hover:opacity-100 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-400 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
              title="Quitar unidades"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-right">
        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(item.precio)}</span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatCurrency((Number(item.precio || 0) * Number(item.cantidad || 0)).toFixed(2))}</span>
      </td>
      
      {canEditInventory(role, area) && (
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); onShowQR(item); }}
              className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-lg dark:text-slate-400 dark:hover:text-slate-400 dark:hover:bg-slate-900/30 transition-all duration-200 hover:scale-110"
              title="Generar QR"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
            {canLendItems(role, area) && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrestar(item); }}
                className="p-2 text-slate-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg dark:text-slate-400 dark:hover:text-gray-400 dark:hover:bg-gray-900/30 transition-all duration-200 hover:scale-110"
                title="Prestar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-lg dark:text-slate-400 dark:hover:text-slate-400 dark:hover:bg-slate-900/30 transition-all duration-200 hover:scale-110"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-900/30 transition-all duration-200 hover:scale-110"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
      ndp: '', articulo: '', equipo: '', gaveta: gavetas[0] || '', nivel: '', cantidad: 0, precio: 0, min: 0, max: 0, tde: 0, link: '', linea: ''
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
          <Input label="Línea" value={form.linea || ''} onChange={e => upd('linea', e.target.value)} placeholder="Ej: L1, L2, L3" />
        )}
        
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
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

// Modal para préstamo
function PrestarModal({ open, item, onClose, onSubmit, turno, currentUser }) {
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (!open) {
      setShowScanner(false);
      setError('');
      setEmployeeInfo(null);
      setLoading(false);
      setCantidad(1);
    } else {
      setShowScanner(true);
    }
  }, [open]);

  async function handleEmployeeScan(credentials) {
    setLoading(true);
    setError('');
    try {
      // If user info is passed directly (requirePassword=false mode), use it
      if (credentials.user) {
        setEmployeeInfo(credentials.user);
        setShowScanner(false);
        return;
      }
      // Otherwise lookup employee info using the scanned badge
      const info = await api.lookupUser(credentials.employee_input);
      setEmployeeInfo(info);
      setShowScanner(false);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || trLocal('employee_not_found'));
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
      if (!cantidad || cantidad < 1 || cantidad > (item?.cantidad || 1)) throw new Error('Cantidad inválida');
      await onSubmit({
        employee_input: employeeInfo.num_empleado,
        articulo: item.articulo,
        cantidad,
        item_id: item.id
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{trLocal('confirm_lend')}</h3>
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm space-y-1">
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">{trLocal('item_label')}:</span> {item?.articulo}</p>
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">NDP:</span> {item?.ndp}</p>
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">{trLocal('quantity_label')} disponible:</span> {item?.cantidad}</p>
            </div>

            {employeeInfo ? (
              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-sm space-y-1">
                  <p><span className="font-semibold text-emerald-800 dark:text-emerald-300">{trLocal('usuario_label')}:</span> {employeeInfo.nombre}</p>
                  <p><span className="font-semibold text-emerald-800 dark:text-emerald-300">N° {trLocal('usuario_label')}:</span> {employeeInfo.num_empleado}</p>
                </div>
                
                <Input 
                  label="Cantidad a prestar" 
                  type="number" 
                  min={1} 
                  max={item?.cantidad || 1} 
                  value={cantidad} 
                  onChange={e => setCantidad(Number(e.target.value))} 
                  required 
                />
                <div className="text-xs text-slate-500 mt-1">Máximo: {item?.cantidad || 1}</div>
                
                {error && <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 p-2 rounded">{error}</div>}
                
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => { setShowScanner(true); setEmployeeInfo(null); setCantidad(1); setError(''); }}>
                    {trLocal('scan_another')}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? trLocal('processing') : trLocal('confirm_lend')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                {loading ? trLocal('processing') : trLocal('scan_badge')}
              </div>
            )}

            {error && !employeeInfo && (
              <div className="mt-4 text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 p-3 rounded text-center">
                {error}
                <button
                  onClick={() => { setShowScanner(true); setError(''); }}
                  className="block w-full mt-2 text-slate-600 dark:text-slate-400 hover:underline font-medium"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
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
  // --- NUEVO FLUJO: primero pedir cantidad, luego contraseña ---
  const [qtyPrompt, setQtyPrompt] = useState({ open: false, item: null });
  const [pendingQty, setPendingQty] = useState(null);
  const [token] = useState(localStorage.getItem('token'));
  const [user] = useState(() => (token ? jwtDecode(token) : null));
  const [lang, setLang] = useState(() => localStorage.getItem('inv_lang') || DEFAULT_LANG);
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
    setQtyPrompt({ open: true, item });
  }

  function handleQtySubmit(cantidad) {
    setQtyPrompt({ open: false, item: null });
    setPendingQty(cantidad);
    // Después de cantidad, pedir contraseña
    setPwPrompt({ open: true, action: 'decrement-item', context: { ...qtyPrompt.item, cantidad: cantidad } });
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
        const { id, cantidad } = pwPrompt.context;
        await api.patch(`/items/${id}/decrement`, { password, turno, cantidad: cantidad || 1 });
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
    
    return matchNdp && matchArticulo && matchEquipo && matchGaveta && matchNivel && matchLinea;
  });

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
  };

  return (
    <Layout fullWidth>
      {/* Main Control Header */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top Control Bar: App Settings & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Quick Actions / Modes */}
            {canEditInventory(user?.rol, user?.area) && (
              <Button variant="primary" onClick={() => setModal({ mode: 'add' })} className="whitespace-nowrap">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {trLocal('agregar')}
              </Button>
            )}
            {canLendItems(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setShowPrestamos(true)}>
                <svg className="w-5 h-5 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {trLocal('prestamos')}
              </Button>
            )}
            {canViewHistory(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setModal({ mode: 'historial' })}>
                <svg className="w-5 h-5 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {trLocal('ver_historial')}
              </Button>
            )}
            {canAdministerUsers(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setModal({ mode: 'usuarios' })}>
                <svg className="w-5 h-5 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {trLocal('administrar_usuarios')}
              </Button>
            )}
            {canViewHistory(user?.rol, user?.area) && (
              <Button variant="secondary" onClick={() => setShowNotifModal(true)} className="relative">
                <svg className="w-5 h-5 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notificaciones
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {canEditInventory(user?.rol, user?.area) && (
              <Button variant="outline" onClick={() => setQrBulkModal(true)} title="Generar QR en lote">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR Lote
              </Button>
            )}
            {canViewHistory(user?.rol, user?.area) && (
              <Button variant="outline" onClick={handleExportExcel} title="Exportar a Excel">
                <svg className="w-4 h-4 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Excel
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowInfoModal(true)} title="Información del sistema">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
            <Button variant="ghost" onClick={() => { loadGavetas(); loadItems(); loadTotals(); }} title={trLocal('refresh')}>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
          {/* Segmented Control for Gavetas */}
          <div className="flex w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              {gavetas.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGaveta(g)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-grow sm:flex-grow-0 ${
                    g === activeGaveta
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {g === 'Todas' ? 'Todas las Gavetas' : `Gaveta ${g}`}
                </button>
              ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={trLocal('search_placeholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all font-medium placeholder:font-normal"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card hover className="p-5 flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{trLocal('turno_prefix')}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-zinc-600 bg-clip-text text-transparent">{turno}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-500 to-zinc-500 flex items-center justify-center text-white shadow-lg shadow-slate-500/30 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Card>
        
        <Card hover className="p-5 flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{trLocal('totals_by_gaveta')}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {activeGaveta ? (
                (() => {
                  const sel = gavetaTotals.find(gt => String(gt.gaveta) === String(activeGaveta));
                  return formatCurrency(Number(sel?.total || 0).toFixed(2));
                })()
              ) : '-'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Card>

        <Card hover className="p-5 flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{trLocal('showing_label')}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">{itemsFiltrados.length} / {total}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center text-white shadow-lg shadow-slate-500/30 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
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
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('part_number')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('item_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 hidden md:table-cell">{trLocal('equipment')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('drawer_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('level_label')}</th>
                {user?.area === 'Ensamble' && <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">Linea</th>}
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{trLocal('quantity_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">{trLocal('price_label')}</th>
                <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">{trLocal('total_label')}</th>
                {canEditInventory(user?.rol, user?.area) && <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">Acciones</th>}
              </tr>
              <tr className="bg-white/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-2 py-2"><input className="w-full text-xs p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all" value={filtroNdp} onChange={e => setFiltroNdp(e.target.value)} placeholder="Filtrar..." /></th>
                <th className="px-2 py-2"><input className="w-full text-xs p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all" value={filtroArticulo} onChange={e => setFiltroArticulo(e.target.value)} placeholder="Filtrar..." /></th>
                <th className="px-2 py-2 hidden md:table-cell"><input className="w-full text-xs p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all" value={filtroEquipo} onChange={e => setFiltroEquipo(e.target.value)} placeholder="Filtrar..." /></th>
                <th className="px-2 py-2"><input className="w-full text-xs p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all" value={filtroGaveta} onChange={e => setFiltroGaveta(e.target.value)} placeholder="Filtrar..." /></th>
                <th className="px-2 py-2"><input className="w-full text-xs p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all" value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} placeholder="Filtrar..." /></th>
                {user?.area === 'Ensamble' && <th className="px-2 py-2"><input className="w-full text-xs p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all" value={filtroLinea} onChange={e => setFiltroLinea(e.target.value)} placeholder="Filtrar..." /></th>}
                <th colSpan={4}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {!loading && itemsFiltrados.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  role={user?.rol}
                  area={user?.area}
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
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-slate-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cargando inventario...</span>
              </div>
            </div>
          )}
          {!loading && itemsFiltrados.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron resultados</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Intenta ajustar los filtros de busqueda</p>
            </div>
          )}
        </div>
      </Card>

      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {modal.mode === 'edit' ? 'Editar Item' : modal.mode === 'historial' ? 'Historial' : modal.mode === 'usuarios' ? 'Usuarios' : modal.mode === 'detail' ? 'Detalle' : 'Agregar Item'}
              </h3>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
             
             {modal.mode === 'historial' ? <Historial /> : 
              modal.mode === 'usuarios' ? <UsuariosAdmin onClose={() => setModal(null)} onPasswordPrompt={(d) => { setModal(null); setPwPrompt({ open: true, ...d }); }} /> :
              modal.mode === 'detail' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">{modal.item.articulo}</h4>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p><b>N° Parte:</b> {modal.item.ndp}</p>
                      <p><b>Equipo:</b> {modal.item.equipo}</p>
                      <p><b>Ubicación:</b> Gaveta {modal.item.gaveta}, Nivel {modal.item.nivel}</p>
                      <p><b>Stock:</b> {modal.item.cantidad} (Min: {modal.item.min}, Max: {modal.item.max})</p>
                      <p><b>Precio:</b> {formatCurrency(modal.item.precio)}</p>
                      {/* Mostrar línea solo si el usuario es del área Ensamble y existe el valor */}
                      {user?.area === 'Ensamble' && modal.item.linea && (
                        <p><b>Línea:</b> {modal.item.linea}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    {modal.item.link ? (
                      <img src={resolveImageUrl(modal.item.link)} alt={modal.item.articulo} className="max-h-64 object-contain" />
                    ) : (
                      <span className="text-slate-400">Sin imagen</span>
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
      <PrestarModal open={prestarModal.open} item={prestarModal.item} onClose={() => setPrestarModal({ open: false, item: null })} onSubmit={handlePrestarSubmit} turno={turno} currentUser={user} />
      <DevolverModal open={devolverModal.open} prestamo={devolverModal.prestamo} onClose={() => setDevolverModal({ open: false, prestamo: null })} onSubmit={handleDevolverSubmit} turno={turno} currentUser={user} />
      <QRModal open={qrModal.open} item={qrModal.item} onClose={() => setQrModal({ open: false, item: null })} />
      
      {showPrestamos && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Préstamos Activos</h3>
              <button onClick={() => setShowPrestamos(false)}>✕</button>
            </div>
            <PrestamosPanel prestamos={prestamos} onDevolver={handleDevolver} onClose={() => setShowPrestamos(false)} loading={prestamosLoading} />
          </Card>
        </div>
      )}
      
      <QRBulkModal 
        open={qrBulkModal} 
        onClose={() => setQrBulkModal(false)} 
        allItems={items} 

      />

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Información del Sistema</h3>
              <button onClick={() => setShowInfoModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
              <Button variant="secondary" onClick={() => setShowInfoModal(false)}>Cerrar</Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
