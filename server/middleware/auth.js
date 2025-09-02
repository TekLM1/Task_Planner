const jwt = require('jsonwebtoken');

function auth(req, res, next){
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({error:'unauthorized'});
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  }catch{
    return res.status(401).json({error:'invalid_token'});
  }
}

function requireSupervisor(req, res, next){
  if (req.user?.role === 'supervisor') return next();
  return res.status(403).json({error:'forbidden'});
}

module.exports = { auth, requireSupervisor };
