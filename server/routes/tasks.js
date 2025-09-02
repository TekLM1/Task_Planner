const express = require('express');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Alle: user sieht nur eigene Tasks; supervisor kann optional ?userId=... filtern oder alle sehen
router.get('/', auth, async (req, res) => {
  const isSup = req.user.role === 'supervisor';
  const filter = isSup && req.query.userId ? { user: req.query.userId } : isSup ? {} : { user: req.user.id };
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
});

router.post('/', auth, async (req, res) => {
  const t = await Task.create({
    user: req.user.id,
    title: req.body.title || 'Neuer Task',
    description: req.body.description || '',
    effortMin: req.body.effortMin || 0,
    assignee: req.body.assignee || '',
    auditor: req.body.auditor || '',
    status: req.body.status || 'offen',
    comments: Array.isArray(req.body.comments) ? req.body.comments : []
  });
  res.status(201).json(t);
});

router.patch('/:id', auth, async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({error:'not_found'});
  const isOwner = t.user.toString() === req.user.id;
  const isSup = req.user.role === 'supervisor';
  if (!isOwner && !isSup) return res.status(403).json({error:'forbidden'});

  const fields = ['title','description','effortMin','assignee','auditor','status','comments'];
  for (const k of fields){
    if (req.body[k] !== undefined) t[k] = req.body[k];
  }
  await t.save();
  res.json(t);
});

router.delete('/:id', auth, async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({error:'not_found'});
  const isOwner = t.user.toString() === req.user.id;
  const isSup = req.user.role === 'supervisor';
  if (!isOwner && !isSup) return res.status(403).json({error:'forbidden'});
  await t.deleteOne();
  res.status(204).end();
});

module.exports = router;
