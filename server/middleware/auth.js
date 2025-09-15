const jwt = require('jsonwebtoken');

/**
 * Auth-Middleware
 * - prüft ob ein JWT vorhanden ist (Cookie oder Authorization-Header)
 * - validiert das Token mit dem Secret
 * - hängt payload (Userdaten) an req.user
 */
function auth(req, res, next) {
  // Token zuerst aus Cookies holen
  let token = req.cookies?.token;

  // Falls nicht vorhanden: aus Header ziehen (Bearer <token>)
  const h = req.headers.authorization;
  if (!token && h && h.startsWith('Bearer ')) token = h.slice(7);

  // Kein Token -> 401 Unauthorized
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  try {
    // Token prüfen
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // Userinfo für weitere Middleware/Handler
    next();
  } catch {
    // Fehlerhaftes/abgelaufenes Token
    res.status(401).json({ error: 'invalid_token' });
  }
}

/**
 * Middleware für Supervisor-Only Endpoints
 * - erlaubt Zugriff nur, wenn User Rolle "supervisor" hat
 */
function requireSupervisor(req, res, next) {
  if (req.user?.role === 'supervisor') return next();
  res.status(403).json({ error: 'forbidden' });
}

module.exports = { auth, requireSupervisor };
