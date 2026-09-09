import type { Creature, Recipe } from '../types';
import { buildCreature } from '../core/creature';
import { mulberry32 } from '../core/offers';
import { STARTER_RECIPES } from '../data/parts';

export const STAGES_TOTAL = 5;

export interface RunState {
    runSeed: number;
    stage: number;
    team: Creature[];
}

export function newRun(seed: number = (Date.now() >>> 0) % 0xffffffff): RunState {
    const rng = mulberry32(seed);
    const starterRecipe = STARTER_RECIPES[Math.floor(rng() * STARTER_RECIPES.length)];
    return { runSeed: seed >>> 0, stage: 1, team: [buildCreature(starterRecipe)] };
}

function scaleCreature(c: Creature, hpMult: number, statMult: number): Creature {
    return {
        ...c,
        stats: {
            hp: Math.round(c.stats.hp * hpMult),
            atk: Math.round(c.stats.atk * statMult),
            def: Math.round(c.stats.def * statMult),
            spd: Math.round(c.stats.spd * statMult),
        },
    };
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Composições CURADAS por etapa (em vez de aleatórias):
// - o jogador consegue reconhecer padrões ("mais um healer Cristalino")
// - sem combos absurdos de inimigo no começo
// - dificuldade consistente entre runs para os amigos compararem
const STAGE_POOLS: Recipe[][] = [
    // Etapa 1 — 1 inimigo fraco (lição: criatura de suporte/defesa)
    [
        { core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'RARO' },
        { core: 'LUZ', body: 'BESTIAL', instinct: 'GUARDIAO', origin: 'RARO' },
        { core: 'FOGO', body: 'CRISTALINO', instinct: 'FRENESI', origin: 'RARO' },
    ],
    // Etapa 2 — 1 inimigo
    [
        { core: 'AGUA', body: 'BESTIAL', instinct: 'GUARDIAO', origin: 'RARO' },
        { core: 'LUZ', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'RARO' },
        { core: 'FOGO', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' },
    ],
    // Etapa 3 — 2 inimigos
    [
        { core: 'AGUA', body: 'VEGETAL', instinct: 'GUARDIAO', origin: 'RARO' },
        { core: 'LUZ', body: 'BESTIAL', instinct: 'FRENESI', origin: 'HIBRIDO' },
        { core: 'FOGO', body: 'BESTIAL', instinct: 'GUARDIAO', origin: 'SOMBRA' },
    ],
    // Etapa 4 — 2 inimigos
    [
        { core: 'AGUA', body: 'BESTIAL', instinct: 'FRENESI', origin: 'HIBRIDO' },
        { core: 'LUZ', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' },
        { core: 'FOGO', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'SOMBRA' },
    ],
];

// Chefe fixo do F0: composição estável, alta defesa, velocidade baixa — "teste de build".
const BOSS_RECIPES: Recipe[] = [
    { core: 'AGUA', body: 'VEGETAL', instinct: 'GUARDIAO', origin: 'HIBRIDO' },
    { core: 'LUZ', body: 'VEGETAL', instinct: 'GUARDIAO', origin: 'RARO' },
    { core: 'FOGO', body: 'CRISTALINO', instinct: 'FRENESI', origin: 'SOMBRA' },
];

export function buildEnemyTeam(stage: number, runSeed: number): Creature[] {
    const rng = mulberry32((runSeed ^ (stage * 2654435761)) >>> 0);

    // Chefe: modesto o suficiente para ser vencível com um build razoável.
    if (stage >= STAGES_TOTAL) {
        return BOSS_RECIPES.map((r) => scaleCreature(buildCreature(r), 1.1, 1.0));
    }

    // Curva bem suave. Ajuste estes multiplicadores se quiser mais/menos dificuldade.
    const hpMult = 0.8 + (stage - 1) * 0.16;    // 0.80 · 0.92 · 1.04 · 1.16
    const statMult = 0.75 + (stage - 1) * 0.2;  // 0.75 · 0.85 · 0.95 · 1.05
    const count = stage <= 2 ? 1 : 2;           // Etapa 1-2: 1 inimigo · 3-4: 2 inimigos

    const pool = STAGE_POOLS[stage - 1];
    const picked = shuffle(pool, rng).slice(0, count);
    return picked.map((r) => scaleCreature(buildCreature(r), hpMult, statMult));
}

export function nextStage(run: RunState): RunState {
    return { ...run, stage: run.stage + 1 };
}