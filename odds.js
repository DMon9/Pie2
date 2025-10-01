
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../jwt');
const router = express.Router();

router.get('/:matchId', async (req,res)=>{
  const row = await db('odds').where({ match_id: req.params.matchId }).orderBy('updated_at','desc').first();
  res.json(row || null);
});

router.post('/', requireAuth, requireAdmin, async (req,res)=>{
  const { match_id, market='moneyline', odds_home, odds_away, draw_odds=null } = req.body;
  const [idObj] = await db('odds').insert({ match_id, market, odds_home, odds_away, draw_odds }).returning('id');
  const id = typeof idObj === 'object' ? idObj.id : idObj;
  const row = await db('odds').where({ id }).first();
  res.json(row);
});

module.exports = router;
