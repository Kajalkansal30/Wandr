# Deploy Wandr on Render + Supabase + Cloudinary

Blueprint: [`render.yaml`](./render.yaml)  
Creates: **wandr-api** (Docker Spring Boot) · **wandr-web** (static Vite)  
Database: **[Supabase](https://supabase.com)** Postgres (JDBC only — no Supabase Auth/Storage)  
Media: **[Cloudinary](https://cloudinary.com)** (signed browser uploads)

## Architecture

| Layer | Service | Responsibility |
|-------|---------|----------------|
| Frontend | Render static | UI, Cloudinary upload |
| Backend | Render Docker | JWT auth, business logic, Cloudinary **sign** |
| Database | Supabase Postgres | Users, places, `place_media` **URLs only** |
| Media | Cloudinary | Video/image binaries |
| Auth | Spring JWT | Do not enable Firebase Auth or Supabase Auth |

Media binaries never go in Postgres — only `url` / `thumbnail_url` strings in `place_media`.

## Prerequisites

1. [Supabase](https://supabase.com/dashboard) project  
2. [Cloudinary](https://cloudinary.com/console) account  
3. [Render](https://render.com) account  
4. Repo: [Kajalkansal30/Wandr](https://github.com/Kajalkansal30/Wandr)

## 1. Create Supabase database

1. Supabase → **New project** (region close to Render, e.g. West US)  
2. **Project Settings → Database → Connection string**  
3. For **Render**, use **Session pooler** (IPv4). Direct `db.<ref>.supabase.co` often fails from Render with Hibernate “Unable to determine Dialect…”  
4. Mode: **Session** · copy URI (`postgresql://postgres.<ref>:PASSWORD@aws-0-….pooler.supabase.com:5432/postgres`)  
5. Paste that full URI into Render **wandr-api** → `DATABASE_URL` (no quotes)  
6. After a successful API boot, Supabase **Table Editor** shows `users`, `places`, etc. (created by Hibernate `ddl-auto=update` + seeder)

## 2. Configure Cloudinary

1. Cloudinary Console → copy **Cloud name**, **API Key**, **API Secret**  
2. Signed uploads are used (Spring signs; browser uploads direct to Cloudinary)  
3. Optional: set upload limits (max ~50MB, video) in the dashboard  

See [`docs/media-setup.md`](./docs/media-setup.md) for the upload flow.

## 3. Push (if not already)

```powershell
cd C:\Users\KajalKansal\Desktop\wandr
git push -u origin main
```

## 4. Deploy Blueprint on Render

1. [Render → Blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**  
2. Connect **Kajalkansal30/Wandr** → Apply  
3. Set env on **wandr-api**:
   - `DATABASE_URL` = Supabase URI  
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`  
4. Set env on **wandr-web** (build-time):
   - `VITE_API_URL` = your API URL  
   - `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_API_KEY`  
5. Wait until API + static site are live

URLs (typical):

- API: `https://api.wandrhere.com` (also `https://wandr-api-d59o.onrender.com`)  
- Web: `https://www.wandrhere.com` (also `https://wandr-web.onrender.com`)

## 5. Custom domain (`wandrhere.com` on Namecheap)

Keep **Namecheap BasicDNS** (do not switch to Custom DNS). Edit **Advanced DNS → HOST RECORDS**.

| Type | Host | Value |
|------|------|--------|
| CNAME | `www` | `wandr-web.onrender.com.` |
| CNAME | `api` | `wandr-api-d59o.onrender.com.` |
| URL Redirect (optional) | `@` | `https://www.wandrhere.com` (apex → www) |

Then on Render:

1. **wandr-web** → Custom Domains → add `www.wandrhere.com` (wait until Verified + Certificate Issued)  
2. **wandr-api** → Custom Domains → add `api.wandrhere.com`  
3. Apex `wandrhere.com` may stay “Waiting for DNS” if you use URL Redirect instead of A `216.24.57.1` — that is OK while redirecting to www  
4. **wandr-api** env:  
   `WANDR_CORS_ORIGINS=https://www.wandrhere.com,https://wandrhere.com,http://localhost:*,http://127.0.0.1:*`  
   Also set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`  
5. **wandr-web** env:  
   `VITE_API_URL=https://api.wandrhere.com`  
   + `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_API_KEY`  
6. **Manual Deploy** both services (web must rebuild so Vite bakes the API URL)  
7. Verify: https://www.wandrhere.com · https://api.wandrhere.com/api/health  

Production URLs: **https://www.wandrhere.com** (site) · **https://api.wandrhere.com** (API)

## 6. After first deploy

1. Hit `https://YOUR-API/api/health` (cold start can take ~1 min)  
2. Open the web app — demos: `user@` / `owner@` / `admin@wandr.test` · password `wandr123`  
3. If CORS fails, set exact `WANDR_CORS_ORIGINS` and redeploy  
4. Create a Spot with a small MP4 to verify Cloudinary + sign endpoint

## Manual deploy

**API** — Web Service → Docker → `backend` / Dockerfile  

| Env | Value |
|-----|--------|
| `DATABASE_URL` | Supabase Postgres URI |
| `WANDR_JWT_SECRET` | Long random string (32+) |
| `WANDR_CORS_ORIGINS` | `https://www.wandrhere.com,https://wandrhere.com,…` |
| `JPA_DDL_AUTO` | `update` |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
| `CLOUDINARY_API_KEY` | from Cloudinary |
| `CLOUDINARY_API_SECRET` | from Cloudinary (server only) |

**Web** — Static Site → `npm ci && npm run build` → `dist`

| Env | Value |
|-----|--------|
| `VITE_API_URL` | `https://api.wandrhere.com` |
| `VITE_CLOUDINARY_CLOUD_NAME` | from Cloudinary |
| `VITE_CLOUDINARY_API_KEY` | from Cloudinary (public) |
| rewrite | `/*` → `/index.html` |

## Local vs production

| | Local | Production |
|--|--------|------------|
| API | `localhost:8080` | Render Docker |
| DB | `docker compose` Postgres | Supabase |
| Media | Cloudinary (same cloud) | Cloudinary |
| Frontend | Vite | Render static + custom domain |

Local backend also needs `CLOUDINARY_*` in the environment (or a backend `.env` loaded by your process manager). Frontend: copy `.env.example` → `.env`.

## Migrating from Neon

If you already have Neon data: `pg_dump` from Neon → restore into Supabase, then point Render `DATABASE_URL` at Supabase. Empty Supabase is fine for a fresh start — Hibernate `ddl-auto=update` creates tables.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 502 / cold start | Wait 30–60s; free Render sleeps when idle |
| CORS errors | Set exact `WANDR_CORS_ORIGINS`, redeploy API |
| Sign returns 503 | Set all three `CLOUDINARY_*` on the API |
| Upload fails signature | Confirm API secret matches; clock skew rare |
| DB connection fails | Use Supabase Session/direct URI, enable SSL (`sslmode=require` is added by the app for `DATABASE_URL`) |
