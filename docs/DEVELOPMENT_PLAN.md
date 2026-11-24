# Development Plan: Kingdom Guardians (Ottoman Tower Defense)

## Starting point
The repository was the stock `phaserjs/template-vite-ts` template: placeholder scenes, the Phaser **4.0.0** dependency, and a `log.js` script that sent a request to an outside server on every `dev` or `build` run.

Decisions:
- **Phaser 3.90** replaces Phaser 4.0.0, as the spec asks. Phaser 3 is the mature, well-documented API.
- The template scenes, placeholder images and `log.js` are removed. The npm scripts no longer contact any outside server.
- Vitest runs the unit and integration tests.

## Phases
| Phase | Scope | Status |
|---|---|---|
| 1 | Inspect the repo, write the docs and architecture | done |
| 2 | Prototype: pure simulation core (path, enemy, tower, projectile, wave) and the Phaser renderer | done |
| 3 | Full gameplay: 7 towers, 13 enemies, 10 bosses, 100 levels, economy, 5 upgrade levels, selling, win and lose | done |
| 4 | UI and polish: DOM HUD, tower menu, info panel, menus, effects, synthesized sound | done |
| 5 | Mobile: responsive layouts, portrait map transpose, touch placement, view-mode switch | done |
| 6 | QA: typecheck, unit and integration tests, headless balance simulation, production build | done |

## Risks and mitigations
- **Balancing 100 levels.** All values are in `src/game/config`. A headless bot (`npm run balance`) plays the real simulation to check that the curve can be played.
- **Phone vs desktop layout.** The simulation always runs in landscape coordinates. Portrait mode only swaps x and y at render and input time, so switching views mid-game is safe.
- **Testability.** The game rules live in `src/game/core` and never import Phaser, so Vitest runs them in Node.
- **Replaceable art.** Every image is a file in `public/assets`, listed in `assetManifest.ts`.

## Phase reports (summary)
- **Phase 1.** Inspected the template. Wrote AGENTS.md and the docs. Switched to Phaser 3.90 and Vitest.
- **Phase 2–3.** Built the pure simulation core (`src/game/core`) and the config-driven towers, enemies, levels and maps. Unit tests cover economy, combat, waves and placement. The balance bot led to adding the Treasury, because late-game gold was piling up unused once every tower was maxed.
- **Phase 4.** Built the Phaser renderer (world, entities, effects), the DOM UI (HUD, tower cards, info panel, wave panel, menus, Treasury, Bestiary, notifications) and synthesised sound. Generated 75 original SVG assets.
- **Phase 5.** Added the phone layout (portrait transpose, bottom tray, bottom-sheet info panel), touch press-and-release placement, a `ResizeObserver` fix for container resizes, and orientation hysteresis. Verified in headless Chrome at 1366×768, 1280×720 and 390×844 (touch emulation).
- **Phase 6.** `npm run typecheck`, `npm test` (49 tests, including the integration and balance runs) and `npm run build` all pass. A smoke test of the production build showed no console errors.

## Known limitations and next ideas
- Balance was checked by a bot, not by human playtesting. Tune `config/` after real play sessions.
- On a 390px-wide phone a map tile is about 39 CSS px, slightly under the 44px guideline. Press-and-drag placement shows the ghost tower before you release.
- Flying enemies follow the road; there are no shortcut flight paths.
- Sound is synthesised (see docs/ASSETS.md for using real recordings).
