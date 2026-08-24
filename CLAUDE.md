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

- `game/systems/*.test.ts` — economy math, offline earnings, save validation
- `game/data/roomTypes.test.ts` — cost curve properties (monotonic, positive, finite)
- `game/state/store.test.ts` — store actions, using `createGameStore()` for per-test isolation. Never test against the shared `useGameStore` singleton directly — parallel tests would pollute each other's localStorage/state.
- `utils/formatNumber.test.ts` — display formatting edge cases
- `game/audio/soundManager.test.ts` — audio must degrade silently with no Web Audio API (true in jsdom, and in some real locked-down browsers)

3D scene components (`src/scene/**`) are intentionally not unit-tested — they need a WebGL context jsdom doesn't provide. Verify those visually instead.

## Verifying visually

No `chromium-cli` in this environment; a raw Playwright script (`chromium.launch` + manual screenshot loop against the dev server) was used during development instead — see the `run` skill if repeating this. Gotcha: when seeding localStorage for a test scenario, use `page.addInitScript()` (runs before any app code), not `page.evaluate()` after `page.goto()` — the app's own first save-write can race and clobber a post-load `evaluate()` seed.

## Mobile (Capacitor)

Android platform (`android/`) added via `npx cap add android`, app id `com.grandstay.tycoon`. UI is built mobile-first (large tap targets, safe-area insets, `touch-action: none` on the canvas). This container has no Java/Android SDK, so `npm run cap:android` (launches on-device) can't run here — only `npm run cap:sync` (build + copy assets into the native project) is verifiable in this environment.
