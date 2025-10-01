
const db = require('../db');

function americanToMultiplier(odds){
  const o = Number(odds);
  if(o > 0) return 1 + (o/100);
  if(o < 0) return 1 + (100/Math.abs(o));
  return 1;
}

async function settleMatch(matchId){
  const match = await db('matches').where({ id: matchId }).first();
  if(!match) throw new Error('Match not found');
  if(match.status !== 'finished') throw new Error('Match is not finished');

  let winner = 'draw';
  if(match.home_score > match.away_score) winner = 'home';
  else if(match.away_score > match.home_score) winner = 'away';

  const bets = await db('bets').where({ match_id: matchId, status: 'pending' });

  for(const bet of bets){
    if(bet.selection === winner){
      const multiplier = americanToMultiplier(bet.odds_at_bet);
      const payout = Math.round(bet.wager_cents * multiplier);
      await db.transaction(async trx => {
        const user = await trx('users').where({ id: bet.user_id }).first();
        await trx('users').where({ id: user.id }).update({ balance_cents: (user.balance_cents||0) + payout });
        await trx('transactions').insert({ user_id: user.id, type: 'payout', amount_cents: payout, meta: JSON.stringify({ bet_id: bet.id, match_id: matchId }) });
        await trx('bets').where({ id: bet.id }).update({ status: 'won', settled_at: trx.fn.now(), potential_payout_cents: payout });
      });
    } else {
      await db('bets').where({ id: bet.id }).update({ status: 'lost', settled_at: db.fn.now() });
    }
  }
  return { settled: bets.length, winner };
}

module.exports = { settleMatch, americanToMultiplier };
