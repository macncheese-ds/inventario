// Roles según tu esquema: 'admin' y 'operador'
export function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!allowed.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    next();
  };
}
