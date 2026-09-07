# Wandr

Place discovery app — cafés, food spots, and short “Spotted” videos.

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend | React 19 + Vite 8 + Tailwind 4 + React Router 7 |
| Backend | Spring Boot 3.4 (Java 17) REST API + JWT auth |
| Database | PostgreSQL (local Docker / Supabase in prod) |
| Media | Cloudinary (signed direct browser uploads) |
| Deploy | Render (`render.yaml`) — static web + Docker API (**Free** for now; upgrade to `1c-2g` for 24/7 — see [`DEPLOY.md`](DEPLOY.md)) |

```
Browser (React SPA)
  → HTTPS /api/* → Spring Boot (JWT, business logic, Cloudinary signing)
  → signed upload → Cloudinary (video/image binaries)
  → Postgres stores metadata + media URLs only
```

## Local development

```bash
# 1. Postgres
docker compose up -d

# 2. Backend (from backend/)
cp .env.example .env   # fill Cloudinary + optional DATABASE_URL
./mvnw spring-boot:run

# 3. Frontend (repo root)
cp .env.example .env
npm install
npm run dev
```

Demo accounts and API details: [`backend/README.md`](backend/README.md)  
Deploy guide: [`DEPLOY.md`](DEPLOY.md)  
Media / Cloudinary: [`docs/media-setup.md`](docs/media-setup.md)
