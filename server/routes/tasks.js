const express = require('express');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', auth, async (req,res)=>{
  const isSup = req.user.role==='supervisor';
  const filter = isSup ? {} : { user:req.user.sub };
  const tasks = await Task.find(filter).sort({createdAt:-1});
  res.json(tasks);
});

router.post('/', auth, async (req,res)=>{
  const t = await Task.create({...req.body, user:req.user.sub});
  res.status(201).json(t);
});

router.patch('/:id', auth, async (req,res)=>{
  const t = await Task.findById(req.params.id);
  if(!t) return res.status(404).json({error:'not found'});
  if(t.user.toString()!==req.user.sub && req.user.role!=='supervisor') 
    return res.status(403).json({error:'forbidden'});
  Object.assign(t, req.body);
  await t.save();
  res.json(t);
});

router.delete('/:id', auth, async (req,res)=>{
  const t = await Task.findById(req.params.id);
  if(!t) return res.status(404).json({error:'not found'});
  if(t.user.toString()!==req.user.sub && req.user.role!=='supervisor') 
    return res.status(403).json({error:'forbidden'});
  await t.deleteOne();
  res.status(204).end();
});

module.exports = router;
