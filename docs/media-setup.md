# Wandr media setup (Cloudinary)

## What Cloudinary does

Stores Spotted videos (and later images). Postgres only keeps `url` and `thumbnail_url`.

Login stays on **Spring Boot JWT**. Do not enable Firebase Auth or Supabase Auth/Storage.

## Upload flow

1. Logged-in React calls `POST /api/media/cloudinary-sign` with Bearer JWT  
2. Spring returns `cloudName`, `apiKey`, `timestamp`, `signature`, `folder` (`spotted/{userId}`), `publicId`  
3. Browser uploads the file **directly** to Cloudinary (`/video/upload`)  
4. React gets `secure_url`, builds a thumbnail transform URL  
5. React calls `POST /api/spotted` with `{ placeId, url, thumbnailUrl, caption, spotKind }`  
6. Spring saves metadata in Postgres (Supabase in production)

Large videos never pass through the Render API process.

## Console steps

1. Create a Cloudinary account / product environment  
2. Copy **Cloud name**, **API Key**, **API Secret**  
3. Backend env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`  
4. Frontend `.env`: `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_API_KEY`  
5. Restart Vite and the Spring API  

Optional dashboard limits: max video ~50 MB under `spotted/`, images ~10 MB under `places/`.

Sign endpoint: `POST /api/media/cloudinary-sign?purpose=spotted|place-cover`

## Local test

1. Sign in to Wandr  
2. Spotted → Create a Spot → upload a small MP4  
3. Confirm the asset appears under Cloudinary Media Library in `spotted/{userId}/`  
4. Confirm the spot row in Postgres has https URLs only  

## Add a video to the DB (production)

**Preferred:** Spotted → **+ Spot** (needs Cloudinary env vars above). File goes to Cloudinary; API stores `url` + `thumbnail_url` in `place_media` as `APPROVED`.

**Manual SQL** (Supabase / Postgres) — only if you already have a public https MP4:

```sql
INSERT INTO place_media (
  place_id, user_id, url, thumbnail_url, media_type, spot_kind, caption,
  duration_sec, like_count, source, status, created_at
) VALUES (
  2,                    -- existing place id
  1,                    -- your user id (optional)
  'https://YOUR-CLOUDINARY-OR-CDN/video.mp4',
  'https://YOUR-THUMB.jpg',
  'VIDEO',
  'AMBIENCE',
  'Short caption for Spotted',
  12,
  0,
  'COMMUNITY',
  'APPROVED',
  NOW()
);
```

Do **not** use Google `gtv-videos-bucket` sample URLs — they often return **403** and Spotted falls back to the café photo.

## Security notes

- API **secret** never ships in the Vite bundle  
- Unsigned public upload presets are **not** used; Spring signs each upload after JWT check  
- Spot create requires `https://` URLs  
