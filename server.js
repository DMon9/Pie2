
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('./passport');

const auth = require('./routes/auth');
const users = require('./routes/users');
const matches = require('./routes/matches');
const odds = require('./routes/odds');
const bets = require('./routes/bets');
const payments = require('./routes/payments');

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: [FRONTEND_URL], credentials: true }));

// Stripe webhook must be raw body, mount first:
app.use('/payments', payments);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  name: 'pi2.sid',
  secret: process.env.JWT_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/auth', auth);
app.use('/api/users', users);
app.use('/api/matches', matches);
app.use('/api/odds', odds);
app.use('/api/bets', bets);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pi2 backend listening on :${PORT}`));
