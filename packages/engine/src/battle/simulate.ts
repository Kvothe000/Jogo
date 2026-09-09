import type { BattleEvent, BattleResult, BattleSide, BattleUnit, Creature, DefeatAnalysis, SynergyEffect } from '../types';

// Batalha automática determinística (GDD seção 5): mesma entrada → mesmo resultado.
// Ordem por VELOCIDADE. Sem RNG na resolução.

export function toUnits(creatures: Creature[], side: BattleSide): BattleUnit[] {
    return creatures.map((c) => ({
        id: c.id,
        label: c.label,
        recipe: c.recipe,
        stats: c.stats,
        maxHp: c.stats.hp,
        hp: c.stats.hp,
        effects: c.effects,
        disabledPassives: c.disabledPassives,
        side,
    }));
}

function alive(units: BattleUnit[]): BattleUnit[] {
    return units.filter((u) => u.hp > 0);
}

function passivesEnabled(u: BattleUnit): boolean {
    return !u.disabledPassives;
}

function alliesWithInstinct(u: BattleUnit, all: BattleUnit[]): number {
    return alive(all).filter((x) => x.side === u.side && x.recipe.instinct === 'SINCRONIA').length;
}

function pickTarget(attacker: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
    const targets = alive(enemies);
    if (targets.length === 0) return null;
    switch (attacker.recipe.body) {
        case 'BESTIAL': {
            let best = targets[0];
            for (const t of targets) if (t.stats.atk > best.stats.atk) best = t;
            return best;
        }
        case 'CRISTALINO': {
            let best = targets[0];
            for (const t of targets) if (t.hp < best.hp) best = t;
            return best;
        }
        case 'VEGETAL':
        default: {
            let best = targets[0];
            for (const t of targets) if (t.hp > best.hp) best = t;
            return best;
        }
    }
}

function damageAmount(attacker: BattleUnit, target: BattleUnit): { amount: number; notes: string[] } {
    const notes: string[] = [];
    let mult = 1;
    if (passivesEnabled(attacker) && attacker.recipe.instinct === 'FRENESI' && attacker.hp / attacker.maxHp < 0.5) {
        mult *= 1.5;
        notes.push('+50% Frenesi');
    }
    const raw = Math.max(1, Math.round(attacker.stats.atk * mult - target.stats.def * 0.5));
    let amount = raw;
    if (passivesEnabled(target) && target.recipe.instinct === 'GUARDIAO') {
        amount = Math.max(1, Math.round(amount * 0.85));
        notes.push('Guardião -15%');
    }
    return { amount, notes };
}

export function simulateBattle(playerCreatures: Creature[], enemyCreatures: Creature[]): BattleResult {
    const playerUnits = toUnits(playerCreatures, 'player');
    const enemyUnits = toUnits(enemyCreatures, 'enemy');
    const allUnits = [...playerUnits, ...enemyUnits];
    const events: BattleEvent[] = [];
    let winner: BattleSide | null = null;
    let rounds = 0;

    for (let round = 1; round <= 100 && winner === null; round++) {
        rounds = round;

        // Passivas de início de rodada (ex.: Maré de Cristal).
        for (const u of alive(allUnits)) {
            const healFx = u.effects.find((fx) => fx.healPerBattle === true);
            if (healFx && passivesEnabled(u)) {
                const heal = Math.max(1, Math.round(u.maxHp * 0.05));
                u.hp = Math.min(u.maxHp, u.hp + heal);
                events.push({
                    round,
                    actorId: u.id,
                    actorLabel: u.label,
                    actorHp: u.hp,
                    targetId: null,
                    targetLabel: null,
                    kind: 'passiva',
                    amount: heal,
                    note: `${healFx.name} +${heal} HP`,
                });
            }
        }

        // Ordena por velocidade (desc); empate: player antes, depois índice original.
        const order = alive(allUnits).sort((a, b) => {
            if (b.stats.spd !== a.stats.spd) return b.stats.spd - a.stats.spd;
            if (a.side !== b.side) return a.side === 'player' ? -1 : 1;
            return 0;
        });

        for (const actor of order) {
            if (actor.hp <= 0) continue;
            const enemies = actor.side === 'player' ? enemyUnits : playerUnits;
            if (alive(enemies).length === 0) {
                winner = actor.side;
                break;
            }

            const syncFx = actor.effects.find((fx) => fx.extraActionOnSync === true);
            const actions = syncFx && passivesEnabled(actor) && alliesWithInstinct(actor, allUnits) >= 2 ? 2 : 1;

            for (let act = 0; act < actions; act++) {
                if (actor.hp <= 0 || alive(enemies).length === 0) break;
                const target = pickTarget(actor, enemies);
                if (!target) break;
                const { amount, notes } = damageAmount(actor, target);
                target.hp = Math.max(0, target.hp - amount);
                events.push({
                    round,
                    actorId: actor.id,
                    actorLabel: actor.label,
                    actorHp: actor.hp,
                    targetId: target.id,
                    targetLabel: target.label,
                    targetHp: target.hp,
                    kind: 'ataque',
                    amount,
                    note: notes.length > 0 ? notes.join(' · ') : undefined,
                });
                if (target.hp <= 0) {
                    events.push({
                        round,
                        actorId: target.id,
                        actorLabel: target.label,
                        actorHp: 0,
                        targetId: null,
                        targetLabel: null,
                        kind: 'morte',
                        note: `${target.label} caiu`,
                    });
                    if (alive(enemies).length === 0) {
                        winner = actor.side;
                        break;
                    }
                }
            }
        }
    }

    if (winner === null) {
        winner = alive(playerUnits).length >= alive(enemyUnits).length ? 'player' : 'enemy';
    }

    return {
        winner,
        rounds,
        events,
        playerSurvivors: alive(playerUnits).length,
    };
}

// Análise pós-derrota (GDD seção 6): causa + sugestão — feedback de build, não log.
export function analyzeDefeat(playerCreatures: Creature[], enemyCreatures: Creature[], result: BattleResult): DefeatAnalysis {
    if (result.winner !== 'enemy') {
        return { cause: '', suggestion: '' };
    }
    const avgSpd = (cs: Creature[]) => (cs.length ? cs.reduce((acc, c) => acc + c.stats.spd, 0) / cs.length : 0);
    if (avgSpd(enemyCreatures) > avgSpd(playerCreatures) * 1.1) {
        return {
            cause: 'Velocidade insuficiente',
            suggestion: 'Busque Corpo Cristalino, priorize +Velocidade ou efeitos de ação antecipada (Sincronia + Híbrido).',
        };
    }
    const hasCombustao = playerCreatures.some((c) => c.effects.some((fx) => fx.id === 'combustao-instavel'));
    if (hasCombustao) {
        return {
            cause: 'Combustão Instável ativa',
            suggestion: 'Fogo + Vegetal custa -30% de HP. Troque o corpo ou o núcleo para remover a penalidade.',
        };
    }
    if (avgSpd(enemyCreatures) > avgSpd(playerCreatures)) {
        return {
            cause: 'Ameaças eliminaram seu time antes da resposta',
            suggestion: 'Reforce a defesa (Corpo Vegetal), o dano (Fogo + Bestial) ou a cura (Água + Cristalino).',
        };
    }
    return {
        cause: 'Dano ou sustentação insuficientes',
        suggestion: 'Avalie trocar núcleo/corpo para ativar uma combinação positiva no seu time.',
    };
}