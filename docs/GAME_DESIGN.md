# Game Design: Kingdom Guardians

An Ottoman-inspired fantasy tower defense game. Fantasy invaders march along a road toward the Sultan's fortress. The player builds towers beside the road to stop them across **100 levels**.

All numbers below live in `src/game/config/` and can be tuned there.

## Core loop
1. **Prepare.** Build and upgrade towers, and spend gold in the Treasury. Levels never start by themselves unless the player turns on auto-start (an 8-second countdown).
2. **Defend.** Press *Start Level N*. Enemies spawn in groups and follow the road. Towers attack automatically.
3. **Reward.** Each kill pays gold, and clearing a level pays a bonus of `25 + 4 × level`. The game autosaves.
4. Every **10th level is a boss level**. A new enemy type appears every 10 levels, and new towers unlock after levels 10, 20 and 30.

The player starts with **100 gold and 20 castle health** (on Pasha difficulty). Health 0 means defeat. Clearing level 100 means victory. Each leaked enemy deals its castle damage, and the HUD counts **breaches**.

## Difficulties
| | Apprentice | Pasha | Grand Vizier |
|---|---|---|---|
| Start gold | 150 | 100 | 100 |
| Castle health | 30 | 20 | 20 |
| Enemy HP | ×0.75 | ×1 | ×1.25 |
| Rewards | ×1.15 | ×1 | ×0.9 |

## Maps
- **Bosphorus Gardens**: balanced S-shaped road.
- **Anatolian Steppe**: long zig-zag road (easier).
- **Cappadocia Valley**: short road (harder).

Obstacles (cypresses, rocks, fountains, tents, wells) block building on their tiles.

## Towers (5 levels each)
| Tower | Cost | Role | Special | Level-5 ability | Unlock |
|---|---|---|---|---|---|
| Archer Tower | 50 | Fast single target | — | Arrow Volley: 3 targets | start |
| Bombard Bastion | 100 | Area damage | Splash; cannot hit flyers | Cluster Shot: 3 bomblets | start |
| Dervish Sanctum | 125 | Magic | Ignores armour, +50% vs armoured | Chain Light: arcs to 3 more | start |
| Frost Fountain | 75 | Control | Slows; splash from level 3 | Deep Freeze: 15% freeze | start |
| Janissary Post | 150 | Sniper | Long range, ignores 50–70% armour | Marksman: 25% triple damage | after level 10 |
| Naphtha Kiln | 160 | Damage over time | Burns groups, stops regeneration | Inferno: longer, hotter burns | after level 20 |
| Mehter Pavilion | 200 | Support | +15–40% damage and +10–22% speed to nearby towers (no stacking) | Battle Hymn: +10% range | after level 30 |

- **Upgrade costs** per tower are 0.8×, 1.4×, 2.2× and 3.4× of the base cost.
- **Selling** refunds 60% of everything invested.
- **Targeting modes**: First (default: furthest along the road), Last, Strongest, Closest.

## Damage model
- **Physical** damage is reduced by armour (armour pierce ignores part of it).
- **Magic** damage is reduced by magic resist, with a bonus against enemies at 25% armour or more.
- **Fire** is reduced by half the armour. Fire-immune enemies take 25%.
- Shields multiply all incoming damage by `1 − reduction`.

## Enemies
Each regular enemy is listed with the level it first appears on:

| Lv | Enemy | Trait |
|---|---|---|
| 1 | Goblin | basic |
| 3 | Orc | tough, light armour |
| 5 | Wolf Rider | fast |
| 6 | Armored Golem | 50% armour |
| 11 | Sand Scorpion | fast and armoured |
| 21 | Ifrit Wisp | flying, fire-immune |
| 31 | Cave Troll | regenerates (burning stops it) |
| 41 | Goblin Shaman | heals nearby enemies |
| 51 | Desert Wraith | 70% physical resistance |
| 61 | Sand Slime | splits into 3 slimelings |
| 71 | Griffin | fast flyer |
| 81 | War Mammoth | huge HP, armoured, resists slows |
| 91 | Shadow Djinn | flying, resists magic, blinks forward |

**Bosses** appear on every 10th level:

| Level | Boss | Ability |
|---|---|---|
| 10 | Goblin Warlord | summons goblins |
| 20 | Orc Warchief | shield |
| 30 | Scorpion King | speed bursts |
| 40 | Stone Colossus | 65% armour |
| 50 | Ifrit King | flying, summons wisps |
| 60 | Troll Behemoth | regenerates |
| 70 | Grand Shaman | heals the horde, summons shamans |
| 80 | Sand Hydra | splits into slimes |
| 90 | Great Roc | fast flyer |
| 100 | Shadow Djinn Emperor | shields, summons, blinks |

Killing a boss restores 5 castle health. Bosses cannot be frozen.

## Scaling across 100 levels
- **Enemy HP** ×`1 + 0.11(w−1) + 0.0028(w−1)²`: about ×2.2 at level 10, ×13 at 50, and ×39 at 100.
- **Rewards** ×`1 + 0.045(w−1)`.
- **Speed** +0.3% per level, capped at +30%.
- **Enemy count** is `6 + 0.55w`. Spawn intervals shrink, and heavier enemies come in smaller numbers.
- **Elites** (from level 25) and **champions** (from level 60) are bigger, faster and tougher. They pay more and show a gold or purple ring.
- Levels 1–10 are hand-authored to match the brief. Levels 11–100 come from a seeded generator, so they are the same every game. A new enemy type makes up about 45% of the level it first appears on.

## Treasury (late-game gold sink)
- **Damascus Steel**: +10% damage for every tower, up to 15 levels, starting at 400 gold (×1.45 per level).
- **Drill Masters**: +6% attack speed, up to 10 levels, starting at 500 gold.
- **Repair the Walls**: +2 health, costing 100 + 10 × the current level.

## Balance check
`npm run balance` runs a deliberately simple greedy bot through the real simulation. At the time of writing it reaches:

| Difficulty | Result |
|---|---|
| Pasha | level 41–100, depending on the map |
| Apprentice | level 100 (it falls to the final boss) |
| Grand Vizier | level 30–41 |

A thoughtful player using targeting, the right counters and Mehter placement should do better.
