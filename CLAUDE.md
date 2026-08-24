# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Grand Stay Tycoon — a 3D idle hotel-tycoon game. Web app (Vite + React + TypeScript + React Three Fiber/Three.js), also packaged for Android via Capacitor. Personal/portfolio project, no monetization. Full design/milestone plan (M0–M4) lives at `~/.claude/plans/i-want-to-build-playful-frog.md`.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm run lint` — oxlint
- `npm run test` — run the vitest suite once
- `npm run test:watch` — vitest watch mode
- Run a single test file: `npx vitest run src/game/systems/economyTick.test.ts`
- Run tests matching a name: `npx vitest run -t "buyRoom"`
- `npm run cap:sync` — build + copy web assets into the Android Capacitor project
- `npm run cap:android` — sync + launch on a connected Android device/emulator (needs Android Studio/SDK — not available in every dev environment)

## Standing rules

- **Full test coverage is a project requirement.** Any non-trivial change to `game/systems`, `game/data`, `game/state`, or `utils` needs tests alongside it — see "Testing" below for the existing pattern.
- **Always verify.** After a change, run `npm run test`, `npm run lint`, and `npm run build` before considering it done. For anything touching the 3D scene or UI, also boot the dev server and actually look at it (see "Verifying visually").
- **Follow SOLID principles** when structuring or refactoring. Example already in this codebase: `store.ts` exposes a `createGameStore()` factory rather than only a bare singleton, so store creation is decoupled from the one app-wide instance — this is what makes the store unit-testable in isolation (see `store.test.ts`).
- **Commit and push every change** to `origin main` as you go — don't leave work uncommitted. Still use judgment about what not to commit (see `.gitignore`: `node_modules`, `dist`, Android build artifacts).

## Architecture

This is a hybrid-state 3D idle game. Two layers share one Zustand store:

- `src/scene/` — the React Three Fiber (Three.js) 3D layer, rendered inside a `<Canvas>`.
- `src/ui/` — a plain React DOM overlay (HUD, shop panel, modals), absolutely positioned on top of the canvas. Its root wrapper is `pointer-events: none`, re-enabled only on actual interactive panels — otherwise it eats clicks meant for the 3D camera controls.

Both layers read the same store (`src/game/state/store.ts`) via selectors; there's no bridge beyond that.

### State model is deliberately split in two

- **Zustand + immer + persist** (`src/game/state/store.ts`) is the source of truth for durable/economic state: cash, floors, rooms, muted flag. Normalized as `Record<id, Room>`, persisted to localStorage with zod validation on read (`src/game/systems/saveLoad.ts`), versioned via zustand's `persist` `version`/`migrate` options (`src/game/systems/migrations.ts`).
- **A miniplex ECS** (`src/game/ecs/world.ts`) holds only transient guest agents (position/phase/timers), mutated every frame inside `useFrame`. Guests are cosmetic: the store marks a room `occupied`, and the ECS spawns/despawns a guest to visually walk there. Guests are never persisted — only the room's `status` is.
- Why: guest movement needs 60fps per-frame mutation without triggering React re-renders every frame; the economy needs to be cleanly serializable and shared between live play and offline catch-up. One structure doesn't do both well.

### The economy tick is the single source of truth for money math

`src/game/systems/economyTick.ts` exports `simulateEconomy(snapshot, deltaSeconds)` — a pure, closed-form function (no per-tick randomness) that is linear in `deltaSeconds`. It is the *only* place income is computed, called by both:

- the live loop (`src/game/systems/useEconomyLoop.ts` — a `setInterval` outside the render loop, not `useFrame`, so income keeps accruing even if rendering stalls), and
- offline catch-up on load (`src/game/systems/offlineEarnings.ts`, invoked from `onRehydrateStorage` in `store.ts`).

Because both paths share one linear function, N small ticks always sum to exactly one big tick (`economyTick.test.ts` pins this down). Don't add per-room randomness or side effects to `simulateEconomy` — if guest-level granularity is ever needed for the money math itself (not just visuals), it has to stay closed-form or the online/offline consistency guarantee breaks.

The snapshot passed to `simulateEconomy` describes **one hotel location**: `{ roomCounts: Partial<Record<RoomTypeId, number>>, satisfaction: number, receptionistCount: number }` — income sums `count × incomePerSec` across room types (`src/game/data/roomTypes.ts`), then applies a satisfaction multiplier (`src/game/systems/satisfaction.ts`, 0.6x–1.0x, floor keeps an unstaffed hotel suboptimal rather than broken) and a receptionist multiplier (diminishing returns capped at `MAX_EFFECTIVE_RECEPTIONISTS`). Satisfaction/staffing are read once per call and treated as constant over the delta — including across an offline gap — which is what keeps the function closed-form; it deliberately does not model *historical* staffing changes during time away.

`simulateEconomyAcrossLocations(locationSnapshots, globalIncomeMultiplier, deltaSeconds)` sums `simulateEconomy` across every owned location (all locations earn simultaneously — an idle-game empire keeps running, not just the one you're viewing), then scales the total once by `globalIncomeMultiplier` (see below). It's still a sum of linear functions times a constant, so the same N-small-ticks-equal-one-big-tick guarantee holds. Don't add per-room randomness or side effects to either function — if guest-level granularity is ever needed for the money math itself (not just visuals), it has to stay closed-form or the online/offline consistency guarantee breaks.

### Multiple hotel locations

`state.locations: Record<string, HotelLocation>` + `state.activeLocationId` — each `HotelLocation` owns its *own* `floors`/`rooms`/`staff`, independent of every other location. Room-type unlock gating (`isRoomTypeUnlocked`) is deliberately **per-location** (a brand-new location restarts that progression, standard-only until it earns Deluxe/Suite again on its own) — this is intentional idle-game design, not an oversight, so don't "fix" it into a global unlock. `activeLocation()` is the one selector nearly everything else (`totalRoomCount`, `roomCountsByType`, `staffCountByRole`, `satisfaction`, `buyRoom`, `buyFloor`, `hireStaff`, `setRoomStatus`) reads/writes through — they all implicitly operate on whichever location is active. Achievement/global stats instead sum across every location (`totalRoomCountAllLocations`, and inline sums in `checkAchievements`/`onRehydrateStorage`) since those represent empire-wide progress. Location visuals (sky/ground color) are data, not code, via `src/game/data/locationThemes.ts` (`LocationThemeDef`) — adding a fifth theme is one more table row, same principle as room types/staff roles below. `GuestSimulation.tsx` clears the miniplex ECS on `activeLocationId` change so stale guests from the previous hotel don't wander through the newly-shown one (guests were never persisted per-location to begin with — see the ECS note above).

### Room types, staff, satisfaction, upgrades, and prestige

Room tiers (`standard`/`deluxe`/`suite`) are data, not code — `src/game/data/roomTypes.ts` holds cost curve, income, color, and an `unlockAtRoomCount` gate per tier, each type's cost curve independent of the others (buying more `standard` rooms doesn't raise `deluxe` prices). Staff roles (`receptionist`/`housekeeper`) work the same way via `src/game/data/staffDefs.ts`. Adding a new room tier or staff role should only ever require adding an entry to these data tables, not touching `store.ts`, `economyTick.ts`, or the 3D rendering — if it does, something is coupled that shouldn't be.

Empire-wide multipliers are composed once per tick in `globalIncomeMultiplier()` (a plain function in `store.ts`, not part of the pure economy module, since it reads live upgrade/prestige/event state): `upgradeIncomeMultiplier()` (marketing × staff-training, `src/game/systems/upgrades.ts`), `prestigeIncomeMultiplier()` (permanent, grows with lifetime prestige points, `src/game/systems/prestige.ts`), and `eventIncomeMultiplier()` (temporary, only while a timed event is active, `src/game/systems/events.ts`). The concierge upgrade instead adds directly to each location's satisfaction score (`upgradeSatisfactionBonus`), clamped to 1 — it boosts the satisfaction multiplier's ceiling rather than being a fourth flat multiplier.

**Prestige** (`store.ts`'s `prestige()` action) resets cash/upgrades/every location's rooms-floors-staff back to a single fresh starter location, in exchange for permanent `prestigePoints` (√-scaled off `totalEarned`, see `prestige.ts`) that never go away on future resets. `lifetimeEarned` is a separate counter that **never resets** (unlike `totalEarned`, which prestige zeroes) — it exists specifically so earn-based achievements stay fair across resets instead of becoming unreachable. Don't conflate the two: `totalEarned` drives the next prestige's point calculation, `lifetimeEarned` drives achievements/display of total career earnings.

**Timed events** (`src/game/data/eventDefs.ts`) are rolled probabilistically inside `tickEconomy` itself (`EVENT_SPAWN_CHANCE_PER_SEC`), not inside the pure economy functions — `state.activeEvent: {id, endsAt} | null` is plain persisted state, and `isEventActive`/`eventIncomeMultiplier` are pure functions of `(event, now)` so both live ticking and rehydration-time expiry checks share the same logic. Because event rolls use `Math.random()`, any test comparing tick outcomes across two stores must pin `Math.random()` (`vi.spyOn(Math, 'random')`) or it becomes flaky — see the "marketing and staff training" test in `store.test.ts` for the pattern.

### Achievements

`src/game/data/achievementDefs.ts` defines each achievement as `{ id, label, description, isUnlocked(snapshot) }` — pure predicates over a small `AchievementSnapshot`, no store coupling. `getNewlyUnlockedAchievements(snapshot, alreadyUnlockedIds)` is the one function both the store's live actions (via a `checkAchievements()` closure in `createGameStore`) and `onRehydrateStorage` call after anything that could unlock one (buying a room/floor, hiring staff, ticking the economy, or a big offline catch-up) — don't duplicate the unlock-checking logic at each call site, route through this function so a new achievement only needs a new entry in the data table.

### Save schema versioning is load-bearing, not decorative

`persistedStateSchema` in `saveLoad.ts` is the **strict, current-version** shape — it must only be checked *after* migration. The raw `localStorage` read (`createValidatedStorage`'s `getItem`) uses a deliberately loose schema that only checks the fields present in *every* version so far (`cash`/`totalEarned`/`lastTickTimestamp`) — not an outdated-but-valid shape — validating strictly at that layer would silently wipe every older save instead of letting `migrateSave` (`migrations.ts`) upgrade it. When adding a field to persisted state (as `staff`/`unlockedAchievementIds`/room `typeId` were added for M2, and `locations`/`upgradeLevels`/`prestigePoints`/`activeEvent` for M3's v2→v3 migration, which also had to reshape the top-level `floors`/`rooms`/`staff` into a single starter `HotelLocation`): bump `CURRENT_SAVE_VERSION`, add a `migrateVOldToVNew` step in `migrations.ts` that fills in the new field(s) with sane defaults, and never tighten the loose storage-layer schema to require the new field — only add to it a field that has existed since v1.

### 3D layout (`src/scene/hotel/layout.ts`)

All room/floor/guest-waypoint positions are computed from one shared grid-math module — the building renderer, guest pathing, and pop-in animation all derive positions from the same functions rather than hardcoding coordinates independently.

Important convention: **rooms sit at negative Z (receding from the camera); the lobby/corridor sit at positive Z (facing the camera).** This is intentional so guests walking from lobby → room stay visible instead of walking behind the building. Preserve "corridor side faces camera" when touching camera position/target or building geometry — this exact bug (guests invisible behind the building) happened once during M1.

Guests move via a `CatmullRomCurve3` through a handful of fixed waypoints (`src/scene/guests/waypoints.ts`) — deliberately not a navmesh/pathfinding library, since the corridor topology is fixed and known.

### Outline/toon rendering gotchas

`@react-three/postprocessing`'s `<Outline>` outlines everything wrapped in `<Select enabled>`. Wrap only the actual visible room/guest meshes (see `Room.tsx`, `GuestAgent.tsx`) — wrapping a whole parent group also outlines wireframe ghost-slot placeholders and flat slabs, producing a white halo artifact.

drei's `<Edges>` (used for ghost room-slot outlines in `Floor.tsx`) needs its parent mesh to stay in the render tree. Hide the parent's *material* (`opacity={0}`), not the mesh (`visible={false}`) — Three.js stops traversing a node's children once the node itself is invisible, which would hide `<Edges>` too.

### Data vs. logic vs. rendering

Static balance numbers (costs, growth curves, guest timing) live in `src/game/data/roomTypes.ts`, separate from the systems that use them (`src/game/systems/`) and from rendering (`src/scene/`). This is the one file to touch when tuning game balance.

## Testing

Vitest + jsdom (`vitest.config.ts`). Coverage focus is business logic, not 3D rendering:

- `game/systems/economyTick.test.ts`, `offlineEarnings.test.ts`, `satisfaction.test.ts`, `upgrades.test.ts`, `prestige.test.ts`, `events.test.ts` — economy/satisfaction/multiplier math, including the linearity (N-small-ticks-equal-one-big-tick) property and its extension across multiple locations
- `game/systems/saveLoad.test.ts` — loose storage-layer validation vs. strict post-migration schema, tested as two separate concerns (see architecture note above)
- `game/systems/migrations.test.ts` — v1→v2→v3 upgrade path (including the full v1→v3 chain), and the safe-fallback-to-fresh-state behavior for unfixable input
- `game/data/roomTypes.test.ts`, `staffDefs.test.ts`, `upgradeDefs.test.ts`, `locationThemes.test.ts` — cost curve properties (monotonic, positive, finite) per room type / staff role / upgrade / location unlock
- `game/data/achievementDefs.test.ts` — unlock predicates and the newly-unlocked-vs-already-recorded logic
- `game/state/store.test.ts` — store actions, using `createGameStore()` for per-test isolation. Never test against the shared `useGameStore` singleton directly — parallel tests would pollute each other's localStorage/state.
- `utils/formatNumber.test.ts` — display formatting edge cases
- `game/audio/soundManager.test.ts` — audio must degrade silently with no Web Audio API (true in jsdom, and in some real locked-down browsers)

3D scene components (`src/scene/**`) are intentionally not unit-tested — they need a WebGL context jsdom doesn't provide. Verify those visually instead.

## Verifying visually

No `chromium-cli` in this environment; a raw Playwright script (`chromium.launch` + manual screenshot loop against the dev server) was used during development instead — see the `run` skill if repeating this. Gotcha: when seeding localStorage for a test scenario, use `page.addInitScript()` (runs before any app code), not `page.evaluate()` after `page.goto()` — the app's own first save-write can race and clobber a post-load `evaluate()` seed.

## Mobile (Capacitor)

Android platform (`android/`) added via `npx cap add android`, app id `com.grandstay.tycoon`. UI is built mobile-first (large tap targets, safe-area insets, `touch-action: none` on the canvas). This container has no Java/Android SDK, so `npm run cap:android` (launches on-device) can't run here — only `npm run cap:sync` (build + copy assets into the native project) is verifiable in this environment.
