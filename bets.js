
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../jwt');
const router = express.Router();

router.post('/', requireAuth, async (req,res)=>{
  const { match_id, selection, wager_dollars } = req.body;
  if(!['home','away','draw'].includes(selection)) return res.status(400).json({ error: 'Bad selection' });
  const wager_cents = Math.round(Number(wager_dollars) * 100);
  if(!wager_cents || wager_cents < 50) return res.status(400).json({ error: 'Minimum $0.50' });

  const match = await db('matches').where({ id: match_id }).first();
  if(!match) return res.status(404).json({ error: 'Match not found' });
  if(['finished','locked'].includes(match.status)) return res.status(400).json({ error: 'Match not open for betting' });

  const oddsRow = await db('odds').where({ match_id }).orderBy('updated_at','desc').first();
  if(!oddsRow) return res.status(400).json({ error: 'No odds for match' });
  const odds_at_bet = selection === 'home' ? oddsRow.odds_home : selection === 'away' ? oddsRow.odds_away : (oddsRow.draw_odds || 0);

  const user = await db('users').where({ id: req.user.id }).first();
  if(!user) return res.status(404).json({ error: 'User not found' });
  if((user.balance_cents || 0) < wager_cents) return res.status(400).json({ error: 'Insufficient balance' });

  await db.transaction(async trx => {
    await trx('users').where({ id: user.id }).update({ balance_cents: (user.balance_cents||0) - wager_cents });
    const [idObj] = await trx('bets').insert({
      user_id: user.id, match_id, market: 'moneyline', selection, wager_cents, odds_at_bet, status: 'pending'
    }).returning('id');
    const id = typeof idObj === 'object' ? idObj.id : idObj;
    await trx('transactions').insert({ user_id: user.id, type: 'bet', amount_cents: -wager_cents, meta: JSON.stringify({ bet_id: id, match_id }) });
    const bet = await trx('bets').where({ id }).first();
    res.json({ bet });
  });
});

router.get('/my', requireAuth, async (req,res)=>{
  const rows = await db('bets').where({ user_id: req.user.id }).orderBy('created_at','desc');
  res.json(rows);
});

module.exports = router;
