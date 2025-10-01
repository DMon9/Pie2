
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../jwt');
const { settleMatch } = require('../lib/settlement');
const router = express.Router();

router.get('/', async (_req,res)=>{
  const rows = await db('matches').select('*').orderBy('start_time','asc');
  res.json(rows);
});

router.post('/', requireAuth, requireAdmin, async (req,res)=>{
  const { sport='NFL', home_team, away_team, start_time, status='scheduled' } = req.body;
  const [idObj] = await db('matches').insert({ sport, home_team, away_team, start_time, status }).returning('id');
  const id = typeof idObj === 'object' ? idObj.id : idObj;
  const m = await db('matches').where({ id }).first();
  res.json(m);
});

router.put('/:id', requireAuth, requireAdmin, async (req,res)=>{
  const { id } = req.params;
  await db('matches').where({ id }).update({ ...req.body, updated_at: db.fn.now() });
  const m = await db('matches').where({ id }).first();
  res.json(m);
});

router.post('/:id/settle', requireAuth, requireAdmin, async (req,res)=>{
  const { id } = req.params;
  const { home_score, away_score } = req.body;
  await db('matches').where({ id }).update({ status: 'finished', home_score, away_score, updated_at: db.fn.now() });
  try {
    const result = await settleMatch(id);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
