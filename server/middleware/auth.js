const jwt = require('jsonwebtoken');

function auth(req, res, next){
  let token = req.cookies?.token;
  const h = req.headers.authorization;
  if (!token && h && h.startsWith('Bearer ')) token = h.slice(7);

  if (!token) return res.status(401).json({error:'unauthorized'});
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  }catch{
    res.status(401).json({error:'invalid_token'});
  }
}

function requireSupervisor(req,res,next){
  if(req.user?.role==='supervisor') return next();
  res.status(403).json({error:'forbidden'});
}
module.exports = { auth, requireSupervisor };
