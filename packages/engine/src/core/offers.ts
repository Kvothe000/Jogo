import type { Axis, Creature, Offer, OfferPreview, PartValue, Recipe } from '../types';
import { BODY_LIST, CORE_LIST, INSTINCT_LIST, ORIGIN_LIST } from '../data/parts';
import { applyCreate, applyMutate, applySacrifice, teamAtkTotal, teamDefTotal, teamDelta, teamHpTotal, teamSpdTotal } from './creature';

// RNG determinístico (mulberry32) — mesma seed → mesma sequência.
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick<T>(list: readonly T[], rng: () => number): T {
    return list[Math.floor(rng() * list.length)];
}

export function randomRecipe(rng: () => number): Recipe {
    return {
        core: pick(CORE_LIST, rng) as Recipe['core'],
        body: pick(BODY_LIST, rng) as Recipe['body'],
        instinct: pick(INSTINCT_LIST, rng) as Recipe['instinct'],
        origin: pick(ORIGIN_LIST, rng) as Recipe['origin'],
    };
}

const PART_POOL: Record<string, readonly PartValue[]> = {
    CORE: CORE_LIST,
    BODY: BODY_LIST,
    INSTINCT: INSTINCT_LIST,
    ORIGIN: ORIGIN_LIST,
};

// Retorna a variante MUTAR especificamente (não a união Offer),
// para que .axis e .partId sejam acessíveis sem narrowing.
function makeMutate(rng: () => number, offerId: string, excludeAxes: Axis[] = []): Extract<Offer, { kind: 'MUTAR' }> {
    const axes = (['CORE', 'BODY', 'INSTINCT', 'ORIGIN'] as Axis[]).filter((a) => !excludeAxes.includes(a));
    const axis = axes[Math.floor(rng() * axes.length)];
    const pool = PART_POOL[axis];
    const partId = pick(pool, rng);
    return { kind: 'MUTAR', offerId, axis, partId, targetIndex: null };
}

/** Gera até 3 ofertas determinísticas para a etapa. MUTAR vem sem alvo: o jogador escolhe. */
/** Gera até 3 ofertas determinísticas para a etapa. MUTAR/SACRIFICAR vêm sem alvo: o jogador escolhe. */
export function generateOffers(runSeed: number, stage: number, team: Creature[]): Offer[] {
    const rng = mulberry32((runSeed ^ (stage * 2654435761)) >>> 0);
    const m1 = makeMutate(rng, `${stage}-m1`);
    const offers: Offer[] = [m1];
    // 2ª oferta: CRIAR se houver slot vazio; time cheio → SACRIFICAR (F1, GDD seção 4.1).
    if (team.length < 3) {
        offers.push({ kind: 'CRIAR', offerId: `${stage}-c1`, recipe: randomRecipe(rng) });
    } else {
        offers.push(makeSacrifice(`${stage}-s1`));
    }
    // 3ª oferta: MUTAR com eixo diferente da 1ª (variedade de decisão).
    offers.push(makeMutate(rng, `${stage}-m3`, [m1.axis]));
    return offers.slice(0, 3);
}

/** Oferta SACRIFICAR nasce sem escolhas: o jogador define vítima, alvo e eixo na UI. */
function makeSacrifice(offerId: string): Extract<Offer, { kind: 'SACRIFICAR' }> {
    return { kind: 'SACRIFICAR', offerId, victimIndex: null, targetIndex: null, axis: null };
}

/** Vincula as escolhas (vítima, alvo, eixo) a uma oferta SACRIFICAR. */
export function resolveSacrifice(offer: Offer, victimIndex: number, targetIndex: number, axis: Axis): Offer {
    if (offer.kind !== 'SACRIFICAR') return offer;
    return { ...offer, victimIndex, targetIndex, axis };
}

/** Vincula o alvo escolhido pelo jogador a uma oferta MUTAR. */
export function withTarget(offer: Offer, targetIndex: number): Offer {
    if (offer.kind === 'MUTAR') return { ...offer, targetIndex };
    return offer;
}

/** Aplica uma oferta ao time atual (validação + imutabilidade). */
/** Aplica uma oferta ao time atual (validação + imutabilidade). */
export function applyOffer(team: Creature[], offer: Offer): Creature[] {
    if (offer.kind === 'MUTAR') {
        if (offer.targetIndex === null) throw new Error('MUTAR inválido: escolha a criatura-alvo.');
        return applyMutate(team, offer.targetIndex, offer.axis, offer.partId);
    }
    if (offer.kind === 'SACRIFICAR') {
        if (offer.victimIndex === null || offer.targetIndex === null || offer.axis === null) {
            throw new Error('SACRIFICAR inválido: escolha vítima, alvo e eixo.');
        }
        return applySacrifice(team, offer.victimIndex, offer.targetIndex, offer.axis);
    }
    return applyCreate(team, offer.recipe);
}

export function previewOffer(team: Creature[], offer: Offer): OfferPreview {
    // Estreita o tipo: resolve MUTAR (targetIndex) e SACRIFICAR (vítima, alvo, eixo).
    const resolved =
        offer.kind === 'MUTAR'
            ? withTarget(offer, offer.targetIndex ?? 0)
            : offer.kind === 'SACRIFICAR'
                ? resolveSacrifice(offer, offer.victimIndex ?? 0, offer.targetIndex ?? 0, offer.axis ?? 'CORE')
                : offer;
    const teamAfter = applyOffer(team, resolved);
    const delta = teamDelta(team, teamAfter);
    return {
        teamAfter,
        hpTotalBefore: teamHpTotal(team),
        hpTotalAfter: teamHpTotal(teamAfter),
        atkTotalBefore: teamAtkTotal(team),
        atkTotalAfter: teamAtkTotal(teamAfter),
        defTotalBefore: teamDefTotal(team),
        defTotalAfter: teamDefTotal(teamAfter),
        spdTotalBefore: teamSpdTotal(team),
        spdTotalAfter: teamSpdTotal(teamAfter),
        effectsAdded: delta.effectsAdded,
        effectsRemoved: delta.effectsRemoved,
    };
}