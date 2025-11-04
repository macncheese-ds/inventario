// Roles hierarchy (kept for backward reference)
const ROLES = {
  SUPER_ADMIN: ['The Goat'],                    // Nivel más alto - acceso total
  HIGH_ADMIN: ['Administrador', 'Ingeniero'],   // Administradores - acceso total
  OPERATOR: ['Operador', 'Tecnico'],            // legacy grouping
  GUEST: ['Invitado']                           // Solo lectura
};

// Authoritative role groups as requested:
// - FULL_ACCESS: The Goat, Ingeniero, Administrador
// - TOOL_ROOM: Tool Room (can edit tool-room related things)
// - VIEW_ONLY: Calidad, Soporte, Lider, Operador, Invitado, Recursos Humanos
const ROLE_GROUPS = {
  FULL_ACCESS: ['The Goat', 'Ingeniero', 'Administrador'],
  TOOL_ROOM: ['Tool Room'],
  VIEW_ONLY: ['Calidad', 'Soporte', 'Lider', 'Operador', 'Invitado', 'Recursos Humanos']
};

// Normaliza un role para comparaciones: trim + lowercase
function normalizeRole(r) {
  if (!r && r !== 0) return '';
  return String(r).trim().toLowerCase();
}

// Helper to check if role has edit permissions
function canEdit(rol) {
  // Full access and Tool Room can edit; VIEW_ONLY cannot.
  const normalized = normalizeRole(rol);
  const full = ROLE_GROUPS.FULL_ACCESS.map(normalizeRole);
  const tool = ROLE_GROUPS.TOOL_ROOM.map(normalizeRole);
  return full.includes(normalized) || tool.includes(normalized);
}

// Helper to check if role has admin permissions
function canAdminister(rol) {
  // Only FULL_ACCESS can administer
  const normalized = normalizeRole(rol);
  const adminRoles = ROLE_GROUPS.FULL_ACCESS.map(normalizeRole);
  return adminRoles.includes(normalized);
}

export function authorizeRoles(...allowed) {
  return (req, res, next) => {
    // Aplanar el array en caso de que venga anidado
    const flatAllowed = allowed.flat();
    
    console.log('🛡️ Roles - User:', req.user?.username, 'Role:', req.user?.rol);
    console.log('🛡️ Roles - Allowed roles:', flatAllowed);
    
    if (!req.user) {
      console.log('🛡️ Roles - No user in request');
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    // Check against role shortcuts and normalize comparisons
    const userRoleNorm = normalizeRole(req.user.rol);
    let hasPermission = false;
    for (const allowedRoleRaw of flatAllowed) {
      const allowedRole = String(allowedRoleRaw || '').trim().toLowerCase();

      // 'admin' shortcut => only FULL_ACCESS
      if (allowedRole === 'admin' && canAdminister(req.user.rol)) {
        hasPermission = true;
        break;
      }

      // 'toolroom' or 'tool' shortcut => Tool Room or Full Access
      if ((allowedRole === 'toolroom' || allowedRole === 'tool') && (canEdit(req.user.rol) || canAdminister(req.user.rol))) {
        hasPermission = true;
        break;
      }

      // 'view' shortcut => any role that has at least view permission (full, tool, or view-only)
      if (allowedRole === 'view') {
        const isViewer = ROLE_GROUPS.FULL_ACCESS.map(normalizeRole).includes(userRoleNorm)
          || ROLE_GROUPS.TOOL_ROOM.map(normalizeRole).includes(userRoleNorm)
          || ROLE_GROUPS.VIEW_ONLY.map(normalizeRole).includes(userRoleNorm);
        if (isViewer) {
          hasPermission = true;
          break;
        }
      }

      // literal role match after normalization
      if (allowedRole === userRoleNorm) {
        hasPermission = true;
        break;
      }
    }
    
    if (!hasPermission) {
      console.log('🛡️ Roles - Role not allowed:', req.user.rol, 'vs', flatAllowed);
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    console.log('🛡️ Roles - Access granted');
    next();
  };
}

// Export helpers and groups for reuse
export { ROLE_GROUPS, canEdit, canAdminister, normalizeRole };
