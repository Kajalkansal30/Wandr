# Deploy Wandr on Render + Neon

Blueprint: [`render.yaml`](./render.yaml)  
Creates: **wandr-api** (Docker Spring Boot) · **wandr-web** (static Vite)  
Database: **[Neon](https://neon.tech)** Postgres (recommended over Render free DB)

## Why Neon?

| | Neon | Render free Postgres |
|--|------|----------------------|
| Lifetime | Free project stays up (usage limits) | Expires every **30 days** |
| Fits Spring Boot | Yes — standard Postgres JDBC | Yes |
| Setup | Create project → paste `DATABASE_URL` | Bundled in Blueprint |

Use Neon’s **direct** connection string (`ep-….neon.tech`), not the `-pooler` host, so Hibernate/JPA works cleanly.

## Prerequisites

1. [Neon](https://console.neon.tech) account + project  
2. [Render](https://render.com) account  
3. Repo: [Kajalkansal30/Wandr](https://github.com/Kajalkansal30/Wandr)

## 1. Create Neon database

1. Neon Console → **New Project** (region close to Render, e.g. US West / Oregon if available)  
2. Open **Connection details** → copy the URI (starts with `postgresql://…`)  
3. Choose **direct** connection (host without `-pooler`)

## 2. Push (if not already)

```powershell
cd C:\Users\KajalKansal\Desktop\wandr
git push -u origin main
```

## 3. Deploy Blueprint on Render

1. [Render → Blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**  
2. Connect **Kajalkansal30/Wandr** → Apply  
3. When prompted for `DATABASE_URL` on **wandr-api**, paste the Neon URI  
4. Wait until API + static site are live

URLs (typical):

- API: `https://wandr-api.onrender.com`  
- Web: `https://wandr-web.onrender.com`

## 4. After first deploy

1. Hit `https://wandr-api.onrender.com/api/health` (cold start can take ~1 min)  
2. Open the web app — demos: `user@` / `owner@` / `admin@wandr.test` · password `wandr123`  
3. If CORS fails, set `WANDR_CORS_ORIGINS` on the API to your exact web URL and redeploy

## Manual deploy

**API** — Web Service → Docker → `backend` / Dockerfile  

| Env | Value |
|-----|--------|
| `DATABASE_URL` | Neon direct URI |
| `WANDR_JWT_SECRET` | Long random string (32+) |
| `WANDR_CORS_ORIGINS` | `https://YOUR-WEB.onrender.com,http://localhost:*` |
| `JPA_DDL_AUTO` | `update` |

**Web** — Static Site → `npm ci && npm run build` → `dist` · `VITE_API_URL=https://YOUR-API.onrender.com` · rewrite `/*` → `/index.html`

## Local vs production

| | Local | Production |
|--|--------|------------|
| API | `localhost:8080` | Render free web service |
| DB | `docker compose` Postgres | Neon |
| Frontend | Vite / unset → localhost | `VITE_API_URL` at build |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 502 / cold start | Wait 30–60s; free Render sleeps when idle |
| CORS errors | Set exact `WANDR_CORS_ORIGINS`, redeploy API |
| DB SSL / auth errors | Use Neon **direct** URI; app adds `sslmode=require` for `postgres://` URLs |
| Pooler weirdness | Switch off `-pooler` host |
| Frontend hits localhost | Redeploy static site with `VITE_API_URL` set |
