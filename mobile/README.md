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

Email verification links expire in **24 hours**. Logged-in users can **Resend verification** (`POST /api/auth/resend-verification`) from Profile / Verify / 403 write-action prompts.

Deep links: `wandr://verify-email?token=` and `wandr://reset-password?token=` (plus https://www.wandrhere.com/... when the OS opens the app).

## Spotted (Reels-style)

- **Video only**, 30s max (camera, gallery, backend)
- **Record**: Spotted tab → Record (front/back flip) or Gallery
- **Publish**: place + caption → signed Cloudinary upload → `POST /api/spotted`
- Pending moderation shows **Submitted for review**
- Report from the feed

## App structure

| Area | Routes |
|------|--------|
| Tabs | Home, Map, Spotted, Saved, Profile |
| Auth | login, signup, forgot, reset-password, verify, change-password, delete-account |
| Places | place detail, submit, lists, what's new |
| Spotted | vertical feed, `record-spot`, `create-spot` |
| Owner | places, edit (+ cover), analytics, create boost, claims / request verification |

Admin moderation stays on the website (`/admin`).

## Push notifications (Phase 5)

1. Run `eas build:configure` so `app.json` → `extra.eas.projectId` is a real UUID (not the placeholder).
2. After login, the app calls `registerForPushNotificationsAsync()` and `POST /api/notifications/push-token`.
3. Tokens are stored in `push_device_tokens` (Flyway `V5`). Sending Expo push on claim/review/moderation can be wired from the API using those rows.

Push registration no-ops on simulators, Expo Go without a projectId, or when permission is denied.

## Real-device QA checklist (Phase 6)

Use an **EAS development build** (or device + LAN API), not only Expo Go:

- [ ] Cold start against production/staging API (timeouts OK)
- [ ] Location denied: Map shows banner (not silent Delhi without notice); Enable location works
- [ ] Camera + mic for Spotted record; gallery rejects >30s video
- [ ] Verify email deep link + resend after expiry
- [ ] Reset password deep link
- [ ] Report place + Spotted
- [ ] Owner cover upload, create boost, request verification
- [ ] Sign out / logout-all / delete account

## EAS / stores (Phase 7)

```bash
npm i -g eas-cli
eas login
eas build:configure   # writes real projectId into app.json — do not invent one
# Production env: EXPO_PUBLIC_API_URL=https://api.wandrhere.com
eas build --profile development   # device QA
eas build --profile preview       # internal APK
eas build --profile production    # AAB + iOS for stores
eas submit --platform ios
eas submit --platform android
```

See [eas.json](./eas.json).

**Google Maps API key:** not required for Expo Go / iOS Apple Maps. Add Android Maps key in `app.json` only if Play production needs Google Maps provider.

**Placeholder:** `extra.eas.projectId` stays `replace-with-eas-project-id` until you run `eas build:configure`.
