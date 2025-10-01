
# Pi2 Sports Backend (Full)

Scripts:
- npm run migrate
- npm run seed
- npm start

Routes:
- GET /api/ping
- Auth: GET /auth/google -> redirects to FRONTEND_URL/auth/success#token=...
- Users: GET /api/users/me, GET /api/users/transactions
- Matches: GET /api/matches, POST /api/matches (admin), PUT /api/matches/:id (admin), POST /api/matches/:id/settle (admin, auto-grade)
- Odds: GET /api/odds/:matchId, POST /api/odds (admin)
- Bets: POST /api/bets, GET /api/bets/my
- Stripe: POST /payments/create-checkout-session, POST /payments/webhook

Render:
- Build: npm ci
- Start: npm start
- Env: Add vars from .env.example
