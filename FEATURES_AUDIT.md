# 🌾 Agri-Mizaniya — Full Features Audit

**Platform:** React Native (Expo 57 / RN 0.86) · **Architecture:** Expo Router + Firebase (Auth, Firestore, Storage via Firebase) + NativeWind + Zustand · **Push:** OneSignal · **Charts:** react-native-gifted-charts

---

## 1. Authentication & Onboarding (`app/(auth)/`)
| Feature | Status | Details |
|---|---|---|
| Email/Password Sign In | ✅ | `signInWithEmailAndPassword` |
| Email/Password Sign Up | ✅ | Creates Firebase auth user + Firestore profile |
| Google Sign-In | ✅ | `@react-native-google-signin`; auto-creates profile on first login |
| Forgot Password | ✅ | Bottom-sheet with email reset via Firebase |
| Password Change | ✅ | Re-auth required before update (Settings) |
| Multi-language Auth Screen | ✅ | FR / EN / AR switcher on login |
| Legal Links | ✅ | Privacy Policy + Terms of Use deep links |

## 2. Farm Selection & Management (`app/(farm-select)/`)
| Feature | Status | Details |
|---|---|---|
| Farm List with Role Badges | ✅ | Owner/Manager/Worker/Viewer badges per farm |
| Create Farm | ✅ | Name, description, location; persists to Firestore |
| Switch Farm | ✅ | Updates `currentFarmId` in user profile |
| Join Farm via 6-char Invite Code | ✅ | `joinByShareCode` with expiry/maxUses validation |
| Join Farm via QR Scan | ✅ | `expo-camera` QRScanner; deep-link `agri-mizaniya://join?code=` |
| Join via Deep Link | ✅ | `app/join.tsx` routes to farm-select with code |
| Share Code / Invite Link Generation | ✅ | 30-day validity, viewer role, unlimited uses |

## 3. Dashboard (`app/(app)/(tabs)/index.tsx`)
| Feature | Status | Details |
|---|---|---|
| Net Profit/Loss Hero Card | ✅ | Income − (Expenses + Gas + Cooperative); profit/loss color states |
| Per-Parcel Profit Cards | ✅ | Horizontal scroll, sorted by net profit, income/cost breakdown |
| 4 Stat Tiles | ✅ | Total Income, Expenses, Gas, Cooperative — tap-to-navigate |
| Total Parcels Counter | ✅ | Active parcel count |
| Recent Activity Feed | ✅ | Merged expenses/incomes/gas/cooperative, newest first |
| Pull-to-Refresh | ✅ | + manual refresh button |
| Quick Action FAB (animated) | ✅ | Spring-animated radial menu: Add Expense / Income / Gas / Cooperative |
| Farm Switcher Modal | ✅ | From header; create-new-farm shortcut |
| Notification Bell | ✅ | Unread count badge |
| Skeleton Loading States | ✅ | Shimmer placeholders while fetching |
| Empty States | ✅ | Friendly empty messages |

## 4. Parcels (`app/(app)/(tabs)/parcels/`)
| Feature | Status | Details |
|---|---|---|
| List Parcels (realtime) | ✅ | `useRealtimeCollection` with pending-write indicators |
| Create/Edit Parcel | ✅ | Name, area (ha), location, notes |
| Archive/Unarchive | ✅ | Active vs Archival sections visually separated |
| Delete Parcel | ✅ | From detail sheet |
| Per-Parcel Financial Summary | ✅ | Net profit, income, expenses, gas, cooperative breakdown |
| Last-Used Parcel Pre-selection | ✅ | AsyncStorage persistence (`useDraft`) |
| Role-Gated Create/Edit | ✅ | Only owner/manager (`canManageParcels`) |

## 5. Expenses (`app/(app)/(tabs)/expenses/`)
| Feature | Status | Details |
|---|---|---|
| Add Expense (bottom sheet) | ✅ | Description, type, quantity, unit, amount |
| Expense Type Grid | ✅ | 9 default types (labor, fuel, fertilizer, seeds, pesticides, equipment, transport, water, other) with color-coded icons |
| Custom Expense Type Creation | ✅ | Add ad-hoc type with random color |
| Unit Price Auto-Calculation | ✅ | amount ÷ quantity, shown live |
| Quick Recent Amounts | ✅ | Last 4 amounts as tappable chips |
| Parcel Filter Chips | ✅ | Horizontal "All Parcels" + active parcels |
| Advanced Filters Sheet | ✅ | Date presets (7d / 30d / this month), created-by member (multi-user only), min/max amount |
| Delete with Undo | ✅ | Toast-based soft-delete + restore |
| Realtime Sync Indicator | ✅ | "Syncing" spinner on pending writes |
| Total Expenses Header | ✅ | Aggregated sum (respects filters) |
| Skin-Color Theming per Entity | ✅ | Expenses = red, Gas = orange, etc. |

## 6. Incomes (`app/(app)/(tabs)/incomes/`)
| Feature | Status | Details |
|---|---|---|
| Add Income (bottom sheet) | ✅ | Product name, quantity, unit, total amount |
| Recent Products List | ✅ | AsyncStorage-backed quick picker |
| Parcel Filter Chips | ✅ | Same as expenses |
| Advanced Filters Sheet | ✅ | Date presets, member, amount range |
| Unit Price Display | ✅ | totalAmount ÷ quantity per row |
| Delete with Undo | ✅ | Restore capability |
| Total Income Header | ✅ | Aggregated sum |

## 7. Gas Usage (`app/(app)/(tabs)/tools/gas.tsx`)
| Feature | Status | Details |
|---|---|---|
| Add Gas (bottom sheet) | ✅ | Bottle quantity, total amount |
| Parcel Filter Chips | ✅ | |
| Advanced Filters | ✅ | Date/member/amount |
| Delete with Undo | ✅ | |
| Total Gas Header | ✅ | |

## 8. Cooperative Support (`app/(app)/(tabs)/tools/cooperative.tsx`)
| Feature | Status | Details |
|---|---|---|
| Add Cooperative Support | ✅ | Support type (gas/seeds/tools/fertilizer/equipment/other), invoice no., description, amount |
| Parcel Filter Chips | ✅ | |
| Advanced Filters | ✅ | |
| Invoice Number Display | ✅ | In list rows |
| Delete with Undo | ✅ | |

## 9. Activity Log (`app/(app)/(tabs)/tools/activity.tsx`)
| Feature | Status | Details |
|---|---|---|
| Entity Activity Timeline | ✅ | Expense/income/parcel/gas/cooperative icons |
| Relative Time Stamps | ✅ | "Just now / 5m ago / 3h ago / 2d ago" |
| Action Descriptions | ✅ | "X added/deleted Y" with entity names |
| Pull-to-Refresh & Retry | ✅ | Error state with retry |

## 10. Reports (`app/(app)/(tabs)/tools/reports.tsx`)
| Feature | Status | Details |
|---|---|---|
| Period Filtering | ✅ | Monthly / Yearly / Custom (YYYY-MM-DD) / All |
| Parcel Filtering | ✅ | Per-parcel or all-parcels |
| Net Profit Card | ✅ | Green/red profit-loss result |
| Parcel Comparison Bar Chart | ✅ | Dual income vs. cost bars (gifted-charts) |
| Detailed Breakdown Table | ✅ | Per-parcel income/costs/net |
| Summary Ledger | ✅ | Income, expenses, gas, cooperative + total cost |
| Share via WhatsApp | ✅ | Pre-formatted `whatsapp://send` text |
| Export to PDF | ✅ | `expo-print` HTML → PDF → share sheet |
| Role-Gated Export | ✅ | Only owner/manager (`canExportReports`) |

## 11. Members (`app/(app)/(tabs)/tools/members.tsx`)
| Feature | Status | Details |
|---|---|---|
| Member List (realtime) | ✅ | Avatar initials, full name, email, role badge |
| Invite via Share Link/QR Code | ✅ | QRCodeDisplay + Share native sheet |
| Invite via Deep Link | ✅ | |
| Create Member Account | ✅ | Creates Firebase auth user + Firestore doc + member record; returns credentials |
| Auto-Generated Password | ✅ | Toggleable; strong 12-char generator |
| Share Credentials | ✅ | Native share sheet with email/password |
| Role Management Modal | ✅ | Change to manager/worker/viewer |
| Remove Member | ✅ | Confirmation + guardrails (can't remove owner/self) |
| Offline Guard | ✅ | Invite disabled while offline |

## 12. Farm Settings (`app/(app)/(tabs)/tools/farm-settings.tsx`)
| Feature | Status | Details |
|---|---|---|
| Edit Farm Name/Description | ✅ | |
| Share Codes Management | ✅ | View list, use-count display (`x/∞`), copy code |
| Generate New Share Code | ✅ | |
| Role-Gated | ✅ | Owner only |

## 13. Settings (`app/(app)/settings.tsx`)
| Feature | Status | Details |
|---|---|---|
| Edit Profile Name | ✅ | Updates Firebase auth displayName + profile |
| Current Farm Card | ✅ | + Switch Farm shortcut |
| Data Migration Tool | ✅ | Legacy-to-new data structure migration (auto-runs on first login) |
| Change Password | ✅ | Hidden for Google-authenticated users |
| Language Selection | ✅ | FR / EN / AR with checkmarks |
| Theme Selection | ✅ | System / Light / Dark (persisted) |
| Sync Status Card | ✅ | synced / syncing / offline / error + force sync |
| App Version Display | ✅ | From `expo-constants` |
| Sign Out | ✅ | Cleans OneSignal session + Google sign-out |

## 14. Notifications (`app/notifications.tsx`)
| Feature | Status | Details |
|---|---|---|
| In-App Notification Center | ✅ | Real-time via Firestore `onSnapshot` |
| Push Notifications | ✅ | OneSignal (aliased by external_id = UID) |
| 12 Notification Types | ✅ | Invites, member join/leave, role change, parcel/expense/income/gas/cooperative/farm-settings events |
| Notification Routing | ✅ | Tap → deep-link to relevant screen |
| Unread Indicators | ✅ | Green dot + unread tint + bell badge |
| Mark All as Read | ✅ | |
| Relative Timestamps | ✅ | min/h/d/j localized |

## 15. Sync & Offline (`src/lib/sync-context.tsx`, `src/hooks/useRealtimeCollection.ts`)
| Feature | Status | Details |
|---|---|---|
| Real-time Firestore Subscriptions | ✅ | `onSnapshot` with `includeMetadataChanges` |
| Pending Write Indicators | ✅ | `_pending` flag → "Syncing…" spinner on rows |
| Offline Banner | ✅ | Amber strip: "You're offline — changes will sync automatically" |
| Offline Firestore Persistence | ✅ | `disableNetwork/enableNetwork` + local cache |
| Force Sync | ✅ | Settings → retry |
| Optimistic UI via `hasPendingWrites` | ✅ | Data shows instantly, reconcile later |

## 16. Role-Based Access Control (`src/lib/permissions.ts` + `farm-context.tsx`)
| Capability | Owner | Manager | Worker | Viewer |
|---|---|---|---|---|
| Create entries (expense/income/gas/coop) | ✅ | ✅ | ✅ | ❌ |
| Edit/delete own entries | ✅ | ✅ | ✅ | ❌ |
| Edit/delete any entries | ✅ | ✅ | ❌ | ❌ |
| Manage parcels | ✅ | ✅ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ❌ | ❌ |
| Manage members (invite/remove/roles) | ✅ | ❌ | ❌ | ❌ |
| Manage farm settings | ✅ | ❌ | ❌ | ❌ |
| Leave farm (non-owner) | — | ✅ | ✅ | ✅ |

## 17. i18n (`src/lib/i18n.ts`)
- **3 Languages:** French (default), English, Arabic (RTL-aware)
- **Scope:** All screens, sheets, badges, notifications, reports, empty states
- Language persisted client-side

## 18. UX Polish & Micro-Features
- **Skeleton loading** animations across lists & dashboard
- **Toast notifications** for success/error/undo (react-native-toast-message, theme-aware)
- **Currency formatting** (MAD) with French locale; numeric keypad filtering (`filterNumeric`)
- **Draft persistence** — expense/income forms survive app restarts per-farm (AsyncStorage)
- **Recent amounts & products** quick-pick
- **Last parcel auto-preference** across forms
- **Dark mode** via ThemeContext (system/light/dark)
- **Custom bottom sheets** (gorhom) — non-modal, swipe-friendly
- **QR generation & scanning** for invitations (react-native-qrcode-svg / expo-camera)
- **Haptics** (expo-haptics) in add flows
- **Safe-area aware** tab bar & FAB positioning
- **Pull-to-refresh** on all list screens

---

## ⚠️ Notable Gaps / Observations (not bugs, but worth noting)

1. **No edit UI** for existing expense/income/gas/cooperative entries — only create/delete (permission functions `canEditOwn/AnyEntries` exist but no edit screen wired).
2. **No farm deletion UI** — `deleteFarm` API exists but no screen exposes it.
3. **No "leave farm" UI** — `canLeaveFarm` permission exists but not surfaced.
4. **Invitations by email** — `sendInvite`/`acceptInvite`/`revokeInvite` APIs exist but no screen uses them; the UI focuses on share codes/QR/create-account (older invite system).
5. **FilterSheet typeId/createdBy** — `typeId` filter count is computed but type filtering isn't exposed in FilterSheet UI (only member + date + amount).
6. **Activity log & reports** are pull-based (no realtime subscription) while list screens are realtime.
7. **Worker role** can create entries but the Parcels screen hides add/edit for workers (`canManageParcels`).
8. **Reports custom period** uses free-text `YYYY-MM-DD` inputs (no date picker), though the dependency `@react-native-community/datetimepicker` is installed.
9. **Backend push notification titles/bodies are hardcoded in French** (`api.ts`), while in-app notifications rely on i18n params.
10. **Google Sign-In is implemented in auth-context** but no UI button on the auth screen calls `signInWithGoogle` — the auth screen only shows email/password + forgot password + language switcher.

---

## Tech Stack Summary
- **Framework:** Expo SDK 57, expo-router v6, React 19, RN 0.86
- **State:** Zustand (farm store) + React Context (auth, i18n, theme, sync)
- **Backend:** Firebase Auth + Cloud Firestore (with security rules in `firestore/firestore.rules`)
- **Push:** OneSignal (expo plugin + RN SDK)
- **UI:** NativeWind v4 (Tailwind), lucide-react-native icons, gorhom bottom-sheet, gifted-charts
- **Forms/Validation:** react-hook-form + zod (declared; used minimally in components)
- **Persistence:** AsyncStorage + SecureStore (tokens) + Firestore offline cache