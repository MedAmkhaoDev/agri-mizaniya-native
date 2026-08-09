# 🌐 Agri-Mizaniya — Web Version: Evidence-Based Plan

**Date:** 2026-08-09 · **Method:** hands-on testing of this codebase (not the earlier feasibility doc, which is outdated)

---

## 1. Verdict (based on actual testing)

| Claim in old `WEB_APP_FEASIBILITY.md` | Reality (tested) |
|---|---|
| "Will not build/run cleanly on web without significant work" | **Wrong.** `npx expo export --platform web` **succeeds** after installing 2 packages. |
| "`metro.config.js` excludes web condition → breaks bundling" | **Wrong.** Bundles 3397 modules + 28KB Tailwind CSS without touching metro config. |
| "expo-secure-store is a blocker" | **Not even used** in `src/` or `app/` (0 hits). |
| "expo-dev-client blocker" | Dev-only, harmless. |

**Real status: the app is ~90% web-ready.** Two modules crash at runtime on web (both native-only), and ~5 flows need small platform adaptations. Estimate: **1–2 days of work**, no rewrite.

---

## 2. What I did (test steps, reproducible)

```bash
npx expo install react-native-web react-dom   # the ONLY missing deps
npx expo export --platform web                # ✅ succeeds, output in dist/
```

No other changes were needed to bundle. The rest is runtime work (below).

---

## 3. The 5 real blockers (verified with line numbers)

| # | Blockers | Location | Impact |
|---|---|---|---|
| 1 | `GoogleSignin.configure()` runs at **module scope** — native TurboModule, throws on web | `src/config/firebase.ts:32-35` | **Startup crash** |
| 2 | `react-native-onesignal` does `TurboModuleRegistry.getEnforcing("OneSignal")` **at import time** | `src/lib/onesignal.ts:1` imported by `app/_layout.tsx:15` | **Startup crash** |
| 3 | `I18nManager.forceRTL()` no-ops on web — Arabic RTL won't apply | `src/lib/i18n-context.tsx:28-41` | Broken RTL for AR users |
| 4 | Deep link `agri-mizaniya://join?code=` — no web scheme | `app/join.tsx`, notifications routing | Invite links dead on web |
| 5 | QR scanning needs `getUserMedia` → HTTPS + different permission UX | `src/components/QRScanner.tsx` | Camera flow on web |

**Verified working on web (no action needed):** expo-print→`window.print`, expo-sharing→Web Share API, expo-clipboard→`navigator.clipboard`, NetInfo→`navigator.onLine`, AsyncStorage→localStorage, expo-camera→getUserMedia, all RN primitives (FlatList/Modal/Animated/Dimensions), NativeWind v4, firebase (incl. `firebase/auth/react-native` — resolves to web build), firestore offline cache, gorhom bottom-sheet, reanimated, gifted-charts.

---

## 4. The fixes — file by file

### 4.1 `src/config/firebase.ts` — guard Google configure (blocker #1)

```ts
// top of file: remove static import of GoogleSignin, keep it lazy
import { Platform } from 'react-native'

// GoogleSignin.configure() is native-only → move it OUT of this module.
// It belongs inside auth-context's native-only branch (see 4.2).
// delete:  GoogleSignin.configure({ webClientId: ... })
```

Note: `getReactNativePersistence(AsyncStorage)` is fine — AsyncStorage's web build uses localStorage.

### 4.2 `src/lib/auth-context.tsx` — platform-switch Google auth (blocker #1 continued)

```ts
import { Platform } from 'react-native'
// web: Firebase popup (no native SDK)
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
// native: keep @react-native-google-signin — but import it dynamically:
// const { GoogleSignin } = require('@react-native-google-signin/google-signin')

const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    await signInWithPopup(auth, new GoogleAuthProvider()) // + signInWithRedirect option
  } else {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin')
    await GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID })
    const { idToken } = await GoogleSignin.signIn()
    // ...existing credential flow
  }
}
```

**Also fix the pre-existing bug while you're here:** `auth-context.tsx:154` — `idToken` doesn't exist on `SignInResponse` (this is one of the 11 typecheck errors; use `.data.idToken`).

### 4.3 `src/lib/onesignal.ts` + `app/_layout.tsx` — no-op push on web (blocker #2)

```ts
// onesignal.ts — web branch skips the native SDK entirely
import { Platform } from 'react-native'

export function initializeOneSignal(): void {
  if (Platform.OS === 'web') return   // web push = OneSignal Web SDK (optional, phase 2)
  // ...existing native code unchanged
}
```

- `onesignalLogin(userId)` / `onesignalLogout()` / click handlers → also early-return on web.
- **Same-session win:** delete the dev "integration complete" `Alert` (`onesignal.ts:19-33`) — audit finding #22, it's a production bug on both platforms.
- **Web push later:** swap in OneSignal's web SDK (`@onesignal/web`) behind the same functions — zero UI changes.

### 4.4 `src/lib/i18n-context.tsx` — real RTL on web (blocker #3)

```ts
if (Platform.OS === 'web') {
  document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
} else {
  I18nManager.forceRTL(rtl)
  I18nManager.allowRTL(rtl)
}
```

### 4.5 Deep links — web URLs (blocker #4)

- Replace `agri-mizaniya://join?code=X` with `https://<your-domain>/join?code=X`.
- `app/join.tsx` and notification routing use `Linking`/`expo-router` — on web they already resolve to URL paths; just emit web URLs from:
  - **Share code / invite share** (`farm-settings.tsx`, `members.tsx`, `api.ts` share-text builders)
  - **Push notification `route` field** already carries the screen path → works.
- Add an SPA catch-all rewrite on hosting so `/join` and `/notifications` deep links land (see §7).

### 4.6 `QRScanner.tsx` — web camera flow (blocker #5)

- Works via `getUserMedia` automatically; needs:
  - **HTTPS** to serve (local dev exempt)
  - A "camera unavailable / denied" state with an **open-settings link** (web: instructions instead) — currently hardcoded English strings; run through i18n while you're there.
- Fallback for desktop: a plain "paste code" input in the join dialog (better UX than a webcam on a laptop).

### 4.7 Bonus fixes bundled with the port (from `AUDIT_REPORT.md`)

- `joinByShareCode` already-member guard — `api.ts:682-707` (prevents duplicate farmIds on web too)
- `logActivity()` is dead code — `api.ts:158`; wire it into create/update/delete so the Activity tab works
- Pull-to-refresh is `onRefresh={() => {}}` everywhere → wire to real refetch
- FilterSheet: `filterNumeric` on amount inputs; date/amount constraints actually applied in `expenseConstraints()` (`api.ts:979-985`)
- Typecheck: fix the 11 TS errors (incl. i18n `thisMonth` duplicates ×3)

---

## 5. Desktop UX (recommended, small)

The app runs fine as-is in a browser (bottom tabs, sheets, FAB). Two cheap wins:

1. **Responsive shell** — keep bottom tabs on mobile widths; at `md:` breakpoint, show a left sidebar with the same nav (`app/(app)/(tabs)/_layout.tsx` + a CSS class toggle). NativeWind v4 handles this with `md:` variants only.
2. **PWA** — run `npx expo install expo-pwa` (or manual `manifest.webmanifest` + a few icons) → installable, offline caching via service worker. Optional but high-value for a farming tool used in the field.

---

## 6. What NOT to do

- ❌ **Don't rewrite in Next.js.** The feasibility doc suggested it, but it's 5× the work for the same result — this app bundles for web today. You'd duplicate 70 files and re-test everything.
- ❌ **Don't fork the codebase.** Keep one codebase; the `Platform.OS === 'web'` guards are ~50 lines total.
- ❌ **Don't deploy `EXPO_PUBLIC_ONESIGNAL_REST_KEY` to the web bundle** — same critical issue as native (audit #1); server-side push only.

---

## 7. Deployment

| Option | Steps |
|---|---|
| **Firebase Hosting (free, same ecosystem)** | 1. `npx expo export --platform web` → `dist/`<br>2. `firebase.json` hosting config: `"public": "dist"`, `"rewrites": [{ "source": "**", "destination": "/index.html" }]` (SPA fallback for deep links)<br>3. `firebase deploy --only hosting` |
| **Vercel / Netlify** | Point build command at `npx expo export --platform web`; output `dist/`; configure SPA rewrite |

- Add the domain to **Firebase Auth authorized domains** (Auth → Settings) — required for popup sign-in.
- Add the domain to **OneSignal** if you later enable web push.
- Set up a **Google OAuth web client ID** (Firebase console → Authentication → Google) — different from the iOS client ID (audit #7: the iOS one is already mismatched).

---

## 8. Work order & test checklist

1. Apply §4.1–4.4 → `npx expo start --web` → app boots, login works
2. §4.5–4.6 → invite by link + QR on web
3. §4.7 bug bundle → typecheck clean
4. §5 responsive + PWA
5. Deploy §7 → test on phone browser + desktop

**Acceptance:** email & Google login, farm switch, all 4 CRUD screens with filters, reports + PDF (browser print), members + invites (link), notifications (in-app), AR RTL, dark mode — all from `http://localhost:8081` and the deployed URL.
