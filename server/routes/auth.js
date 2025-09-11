const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { auth, requireSupervisor } = require('../middleware/auth');

function setCookie(res, user){
  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET, { expiresIn: '7d' }
  );
  res.cookie('token', token, { httpOnly:true, sameSite:'lax', secure:false, maxAge:7*24*60*60*1000 });
}

router.post('/register', async (req,res)=>{
  const {email,name,password,role} = req.body;
  if(!email||!name||!password) return res.status(400).json({error:'fields missing'});
  if(await User.findOne({email})) return res.status(409).json({error:'email exists'});
  const hash = await bcrypt.hash(password,12);
  const user = await User.create({email,name,passwordHash:hash,role:role==='supervisor'?'supervisor':'user'});
  setCookie(res,user);
  res.status(201).json({id:user._id,email:user.email,name:user.name,role:user.role});
});

router.post('/login', async (req,res)=>{
  const {email,password}=req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(401).json({error:'login failed'});
  const ok = await bcrypt.compare(password,user.passwordHash);
  if(!ok) return res.status(401).json({error:'login failed'});
  setCookie(res,user);
  res.json({id:user._id,email:user.email,name:user.name,role:user.role});
});

router.post('/logout',(req,res)=>{
  res.clearCookie('token');
  res.status(204).end();
});

router.get('/me',(req,res)=>{
  try{
    const p = jwt.verify(req.cookies?.token, process.env.JWT_SECRET);
    res.json(p);
  }catch{ res.status(401).json({error:'unauthorized'}); }
});

router.get('/users', auth, requireSupervisor, async (req, res) => {
  const users = await User.find({}, { _id:1, email:1, name:1, role:1 }).sort({ name: 1 });
  res.json(users.map(u => ({ id: u._id, email: u.email, name: u.name, role: u.role })));
});

module.exports = router;
