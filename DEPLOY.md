## Local vs production

| | Local | Production (current) |
|--|--------|------------|
| API | `localhost:8080` (`dev` profile) | Render Docker **Free** (`prod`), region **Oregon** — sleeps after ~15 min idle |
| Frontend | Vite | Render **static** site (free CDN) |
| DB | Docker Postgres (PostGIS) or H2 | Supabase Postgres (**ap-south-1 Mumbai** pooler) + Flyway |
| Media | Cloudinary | Cloudinary (browser → signed upload → Cloudinary) |
| Auth | 15m access + refresh cookie | Same; CORS locked to wandrhere.com |

Local backend also needs `CLOUDINARY_*` in `.env`. Frontend: copy `.env.example` → `.env`.

## Render billing model (current vs later)

| Service | Current | Later (24/7) |
|---------|---------|----------------|
| `wandr-api` | **Free** — spins down after idle; cold starts can exceed the 15s frontend timeout | Paid **`1c-2g`** always-on |
| `wandr-web` | Static (free CDN) | Same — no change |

Do **not** cron-ping Free to keep it awake. When real users need reliability, set in [`render.yaml`](render.yaml):

```yaml
plan: 1c-2g
# region: singapore   # only when recreating the service; existing Oregon Free stays Oregon until then
```

Then resize in the Render dashboard and redeploy.

## Region + database

- **Current API:** Oregon (matches live Free service + `render.yaml`).
- **Current DB:** Supabase Session pooler in **ap-south-1** (Mumbai) is fine for India users.
- **Later:** optionally recreate API in Singapore (or closer) for lower RTT; not required while on Free.

## DATABASE_URL — Supabase Session pooler (IPv4)

On Render set `DATABASE_URL` to the **Session pooler** URI from Supabase → **Connect** → Session mode.

- Use Session pooler (`.pooler.supabase.com`), **not** the direct `db.*.supabase.co` host if Render cannot reach IPv6-only endpoints.
- The app parses `DATABASE_URL` and adds `sslmode=require` automatically.
- Example shape: `postgresql://postgres.PROJECT:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

## Production security & ops

### Profiles
- Seed data: `SPRING_PROFILES_ACTIVE=dev` only (DataSeeder never runs in `prod`)
- Render: `SPRING_PROFILES_ACTIVE=prod` — strict CORS, required `WANDR_JWT_SECRET`, Flyway + `JPA_DDL_AUTO=validate`

### Extra API env
`RESEND_API_KEY`, `WANDR_EMAIL_FROM`, `WANDR_WEB_BASE_URL=https://www.wandrhere.com`, optional `SENTRY_DSN`, optional `SENTRY_ENVIRONMENT=prod`

### Frontend env
`VITE_API_URL`, `VITE_CLOUDINARY_*`, optional `VITE_SENTRY_DSN` (must redeploy static site after changing Vite env)

### Health checks
- `GET /api/health` — liveness (JVM up; no DB)
- `GET /api/ready` — readiness (DB `SELECT 1`); Render `healthCheckPath`
- On Free, external monitors that hit the API may wake a sleeping instance; prefer monitoring for alerts, not as a keep-alive hack

### Email
Without Resend key, verification/reset emails are logged to the API console. Set Resend in production.

### Secrets hygiene
If a project ZIP containing `.env` was ever shared, or a password appeared in a screenshot/chat, **rotate**: Cloudinary API secret, `WANDR_JWT_SECRET`, database password, Resend API key. Never commit `.env` / upload secrets to GitHub.

### Database backups (Supabase)
1. Supabase → **Database → Backups** (enable PITR if available)  
2. Test restore once into a scratch DB and confirm `users` / `places`  
3. Do not put real user data live until a restore has been tested  

### After first prod deploy
```sql
delete from users where email like '%@wandr.test';
```

Flyway migrations:
- `V1__security_accounts_reviews_notifications.sql`
- `V2__notifications_metadata_account.sql`
- `V3__discovery_indexes.sql` — places/reviews/boost discovery indexes
- `V4__analytics_retention_helpers.sql` — analytics retention support

### Promote a production admin
Signup never creates admins. In Supabase SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Then sign in and open `/admin` or Profile → **Command Center**.

Local `dev` profile seeds `admin@wandr.test` / `wandr123`.

### Notifications retention
```sql
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '180 days';
```

### Analytics retention
Raw `analytics_events` grow quickly. Prune or roll up regularly (e.g. keep raw 90 days):

```sql
DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
```

### Rate limiting note
In-memory rate limits work for **one** API instance. Before horizontal scale, move to Redis/shared limiting. Trust proxy client IP from Render only.

### Capacity ladder (after upgrading off Free)
Monitor `1c-2g` CPU/RAM → `2c-4g` if needed → Redis → second replica → load test.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API timeout / cold start | Expected on **Free** after idle. Upgrade to **`1c-2g`** for 24/7. Retries help a little; they do not remove sleep. |
| High latency from India | Free Oregon API + Mumbai DB is OK for demo. For lower RTT later: closer API region. |
| CORS errors | Prod CORS: `https://www.wandrhere.com,https://wandrhere.com` only |
| Sign returns 503 | Set all three `CLOUDINARY_*` on the API |
| DB connection fails | Session pooler URI (IPv4); app adds `sslmode=require` |
| `/api/ready` 503 | Check Supabase / Hikari / `DATABASE_URL` |
| 403 Email not verified | Open `/verify-email?token=…` from email |
| 429 | Auth/review rate limit — wait and retry |
| Blank site / asset 404 | Hard refresh; use `www.wandrhere.com` |
| Fake cafés in UI | Should not happen in prod builds — report as bug |
| Sentry empty | Set `SENTRY_DSN` on API + `VITE_SENTRY_DSN` on web, then redeploy both |
