# Wandr mobile (Expo)

Native iOS/Android client for the **same** Spring Boot API as the website. No second backend or database.

## Setup

```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL:
#   Local API (simulator):     http://localhost:8080
#   Android emulator:          http://10.0.2.2:8080  (auto-rewritten from localhost)
#   Physical device on LAN:    http://YOUR_LAN_IP:8080
#   Production:                https://api.wandrhere.com
npm install
npx expo start
```

Requires the API running (`backend/`) with the same Postgres/Supabase as web.

## Auth

Access JWT is stored in Secure Store and sent as `Authorization: Bearer …`.
Refresh tokens are also stored securely and sent via `X-Refresh-Token` / JSON body on `/api/auth/refresh` and logout (web still uses HttpOnly cookies).

## Spotted (Reels-style)

- **Record**: Spotted tab → Record (front/back flip, 30s max) or Gallery
- **Publish**: choose place + caption → signed Cloudinary upload → `POST /api/spotted`
- **Feed**: vertical full-screen paging with autoplay + like

No video binaries in Postgres — only Cloudinary URLs via the existing Spring API.

## App structure

| Area | Routes |
|------|--------|
| Tabs | Home, Map, Spotted, Saved, Profile |
| Auth | login, signup, forgot, verify |
| Places | place detail + reviews, submit community place |
| Spotted | vertical feed, `record-spot`, `create-spot` |
| Owner | places, edit, analytics, boosts, claims |

Admin moderation stays on the website (`/admin`).

## EAS builds (when ready for TestFlight / Play)

```bash
npm i -g eas-cli
eas login
eas build:configure   # replaces placeholder projectId in app.json
eas build --platform all
```

See [eas.json](./eas.json). Store credentials and Apple/Google accounts are required for store builds; Expo Go is enough for local API development.
