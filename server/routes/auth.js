const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function setAuthCookie(res, user){
  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7*24*60*60*1000
  });
}

router.post('/register', async (req, res) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password) return res.status(400).json({error:'email, name, password noetig'});
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({error:'email belegt'});
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, passwordHash, role: role === 'supervisor' ? 'supervisor':'user' });
  setAuthCookie(res, user);
  res.status(201).json({ id:user._id, email:user.email, name:user.name, role:user.role });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({error:'login fehlgeschlagen'});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({error:'login fehlgeschlagen'});
  setAuthCookie(res, user);
  res.json({ id:user._id, email:user.email, name:user.name, role:user.role });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly:true, sameSite:'lax', secure: process.env.NODE_ENV==='production' });
  res.status(204).end();
});

router.get('/me', (req, res) => {
  try{
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({error:'unauthorized'});
    const p = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id:p.sub, email:p.email, name:p.name, role:p.role });
  }catch{
    res.status(401).json({error:'unauthorized'});
  }
});

module.exports = router;
