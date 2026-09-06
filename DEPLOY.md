## Local vs production

| | Local | Production |
|--|--------|------------|
| API | `localhost:8080` (`dev` profile) | Render Docker (`prod`) |
| DB | Docker Postgres or H2 | Supabase + Flyway |
| Media | Cloudinary | Cloudinary |
| Auth | 15m access + refresh cookie | Same; CORS locked to wandrhere.com |
| Frontend | Vite | Render static + custom domain |

Local backend also needs `CLOUDINARY_*` in `.env`. Frontend: copy `.env.example` → `.env`.

## Production security & ops

### Profiles
- Seed data: `SPRING_PROFILES_ACTIVE=dev` only (DataSeeder never runs in `prod`)
- Render: `SPRING_PROFILES_ACTIVE=prod` — strict CORS, required `WANDR_JWT_SECRET`, Flyway + `JPA_DDL_AUTO=validate`

### Extra API env
`RESEND_API_KEY`, `WANDR_EMAIL_FROM`, `WANDR_WEB_BASE_URL=https://www.wandrhere.com`, optional `SENTRY_DSN`

### Email
Without Resend key, verification/reset emails are logged to the API console. Set Resend in production.

### Database backups (Supabase)
1. Supabase → **Database → Backups** (enable PITR if available)  
2. Test restore once into a scratch DB and confirm `users` / `places`  
3. Do not put real user data live until a restore has been tested  

### After first prod deploy
```sql
delete from users where email like '%@wandr.test';
```

Flyway `V1__security_accounts_reviews_notifications.sql` adds verification, refresh tokens, notifications, review uniqueness.
Flyway `V2__notifications_metadata_account.sql` adds notification deep-link fields, idempotency, and nullable review authors for account deletion.

### Promote a production admin
Signup never creates admins. In Supabase SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Then sign in and open `/admin` or Profile → **Command Center**.

Local `dev` profile seeds `admin@wandr.test` / `wandr123`.

### Notifications retention
In-app notifications can accumulate. Periodically prune old rows (e.g. older than 180 days) when volume grows:

```sql
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '180 days';
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 502 / cold start | Wait 30–60s; free Render sleeps when idle |
| CORS errors | Prod CORS: `https://www.wandrhere.com,https://wandrhere.com` only |
| Sign returns 503 | Set all three `CLOUDINARY_*` on the API |
| DB connection fails | Supabase Session URI; app adds `sslmode=require` |
| 403 Email not verified | Open `/verify-email?token=…` from email |
| 429 | Auth/review rate limit — wait and retry |
| Blank site / asset 404 | Hard refresh; use `www.wandrhere.com` |
