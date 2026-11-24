# AGENTS.md

Guidance for AI agents and contributors working on this repository.

## Project
Kingdom Guardians: an Ottoman-inspired tower defense game with 100 levels. Built with Phaser 3.90, TypeScript and Vite, and runs entirely in the browser.

## Commands
- `npm run dev`: dev server at http://localhost:8080 (also reachable on your LAN, for testing on a phone)
- `npm test`: Vitest unit and integration tests
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: typecheck, then a production build into `dist/`
- `npm run balance`: headless bot that plays through the levels and prints how far it gets
- `npm run assets`: regenerates the missing SVG assets (`assets:force` overwrites all of them)

## Architecture rules
- `src/game/core/**` is the **pure simulation**. It must never import Phaser or touch the DOM. All game rules live here and are unit-tested.
- `src/game/config/**` holds **every balancing number**. Do not hard-code stats anywhere else.
- `src/game/render/**` and `src/game/scenes/**` are Phaser views. They read simulation state and react to simulation events.
- `src/game/ui/**` is the DOM/CSS interface (HUD, menus, panels). It talks to the game only through `GameSession`.
- The simulation uses landscape world coordinates (1024x640). Portrait views are rendered by swapping x and y (see `render/ViewTransform.ts`).
- Assets are listed in `src/game/config/assetManifest.ts`. Never use external URLs at runtime.

## Definition of done for changes
Typecheck, tests and the build all pass. Update `docs/` when mechanics or the architecture change.
