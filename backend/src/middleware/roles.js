// Roles hierarchy
const ROLES = {
  SUPER_ADMIN: ['The Goat'],                    // Nivel más alto - acceso total
  HIGH_ADMIN: ['Administrador', 'Ingeniero'],   // Administradores - acceso total
  OPERATOR: ['Operador', 'Tecnico'],            // Operadores - pueden editar
  GUEST: ['Invitado']                           // Solo lectura
};

// Helper to check if role has edit permissions
function canEdit(rol) {
  // The Goat, Administrador, Ingeniero, Operador, Tecnico pueden editar
  return [...ROLES.SUPER_ADMIN, ...ROLES.HIGH_ADMIN, ...ROLES.OPERATOR].includes(rol);
}

// Helper to check if role has admin permissions
function canAdminister(rol) {
  // The Goat, Administrador, Ingeniero pueden administrar
  return [...ROLES.SUPER_ADMIN, ...ROLES.HIGH_ADMIN].includes(rol);
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
    
    // Check against role shortcuts
    let hasPermission = false;
    for (const allowedRole of flatAllowed) {
      if (allowedRole === 'admin' && canAdminister(req.user.rol)) {
        hasPermission = true;
        break;
      } else if (allowedRole === 'operador' && canEdit(req.user.rol)) {
        hasPermission = true;
        break;
      } else if (flatAllowed.includes(req.user.rol)) {
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
