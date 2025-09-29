import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authenticateToken(req, res, next) {
  console.log('🔐 Auth - Headers:', req.headers.authorization ? 'Token present' : 'No token');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('🔐 Auth - No token provided');
    return res.status(401).json({ message: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('🔐 Auth - Token verification failed:', err.message);
      return res.status(403).json({ message: 'Token inválido' });
    }
    
    console.log('🔐 Auth - User authenticated:', user.username, 'Role:', user.rol);
    req.user = user;
    next();
  });
}
