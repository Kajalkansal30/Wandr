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
3. Prefer **direct** / **Session** mode URI for Hibernate/JPA (avoid Transaction pooler if connections fail)  
4. Copy URI (`postgresql://…` or `postgres://…`)

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

- API: `https://wandr-api.onrender.com`  
- Web: `https://wandr-web.onrender.com`

## 5. Custom domain

1. Render → **wandr-web** → Custom Domains → add `wandr.in` (or your domain)  
2. Render → **wandr-api** → Custom Domains → add `api.wandr.in`  
3. Point DNS as Render instructs (CNAME / A)  
4. Set `WANDR_CORS_ORIGINS` on the API to include `https://wandr.in` (and `https://www.wandr.in` if used)  
5. Set `VITE_API_URL=https://api.wandr.in` on the web service and **redeploy** so the build embeds the production API

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
| `WANDR_CORS_ORIGINS` | `https://YOUR-WEB,…` |
| `JPA_DDL_AUTO` | `update` |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
| `CLOUDINARY_API_KEY` | from Cloudinary |
| `CLOUDINARY_API_SECRET` | from Cloudinary (server only) |

**Web** — Static Site → `npm ci && npm run build` → `dist`

| Env | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-API` |
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
