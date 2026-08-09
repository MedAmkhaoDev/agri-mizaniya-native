# 🔍 Agri-Mizaniya — Audit Report

**Date:** 2026-08-09
**Platform:** React Native (Expo 57 / RN 0.86) · Firebase (Auth, Firestore, Storage) · OneSignal

**Verified baseline:**
- `npm run typecheck` → **11 errors in 6 files**
- `npm audit` → **35 vulnerabilities (1 critical, 24 high, 10 moderate)**
- `npx expo lint` → **ESLint not installed** (lint script is broken)
- `FEATURES_AUDIT.md` is stale on ~8 claims

---

## 🔴 CRITICAL — Security & data integrity

| # | Finding | Location |
|---|---|---|
| 1 | **OneSignal REST API key shipped in the client bundle** (`EXPO_PUBLIC_` is inlined at build time) — anyone who extracts your APK/IPA can send pushes to any user (aliases = Firebase UIDs). Must move to a Cloud Function/server | `src/lib/api.ts:39,66` |
| 2 | **RBAC is UI-only, not enforced in Firestore rules.** Viewer/Worker restrictions exist in `permissions.ts` but rules say `allow read, write: if isMember(farmId)` — a viewer (or anyone with your Firebase config) can create/delete anything via the SDK | `firestore/firestore.rules:99,105,112,120,127,134,141` |
| 3 | **Any authenticated user can update any farm doc** (name, ownerId, memberCount) — the join flow only needs `memberCount` | `firestore.rules:57` |
| 4 | **Membership create rule doesn't validate `role`** — any user can join any farm as `owner`, full privilege escalation | `firestore.rules:70` |
| 5 | **`farm_invite_codes` is world-readable** (`allow read: if true`) + updatable by any auth'd user (bump useCount, alter role → self-promote to owner) | `firestore.rules:165,173` |
| 6 | **`joinByShareCode` has no already-member check** → duplicate `farmIds` + inflated `memberCount` if you re-join with the same code | `src/lib/api.ts:682-707` |
| 7 | **iOS Google Sign-In is broken**: `iosUrlScheme` (app.json:75) doesn't match `CLIENT_ID` in GoogleService-Info.plist; the `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` env var is never read by code | `app.json:75` + plist |
| 8 | **Push entitlements hardcoded to `development`** for all builds — prod iOS builds get no push | `app.json:20,60` |

## 🟠 HIGH

| # | Finding | Location |
|---|---|---|
| 9 | **`deleteFarm` can never succeed**: rules forbid farm-doc delete; deactivateShareCode writes to a path with no matching rule | `api.ts:282-316,737` |
| 10 | **Activity log is always empty** — `logActivity()` is never called anywhere | `src/lib/api.ts:158` |
| 11 | **Date-range & amount-range filters are dead code** — `expenseConstraints()` ignores `dateFrom/dateTo/amountMin/amountMax` while FilterSheet offers them | `api.ts:979-985` |
| 12 | **Rules-of-Hooks violation** — `useFarm()` called after conditional early returns → crash risk during auth transitions | `app/(app)/_layout.tsx:14-24` |
| 13 | **`signOut` awaits Google sign-out before Firebase sign-out** — if Google throws, user stays signed in with no feedback | `auth-context.tsx:184-188` |
| 14 | **`loadUserFarms` treats transient errors as "no farms"** → user locked out of the app with no retry | `farm-context.tsx:57-78` |
| 15 | **`createdBy`/`typeId` filters throw "requires index" runtime errors** (no composite indexes) | `api.ts:982-983` |
| 16 | **Dashboard shows previous farm's data after switching farms** — no farmId guard/cancellation; out-of-order responses | `index.tsx:46-73` |
| 17 | **Migration can permanently partial-migrate** (if batch1 commits then a copy fails, it never re-runs) | `migrate.ts:14-85` |
| 18 | **`createMemberAccount` returns the new user's plaintext password to the client** + creates auth account before profile doc (orphan risk) | `api.ts:762-838` |
| 19 | **No pagination anywhere** — whole collections (incl. activityLog) materialized in memory, unbounded growth | `useRealtimeCollection.ts:41-63` |
| 20 | **N+1 reads**: every parcels snapshot refetches 4 `getDocs` per parcel (×N per farm write); dashboard & reports repeat it with no sharing | `parcels/index.tsx:56-62` |
| 21 | **Zero accessibility** — no `accessibilityRole`/`accessibilityLabel` anywhere; 36px touch targets; color-only status indicators | entire `app/` + `src/` |
| 22 | **Production users see a hardcoded-English developer dialog** (OneSignal "integration complete") | `src/lib/onesignal.ts:19-33` |

## 🟡 MEDIUM

| Finding | Location |
|---|---|
| No numeric validation — `"0"`-amount entries pass the string-truthiness guards in all 4 add-sheets | `AddExpenseSheet.tsx:113-114`, `AddIncomeSheet.tsx:69-70`, `AddGasSheet.tsx:62-63`, `AddCooperativeSheet.tsx:66-67` |
| Farm-switch / sign-out / delete-farm flows lack try/catch/finally → stuck spinners, stale `currentFarmId` | `settings.tsx:55-85,131-140`, `farm-select/index.tsx:71-92` |
| **Undo-delete re-creates with a new doc ID**, orphaning notifications/activity refs | `useUndoDelete.ts:28-45` |
| **Pull-to-refresh is a no-op** on every list screen (`onRefresh={() => {}}`) | expenses:146, incomes:140, gas:138, cooperative:139, parcels:145, members:229 |
| **Stuck spinner bug**: parcel save failure leaves infinite spinner | `parcels/index.tsx:67-73` |
| **Draft keys not farm/user-scoped** — last-parcel/recent-products leak across farms & users on shared devices | `useDraft.ts:66,78,99` |
| **`memberCount` can drift negative / double-count** | `api.ts:466-469` |
| **Tab bar hardcoded light** in dark mode; theme flash on cold start | `(tabs)/_layout.tsx:16-21`, `theme-context.tsx:27-34` |
| **i18n leaks**: hardcoded English join errors, French "bouteilles", `fr-MA` dates on dashboard, English camera permission strings | `api.ts:663-672`, `gas.tsx:153`, `index.tsx:275`, `QRScanner.tsx:65-67` |
| **Push titles/bodies hardcoded French** in api.ts; **reports/PDF export hardcoded French** + HTML injection vector in PDF (unescaped parcel names) | `api.ts`, `reports.tsx:111-145` |
| **Concurrent joins can exceed `maxUses`** (check-then-increment race) | `api.ts:656-707` |
| `filterNumeric` missing in FilterSheet amount inputs → NaN filters silently empty lists | `FilterSheet.tsx:177-193` |
| Sign-in/sign-up: no email/password validation; raw English Firebase error codes shown to users | `(auth)/index.tsx:29-72` |
| Offline banner hardcoded English (`t.offlineBanner` unused) | `app/_layout.tsx:35` |
| `google-services.json` committed to git (inconsistent secret hygiene) + stale bundle ID `com.agrimizane.native` | repo root |
| Share codes generated with `Math.random()` — guessable (≈2^31 space) | `api.ts:94-101` |
| `CACHE_SIZE_UNLIMITED` persists all data on-device with no expiry | `config/firebase.ts:28-30` |
| Error handling is swallow-and-return-empty throughout `api.ts` — failures fail silently | `api.ts` (throughout) |
| Old user data never deleted post-migration (double storage) | `migrate.ts:105-115` |
| Any auth'd user can spam notifications into any user's inbox (rules) | `firestore.rules:41` |

## 🟢 The good stuff

- Firestore persistence + realtime subscriptions correctly wired; no subscription leaks found
- Rules helpers (`isMember`/`getRole`) are clean; compound indexes exist for the common paths
- `.env` and GoogleService-Info.plist properly gitignored; no hardcoded Firebase keys
- Money/draft/optimistic-UI patterns are solid foundations

---

## ⚠️ TypeScript errors (fixable in one sitting)

1. `src/lib/i18n.ts` — `thisMonth` duplicated in all 3 dictionaries (lines 272/584/896)
2. `src/lib/auth-context.tsx:154` — `idToken` doesn't exist on `SignInResponse` (likely the actual cause of broken Google sign-in)
3. `src/lib/api.ts:725` — invalid cast to `FarmInviteCode`
4. Typed-route errors in `app/(app)/(tabs)/index.tsx:216`, `tools/_layout.tsx:17`, `(farm-select)/create.tsx:41`, `(farm-select)/index.tsx:68,90`

---

## ✅ Recommended fix order

1. **OneSignal REST key out of the client** (Cloud Function) — security emergency
2. **Firestore rules**: restrict farm update, whitelist `role` on membership writes, enforce viewer/worker/manager write restrictions in rules
3. **iOS Google Sign-In client-ID mismatch + dev-only push entitlements** — blocks production release
4. **`joinByShareCode` already-member guard** + `deleteFarm`/`deactivateShareCode` path fixes
5. **TypeScript errors** + install ESLint (fix `expo lint` script)
6. UX hardening: error states, pull-to-refresh, numeric validation, accessibility

---

## 📋 Stale claims in FEATURES_AUDIT.md (needs updating)

| Claim | Reality |
|---|---|
| "No edit UI for expense/income/gas/cooperative" | Expenses DO have edit UI (`expenses/index.tsx:180`); others still lack it |
| "No farm deletion UI" | Now exists (`settings.tsx:131-140`) |
| "No leave farm UI" | Now exists (`settings.tsx:121-130`) |
| "Google Sign-In no UI button" | Button exists (`(auth)/index.tsx:163-175`) |
| "`typeId` filter not exposed" | Now exposed (`FilterSheet.tsx:147-172`) |
| "Delete Parcel — From detail sheet" | Dead code — no UI calls `handleDelete`/`deleteParcel` |
| "Pull-to-refresh on all list screens" | No-op everywhere (`onRefresh={() => {}}`) |
| "Sync: changes sync automatically" | Mostly true, but `synced` state is a fixed 2s timeout, not a real flush check |
