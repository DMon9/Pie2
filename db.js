
const knex = require('knex');
const cfg = require('../knexfile.js');
const db = knex(cfg);
module.exports = db;
