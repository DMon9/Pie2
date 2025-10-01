
exports.seed = async function(knex) {
  await knex('odds').del();
  await knex('bets').del();
  await knex('matches').del();

  const now = new Date();
  const addH = h => new Date(now.getTime() + h*3600*1000).toISOString();

  const [m1] = await knex('matches').insert({ sport:'NFL', home_team:'KC Chiefs', away_team:'LV Raiders', start_time:addH(24), status:'scheduled' }).returning('id');
  const [m2] = await knex('matches').insert({ sport:'CFB', home_team:'Georgia', away_team:'Alabama', start_time:addH(36), status:'scheduled' }).returning('id');
  const id1 = typeof m1==='object'? m1.id:m1;
  const id2 = typeof m2==='object'? m2.id:m2;

  await knex('odds').insert([
    { match_id:id1, market:'moneyline', odds_home:-135, odds_away:+115 },
    { match_id:id2, market:'moneyline', odds_home:-150, odds_away:+130 }
  ]);
};
