# Wandr Backend (Spring Boot + PostgreSQL)

Local API for Wandr. No Flutter yet — React frontend can call this later.

## Prerequisites
- Java 17+
- Docker Desktop (for PostgreSQL)

## 1. Start database (preferred)
Start **Docker Desktop**, then from project root (`wandr/`):

```bash
docker compose up -d
```

Postgres: `localhost:5432`  
DB / user / password: `wandr` / `wandr` / `wandr`

### Or run without Docker (temporary)
```bash
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```
Uses in-memory H2 (data resets when you stop the server).

## 2. Start API
```bash
cd backend
./mvnw spring-boot:run
```

Windows:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

API: http://localhost:8080

## Demo accounts (seeded on first run)
| Role  | Email             | Password  |
|-------|-------------------|-----------|
| USER  | user@wandr.test   | wandr123  |
| OWNER | owner@wandr.test  | wandr123  |
| ADMIN | admin@wandr.test  | wandr123  |

## Useful endpoints
```
GET  /api/health
GET  /api/places
GET  /api/places/{id}
POST /api/auth/login     { "email", "password" }
POST /api/auth/signup    { "email", "password", "displayName", "role" }
GET  /api/favorites      (Bearer token)
POST /api/favorites/{placeId}/toggle
POST /api/analytics/events   { "eventType", "placeId?", "source?", "sessionId?", "metadata?" }
GET  /api/owner/analytics?days=30&placeId=
GET  /api/owner/boosts
POST /api/owner/boosts       { "placeId", "targetRadiusKm", "audiences", "budgetInr", "durationDays", "headline?" }
GET  /api/admin/places?status=PENDING
POST /api/admin/places/{id}/approve
POST /api/admin/places/{id}/reject
```

Analytics events are collected now (place_view, save_place, direction_click, boost_impression, etc.). Owner **Business Hub** charts aggregate them. **Boost** creates clearly labeled Sponsored slots (never buys verification). Restart the API after pull so new tables are created (`ddl-auto: update`).


### Login example
```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@wandr.test\",\"password\":\"wandr123\"}"
```

Use the returned `token` as: `Authorization: Bearer <token>`
