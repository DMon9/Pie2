
exports.up = async function(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('google_id').unique();
    t.string('email').unique();
    t.string('name');
    t.string('picture');
    t.string('role').defaultTo('user');
    t.integer('balance_cents').defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('matches', (t) => {
    t.increments('id').primary();
    t.string('sport').notNullable();
    t.string('home_team').notNullable();
    t.string('away_team').notNullable();
    t.timestamp('start_time').notNullable();
    t.string('status').defaultTo('scheduled');
    t.integer('home_score');
    t.integer('away_score');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('odds', (t) => {
    t.increments('id').primary();
    t.integer('match_id').references('id').inTable('matches').onDelete('CASCADE');
    t.string('market').defaultTo('moneyline');
    t.integer('odds_home').notNullable();
    t.integer('odds_away').notNullable();
    t.integer('draw_odds');
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('bets', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.integer('match_id').references('id').inTable('matches').onDelete('CASCADE');
    t.string('market').defaultTo('moneyline');
    t.string('selection').notNullable();
    t.integer('wager_cents').notNullable();
    t.integer('odds_at_bet').notNullable();
    t.integer('potential_payout_cents');
    t.string('status').defaultTo('pending');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('settled_at');
  });

  await knex.schema.createTable('transactions', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('type').notNullable();
    t.integer('amount_cents').notNullable();
    t.jsonb('meta');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('bets');
  await knex.schema.dropTableIfExists('odds');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('users');
};
