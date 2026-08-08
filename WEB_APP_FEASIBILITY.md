# 🌐 Agri-Mizaniya — Web App Feasibility Assessment

## Can this app run as a web app?

**Short answer: Not out of the box.** The project is configured as a **native mobile app** (iOS + Android). While it has a minimal `web` entry in `app.json` and a `web` npm script, it will **not build/run cleanly on web** without significant work.

---

## ✅ What's already web-ready
- `app.json` has a `web` section (`bundler: metro`, favicon)
- `package.json` has a `web` script (`expo start --web`)
- Most UI libraries are web-compatible: NativeWind, lucide icons, react-native-svg, gifted-charts, gorhom bottom-sheet, reanimated, gesture-handler, expo-camera, expo-print, expo-sharing, expo-clipboard, expo-linking, expo-web-browser, expo-linear-gradient, AsyncStorage (localStorage fallback), NetInfo

## ❌ Blockers for web (native-only dependencies)
1. **`@react-native-google-signin/google-signin`** — native-only. Google Sign-In would need to be swapped for Firebase's web Google auth (`signInWithPopup`/`signInWithRedirect`).
2. **`react-native-onesignal` + `onesignal-expo-plugin`** — native push SDK. Web would need the OneSignal Web SDK instead.
3. **`expo-secure-store`** — has a web fallback in recent SDKs, but token storage would be less secure (localStorage).
4. **`expo-dev-client`** — dev-only, native; harmless but unused on web.

## ⚠️ Critical config issue
`metro.config.js` forces:
```js
config.resolver.unstable_conditionNames = ['require', 'react-native', 'development'];
```
This **excludes the `web`/`browser` condition**, which will break web bundling for many packages. It would need to be made conditional (e.g., only apply for native platforms).

## 🔧 What it would take to make it web-capable
1. Fix `metro.config.js` to include `web`/`browser` conditions (or use platform-specific config).
2. Replace Google Sign-In with Firebase web auth (conditional import).
3. Replace OneSignal native SDK with web SDK (or guard it out on web).
4. Guard native-only modules (`expo-haptics`, `expo-secure-store`, `expo-dev-client`) behind `Platform.OS !== 'web'`.
5. Verify `expo-print`/`expo-sharing` PDF export works via browser print/share APIs.
6. Test deep-link join flow (`agri-mizaniya://join`) — needs a web URL scheme instead.

## Recommendation
This is a **mobile-first app**. If you need a web version, the cleanest path is to **build a separate web frontend** (e.g., React/Next.js) reusing the same Firebase backend, rather than forcing this RN app onto web. The Firestore schema, auth, and API layer (`src/lib/api.ts`) are already backend-agnostic and could be shared.

### Two options
- **Option A:** Attempt to make this app web-compatible (fix metro config + guard native deps).
- **Option B:** Scaffold a separate web app (Next.js) that reuses the same Firebase backend.