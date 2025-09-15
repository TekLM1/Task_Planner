const express = require('express');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /tasks
 * - Supervisor: sieht alle Tasks
 * - User: sieht nur eigene Tasks
 * - Sortierung: neueste zuerst
 */
router.get('/', auth, async (req,res)=>{
  const isSup = req.user.role === 'supervisor';
  const filter = isSup ? {} : { user: req.user.sub };
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
});

/**
 * POST /tasks
 * - erstellt neuen Task
 * - automatisch mit User-ID des eingeloggten Users verknüpft
 */
router.post('/', auth, async (req,res)=>{
  const t = await Task.create({ ...req.body, user: req.user.sub });
  res.status(201).json(t);
});

/**
 * PATCH /tasks/:id
 * - aktualisiert bestehenden Task
 * - nur Owner oder Supervisor darf aendern
 */
router.patch('/:id', auth, async (req,res)=>{
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ error:'not found' });

  // Zugriff prüfen
  if (t.user.toString() !== req.user.sub && req.user.role !== 'supervisor') {
    return res.status(403).json({ error:'forbidden' });
  }

  Object.assign(t, req.body);
  await t.save();
  res.json(t);
});

/**
 * DELETE /tasks/:id
 * - löscht einen Task
 * - nur Owner oder Supervisor darf löschen
 */
router.delete('/:id', auth, async (req,res)=>{
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ error:'not found' });

  // Zugriff prüfen
  if (t.user.toString() !== req.user.sub && req.user.role !== 'supervisor') {
    return res.status(403).json({ error:'forbidden' });
  }

  await t.deleteOne();
  res.status(204).end();
});

module.exports = router;
