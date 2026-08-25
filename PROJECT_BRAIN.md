# 🧠 Project Brain & Architecture Blueprint

> **Single source of truth** for HostelHub (package id: `vite-template`). Last audit: 2026-08-25.
> Read this file before changing anything. Inline code comments marked `SECURITY`, `RACE FIX`, or `DERIVED` encode hard-won fixes — do not undo them.

---

## 1. Executive Summary & Product Intent

- **What this project is:** **HostelHub** — an institute-restricted hostel administration portal for **IIT Roorkee** residents. One app for complaints/suggestions routing, mess & sick-diet management, Reddit-style community boards, digital gate passes, mess rebates, notice board, management group chat, and role-based admin portals. Access is hard-gated to `@iitr.ac.in` emails (incl. subdomains like `@me.iitr.ac.in`).
- **Value proposition:** Replace WhatsApp/paper workflows between students, hostel secretaries, wardens, and the institute admin with accountable, category-routed ticketing and approval flows.
- **Target audience:** Students (residents), 5 hostel secretaries, Assistant Warden/Warden, and a SuperAdmin ("Institute Admin").

### Key User Personas & Primary Workflows

| Persona | Journey |
| :--- | :--- |
| **Student** | Land on `/` → Sign in (Google or email OTP) at `/auth` → first-time users hit **OnboardingGate** (name + 8-digit enrollment `YYBBBXXX` parsed → branch auto-detected → bhawan/room confirmed) → Dashboard tabs: file complaint (auto-routed by category), request sick diet (+ medical slip upload), apply for pass/rebate, post/vote community suggestions, read notices. |
| **Secretary** (Mess/Maint/Gen/Sports/Wellness/Tech Sec) | Sign in → sees only their routed category's complaints → triage `Pending → Under Progress → Resolved/Cannot Resolve` with notes → moderate community suggestions → manage mess menu/notices. |
| **Warden / AsstWarden** | Sees **all** categories → approve/reject passes & rebates → give warden feedback on suggestions → skip enrollment onboarding (faculty accounts). |
| **SuperAdmin** | CentralAdmin view: manage bhawan configs (capacity/active), global announcements, user roles (assign/revoke/add/delete). |

> ⚠️ The top-bar **Persona Switcher** is explicitly labeled "Sandbox Mode" — a demo tool that switches `currentUser` among mock personas. Real identity comes from Convex Auth (`switchByEmail(user.email)`).

---

## 2. Tech Stack & Environment Manifest

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Framework/Runtime** | Vite 7 · React **19.2** · TypeScript **5.9** (strict) | SPA, `BrowserRouter`. React Router **v7** — always `import … from "react-router"` (NOT `react-router-dom`). |
| **Backend/DB** | **Convex 1.45** (`convex/` → `src/convex/`) | Schema in `src/convex/schema.ts`, `schemaValidation: false`. Generated API via `@/convex/_generated/api`. |
| **Auth** | **@convex-dev/auth 0.0.90** | Providers: **Google OAuth** + **Email OTP** (6-digit, 15-min TTL). Anonymous provider *deliberately removed* (security fix). JWT self-issued via OIDC discovery + customJwt provider for federated tokens. |
| **Styling** | Tailwind **v4** (`@tailwindcss/vite`, CSS-first config) · shadcn/ui **new-york** · tw-animate-css | Theme tokens in `src/index.css` (`--background`, `--primary`, …). Aliases: `@/components`, `@/lib`, `@/hooks`. |
| **UI primitives** | Radix UI (full suite), lucide-react icons, sonner toasts, cmdk, vaul drawer, embla carousel, recharts | All primitives pre-generated in `src/components/ui/`. |
| **Motion** | Framer Motion 12 | Required by convention on landing + app pages (fade/slide/layoutId transitions). |
| **State** | React Context store (`src/lib/store.tsx`) + **localStorage persistence** for app entities; Convex subscriptions only for auth/user | See §4 for the critical dual-layer explanation. |
| **Forms/validation** | react-hook-form + **zod v4** (`@hookform/resolvers`) | Installed; OTP form currently uses native FormData. |
| **File storage** | Supabase Storage (medical slips) | Private bucket `medical-slips`; short-lived signed URLs. Graceful no-op when unconfigured. |
| **Integrations** | Vly/Freebuff gateway (`@vly-ai/integrations`): AI completions, transactional email, payments | Must be used inside Convex `"use node"` actions. |
| **Dormant** | better-auth server/client factories (`src/lib/better-auth*.ts`) | Fully written but inactive until deployed on a Node host with SQL. Do not wire in ad hoc. |

---

## 3. Directory Topology & Architectural Invariants

```
├── index.html                  # Title "HostelFlow"; mounts /src/main.tsx
├── PROJECT_BRAIN.md            # ← you are here
├── integrations.md             # Vly AI/email/payments usage docs
├── src/
│   ├── main.tsx                # ENTRY: providers (ConvexAuth, Router), routes,
│   │                           # RootErrorBoundary, RouteSyncer (iframe bridge),
│   │                           # lazy-loaded routes, Toaster
│   ├── instrumentation.tsx     # Global error capture → Vly monitoring endpoint
│   ├── pages/                  # Route components ONLY (thin wrappers)
│   │   ├── Landing.tsx         #   /        → components/landing/LandingPage
│   │   ├── Auth.tsx            #   /auth    → Google + email-OTP stepper
│   │   ├── Dashboard.tsx       #   /dashboard (protected) — shell + tab router
│   │   └── NotFound.tsx        #   *        catch-all
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (dumb) + barrel index.ts
│   │   ├── landing/LandingPage # Self-contained marketing page (legal modals,
│   │   │                       # cookie consent, newsletter, contact dialog)
│   │   ├── RequireAuth.tsx     # Auth guard → /auth?returnTo=…
│   │   ├── LogoDropdown.tsx
│   │   ├── app/                # Domain views: ComplaintsView, MessView,
│   │   │                       # CommunityView, PassesView, NoticeBoard,
│   │   │                       # ManagementGroup, AdminPortal, CentralAdmin,
│   │   │                       # OnboardingGate
│   │   └── features/
│   │       ├── dashboard/      # Persona dashboards (Student/Secy/Warden),
│   │       │                   # constants.ts, primitives.tsx
│   │       └── shared/ViewErrorBoundary.tsx
│   ├── convex/                 # BACKEND (deployed separately!)
│   │   ├── schema.ts           # Tables: users, tickets, ticketUpdates,
│   │   │                       # notifications, messTokens, otpRequests + authTables
│   │   ├── auth.config.ts      # JWT providers — DO NOT MODIFY
│   │   ├── auth.ts             # convexAuth(Google, emailOtp) + createOrUpdateUser
│   │   │                       # domain guard — DO NOT MODIFY casually
│   │   ├── auth/emailOtp.ts    # Mail dispatch via auth.freebuff.app — DO NOT MODIFY
│   │   ├── http.ts             # httpRouter + auth.addHttpRoutes (/api/auth/*)
│   │   ├── otp.ts              # requestOtp action (gate+ratelimit+dispatch),
│   │   │                       # recordOtpSend mutation (ledger)
│   │   └── users.ts            # currentUser query + getCurrentUser helper
│   ├── hooks/
│   │   ├── use-auth.ts         # THE sanctioned auth hook (useAuth)
│   │   ├── use-complaint-filters.ts  # Role-scoped memoized complaint filtering
│   │   └── use-mobile.ts
│   └── lib/
│       ├── store.tsx           # StoreProvider/useStore — ALL app mutations live here
│       ├── types.ts            # Domain types, roles, communities, helpers
│       │                       # (isOverdueNow, localYYYYMMDD, timeAgo, scoreOf)
│       ├── mock-data.ts        # Demo fixtures + SCHEMA_VERSION (=7) + uid()
│       ├── academic-identity.ts# Enrollment parser, BRANCH_CODES, IITR email regex
│       ├── security.ts         # safeExternalUrl scheme allow-list
│       ├── supabase.ts         # Medical slip upload/signed-url (PHI rules)
│       ├── status.ts           # statusTone() — single source of badge tones
│       ├── better-auth*.ts     # DORMANT Better Auth factory/client
│       └── utils.ts            # cn() etc.
└── vly-toolbar-readonly.tsx    # Platform-injected toolbar (referenced by main.tsx
                                # and tsconfig.app.json — never delete the import)
```

### Architectural Guardrails (Do's & Don'ts)

1. **[Mutations]** Every app-state mutation goes through `useStore()` actions in `src/lib/store.tsx` — never mutate arrays/objects outside `setState` updaters, never bump IDs manually (consume `s.nextId` atomically inside an updater, or use `genId()` which is UUID-based).
2. **[Auth]** Never construct your own auth plumbing. Use `useAuth()` from `@/hooks/use-auth`. Do **not** modify `src/convex/auth.config.ts` or `src/convex/auth/emailOtp.ts`. `auth.ts` may only change for provider additions (the sanctioned pattern). OTP requests must go through `api.otp.requestOtp` — never call `signIn("email-otp")` directly.
3. **[Domain policy]** `@iitr.ac.in` restriction is enforced redundantly (client UX → `otp.requestOtp` → `emailOtp.sendVerificationRequest` → `createOrUpdateUser` → Dashboard eviction guard). If you touch any one layer, keep the others intact.
4. **[Styling]** Use design tokens (`bg-background`, `text-muted-foreground`, …) from `index.css`; no hardcoded colors except deliberate status palettes via `statusTone()`. No shadows, no nested cards, `cursor-pointer` on clickables, titles get `tracking-tight font-bold`, everything mobile-responsive and wrapped in a centered max-width container.
5. **[Loading]** Use `<Loader2 className="animate-spin" />`, not skeletons (except the branded route-loading screen in `main.tsx`).
6. **[Toasts/Dialogs]** Feedback via `sonner` toasts; prefer Dialog over new routes for focused tasks; large dialogs must scroll internally.
7. **[Convex rules]** `schemaValidation: false`; never add return-type validators; reference docs as `Doc<"t">` / ids as `Id<"t">`; handle null query results; import generated code via `@/convex/_generated/*`; external side-effects only in `"use node"` action files (no queries/mutations in that file); never edit `_generated/`.
8. **[Routing]** New pages go in `src/pages/` + register in `main.tsx` (lazy). Protected pages wrap in `<RequireAuth>`. `/auth`'s fallback redirect must stay `/dashboard` — never the landing page.
9. **[Dates]** For user-facing day keys use `localYYYYMMDD()` from `types.ts`. **Never** `toISOString().slice(0,10)` (UTC off-by-½-day for IST).
10. **[Overdue]** Compute overdue with `isOverdueNow()` (derived). The stored `Complaint.isOverdue` flag is frozen at creation and stale by design — never trust it alone.

---

## 4. Data Models, Schemas & State Flow

### ⚠️ Critical dual-layer reality

There are **two data layers** and every agent must know which is live:

1. **Live layer (drives 95% of the UI):** `AppState` in `src/lib/store.tsx` — seeded from `mock-data.ts`, persisted to `localStorage["iitr-hms-v6"]`. Owns: users, complaints, sickDietRequests, messMenus, suggestions, rebates, passes, specialAnnouncements, joinedBy (community joins), notices, groupMessages, bhawanConfigs. Per-tab isolation; cross-tab sync via `storage` events (adopts incoming snapshot rather than clobbering).
2. **Target layer (partially built):** Convex tables below. Today they serve **auth + OTP rate-limiting only** (`users`, `otpRequests`). `tickets`, `ticketUpdates`, `notifications`, `messTokens` are fully designed but **not yet consumed by any view** — migrating store entities onto them is the intended graduation path.

### Entity Relationship Model (Convex)

```
users (authTables + hostel fields)          otpRequests (rate-limit ledger)
  ├─ role: admin|user|member                    identifier (indexed), at
  ├─ hostelRole (8-value union) [unused yet]
  ├─ rollNumber, roomNumber, isDemo          tickets
  └─ INDEX email                                 createdBy ──▶ users
                                                 assignedTo?──▶ users (secy)
notifications                                    mentionedIds[] ▶ users
  userId ──▶ users                               category, status, timestamps
  ticketId?──▶ tickets                           INDEXES: by_category, by_creator,
  message, read, createdAt                                by_status, by_assigned
  INDEXES: by_user, by_user_read
                                             ticketUpdates (timeline)
messTokens                                     ticketId ──▶ tickets
  userId ──▶ users                             type: comment|created|transfer|
  tokenCode, meal(breakfast|lunch|                      status_change
  snacks|dinner), date(YYYY-MM-DD)             from/toCategory, from/toStatus
  status: active|used|cancelled                INDEX by_ticket
  INDEXES: by_user, by_date
```

### Client AppState shape (`types.ts`)

`User{id,name,email,role,bhawan,roomNo,enrollmentNumber?,enrollmentYear?,branchCode?,branchName?,academicYear?,isVerified}` · `Complaint{authorId,bhawan,category,assignedRole,status,comments[],isOverdue}` · `SickDietRequest{mealType,medicalProofUrl?,status:Requested→In Preparation→Out for Delivery→Delivered}` · `Suggestion{community,upvotedBy[],downvotedBy[],status:Open→Under Review→Approved→Implemented,comments[{parentId,up/down}]}` · `Rebate{startDate,endDate,totalMeals,status}` · `Pass{passType:LateEntry|SportsGear|GuestStay,status}` · `Notice{pinned,bhawan}` · `BhawanConfig{active,capacity}` · plus `currentUserId`, `nextId`, `schemaVersion`.

Enums: **Roles** `Student|MessSec|MaintSec|GenSec|SportsSec|WellnessSec|TechSec|AsstWarden|Warden|SuperAdmin` · **Categories** `Mess|Maintenance|General|Sports|Wellness|Technical` (mapped 1:1 to secy roles via `CATEGORY_TO_ROLE`) · **Bhawans** `Ravindra|Govind|Cautley|Rajendra|Sarojini`.

### State Lifecycle

```
Convex Auth session (JWT, reactive)
        │  useQuery(api.users.currentUser)
        ▼
useAuth() ──email──▶ store.switchByEmail() ──▶ currentUserId (creates unverified
        │                                            row if first sign-in)
        ▼                                              │ !isVerified
Dashboard <StoreProvider>                             ▼
   │  reads/writes via useStore actions         OnboardingGate
   ▼                                            (enrollment verify)
setState updater (immutable patch) ──▶ useEffect persist ──▶ localStorage
                                        ◀── storage event adopt (other tabs)
```

---

## 5. API Routes, Endpoints & Contracts

### Convex functions (real backend)

| Kind | Function | Input | Auth | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| action | `api.otp.requestOtp` | `{ email }` | Public (domain-gated) | Validate IITR domain → spend rate budget → dispatch 6-digit code. **Only sanctioned OTP entry point.** |
| mutation | `api.otp.recordOtpSend` | `{ identifier }` | Internal use | Sliding-window ledger spend (≤3 sends /10 min/email) + GC >24h rows. Throws when budget exhausted. |
| query | `api.users.currentUser` | `{}` | Any | Current signed-in user doc or `null` (read-only, DO NOT MODIFY). |
| action | Convex Auth `signIn` | provider `google` \| `email-otp` | Public | Google OAuth or `{email, code}` OTP verification. Invoked via `useAuthActions()` / `runAction`. |
| HTTP | `/api/auth/*` (http.ts) | — | — | Convex Auth routes incl. OAuth callback `/api/callback/google`. |

### Store mutations (client "API" via `useStore`)

| Action | Signature (abridged) | Role guard (enforced in UI) |
| :--- | :--- | :--- |
| `addComplaint` | Omit meta fields → auto `assignedRole=CATEGORY_TO_ROLE[category]`, `status:"Pending"` | any signed-in persona |
| `updateComplaintStatus` | `(id, status, note?)` — note appended as comment | secy-of-category / warden |
| `reassignComplaint` | `(id, newCategory)` — resets to Pending, re-routes role | warden-level |
| `addSickDietRequest` / `updateSickDietStatus` | pipeline statuses; notifies MessSec+WellnessSec | student / staff |
| `addSuggestion`, `voteSuggestion`, `voteComment`, `addSuggestionComment`, `toggleJoin`, `updateSuggestionStatus` | Reddit semantics (see §6) | students; warden sets status |
| `addPass`/`updatePassStatus`, `addRebate`/`updateRebateStatus` | approvals record `approvedBy` | warden approves |
| `assignRole`, `revokeRole`, `addUser`, `deleteUser` | role admin; revoke ⇒ Student | SuperAdmin/AdminPortal |
| `addNotice`/`deleteNotice`, `sendGroupMessage` | notices pinned flag; group chat append | warden/secy group |
| `addBhawan`, `toggleBhawanActive`, `removeBhawan`, `addGlobalAnnouncement`, `removeGlobalAnnouncement` | institute config | SuperAdmin (CentralAdmin) |
| `completeOnboarding` | persists verified identity, sets `isVerified:true` | unverified user |

> There are **no REST endpoints** beyond Convex Auth's HTTP routes. Server-side authorization checks for these store actions do **not** exist (they're client-only) — see §6 debt.

---

## 6. Business Logic, Invariants & Hidden Gotchas

### Critical Edge Cases & Invariants

- **OTP rate limiting:** ≤3 codes per email per 10 min, enforced in a **mutation** so concurrent requests serialize on Convex's OCC (a burst cannot exceed budget). Order is domain-check → budget-spend → send, so rejects never burn quota. Mail calls have an 8s timeout; errors are logged server-side, generic messages surface to clients.
- **Domain enforcement is 4-deep** (see Guardrails #3). Dashboard additionally **evicts sessions whose email is absent or non-IITR**, signing out and bouncing to `/?error=domain_restricted`. An absent email counts as disqualifying (closes legacy impersonation hole).
- **Anonymous sign-in was intentionally removed** — credential-less sessions used to land on a mock student's dashboard. Do not re-add the provider.
- **localStorage hardening:** snapshots carry `SCHEMA_VERSION` (now **7**). Bump it whenever `AppState`/fixture shapes change — mismatched or structurally invalid snapshots are discarded and reseeded, never crash. Persist failures (quota) are logged, not thrown (previously caused render crash-loops).
- **ID minting races:** `genId()` is UUID-based; sequence IDs must consume `nextId` atomically inside the same updater that inserts the entity.
- **Vote semantics:** clicking active vote clears it; switching up↔down removes the opposite list entry first. Score is derived via `scoreOf()` which tolerates missing arrays.
- **Announcements/notices removal is ID-based** (an old index-based delete removed the wrong item after list changes). Keep it that way.
- **PHI handling:** medical slips live only in the **private** `medical-slips` bucket; uploads validated for MIME (png/jpeg/webp/pdf) + ≤5MB + non-empty in code (never trust `<input accept>`); reads go through 10-minute **signed URLs** passed through `safeExternalUrl` scheme allow-list (http/https only — blocks `javascript:` hrefs).
- **Enrollment parsing:** strict `\d{8}`, YY<50⇒20YY else 19YY, rejects future years; branch resolved against `BRANCH_CODES` (28 codes); academic year derived with June cutoff, clamped 1–5. Wardens/AsstWardens may skip enrollment.
- **`returnTo` redirect safety:** only same-origin paths starting with `/` and not `//` are honored; otherwise fall back to `/dashboard`.
- **React single-copy:** `vite.config.ts` dedupes `react`/`react-dom` because `@vly-ai/integrations` otherwise drags a second copy → "Invalid hook call". Don't remove `dedupe` or the plugin.

### Known Technical Debt & Fragile Areas

1. **Mock-data graduation:** the entire entity layer is client-side/localStorage. Convex `tickets`/`ticketUpdates`/`notifications`/`messTokens` are unused by views. Migrating means deleting `mock-data.ts` and letting queries return empty collections (per its header comment). Until then, there is **no real multi-user data sharing** and no server authorization on store mutations.
2. **Dual role systems:** `HOSTEL_ROLES` (snake_case, in Convex schema, unused) vs `Role` (CamelCase, in `types.ts`, used everywhere). Consolidate during migration; don't invent a third.
3. **Duplicate `STATUS_COLORS` maps:** `types.ts` still exports one with border classes while `status.ts::statusTone()` is declared the single source. Prefer `statusTone()`; retire the legacy map.
4. **`isValidIITREmail` duplicated 4×** (academic-identity, auth.ts, otp.ts, better-auth.ts — the latter three because Convex files can't import outside their folder). Keep regexes byte-identical when editing.
5. **Google OAuth ships disabled-by-default:** works only once `GOOGLE_CLIENT_ID`/`SECRET` keys exist; the Auth page shows a helpful error meanwhile. `auth.config.ts` also contains a commented federated-provider block and TODO instructions.
6. **Better Auth modules dormant** — activation requires an external Node host; nothing in-app references them at runtime.
7. **Persona Switcher writes demo state into the same store** as real sessions; acceptable for sandbox, must be gated off before production.
8. **No test suite, no CI config, no `.env.example`** in repo (env managed via platform Keys tab + Convex env).

### Environment Secrets Map (names only — NO values)

| Variable | Where | Purpose |
| :--- | :--- | :--- |
| `VITE_CONVEX_URL` / `CONVEX_DEPLOYMENT` | Client env | Convex React client connection (pre-configured by platform). |
| `CONVEX_SITE_URL`, `JWKS`, `JWT_PRIVATE_KEY` | Convex env | Convex Auth token issuance/OIDC discovery. |
| `FREEBUFF_OTP_API_KEY` | Convex env (**required**) | Key for `auth.freebuff.app/send_otp` mail dispatch; without it OTP login fails with "Mail service is not configured." |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Convex env (optional) | Enables "Continue with Google"; redirect URI `https://<CONVEX_SITE_URL>/api/callback/google`. |
| `VITE_SUPABASE_URL` / `SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | Client env (optional) | Medical slip Storage. Absent ⇒ upload UI hides gracefully. |
| `VLY_INTEGRATION_KEY`, `VLY_INTEGRATION_BASE_URL` | Auto-injected | Freebuff AI/email/payments gateway billing key (`sk_*`). Server-side only. |
| `VITE_VLY_APP_ID`, `VITE_VLY_MONITORING_URL` | Client env | Runtime error reporting (instrumentation.tsx). |
| `VLY_APP_NAME` / `VITE_VLY_APP_NAME` | Either | App name stamped into OTP emails. |
| `VLY_CONVEX_AUTH_ISSUER` | Convex env (optional) | Overrides federated-token issuer (default `https://freebuff.com`). |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Future Node host | Dormant Better Auth activation (§6 debt #6). |

---

## 7. Operational Runbook & Developer Commands

Package manager: **bun**. All commands from project root.

```bash
# Install
bun install

# Dev (platform-managed in Freebuff — do NOT start/kill servers manually)
bun run dev            # Vite on :5173, host-bound for WebContainer preview

# Typecheck (fast feedback; mirrors the platform gate)
bun tsc -b --noEmit

# Convex backend: push functions + regenerate _generated types (non-interactive!)
bun convex dev --once && bun tsc -b --noEmit

# Lint / format
bun run lint           # eslint . (flat config, react-hooks + ts-eslint)
bun run format         # prettier --write .

# Production build (only when asked — includes tsc -b)
bun run build && bun run preview
```

- **Seeding:** none required — the client store self-seeds from `mock-data.ts` on first boot (and reseeds automatically if `schemaVersion` bumps).
- **Testing:** no test runner configured. Verification = `tsc -b --noEmit` + manual walkthrough (landing → auth → OTP/onboarding → role tabs).
- **Deployment:** Freebuff/Vly WebContainer hosting (preview auto-synced from file edits; HMR overlay disabled by design) + Convex cloud backend (`convex dev --once` pushes). No CI/CD pipelines in-repo; platform check runs `tsc -b --noEmit` after each turn.
- **Gotcha for agents:** never hand-edit `src/convex/_generated/*`; if types are stale, run `bun convex dev --once`. If `bun convex dev` cannot authenticate, report it — do not fake a passing typecheck.
