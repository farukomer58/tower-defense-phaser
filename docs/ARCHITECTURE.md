# Architecture

```
src/
  main.ts                 bootstrap: GameSession + DOM UI + Phaser game
  styles/main.css         all UI styling (desktop + phone layouts)
  game/
    config/               ALL tunable data (no logic besides formulas)
      gameConfig.ts       grid, difficulties, economy, scaling, ranks, treasury, timing
      towerConfig.ts      7 towers × 5 levels
      enemyConfig.ts      13 enemies + slimeling + 10 bosses
      waveConfig.ts       authored levels 1-10 + seeded generator for 11-100
      mapConfig.ts        3 maps (waypoints, castle, obstacles, theme)
      assetManifest.ts    every image key → file path
    core/                 PURE simulation: no Phaser, no DOM, unit-tested
      Simulation.ts       orchestrator: fixed-step loop, commands, events, save/restore
      Enemy.ts Tower.ts Projectile.ts   plain data objects + small behaviours
      Path.ts             smoothed waypoint path, distance → position
      PlacementGrid.ts    buildable / road / blocked / occupied cells
      WaveManager.ts      spawn schedule, single-fire completion
      Targeting.ts Combat.ts Economy.ts EventBus.ts rng.ts math.ts
    session/
      GameSession.ts      pause/speed, placement + selection, autosave, settings
      SaveSystem.ts       localStorage (save, settings, records), failure-tolerant
    scenes/               Phaser: Boot (procedural particle textures), Preload, Game
    render/               Phaser views of the simulation
      ViewTransform.ts    landscape ↔ portrait transpose
      WorldRenderer.ts    ground, road, decorations, castle, build grid
      EntityRenderer.ts   towers, enemies (pooled), projectiles (pooled), health bars, ranges
      Effects.ts          particles, floating text, rings, lightning
    ui/                   DOM interface (HUD, tower cards, info panel, wave panel, screens, notifications)
    audio/SoundSystem.ts  synthesised Web Audio effects
scripts/generate-assets.mjs (+ scripts/assets/*)   procedural SVG art generator
tests/unit, tests/integration                      Vitest
```

## Key decisions
- **Pure simulation core.** All rules live in `core/` with no Phaser imports, so Vitest runs them in Node: economy, combat, waves, placement, save/restore, determinism, and a 100-level balance bot. The suggested `entities/*Tower.ts` subclasses were replaced by data-driven definitions plus one `Tower`, `Enemy` and `Projectile` class. Tower and enemy behaviour comes from config (splash, slow, burn, chain, aura, summon, shield, split and so on), which keeps it in one place and easy to tune.
- **Fixed-step simulation.** `Simulation.advance(dt × speed)` runs 1/60 s ticks. 2× and 3× run more ticks, so movement, cooldowns and spawn timers all scale exactly. A test checks that 1× and 3× give identical results. Pause simply stops advancing. Sprite animations are driven by simulation time, so they freeze when paused.
- **Events for effects, polling for state.** The simulation emits typed events (kills, explosions, upgrades) that the renderer turns into effects and sounds. Sprites are synced each frame from simulation state (keyed by id), so they can never drift from the rules.
- **DOM UI instead of a Phaser UI scene.** HTML and CSS give crisp text, real buttons (44px touch targets), easy responsive layouts and accessibility. Phaser draws only the world.
- **One simulation, two orientations.** The simulation uses a 1024×640 landscape world. When the canvas is taller than it is wide, the renderer transposes (x↔y) everything. Distances are preserved, so the rules are unaffected and switching mid-game is safe. Hysteresis stops panels from flipping the map.
- **Layouts.** `layout-desktop` puts the HUD on top and a sidebar on the right. `layout-mobile` uses a compact HUD, a bottom tray and a bottom-sheet info panel. *Auto* follows a media query, and Settings can force either layout.
- **Correctness guards.** Enemies are resolved once (no duplicate rewards or leaks), dead enemies take no damage, homing shots fizzle when their target dies, wave completion fires once, coins can't go negative, health is clamped at 0, and the next wave can't start while one is active.
- **Performance.** Enemy and projectile sprites are pooled. Health bars and ground marks use one Graphics object each. Particles are pre-created emitters that call `explode()`.
- **Saving.** The game autosaves to `localStorage` after every cleared level (between levels only). The save is cleared on defeat or victory. Best records are kept per map and difficulty.
- **Phaser 3.90.** The template came with Phaser 4.0.0, but the brief asked for Phaser 3. The template's `log.js` (an outside request on every dev or build run) was removed.
