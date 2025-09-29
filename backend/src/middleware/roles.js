// Roles según tu esquema: 'admin' y 'operador'
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
    
    if (!flatAllowed.includes(req.user.rol)) {
      console.log('🛡️ Roles - Role not allowed:', req.user.rol, 'vs', flatAllowed);
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    console.log('🛡️ Roles - Access granted');
    next();
  };
}
