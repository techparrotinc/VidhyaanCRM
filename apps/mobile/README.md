# Vidhyaan Mobile (Expo / React Native)

One app, three journeys (parent / organization / Vidhyaan admin) — plan and
architecture in [docs/mobile-app-plan-2026.md](../../docs/mobile-app-plan-2026.md).
Standalone npm project on purpose: RN dependencies must never enter the root
(Vercel/Next) install. Shared zod contracts come from `packages/shared` via
metro `watchFolders` + tsconfig paths.

## First-time setup

```bash
cd apps/mobile
npm install
npx expo install --fix       # aligns native dep versions to the Expo SDK
```

Server side needs one env var in `.env.local` AND Vercel (≥32 chars):

```
MOBILE_JWT_SECRET=<openssl rand -hex 32>
```

Apply the device-sessions migration (review first):
`prisma/migrations/20260715000000_mobile_devices/` → `npx prisma migrate deploy`

## Daily dev loop

```bash
npm run dev                       # repo root — API on :3000
cd apps/mobile && npx expo start  # scan QR with Expo Go
```

Set the API base for your LAN: `EXPO_PUBLIC_API_URL=http://<mac-ip>:3000 npx expo start`
Dev OTP bypass: code `123456` (NODE_ENV=development only).

## Builds (EAS)

```bash
npm i -g eas-cli && eas login
eas init                             # sets extra.eas.projectId in app.json
eas build --profile preview --platform android   # shareable test APK
eas update --channel preview                     # OTA JS update, no rebuild
```

Fill `EXPO_PUBLIC_API_URL` in `eas.json` preview/production profiles with the
Vercel domain before the first preview build.

## Auth flow (matches wireframes v7)

login (phone) → otp → [picker if multi-role] → [2fa if org policy] → tokens.
Access JWT 15 min (memory only); rotating refresh token 30 d (SecureStore).
Every `/api/v1/*` route accepts `Authorization: Bearer <access>` — verified in
middleware, identity headers set from claims, `route()` composer unchanged.
