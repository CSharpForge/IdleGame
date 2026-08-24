# Grand Stay Tycoon

A 3D idle hotel-tycoon game — build rooms, hire staff, watch guests check in and out, expand across multiple themed locations, and prestige for permanent bonuses. Built with React, TypeScript, and React Three Fiber (Three.js), packaged for Android via Capacitor.

Personal/portfolio project. No monetization.

## What's in it

- **Build & grow**: Standard/Deluxe/Suite rooms, floors, and horizontal "wing" expansions, each with independent cost curves.
- **Staff & satisfaction**: Receptionists boost income, Housekeepers boost guest satisfaction (which itself multiplies income).
- **Upgrades**: Marketing, Staff Training, and Concierge Service — permanent, purchasable multipliers.
- **Multiple hotel locations**: Beach Resort, Mountain Lodge, City High-Rise, and Desert Oasis, each independently themed and earning income simultaneously.
- **Prestige**: reset for a permanent income multiplier that compounds across every future run.
- **Timed events**: occasional temporary income boosts.
- **Achievements**, **offline earnings**, and **guests you can actually watch walk in and check out**.
- **Mobile-first** UI, playable in-browser or packaged as an Android app.

## Development

```bash
npm install
npm run dev          # start the dev server
npm run test         # run the test suite
npm run lint         # oxlint
npm run build        # typecheck + production build
```

See [CLAUDE.md](./CLAUDE.md) for architecture details, standing project rules, and testing conventions.

## Deploying the web build

The production build (`npm run build`) outputs a fully static `dist/` folder — no server-side code, so any static host works.

**Vercel** (recommended, zero-config for Vite):
```bash
npm i -g vercel
vercel            # first run: link/create a project, deploy a preview
vercel --prod     # promote to production
```
Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) for automatic deploys on every push to `main`.

**Netlify**:
```bash
npm run build
npx netlify-cli deploy --dir=dist --prod
```
Or drag-and-drop the `dist/` folder at [app.netlify.com/drop](https://app.netlify.com/drop).

**GitHub Pages**: add a workflow that runs `npm run build` and publishes `dist/` via `actions/deploy-pages` — since this is a single-page app with no client-side routing, no special SPA fallback config is needed.

## Publishing to the Google Play Store

The Android project (`android/`) is already wired up via Capacitor and stays in sync with the web build (`npm run cap:sync`). This environment doesn't have Android Studio/SDK, an app icon, a signing key, or a Play Console account — those need to happen wherever you have Android Studio installed, and the following is a checklist for that:

- [ ] **Replace the placeholder app icon and splash screen.** `android/app/src/main/res/mipmap-*/ic_launcher*.png` and `drawable*/splash.png` are still the unmodified default Capacitor template assets (a generic blue "X" mark) — not custom "Grand Stay Tycoon" branding. Design a real icon, then regenerate all densities with [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) (`npx @capacitor/assets generate`) rather than hand-editing every density folder.
- [ ] **Create a signing keystore** (`keytool -genkey -v -keystore release-key.keystore -alias grandstay -keyalg RSA -keysize 2048 -validity 10000`) and keep it somewhere safe — losing it means losing the ability to update the app under the same listing.
- [ ] **Build a signed release bundle**: `cd android && ./gradlew bundleRelease`, signed with the keystore above (configure signing in `android/app/build.gradle` or sign the AAB manually with `jarsigner`/`apksigner`).
- [ ] **Write a privacy policy** and host it somewhere public (even a GitHub Pages page) — Play Console requires a URL to one, even for a no-monetization app with no data collection.
- [ ] **Google Play Console account** ($25 one-time registration fee) and a new app listing: title, short/full description, at least 2 screenshots, a feature graphic (1024×500), and the app icon (512×512).
- [ ] **Content rating questionnaire** and **target API level compliance** (Play Console enforces a minimum target SDK that changes yearly — check the current requirement before submitting).
- [ ] Upload the signed AAB, complete the store listing, and submit for review.

Once Android Studio is available, `npm run cap:android` builds and launches the current code on a connected device/emulator for testing before any of the above.
