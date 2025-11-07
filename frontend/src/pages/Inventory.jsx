import React, { useEffect, useState, useRef } from 'react';
import ImageUploader from '../components/ImageUploader.jsx';
import LoginModal from '../components/LoginModal.jsx';
import QuantityPromptModal from '../components/QuantityPromptModal.jsx';
import { FaCog } from 'react-icons/fa';
import api, { setAuthToken } from '../api.js';
import { jwtDecode } from 'jwt-decode';
import { toggleTheme } from '../theme.js';

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
  FULL_ACCESS: ['The Goat', 'Ingeniero', 'Administrador'],
  TOOL_ACCESS: ['Calidad', 'Soporte', 'Lider', 'Operador', 'Recursos Humanos', 'Tool Room'],
  GUEST: ['Invitado']
};

function canAdminister(rol) {
  // Only FULL_ACCESS roles can administer users and high-level settings
  return ROLE_GROUPS.FULL_ACCESS.includes(rol);
}

function canEdit(rol) {
  // FULL_ACCESS and TOOL_ACCESS can edit inventory/tool-room items
  return [...ROLE_GROUPS.FULL_ACCESS, ...ROLE_GROUPS.TOOL_ACCESS].includes(rol);
}

function isGuest(rol) {
  return ROLE_GROUPS.GUEST.includes(rol);
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
    <div className="space-y-2">
      {loading && <div className="text-slate-500 text-sm">Cargando historial...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-700">
                <th className="px-1 sm:px-2 py-1 text-left">{trLocal('fecha_hora')}</th>
                <th className="px-1 sm:px-2 py-1 text-left">{trLocal('usuario_label')}</th>
                <th className="px-1 sm:px-2 py-1 text-left">{trLocal('accion_label')}</th>
                <th className="px-1 sm:px-2 py-1 text-left hidden md:table-cell">{trLocal('detalle_anterior')}</th>
                <th className="px-1 sm:px-2 py-1 text-left">{trLocal('detalle_nuevo')}</th>
                <th className="px-1 sm:px-2 py-1 text-left hidden lg:table-cell">{trLocal('turno_label')}</th>
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
                  <tr key={h.id} className="border-b border-slate-700 dark:border-slate-700">
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

  if (loading) return <div className="text-slate-500">{trLocal('loading_users')}</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h4 className="font-semibold text-sm sm:text-base">{trLocal('manage_users')}</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm font-medium min-h-[36px]"
          >
            {trLocal('add_user')}
          </button>
          <button
            onClick={loadUsuarios}
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[36px]"
          >
            {trLocal('refresh')}
          </button>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-slate-500 text-sm">{trLocal('no_users')}</div>
      ) : (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-700">
                <th className="px-2 sm:px-3 py-2 text-left">Usuario</th>
                <th className="px-2 sm:px-3 py-2 text-left hidden sm:table-cell">Nombre</th>
                <th className="px-2 sm:px-3 py-2 text-left">Rol</th>
                <th className="px-2 sm:px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.username} className="border-b border-slate-700 dark:border-slate-700">
                  <td className="px-2 sm:px-3 py-2 font-medium">{user.username}</td>
                  <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{user.nombre}</td>
                  <td className="px-2 sm:px-3 py-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      canAdminister(user.rol) ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' :
                      canEdit(user.rol) ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                      'bg-slate-800 text-slate-200 dark:bg-slate-800 dark:text-slate-100'
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
                        {trLocal('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs whitespace-nowrap min-h-[36px]"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700">
            <div className="mb-4 text-base sm:text-lg font-semibold text-red-700 dark:text-red-400">
              {trLocal('delete_confirm')}
            </div>
            <div className="mb-6 text-sm sm:text-base text-slate-300 dark:text-slate-300">
              {trLocal('delete_user_text')} <strong>{confirmDelete}</strong>?
              <br />
              <span className="text-xs sm:text-sm text-slate-500">{trLocal('irreversible_action')}</span>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2.5 rounded-lg border border-slate-600 dark:border-slate-600 hover:bg-slate-700/50 dark:hover:bg-slate-600 text-sm min-h-[44px]"
              >
                {trLocal('cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm min-h-[44px]"
              >
                {trLocal('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]">
          <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-4">{trLocal('add_new_user')}</h3>
            
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                  className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-500 px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  {trLocal('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  {formBusy ? trLocal('processing') : trLocal('create_user')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]">
          <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-4">{trLocal('edit_item') /* reuse edit label for modal */}</h3>
            
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                    className="w-full bg-slate-900 dark:bg-slate-700 border border-slate-600 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
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
                  className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-500 px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  {trLocal('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm min-h-[44px]"
                >
                  {formBusy ? trLocal('processing') : trLocal('save_changes')}
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
          className="px-4 py-2.5 rounded-lg border border-slate-600 dark:border-slate-600 hover:bg-slate-700/50 dark:hover:bg-slate-600 text-sm min-h-[44px]"
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
            {trLocal('loans_active')} ({prestamos.length})
          </h3>
          <button
            onClick={onClose}
            className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-xl"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-slate-500 text-sm py-4">{trLocal('loading')}</div>
        ) : prestamos.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">{trLocal('no_active_loans')}</div>
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
  );
}

function Header({ user, onLogout, onOpenPassword, onOpenPrestamos, lang, setLang, grandTotalAll }) {
  const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : TRANSLATIONS[DEFAULT_LANG][key];
  return (
    <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 dark:bg-slate-900 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-semibold">{t('inventory')}</span>
            <span className="text-xs text-slate-500 hidden md:inline">| Gestión de Gavetas</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 text-right mr-2">
              <div className="hidden sm:block"><span className="text-xs text-slate-500 mr-1">{t('total_general')}:</span> <b>{formatCurrency(grandTotalAll.toFixed ? grandTotalAll.toFixed(2) : grandTotalAll)}</b></div>
              <div className="text-xs sm:hidden"><b>{formatCurrency(grandTotalAll.toFixed ? grandTotalAll.toFixed(2) : grandTotalAll)}</b></div>
            </div>

            <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 hidden sm:block">
              {user?.nombre ? (
                <>
                  <b>{user.rol}</b> - {user.nombre}
                </>
              ) : (
                <>Rol: <b>{user.rol}</b></>
              )}
            </span>

            <select value={lang} onChange={(e) => { setLang(e.target.value); localStorage.setItem('inv_lang', e.target.value); }} className="text-xs rounded border px-2 py-1 bg-slate-900 dark:bg-slate-800">
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
            </select>

            <button
              onClick={toggleTheme}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-slate-700/50 dark:hover:bg-slate-700 dark:border-slate-700 text-xs sm:text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cambiar tema"
            >
              <span className="hidden sm:inline">Tema</span>
              <span className="sm:hidden">🌓</span>
            </button>
            <button
              onClick={onOpenPassword}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-slate-700/50 dark:hover:bg-slate-700 dark:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cambiar contraseña"
            >
              <FaCog />
            </button>
            <button
              onClick={onOpenPrestamos}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-slate-700/50 dark:hover:bg-slate-700 dark:border-slate-700 text-xs sm:text-sm min-h-[44px]"
            >
              {t('prestamos')}
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg border px-2 sm:px-3 py-1.5 hover:bg-slate-700/50 dark:hover:bg-slate-700 dark:border-slate-700 text-xs sm:text-sm min-h-[44px]"
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
    <tr onDoubleClick={() => onDoubleClick && onDoubleClick(item)} className="border-b border-slate-700 dark:border-slate-700 cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-600/50">
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
              title="Quitar unidades"
            >
              -
            </button>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-right">{formatCurrency(item.precio)}</td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-right">{formatCurrency((Number(item.precio || 0) * Number(item.cantidad || 0)).toFixed(2))}</td>
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
      ndp: '', articulo: '', equipo: '', gaveta: gavetas[0] || '', nivel: '', cantidad: 0, precio: 0, min: 0, max: 0, tde: 0, link: ''
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
          <label className="text-xs sm:text-sm block mb-1">{trLocal('part_number')}</label>
          <input className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.ndp} onChange={e => upd('ndp', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('item_label')}</label>
          <input className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.articulo} onChange={e => upd('articulo', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('equipment')}</label>
          <input className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.equipo} onChange={e => upd('equipo', e.target.value)} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('drawer_label')}</label>
          <input list="gavetas-list" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.gaveta} onChange={e => upd('gaveta', e.target.value)} required />
          <datalist id="gavetas-list">
            {gavetas.map(g => <option key={g} value={g}>{g}</option>)}
          </datalist>
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('level_label')}</label>
          <input type="number" min={1} className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.nivel} onChange={e => upd('nivel', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('quantity_label')}</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.cantidad} onChange={e => upd('cantidad', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('price_label')}</label>
          <input type="number" step="0.01" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.precio} onChange={e => upd('precio', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('min_label')}</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.min} onChange={e => upd('min', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('max_label')}</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.max} onChange={e => upd('max', Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="text-xs sm:text-sm block mb-1">{trLocal('tde_label')}</label>
          <input type="number" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={form.tde} onChange={e => upd('tde', Number(e.target.value))} min={0} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs sm:text-sm block mb-1">{trLocal('upload_image')}</label>
          <ImageUploader currentImage={form.link} onImageChange={handleImageChange} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2.5 dark:border-slate-700 text-sm min-h-[44px]">{trLocal('cancel')}</button>
        <button type="submit" className="rounded-lg bg-gray-900 text-white px-4 py-2.5 dark:bg-slate-800 dark:text-slate-100 text-sm min-h-[44px]">{trLocal('save')}</button>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-semibold mb-4">{trLocal('change_password')}</h3>
        <form onSubmit={handleChange} className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm mb-1">{trLocal('current_password')}</label>
            <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs sm:text-sm mb-1">{trLocal('new_password')}</label>
            <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={new1} onChange={e => setNew1(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs sm:text-sm mb-1">{trLocal('repeat_new_password')}</label>
            <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={new2} onChange={e => setNew2(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-xs sm:text-sm">{error}</div>}
          {success && <div className="text-green-600 text-xs sm:text-sm">{success}</div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 dark:border-slate-700 text-sm min-h-[44px]">{trLocal('cancel')}</button>
            <button type="submit" className="rounded-lg bg-blue-900 text-white px-4 py-2.5 dark:bg-blue-100 dark:text-blue-900 text-sm min-h-[44px]" disabled={loading}>{trLocal('save')}</button>
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
      <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-semibold mb-4">{label}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(password); }} className="space-y-3">
          <input type="password" className="w-full border rounded-lg px-2 sm:px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm" value={password} onChange={e => setPassword(e.target.value)} autoFocus required />
          {error && <div className="text-red-600 text-xs sm:text-sm">{error}</div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 dark:border-slate-700 text-sm min-h-[44px]">Cancelar</button>
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
      // Lookup employee info using the scanned badge
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-semibold mb-2">{trLocal('confirm_lend')}</h3>
            <div className="mb-4 p-2 bg-slate-800 dark:bg-slate-700 rounded text-sm">
              <p><b>{trLocal('item_label')}:</b> {item?.articulo}</p>
              <p><b>NDP:</b> {item?.ndp}</p>
              <p><b>{trLocal('quantity_label')} disponible:</b> {item?.cantidad}</p>
            </div>

            {employeeInfo ? (
              <form onSubmit={handleConfirm} className="space-y-3">
                <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm">
                  <p><b>{trLocal('usuario_label')}:</b> {employeeInfo.nombre}</p>
                  <p><b>N° {trLocal('usuario_label')}:</b> {employeeInfo.num_empleado}</p>
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">Cantidad a prestar</label>
                  <input
                    type="number"
                    min={1}
                    max={item?.cantidad || 1}
                    value={cantidad}
                    onChange={e => setCantidad(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm"
                    required
                  />
                  <div className="text-xs text-slate-400 mt-1">Máximo: {item?.cantidad || 1}</div>
                </div>
                {error && <div className="text-red-600 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</div>}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowScanner(true); setEmployeeInfo(null); setCantidad(1); setError(''); }}
                    className="rounded-lg border px-4 py-2.5 dark:border-slate-700 text-sm min-h-[44px]"
                  >
                    {trLocal('scan_another')}
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-purple-600 text-white px-4 py-2.5 dark:bg-purple-500 text-sm min-h-[44px]"
                    disabled={loading}
                  >
                    {loading ? trLocal('processing') : trLocal('confirm_lend')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400">
                {loading ? trLocal('processing') : trLocal('scan_badge')}
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-md bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-semibold mb-2">{trLocal('confirm_return')}</h3>

        <div className="mb-4 p-2 bg-slate-800 dark:bg-slate-700 rounded text-sm">
          <p><b>{trLocal('usuario_label')}:</b> {prestamo?.empleado}</p>
          <p><b>N° {trLocal('usuario_label')}:</b> {prestamo?.num_empleado}</p>
          <p><b>{trLocal('item_label')}:</b> {prestamo?.articulo}</p>
          <p><b>{trLocal('lend_item')} por:</b> {prestamo?.empleado1}</p>
          <p><b>Cantidad prestada:</b> {prestamo?.cantidad || 1}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1 font-medium">Cantidad a devolver</label>
            <input
              type="number"
              min={1}
              max={prestamo?.cantidad || 1}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-sm"
              required
            />
            <div className="text-xs text-slate-400 mt-1">Máximo: {prestamo?.cantidad || 1}</div>
          </div>

          {error && <div className="text-red-600 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</div>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 dark:border-slate-700 text-sm min-h-[44px]">{trLocal('cancel')}</button>
            <button type="submit" className="rounded-lg bg-green-600 text-white px-4 py-2.5 dark:bg-green-500 text-sm min-h-[44px]" disabled={loading}>
              {loading ? trLocal('processing') : trLocal('confirm_return')}
            </button>
          </div>
        </form>
      </div>
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
  const [activeGaveta, setActiveGaveta] = useState(null);
  const [serverGavetaTotals, setServerGavetaTotals] = useState([]);
  const [grandTotalAllState, setGrandTotalAllState] = useState(0);
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 dark:bg-slate-900 dark:text-slate-100">
        <Header 
        user={user} 
        onLogout={logout} 
        onOpenPassword={() => setShowPasswordModal(true)}
        onOpenPrestamos={() => setShowPrestamos(!showPrestamos)}
        lang={lang}
        setLang={setLang}
        grandTotalAll={grandTotalAllState}
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
          {trLocal('turno_prefix')} <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">{turno}</span>
        </div>
        {/* Gavetas */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto mb-3 pb-2">
          {gavetas.map((g) => {
            const tieneResultados = false; // Cambiar lógica si es necesario
            let btnClass = 'px-3 sm:px-4 py-2 rounded-full border dark:border-slate-700 transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap min-h-[44px] ';
            if (g === activeGaveta) {
              btnClass += 'bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-100';
            } else if (tieneResultados) {
              btnClass += 'bg-green-200 text-green-900 border-green-400 dark:bg-green-300 dark:text-green-900 dark:border-green-400 animate-pulse';
            } else {
              btnClass += 'bg-slate-800 text-slate-100 dark:bg-slate-800 dark:text-slate-100';
            }
            return (
              <button
                key={g}
                onClick={() => setActiveGaveta(g)}
                className={btnClass}
              >
                {trLocal('drawer_label')} {g}
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
                  <span className="hidden sm:inline">{trLocal('ver_historial')}</span>
                  <span className="sm:hidden">Historial</span>
                </button>
                <button
                  onClick={() => setModal({ mode: 'usuarios' })}
                  className="rounded-xl bg-green-900 text-white px-3 sm:px-4 py-2 dark:bg-green-400 dark:text-green-900 font-semibold border border-green-900 dark:border-green-400 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">{trLocal('administrar_usuarios')}</span>
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
                  <span className="hidden sm:inline">{trLocal('export_excel')}</span>
                  <span className="sm:hidden">Excel</span>
                </button>
                <button
                  onClick={() => setModal({ mode: 'add' })}
                  className="rounded-xl bg-gray-900 text-white px-3 sm:px-4 py-2 dark:bg-slate-800 dark:text-slate-100 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none"
                >
                  {trLocal('agregar')}
                </button>
              </>
            )}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={trLocal('search_placeholder')}
            className="w-full sm:w-72 rounded-xl border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 sm:ml-auto text-sm min-h-[44px]"
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
        {/* Totales por gaveta (server-provided). Show only the currently selected gaveta's total. */}
        <div className="mb-3">
          <div className="text-sm text-slate-300 dark:text-slate-300">
            <b>{trLocal('totals_by_gaveta')}</b>
            <div className="mt-2">
              {/* If there are no server totals at all */}
              {gavetaTotals.length === 0 ? (
                <div className="text-xs text-slate-500">Sin datos</div>
              ) : (
                // Show only the total for the active (selected) gaveta
                (() => {
                  if (activeGaveta === null || activeGaveta === undefined) {
                    return <div className="text-xs text-slate-500">{trLocal('select_gaveta')}</div>;
                  }
                  const sel = gavetaTotals.find(gt => String(gt.gaveta) === String(activeGaveta));
                  const val = Number(sel?.total || 0);
                  return (
                    <div className="text-xs">{trLocal('drawer_label')} {activeGaveta}: <b>{formatCurrency(val.toFixed(2))}</b></div>
                  );
                })()
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-700 dark:border-slate-700 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-700/50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('part_number')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('item_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden md:table-cell">{trLocal('equipment')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('drawer_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('level_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('quantity_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('price_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm">{trLocal('total_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden lg:table-cell">{trLocal('min_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden lg:table-cell">{trLocal('max_label')}</th>
                <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hidden xl:table-cell">{trLocal('tde_label')}</th>
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
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroArticulo}
                    onChange={(e) => setFiltroArticulo(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1 hidden md:table-cell">
                  <input
                    type="text"
                    value={filtroEquipo}
                    onChange={(e) => setFiltroEquipo(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroGaveta}
                    onChange={(e) => setFiltroGaveta(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1">
                  <input
                    type="text"
                    value={filtroNivel}
                    onChange={(e) => setFiltroNivel(e.target.value)}
                    placeholder="..."
                    className="w-full text-xs px-1 sm:px-2 py-1 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  />
                </th>
                <th className="px-1 sm:px-2 py-1"></th>
                <th className="px-1 sm:px-2 py-1"></th>
                <th className="px-1 sm:px-2 py-1 hidden lg:table-cell"></th>
                <th className="px-1 sm:px-2 py-1 hidden lg:table-cell"></th>
                <th className="px-1 sm:px-2 py-1 hidden xl:table-cell"></th>
                {canEdit(user?.rol) && <th className="px-1 sm:px-2 py-1"></th>}
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
          {loading && <div className="p-4 sm:p-6 text-center text-slate-500 text-sm">{trLocal('loading')}</div>}
          {!loading && Array.isArray(itemsFiltrados) && itemsFiltrados.length === 0 && <div className="p-4 sm:p-6 text-center text-slate-500 text-sm">{trLocal('no_results')}</div>}
        </div>
        <div className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {trLocal('total_label')}: <b>{total}</b> | {trLocal('showing_label')}: <b>{itemsFiltrados.length}</b>
        </div>
      </main>
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 border dark:border-slate-700 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold">
                {modal.mode === 'edit' ? 'Editar' : modal.mode === 'historial' ? 'Historial de acciones' : modal.mode === 'usuarios' ? 'Administrar usuarios' : 'Agregar ítem'}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-200 dark:hover:text-slate-200 text-2xl w-10 h-10 flex items-center justify-center min-h-[44px] min-w-[44px]">
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
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400">Equipo: {modal.item.equipo} — Gaveta: {modal.item.gaveta} — Nivel: {modal.item.nivel}</p>
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
                          className="max-h-60 sm:max-h-80 bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 rounded"
                          style={{display: 'none'}}
                        >
                          <span className="text-xs sm:text-sm p-4">{trLocal('error_loading_image')}</span>
                        </div>
                      </>
                    ) : (
                      <div className="max-h-60 sm:max-h-80 w-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 rounded p-8">
                        <span className="text-xs sm:text-sm">{trLocal('no_image')}</span>
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
      <QuantityPromptModal
        open={qtyPrompt.open}
        max={qtyPrompt.item?.cantidad || 1}
        onClose={() => setQtyPrompt({ open: false, item: null })}
        onSubmit={handleQtySubmit}
      />
      <PasswordPromptModal
        open={pwPrompt.open}
        onClose={() => { setPwPrompt({ open: false, action: null, context: null }); setPwError(''); setPwLoading(false); }}
        onSubmit={handlePwSubmit}
        label={pwPrompt.action === 'edit-item' ? trLocal('confirm_password_edit') :
          pwPrompt.action === 'delete-item' ? trLocal('confirm_password_delete') :
          pwPrompt.action === 'decrement-item' ? `Confirma tu contraseña para quitar ${pwPrompt.context?.cantidad || 1} unidad(es)${pwPrompt.context?.articulo ? ` (${pwPrompt.context.articulo})` : ''}` :
          pwPrompt.action === 'edit-user' ? trLocal('confirm_password_admin_edit') :
          pwPrompt.action === 'delete-user' ? trLocal('confirm_password_admin_delete') : trLocal('enter_password_confirm')}
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
