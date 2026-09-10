import type { Creature, Recipe, Stats, SynergyEffect, Axis, PartValue, BattleResult } from '../types';
import { BASE_STATS, CORES, BODIES, INSTINCTS, ORIGINS } from '../data/parts';
import { SYNERGY_RULES } from '../data/synergy-rules';
import { axisPart, recipeId, withAxisPart } from './identity';

function add(base: Stats, part: Partial<Stats>): Stats {
    return {
        hp: base.hp + (part.hp ?? 0),
        atk: base.atk + (part.atk ?? 0),
        def: base.def + (part.def ?? 0),
        spd: base.spd + (part.spd ?? 0),
    };
}

function deriveBaseStats(recipe: Recipe): Stats {
    const c = CORES[recipe.core];
    const b = BODIES[recipe.body];
    const o = ORIGINS[recipe.origin];
    const withCore = add(BASE_STATS, c.stats);
    const withBody = add(withCore, b.stats);
    return add(withBody, o.stats);
}

/** Encontra as sinergias ativas da receita (pares de eixos dentro da criatura). */
export function findEffects(recipe: Recipe): SynergyEffect[] {
    const found: SynergyEffect[] = [];
    for (const rule of SYNERGY_RULES) {
        const a = axisPart(recipe, rule.axisA);
        const b = axisPart(recipe, rule.axisB);
        if (a === rule.partA && b === rule.partB) found.push(rule.effect);
    }
    return found;
}

function applyEffectStats(base: Stats, effects: SynergyEffect[]): Stats {
    const out = { ...base };
    for (const fx of effects) {
        if (!fx.stats) continue;
        if (fx.stats.hp) out.hp = Math.max(1, Math.round(base.hp * (1 + fx.stats.hp)));
        if (fx.stats.atk) out.atk = Math.max(1, Math.round(base.atk * (1 + fx.stats.atk)));
        if (fx.stats.def) out.def = Math.max(1, Math.round(base.def * (1 + fx.stats.def)));
        if (fx.stats.spd) out.spd = Math.max(1, Math.round(base.spd * (1 + fx.stats.spd)));
    }
    return out;
}

export function creatureLabel(recipe: Recipe): string {
    return `${CORES[recipe.core].label} · ${BODIES[recipe.body].label} · ${INSTINCTS[recipe.instinct].label} · ${ORIGINS[recipe.origin].label}`;
}

/** Constrói a criatura final (estats derivados + sinergias aplicadas). */
export function buildCreature(recipe: Recipe): Creature {
    const baseStats = deriveBaseStats(recipe);
    const effects = findEffects(recipe);
    const stats = applyEffectStats(baseStats, effects);
    return {
        id: recipeId(recipe),
        recipe,
        label: creatureLabel(recipe),
        baseStats,
        effects,
        stats,
        hp: stats.hp,
        disabledPassives: effects.some((fx) => fx.disablePassives === true),
    };
}

// ---- Operações de time (imutáveis) ----

/** Aplica MUTAR: substitui um eixo de uma criatura existente. */
export function applyMutate(team: Creature[], targetIndex: number, axis: Axis, partId: PartValue): Creature[] {
    const target = team[targetIndex];
    if (!target) throw new Error(`MUTAR inválido: criatura ${targetIndex} não existe.`);
    const nextRecipe = withAxisPart(target.recipe, axis, partId);
    const rebuilt = buildCreature(nextRecipe);
    rebuilt.hp = Math.min(rebuilt.stats.hp, target.hp);
    const next = team.slice();
    next[targetIndex] = rebuilt;
    return next;
}

/** Aplica CRIAR: adiciona uma criatura nova (exige slot vazio). */
export function applyCreate(team: Creature[], recipe: Recipe): Creature[] {
    if (team.length >= 3) throw new Error('CRIAR inválido: time cheio.');
    return [...team, buildCreature(recipe)];
}

export function teamHpTotal(team: Creature[]): number {
    return team.reduce((acc, c) => acc + c.stats.hp, 0);
}
export function teamAtkTotal(team: Creature[]): number {
    return team.reduce((acc, c) => acc + c.stats.atk, 0);
}
export function teamDefTotal(team: Creature[]): number {
    return team.reduce((acc, c) => acc + c.stats.def, 0);
}
export function teamSpdTotal(team: Creature[]): number {
    return team.reduce((acc, c) => acc + c.stats.spd, 0);
}

export interface TeamDelta {
    teamAfter: Creature[];
    effectsAdded: SynergyEffect[];
    effectsRemoved: SynergyEffect[];
}

/** Calcula a diferença de efeitos entre o time atual e o time após a oferta. */
export function teamDelta(team: Creature[], next: Creature[]): { effectsAdded: SynergyEffect[]; effectsRemoved: SynergyEffect[] } {
    const ids = (cs: Creature[]) => new Set(cs.flatMap((c) => c.effects.map((fx) => fx.id)));
    const before = ids(team);
    const after = ids(next);
    const effectsAdded = next.flatMap((c) => c.effects).filter((fx) => !before.has(fx.id));
    const effectsRemoved = team.flatMap((c) => c.effects).filter((fx) => !after.has(fx.id));
    return { effectsAdded, effectsRemoved };
}
// Poder de Batalha (BP): estimativa aproximada do valor de combate.
// Peso: HP 0.6 · ATK 3 · DEF 2 · SPD 2 — ajuda o jogador a dimensionar o desafio.
export function creaturePower(c: Creature): number {
    return Math.round(c.stats.hp * 0.6 + c.stats.atk * 3 + c.stats.def * 2 + c.stats.spd * 2);
}

export function teamPower(team: Creature[]): number {
    return team.reduce((sum, c) => sum + creaturePower(c), 0);
}
/**
 * Aplica SACRIFICAR (GDD seção 4.1, F1): remove a criatura vítima do time e
 * transfere a parte do eixo escolhido da vítima para a criatura-alvo (que é
 * reconstruída — sinergias recalculadas).
 * Regras: exige time com >= 2 criaturas; vítima e alvo devem ser diferentes.
 */
export function applySacrifice(team: Creature[], victimIndex: number, targetIndex: number, axis: Axis): Creature[] {
    if (team.length < 2) throw new Error('SACRIFICAR inválido: é preciso ter pelo menos 2 criaturas.');
    if (victimIndex === targetIndex) throw new Error('SACRIFICAR inválido: vítima e alvo devem ser diferentes.');
    const victim = team[victimIndex];
    const target = team[targetIndex];
    if (!victim || !target) throw new Error('SACRIFICAR inválido: criatura não encontrada.');
    const part = axisPart(victim.recipe, axis);
    const withoutVictim = team.filter((_, i) => i !== victimIndex);
    const shiftedTarget = victimIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const nextRecipe = withAxisPart(target.recipe, axis, part);
    const rebuilt = buildCreature(nextRecipe);
    rebuilt.hp = Math.min(rebuilt.stats.hp, target.hp);
    const next = withoutVictim.slice();
    next[shiftedTarget] = rebuilt;
    return next;
}
/**
 * Grava o HP final da batalha de volta no time do jogador (persistência entre
 * batalhas — GDD seção 7.3, F1). Criaturas que caíram ficam com hp = 0.
 * Não muta o array original.
 */
export function applyBattleResult(team: Creature[], result: BattleResult): Creature[] {
    return team.map((c) => {
        const after = result.playerHpAfter?.[c.id];
        if (after === undefined) return c;
        return { ...c, hp: Math.max(0, Math.min(c.stats.hp, after)) };
    });
}