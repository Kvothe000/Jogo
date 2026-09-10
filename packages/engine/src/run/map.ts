import type { Creature, Offer } from '../types';
import { generateOffers, mulberry32 } from '../core/offers';

export type MapNodeType = 'COMBATE' | 'MUTACAO' | 'RECUPERACAO' | 'CHEFE';

export interface MapNode {
    id: string;
    type: MapNodeType;
    layer: number; // 1-based (1..MAP_LAYERS_TOTAL)
}

export interface RunMap {
    seed: number;
    layers: MapNode[][]; // layers[0] = camada 1 …
}

/** Camadas de decisão — cada uma com 3 nós (1 de cada tipo, ordem embaralhada). */
export const MAP_DECISION_LAYERS = 4;
/** Última camada é sempre o chefe (alinha com STAGES_TOTAL do run.ts). */
export const MAP_LAYERS_TOTAL = MAP_DECISION_LAYERS + 1;

const DECISION_TYPES: MapNodeType[] = ['COMBATE', 'MUTACAO', 'RECUPERACAO'];

/** Fisher-Yates com PRNG determinístico. */
function shuffle<T>(arr: T[], rng: () => number): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * Gera o mapa da run de forma 100% determinística (GDD 7.1, ⚠️ v0.6).
 * O jogador escolhe o TIPO do nó (combate/mutação/recuperação) — tudo
 * conhecido. A variação authored vem da combinação rota + seed, não de
 * aleatoriedade escondida (benchmark — Slay the Spire/FTL).
 */
export function generateRunMap(runSeed: number): RunMap {
    const rng = mulberry32((runSeed ^ 0x51ab3f2d) >>> 0);
    const layers: MapNode[][] = [];
    for (let layer = 1; layer <= MAP_DECISION_LAYERS; layer++) {
        const types = shuffle(DECISION_TYPES, rng);
        layers.push(types.map((type, idx) => ({ id: `n${layer}-${idx}`, type, layer })));
    }
    layers.push([{ id: `n${MAP_LAYERS_TOTAL}-0`, type: 'CHEFE', layer: MAP_LAYERS_TOTAL }]);
    return { seed: runSeed, layers };
}

/** Retorna o nó escolhido de uma camada (validação + leitura imutável). */
export function selectNode(map: RunMap, layer: number, nodeIndex: number): MapNode {
    const node = map.layers[layer - 1]?.[nodeIndex];
    if (!node) throw new Error(`Mapa inválido: camada ${layer}, nó ${nodeIndex} não existe.`);
    return node;
}

/**
 * Ofertas geradas pelo nó escolhido (determinístico por seed + camada).
 * - COMBATE → geração normal (MUTAR/CRIAR/SACRIFICAR, 1 de 3).
 * - MUTACAO → leque só de MUTARs (rota favorece evoluir o time; decisão deliberada: 2 cartas, escolha 1).
 * - RECUPERACAO → nenhuma oferta (o efeito é a cura — ver applyRecovery).
 * - CHEFE → nenhuma oferta (encerra a run).
 */
export function buildNodeRewards(runSeed: number, node: MapNode, team: Creature[]): Offer[] {
    if (node.type === 'COMBATE') return generateOffers(runSeed, node.layer, team);
    if (node.type === 'MUTACAO') {
        const offers = generateOffers(runSeed, node.layer, team);
        const mutars = offers.filter((o): o is Extract<Offer, { kind: 'MUTAR' }> => o.kind === 'MUTAR');
        return mutars.slice(0, 3);
    }
    return []; // RECUPERACAO e CHEFE
}

/**
 * Cura cada criatura em X% do maxHp (não muta o array original).
 * Liga o nó RECUPERAÇÃO à persistência de HP do F1.
 */
export function applyRecovery(team: Creature[], healPct: number): Creature[] {
    const pct = Math.max(0, Math.min(1, healPct));
    return team.map((c) => ({
        ...c,
        hp: Math.min(c.stats.hp, c.hp + Math.round(c.stats.hp * pct)),
    }));
}