
const express = require('express');
const Stripe = require('stripe');
const { requireAuth } = require('../jwt');
const db = require('../db');
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', requireAuth, async (req,res)=>{
  try {
    const dollars = Number(req.body.amount || 0);
    const amount = Math.max(1, Math.round(dollars * 100));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: 'Pi2 Deposit' }, unit_amount: amount },
        quantity: 1
      }],
      metadata: { userId: String(req.user.id), email: req.user.email },
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/?deposit=success`,
      cancel_url: `${process.env.FRONTEND_URL}/?deposit=cancelled`
    });
    res.json({ url: session.url });
  } catch (e) { console.error(e); res.status(500).json({ error: 'stripe_failed' }); }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req,res)=>{
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature']; let event;
  try {
    if(process.env.STRIPE_WEBHOOK_SECRET) event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    else event = JSON.parse(req.body.toString());
  } catch (err) { console.error('Webhook signature error', err.message); return res.status(400).send(`Webhook Error: ${err.message}`); }
  if(event.type === 'checkout.session.completed'){
    const s = event.data.object;
    const email = s.customer_details?.email || s.metadata?.email;
    const amount = s.amount_total || 0;
    if(email && amount > 0){
      const user = await db('users').whereRaw('lower(email)=lower(?)', [email]).first();
      if(user){
        await db.transaction(async trx => {
          await trx('users').where({ id: user.id }).update({ balance_cents: (user.balance_cents||0) + amount });
          await trx('transactions').insert({ user_id: user.id, type: 'deposit', amount_cents: amount, meta: JSON.stringify({ stripe_session: s.id }) });
        });
      }
    }
  }
  res.json({ received: true });
});

module.exports = router;
