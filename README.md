# Wandr

Place discovery app — cafés, food spots, and short “Spotted” videos.

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend (web) | React 19 + Vite 8 + Tailwind 4 + React Router 7 |
| Mobile | Expo (React Native) in [`mobile/`](mobile/) — same API |
| Backend | Spring Boot 3.4 (Java 17) REST API + JWT auth |
| Database | PostgreSQL (local Docker / Supabase in prod) |
| Media | Cloudinary (signed direct uploads) |
| Deploy | Render (`render.yaml`) — static web + Docker API (**Free** for now; upgrade to `1c-2g` for 24/7 — see [`DEPLOY.md`](DEPLOY.md)) |

```
Web (React SPA)  ─┐
iOS / Android    ─┼→ Spring Boot API → Postgres
                  └→ signed upload → Cloudinary
```

## Local development

```bash
# 1. Postgres
docker compose up -d

# 2. Backend (from backend/)
cp .env.example .env   # fill Cloudinary + optional DATABASE_URL
./mvnw spring-boot:run

# 3. Website (repo root)
cp .env.example .env
npm install
npm run dev

# 4. Mobile (optional — same API)
cd mobile
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://localhost:8080
npm install
npx expo start
```

Mobile details and EAS notes: [`mobile/README.md`](mobile/README.md)  
Demo accounts and API details: [`backend/README.md`](backend/README.md)  
Deploy guide: [`DEPLOY.md`](DEPLOY.md)  
Media / Cloudinary: [`docs/media-setup.md`](docs/media-setup.md)
