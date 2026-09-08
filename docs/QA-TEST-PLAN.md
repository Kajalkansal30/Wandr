# Wandr QA test plan — Web + Expo

Use this as the full checklist before “other testing” (EAS store builds, real SMS, load, etc.).  
Mark each item **Pass / Fail / N/A** and note environment (local / staging / prod).

**Shared API:** Web and Expo must hit the **same** backend + Postgres.

---

## 0. Pre-flight (both platforms)

### Environment

| Check | How | Pass? |
|-------|-----|-------|
| Backend running | Health / login works | |
| Postgres + Flyway up | App starts; migrations applied (incl. V5 push tokens, V6 claims) | |
| `CLOUDINARY_*` set on API | See §0.1 | |
| Web `.env` | `VITE_API_URL`, `VITE_CLOUDINARY_*` | |
| Mobile `.env` | `EXPO_PUBLIC_API_URL` (device LAN IP if physical phone) | |
| SMS | Default `wandr.sms.provider=log` → OTP in **server logs** (OK for QA) | |
| Admin user | Account with role `ADMIN` | |
| Test users | Unverified user + verified user + owner-capable verified user | |

### 0.1 Cloudinary smoke

Logged in, call:

`POST /api/media/cloudinary-sign?purpose=claim-evidence`  
(and `claim-document`, `spotted`, `place-cover`)

| Result | Meaning |
|--------|---------|
| 200 + signature | Ready for uploads |
| 503 “not configured” | Fix backend `CLOUDINARY_*` and restart |
| 401 | Login first |

### Suggested test order

1. Auth & account (web, then phone)  
2. Browse / search / map / lists  
3. Add place ≠ claim  
4. Claim & verification (phone OTP core path)  
5. Owner re-verify + boosts  
6. Spotted  
7. Admin moderation + Activity board  
8. Notifications / push (mobile)  
9. Security & rate limits  

---

## 1. Auth & account

### 1.1 Web

| # | Case | Steps | Expect |
|---|------|-------|--------|
| W-A1 | Signup | New email → signup | Account created; verification email sent; can browse |
| W-A2 | Verify email | Open link / paste token on `/verify-email` | Email verified; writes unlocked |
| W-A3 | Expired link | Use token older than 24h | Error; Resend works |
| W-A4 | Resend | Unverified → Resend verification | New email; old token invalid after new send (if applicable) |
| W-A5 | Login | Correct credentials | Session; profile shows user |
| W-A6 | Bad login | Wrong password | Error; no session |
| W-A7 | Forgot / reset | Forgot password → email → `/reset-password` | Password updates; can login |
| W-A8 | Change password | Profile → change password | Success; optional logout-all behavior |
| W-A9 | Logout | Logout | Session cleared |
| W-A10 | Refresh / reload | Refresh while logged in | Still logged in (cookie/session) |
| W-A11 | Unverified gates | Unverified tries review / claim / submit / spot | 403 + verify messaging / redirect to verify |

### 1.2 Expo

| # | Case | Steps | Expect |
|---|------|-------|--------|
| M-A1 | Signup | Signup screen | Same as web via API |
| M-A2 | Verify | Profile banner / `/verify` + deep link `wandr://verify-email?token=` | Verified |
| M-A3 | Resend | Profile / verify → Resend | New mail; works after 24h expiry too |
| M-A4 | Login | Login | JWT in SecureStore |
| M-A5 | Cold start | Kill app → reopen | Still logged in |
| M-A6 | Forgot / reset | Forgot → email → reset screen / deep link | Password reset |
| M-A7 | Change password | Profile → change password | Success |
| M-A8 | Delete account | Delete account flow | Account gone; cannot login |
| M-A9 | Logout | Logout | Tokens cleared |
| M-A10 | Unverified write | Review / claim / spot / submit while unverified | Alert → Verify / Resend |

---

## 2. Browse, discover, profile (parity)

### 2.1 Web

| # | Case | Expect |
|---|------|--------|
| W-B1 | Home feed / categories / search | Results load; filters work |
| W-B2 | Map explore | Places on map; open detail |
| W-B3 | Place detail | Name, address, media, reviews, ownership badge |
| W-B4 | Save / favorite | Toggle save; shows in profile/saved |
| W-B5 | Reviews | Verified user can post; unverified blocked |
| W-B6 | Curated lists | `/lists`, list detail |
| W-B7 | What’s new | Page loads |
| W-B8 | Share / directions / call | Links or events fire (no crash) |
| W-B9 | Confirm place info | Looks correct / needs update |

### 2.2 Expo

| # | Case | Expect |
|---|------|--------|
| M-B1 | Home tab | Feed loads |
| M-B2 | Map tab | Location allowed → map; denied → clear empty/denied UX |
| M-B3 | Place detail | Same core info as web |
| M-B4 | Saved tab | Favorites list |
| M-B5 | Reviews on place | Submit + list |
| M-B6 | Lists / What’s new | Screens open |
| M-B7 | Report place | Report reasons submit |
| M-B8 | Notifications screen | Opens; list or empty state |

---

## 3. Add place ≠ claim

### 3.1 Web — `/submit`

| # | Case | Expect |
|---|------|--------|
| W-S1 | Copy on form | States community listing, **not** ownership |
| W-S2 | Unverified submit | Blocked / verify required |
| W-S3 | Verified submit | Success; pending review; **not** owner |
| W-S4 | Place detail after approve | Shows **Community Added · Not claimed** (or equivalent) until claimed |

### 3.2 Expo — Submit place

| # | Case | Expect |
|---|------|--------|
| M-S1 | Intro copy | Add ≠ claim disclaimer on form |
| M-S2 | Unverified | Verify gate |
| M-S3 | Verified success | “Community listing — owner can claim later” |
| M-S4 | Does not auto-claim | Ownership still unclaimed |

---

## 4. Claim & business verification

**Prep listings:**

- Unclaimed place **with phone** (phone OTP path)  
- Unclaimed place **with website** you control (DNS / business email)  
- Unclaimed place **without** phone/website (only video/docs)  
- Already **OWNER_VERIFIED** place (access request / dispute)  
- Your own **OWNER_CLAIMED** place needing verification  

**OTP:** with `wandr.sms.provider=log`, read code from **API server logs**.

### 4.1 Web — claim happy paths

| # | Case | Steps | Expect |
|---|------|-------|--------|
| W-C1 | Role picker | Claim → Owner / Manager / Rep | Continues |
| W-C2 | Phone OTP | Send OTP → enter log code | Low-risk → **auto-approved** → Verified business |
| W-C3 | Refresh after approve | Reload place | `OWNER_VERIFIED` / verified badge |
| W-C4 | Methods UX | No phone on listing | Phone method **hidden**; video/docs still shown |
| W-C5 | Domain DNS | Start DNS → add TXT → Check DNS | Auto or admin queue |
| W-C6 | Business email link | Start email → open `/claim-verify?token=&claimId=` | Verifies (login if needed) |
| W-C7 | Business email paste | Paste token in panel | Verifies |
| W-C8 | Video upload | Upload file or paste Cloudinary URL | Queued admin; appears Admin → Claims |
| W-C9 | Document upload | Upload image/PDF or URL | Same as video |
| W-C10 | Resume claim | Start claim → refresh page | Panel auto-opens / resumes same claim (no duplicate) |
| W-C11 | Verify gate | Unverified starts claim | Redirect / verify-email |
| W-C12 | Access request | Other user on managed place | Request access / dispute CTAs (not for owner) |
| W-C13 | Owner upgrade | Own listing not fully verified | Complete verification wizard |
| W-C14 | Dashboard deep-link | Owner dashboard “needs verification” | Opens place with methods |

### 4.2 Expo — claim

| # | Case | Expect |
|---|------|--------|
| M-C1 | Unclaimed → Claim panel | Role → methods |
| M-C2 | Phone OTP | Same as web (OTP in logs) → auto-approve |
| M-C3 | Domain + host shown | After Start DNS, host + TXT visible |
| M-C4 | Business email UI | Send + paste token |
| M-C5 | `wandr://claim-verify` | Deep link verifies (logged in) |
| M-C6 | Video / document picker | Upload → admin queue |
| M-C7 | Resume | Leave place → return | Resumes pending claim |
| M-C8 | Ownership CTAs | Own listing → upgrade only; stranger → access request; not both wrongly |
| M-C9 | Owner Claims → Open place | `?upgrade=1` opens verification wizard |
| M-C10 | Verify gate on claim | Unverified → Verify / Resend alert |

### 4.3 Admin claim moderation (web only)

| # | Case | Expect |
|---|------|--------|
| W-CA1 | Claims queue | Risk, method, evidence media links |
| W-CA2 | Approve video/doc claim | Place becomes verified; competing pending closed |
| W-CA3 | Request info | Claimant → NEED_INFO |
| W-CA4 | Reject | Claim rejected; place not stolen |
| W-CA5 | Non-admin | `/api/admin/**` → 403 |

---

## 5. Owner: re-verify, boosts, analytics

### 5.1 Web

| # | Case | Expect |
|---|------|--------|
| W-O1 | Material edit | Change phone/address/name as verified owner → needs re-verification |
| W-O2 | Boost blocked | Create boost while re-verify needed → fails with clear error |
| W-O3 | Re-verify then boost | Complete verification → boost allowed |
| W-O4 | Owner analytics | Dashboard Analytics: views/funnel (needs traffic) |
| W-O5 | Cover / media | Owner can manage listing media if exposed |

### 5.2 Expo

| # | Case | Expect |
|---|------|--------|
| M-O1 | Owner hub | Business / analytics / boosts / claims / edit |
| M-O2 | Edit listing | Save changes; re-verify flag if material |
| M-O3 | Boosts | Blocked when re-verify needed |
| M-O4 | Request verification | Creates upgrade claim → methods on place |

---

## 6. Spotted

### 6.1 Web

| # | Case | Expect |
|---|------|--------|
| W-SP1 | Feed | Spots load / empty state |
| W-SP2 | Create (if UI) | Video rules honored |
| W-SP3 | Report | Report submits |
| W-SP4 | Unverified create | Blocked |

### 6.2 Expo (primary Spotted UX)

| # | Case | Expect |
|---|------|--------|
| M-SP1 | Feed | Vertical / list plays |
| M-SP2 | Record | Camera ≤ 30s; front/back |
| M-SP3 | Gallery | Video only; rejects overlong if enforced |
| M-SP4 | Publish | Place + caption → Cloudinary → pending review |
| M-SP5 | Pending state | “Submitted for review” |
| M-SP6 | Report | Works from feed |
| M-SP7 | Like / open place | No crash |
| M-SP8 | Admin approve media | Appears in public feed after approve |

---

## 7. Admin Command Center (web)

| # | Case | Expect |
|---|------|--------|
| W-AD1 | Stats strip | Live / pending / claims / users counts |
| W-AD2 | Listings | Approve / reject / request info / suspend queues |
| W-AD3 | Claims | See §4.3 |
| W-AD4 | Media | Approve / reject pending media |
| W-AD5 | **Activity** | Logins, signups, DAU, newest users, event types |
| W-AD6 | Activity after login | Sign in as test user → Activity shows **login** row |
| W-AD7 | Activity after signup | New signup → **signup** row |
| W-AD8 | Audit | Moderation actions listed |
| W-AD9 | Non-admin UI | No access to `/admin` |

---

## 8. Notifications & push

| # | Platform | Case | Expect |
|---|----------|------|--------|
| N1 | Web | In-app notifications (login, claim, password) | Visible where UI exists |
| N2 | Expo | Notifications screen | Lists or empty |
| N3 | Expo | Push token register | After login + permission, token stored (DB `push_device_tokens` / V5) |
| N4 | Both | Claim need-info / approve | Claimant notified (in-app; push if wired) |

---

## 9. Security & abuse (both → API)

| # | Case | Expect |
|---|------|--------|
| X1 | Login hammer | Rate limit → 429 |
| X2 | Resend verification hammer | 429 |
| X3 | Claim OTP start hammer | 429 |
| X4 | Claim OTP verify bad codes | Lock after 5 → request new OTP |
| X5 | Business email bad tokens | Lock after 5 |
| X6 | JWT required | Protected routes without token → 401 |
| X7 | Admin-only | User JWT cannot approve claims |
| X8 | Mobile SecureStore | Tokens not in plain AsyncStorage for access JWT |

---

## 10. Cross-platform parity matrix

| Feature | Web | Expo | Notes |
|---------|-----|------|-------|
| Signup / login / verify / resend | ✅ | ✅ | |
| Forgot / reset password | ✅ | ✅ | Deep links on mobile |
| Change password / delete | ✅ / check UI | ✅ | |
| Browse / map / save / review | ✅ | ✅ | |
| Submit community place | ✅ | ✅ | |
| Claim phone / DNS / email / video / docs | ✅ | ✅ | OTP via logs in QA |
| Claim resume | ✅ | ✅ | |
| Claim-verify deep link | `/claim-verify` | `wandr://claim-verify` | |
| Access request / dispute | ✅ | ✅ | Ownership-aware |
| Owner upgrade / boosts / analytics | ✅ | ✅ (lighter analytics) | |
| Admin moderation | ✅ | N/A | Use web |
| Admin Activity board | ✅ | N/A | Use web |
| Spotted create | Limited / check | ✅ primary | Video ≤30s |
| Push notifications | N/A / web push? | Token register | Real push = EAS later |

---

## 11. Known QA caveats (not failures)

| Item | Reality |
|------|---------|
| Phone OTP delivery | Logs only unless SMS provider configured |
| Login Activity history | Only events **after** Activity feature deploy |
| Claim email in browser | Web `/claim-verify`; app scheme needs app installed |
| Rate limits | Per-instance memory; reset on API restart |
| Cloudinary | Required for video/doc/Spotted/cover uploads |
| Universal Links | Optional polish; scheme + web URL cover QA |

---

## 12. Sign-off template

**Environment:** _______________  
**Build / commit:** _______________  
**Tester:** _______________  
**Date:** _______________  

| Track | Status | Blockers |
|-------|--------|----------|
| Auth web | | |
| Auth Expo | | |
| Discover web | | |
| Discover Expo | | |
| Submit / claim web | | |
| Claim Expo | | |
| Owner | | |
| Spotted | | |
| Admin + Activity | | |
| Security smoke | | |

**Ready for next testing track?**  
☐ EAS device / store builds ☐ Real SMS ☐ Load / multi-instance ☐ App Store / Play listing ☐ Other: ________

---

## Quick smoke (30–40 min)

If time is short, run only this:

1. Signup → verify → login (web + Expo)  
2. Submit place (verified) — not owner  
3. Claim with **phone OTP** (web + Expo) → auto-approve  
4. Second user: access request on managed place  
5. Upload claim video → Admin approve  
6. Owner edit phone → boost blocked → re-verify  
7. Spotted record + publish (Expo)  
8. Admin **Activity** shows recent login  
9. Unverified user blocked from claim/review  

When that passes, move on to EAS / SMS / store testing with confidence the product surface works.
