import type { BodyDef, CoreDef, InstinctDef, OriginDef, BodyId, CoreId, InstinctId, OriginId } from '../types';

// F0: 3 opções por eixo => 3×3×3×3 = 81 receitas suportadas pelo sistema.

export const CORES: Record<CoreId, CoreDef> = {
    FOGO: { id: 'FOGO', label: 'Fogo', color: '#e53935', desc: 'Origem ígnea do poder.', stats: { atk: 8 } },
    AGUA: { id: 'AGUA', label: 'Água', color: '#1e88e5', desc: 'Origem aquática do poder.', stats: { hp: 25 } },
    LUZ: { id: 'LUZ', label: 'Luz', color: '#fdd835', desc: 'Origem luminosa do poder.', stats: { spd: 6 } },
};

export const BODIES: Record<BodyId, BodyDef> = {
    BESTIAL: {
        id: 'BESTIAL', label: 'Bestial', color: '#8d6e63', desc: 'Ataca a maior ameaça com ferocidade.',
        role: 'dano', target: 'maior-ameaca', stats: { hp: 20, atk: 12, def: 2, spd: 4 },
    },
    CRISTALINO: {
        id: 'CRISTALINO', label: 'Cristalino', color: '#26c6da', desc: 'Focado em resistência e precisão.',
        role: 'suporte', target: 'menor-hp', stats: { hp: 10, atk: 2, def: 12, spd: 2 },
    },
    VEGETAL: {
        id: 'VEGETAL', label: 'Vegetal', color: '#43a047', desc: 'Corpo resistente que foca o mais forte.',
        role: 'tanque', target: 'maior-hp', stats: { hp: 40, atk: 4, def: 8, spd: 1 },
    },
};

export const INSTINCTS: Record<InstinctId, InstinctDef> = {
    FRENESI: { id: 'FRENESI', label: 'Frenesi', color: '#ff7043', desc: 'Fica mais forte com HP baixo.' },
    GUARDIAO: { id: 'GUARDIAO', label: 'Guardião', color: '#5c6bc0', desc: 'Reduz o dano que recebe.' },
    SINCRONIA: { id: 'SINCRONIA', label: 'Sincronia', color: '#ab47bc', desc: 'Age em dobro com aliados síncronos.' },
};

export const ORIGINS: Record<OriginId, OriginDef> = {
    RARO: { id: 'RARO', label: 'Raro', color: '#ffca28', desc: 'Traço raro e equilibrado.', stats: { atk: 2, spd: 2 } },
    SOMBRA: { id: 'SOMBRA', label: 'Sombra', color: '#546e7a', desc: 'Poder sombrio e arriscado.', stats: { atk: 6 } },
    HIBRIDO: { id: 'HIBRIDO', label: 'Híbrido', color: '#7e57c2', desc: 'Natureza mesclada.', stats: { hp: 10 } },
};

// Listas para geração aleatória determinística (seeded).
export const CORE_LIST: CoreId[] = ['FOGO', 'AGUA', 'LUZ'];
export const BODY_LIST: BodyId[] = ['BESTIAL', 'CRISTALINO', 'VEGETAL'];
export const INSTINCT_LIST: InstinctId[] = ['FRENESI', 'GUARDIAO', 'SINCRONIA'];
export const ORIGIN_LIST: OriginId[] = ['RARO', 'SOMBRA', 'HIBRIDO'];

export function randomCore(rng: () => number): CoreId {
    return CORE_LIST[Math.floor(rng() * CORE_LIST.length)];
}
export function randomBody(rng: () => number): BodyId {
    return BODY_LIST[Math.floor(rng() * BODY_LIST.length)];
}
export function randomInstinct(rng: () => number): InstinctId {
    return INSTINCT_LIST[Math.floor(rng() * INSTINCT_LIST.length)];
}
export function randomOrigin(rng: () => number): OriginId {
    return ORIGIN_LIST[Math.floor(rng() * ORIGIN_LIST.length)];
}

export const BASE_STATS = { hp: 80, atk: 10, def: 6, spd: 5 };

// Starter: cada um já demonstra uma sinergia positiva (GDD seção 4/9).
export const STARTER_RECIPES: RecipeData[] = [
    { core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' },
    { core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'RARO' },
    { core: 'LUZ', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'HIBRIDO' },
];

interface RecipeData {
    core: CoreId;
    body: BodyId;
    instinct: InstinctId;
    origin: OriginId;
}