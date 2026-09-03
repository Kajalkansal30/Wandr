# Deploy Wandr on Render

Blueprint file: [`render.yaml`](./render.yaml)  
Creates: **wandr-db** (Postgres free) · **wandr-api** (Docker Spring Boot) · **wandr-web** (static Vite)

## Prerequisites

1. A [Render](https://render.com) account  
2. This project on **GitHub** (or GitLab / Bitbucket) — Render deploys from a git remote  
3. Free-tier notes: web service sleeps after ~15 min idle; free Postgres expires after **30 days**

## 1. Push to GitHub

If git is not set up yet:

```powershell
cd C:\Users\KajalKansal\Desktop\wandr
git init
git add .
git commit -m "Prepare Wandr for Render deploy"
```

Create an empty repo on GitHub (no README), then:

```powershell
git remote add origin https://github.com/YOUR_USER/wandr.git
git branch -M main
git push -u origin main
```

## 2. Deploy with Blueprint

1. Open [Render Dashboard → Blueprints](https://dashboard.render.com/blueprints)  
2. **New Blueprint Instance** → connect the `wandr` repo  
3. Confirm services from `render.yaml` → **Apply**  
4. Wait until `wandr-api` and `wandr-web` are live

URLs will look like:

- API: `https://wandr-api.onrender.com`  
- Web: `https://wandr-web.onrender.com`

## 3. After first deploy

1. Open `https://wandr-api.onrender.com/api/health` — expect OK (first request after sleep can take ~1 min)  
2. Open the static site — login with seeded demos:  
   - `user@wandr.test` / `owner@wandr.test` / `admin@wandr.test`  
   - password: `wandr123`  
3. If the browser blocks API calls, set **wandr-api → Environment → `WANDR_CORS_ORIGINS`** to your exact frontend URL, e.g.  
   `https://wandr-web.onrender.com,http://localhost:*,http://127.0.0.1:*`  
   then redeploy the API

`VITE_API_URL` is set at **build** time from the API hostname. If you rename the API service, clear the static site’s build cache and **redeploy wandr-web**.

## Manual deploy (no Blueprint)

**Postgres:** New → PostgreSQL → Free → copy Internal Database URL  

**API:** New → Web Service → Docker → root `backend` → Dockerfile  

| Env | Value |
|-----|--------|
| `DATABASE_URL` | From Postgres (Internal URL) |
| `WANDR_JWT_SECRET` | Long random string (32+ chars) |
| `WANDR_CORS_ORIGINS` | `https://YOUR-WEB.onrender.com,http://localhost:*` |
| `JPA_DDL_AUTO` | `update` |

**Frontend:** New → Static Site → build `npm ci && npm run build` → publish `dist`  

| Env | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com` |
| `NODE_VERSION` | `20` |

Add a rewrite rule: `/*` → `/index.html`

## Local vs production

| | Local | Render |
|--|--------|--------|
| API | `http://localhost:8080` | `https://wandr-api.onrender.com` |
| DB | `docker compose up -d` | Render Postgres |
| Frontend env | `.env` / unset → localhost | `VITE_API_URL` at build |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 502 / cold start | Wait 30–60s and retry `/api/health` |
| CORS errors | Set `WANDR_CORS_ORIGINS` to the exact web URL and redeploy API |
| Frontend calls localhost | Redeploy static site with `VITE_API_URL` set |
| DB connection refused | Use **Internal** Database URL on the API service; ensure `sslmode` (handled by the app for `postgres://` URLs) |
| Build fails on Docker | Confirm `backend/Dockerfile` and `pom.xml` are committed |
