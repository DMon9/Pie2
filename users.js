
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../jwt');
const router = express.Router();

router.get('/me', requireAuth, async (req,res)=>{
  const user = await db('users').select('id','email','name','role','balance_cents').where({ id: req.user.id }).first();
  res.json(user || null);
});

router.get('/transactions', requireAuth, async (req,res)=>{
  const rows = await db('transactions').where({ user_id: req.user.id }).orderBy('created_at','desc').limit(200);
  res.json(rows);
});

module.exports = router;
