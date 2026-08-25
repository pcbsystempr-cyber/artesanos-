// ============================================================
//  Utilidades de autenticación (JWT + bcrypt)
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion';

// Genera un token firmado con el rol del usuario
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Middleware: verifica token y lo decodifica en req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware: requiere rol de administrador
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
}

// Middleware: requiere rol de artesano o admin
function requireArtisan(req, res, next) {
  if (req.user.role !== 'artisan' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para artesanos' });
  }
  next();
}

module.exports = { bcrypt, signToken, authenticate, requireAdmin, requireArtisan, JWT_SECRET };
