/**
 * Map definitions. Coordinates are grid cells in the canonical landscape grid
 * (16 x 10 tiles). Path waypoints must form axis-aligned segments.
 */

export interface GridPoint { c: number; r: number }

export type DecorationKind = 'cypress' | 'rock' | 'fountain' | 'tent' | 'palm' | 'well';

export interface MapTheme {
    groundTexture: string;
    roadColor: number;
    roadEdgeColor: number;
    roadStoneColor: number;
    backgroundColor: string;
    /** Small decorations scattered without blocking building. */
    scatter: string[];
}

export interface MapDefinition {
    id: string;
    name: string;
    subtitle: string;
    difficultyHint: string;
    waypoints: GridPoint[];
    /** Top-left cell of the 3x3 castle. */
    castle: GridPoint;
    /** Decorations that block building on their cell. */
    obstacles: { kind: DecorationKind; c: number; r: number }[];
    theme: MapTheme;
}

export const CASTLE_SIZE = 3;

export const MAPS: MapDefinition[] = [
    {
        id: 'bosphorus',
        name: 'Bosphorus Gardens',
        subtitle: 'Tulip meadows by the straits',
        difficultyHint: 'Balanced road',
        waypoints: [
            { c: -1, r: 1 }, { c: 2, r: 1 }, { c: 2, r: 7 }, { c: 6, r: 7 }, { c: 6, r: 2 },
            { c: 10, r: 2 }, { c: 10, r: 8 }, { c: 12, r: 8 }, { c: 12, r: 4 }, { c: 13, r: 4 }
        ],
        castle: { c: 13, r: 3 },
        obstacles: [
            { kind: 'cypress', c: 0, r: 4 }, { kind: 'cypress', c: 0, r: 8 }, { kind: 'fountain', c: 4, r: 4 },
            { kind: 'cypress', c: 8, r: 5 }, { kind: 'rock', c: 8, r: 0 }, { kind: 'cypress', c: 15, r: 0 },
            { kind: 'cypress', c: 14, r: 9 }, { kind: 'tent', c: 14, r: 7 }
        ],
        theme: {
            groundTexture: 'ground_meadow',
            roadColor: 0xd9b382, roadEdgeColor: 0xa47a4c, roadStoneColor: 0xc4a072,
            backgroundColor: '#5d9b4a',
            scatter: ['deco_tulips', 'deco_tulips_blue', 'deco_grass', 'deco_grass', 'deco_flowers']
        }
    },
    {
        id: 'steppe',
        name: 'Anatolian Steppe',
        subtitle: 'Golden plains and a long winding road',
        difficultyHint: 'Long road (easier)',
        waypoints: [
            { c: -1, r: 5 }, { c: 1, r: 5 }, { c: 1, r: 1 }, { c: 4, r: 1 }, { c: 4, r: 8 }, { c: 7, r: 8 },
            { c: 7, r: 1 }, { c: 10, r: 1 }, { c: 10, r: 8 }, { c: 12, r: 8 }, { c: 12, r: 4 }, { c: 13, r: 4 }
        ],
        castle: { c: 13, r: 3 },
        obstacles: [
            { kind: 'tent', c: 2, r: 8 }, { kind: 'well', c: 5, r: 4 }, { kind: 'rock', c: 9, r: 4 },
            { kind: 'rock', c: 0, r: 0 }, { kind: 'palm', c: 15, r: 9 }, { kind: 'tent', c: 15, r: 0 },
            { kind: 'rock', c: 13, r: 8 }
        ],
        theme: {
            groundTexture: 'ground_steppe',
            roadColor: 0xc99a5b, roadEdgeColor: 0x8f6435, roadStoneColor: 0xb58650,
            backgroundColor: '#b8a050',
            scatter: ['deco_grass_dry', 'deco_grass_dry', 'deco_flowers', 'deco_pebbles']
        }
    },
    {
        id: 'cappadocia',
        name: 'Cappadocia Valley',
        subtitle: 'Fairy chimneys and a short, deadly pass',
        difficultyHint: 'Short road (harder)',
        waypoints: [
            { c: -1, r: 2 }, { c: 4, r: 2 }, { c: 4, r: 7 }, { c: 9, r: 7 }, { c: 9, r: 4 }, { c: 13, r: 4 }
        ],
        castle: { c: 13, r: 3 },
        obstacles: [
            { kind: 'rock', c: 1, r: 5 }, { kind: 'rock', c: 6, r: 4 }, { kind: 'rock', c: 7, r: 1 },
            { kind: 'cypress', c: 11, r: 8 }, { kind: 'rock', c: 2, r: 9 }, { kind: 'well', c: 11, r: 1 },
            { kind: 'cypress', c: 15, r: 8 }
        ],
        theme: {
            groundTexture: 'ground_valley',
            roadColor: 0xe0c29a, roadEdgeColor: 0xa88460, roadStoneColor: 0xcfae84,
            backgroundColor: '#a4b06a',
            scatter: ['deco_pebbles', 'deco_grass', 'deco_flowers', 'deco_tulips']
        }
    }
];

export function getMap(id: string): MapDefinition {
    return MAPS.find((m) => m.id === id) ?? MAPS[0];
}
