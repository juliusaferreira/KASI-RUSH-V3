# Kasi Rush — integrated 3D asset update

This is your **existing AI Studio game source** with the three supplied art packs integrated into its Three.js scene. It is not a separate sample game.

## What changed

- Added **58 usable GLB asset names** under `public/assets/kasi/`: 57 from the comprehensive v4 library plus the new three-lane railway tile from v5.
- Included **19 v5 refined models** (18 replacements of v4 models plus one new railway tile), including trains, taxis, shacks, spaza shops, regional houses, obstacles, BMX, scooters and boards. The **four v3 models are byte-for-byte identical to the copies already bundled in v4**; they are not redundantly shipped alongside newer replacements.
- Kept a matching LOD1, LOD2 and reference collider for every model. A full source/selection catalog is in `public/assets/kasi/catalog.json`.
- Updated the game's `src/game/assetLoader.ts` to load the bundled models progressively, cache each GLB and share textures/geometry across scene clones. Models can replace procedural fallbacks after loading. The existing game UI and mechanics remain in place.
- Upgraded train, ramp, low barriers, R1 coin, power-up and rideable visuals with asset-backed models. Existing lane collision math, coin rewards, jump height and train roof collision rules are unchanged.
- Updated roadsides in **Soweto, Durban, Cape Town and the Eastern Cape** to use regional GLB scenery. Added **Nelspruit** as a fifth selectable destination with new city settings, bends and its own buildings.

## Notes / limitations

- **This ZIP does not automatically update your live AI Studio app.** Import or copy the updated source into your workspace. You can also run it as a Vite web app using `npm install` then `npm run dev`.
- This is a source project, **not an APK**.
- The supplied standalone GLB art is procedural. In-engine art direction, actual Android FPS/memory and gameplay-device testing still need to be done.
- `public/assets/kasi/colliders/` contains **approximate reference proxies only**. It does not replace the existing custom three-lane collision rules.
- The extra tile and environment pieces are installed in the asset library but are *not all drawn during gameplay*. Curved railway geometry remains the engine's procedural system because inserting straight tile GLBs would break track alignment.
- Existing characters, HUD, audio, controls, game saves and WebGL environment logic are preserved.
- Assets are South African-inspired fictional art and do not imply official rail-operator licenses or third-party affiliation.

## Important files

- `src/game/assetCatalog.ts`: all 58 names and which pack each model came from.
- `src/game/assetLoader.ts`: dynamic GLB loading and fitting.
- `src/game/GameEngine.ts`: city scenery, power-up spawning and upgraded rides.
- `src/game/models.ts`: 3D train, barriers and collectibles.
- `src/game/constants.ts` and `src/types/game.ts`: Nelspruit city definition.
- `public/assets/kasi/`: 58 models, LODs, collision proxies and catalog.

## Verification performed

The model files were checked for valid GLB headers, correct binary lengths, and complete LOD/collider paths. Representative models were decoded with trimesh. All 22 TS/TSX source files passed TypeScript **syntax transpilation**. **A full npm build and live Three.js render were not completed in this environment because dependency installation could not complete**; please run and visually test the app before publishing.
