# Kingdom Guardians: Ottoman Tower Defense

A browser tower defense game with **100 levels** and an Ottoman-inspired look. It is built with **Phaser 3, TypeScript and Vite**, and plays on desktop and phone.

- 7 towers, each with 5 upgrade levels and a special ability at level 5 (archers, bombards, dervish mystics, frost fountains, janissaries, naphtha kilns, mehter war drums)
- 13 enemy types plus a boss every 10 levels. New foes and towers unlock as you progress, and elite and champion variants grow bigger, faster and stronger.
- Economy: kill rewards, level-clear bonuses, selling, and Treasury upgrades (kingdom-wide damage and attack speed, wall repair)
- 3 maps, 3 difficulties, autosave after every level, best-record tracking
- Responsive layouts: a desktop sidebar, or a phone layout with the map turned to portrait and a bottom tray. A setting can force either layout.
- Original SVG art you can swap out (see [docs/ASSETS.md](docs/ASSETS.md)) and synthesised sound

## Run it
```bash
npm install
npm run dev        # http://localhost:8080 (also on your LAN, to test on a phone)
npm test           # unit + integration tests (includes the balance bot)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## Controls
- **Mouse or touch:** tap a tower card, then a green tile, to build. Tap a tower to upgrade or sell it, or to change its targeting. Tap empty ground to close the panel.
- **Keyboard:** `1`-`7` build · `Space` start level · `P` pause · `F` speed (1×/2×/3×) · `U` upgrade · `S` sell · `T` treasury · `Esc` cancel, deselect or open the menu · `Shift`+click places several towers in a row

## Docs
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md): mechanics, every tower, enemy and boss, scaling formulas
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code structure and technical decisions
- [docs/ASSETS.md](docs/ASSETS.md): replacing the art
- [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md): phases and status
- [AGENTS.md](AGENTS.md): rules for contributors and AI agents
