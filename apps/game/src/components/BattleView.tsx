import { useMemo, useState } from 'react';
import { teamPower } from '@jogo/engine';
import type { BattleEvent } from '@jogo/engine';
import { useGame } from '../store';
import PartSquare from './PartSquare';

interface HpState {
    hp: number;
    max: number;
}

function buildHpMap(
    team: { id: string; hp?: number; stats: { hp: number } }[],
    enemy: { id: string; hp?: number; stats: { hp: number } }[],
): Record<string, HpState> {
    const map: Record<string, HpState> = {};
    for (const c of team) map[c.id] = { hp: c.hp ?? c.stats.hp, max: c.stats.hp };
    for (const c of enemy) map[c.id] = { hp: c.hp ?? c.stats.hp, max: c.stats.hp };
    return map;
}

export default function BattleView() {
    const result = useGame((s) => s.result);
    const team = useGame((s) => s.team);
    const enemy = useGame((s) => s.enemy);
    const continueAfterBattle = useGame((s) => s.continueAfterBattle);
    const [step, setStep] = useState(0);

    const maxMap = useMemo(() => buildHpMap(team, enemy), [team, enemy]);

    // Aplica os eventos já "vistos" (0..step) sobre o HP inicial.
    const hpMap = useMemo(() => {
        const map = buildHpMap(team, enemy);
        if (!result) return map;
        for (let i = 0; i < step; i++) {
            const ev = result.events[i];
            if (ev.actorHp !== undefined && map[ev.actorId]) map[ev.actorId].hp = ev.actorHp;
            if (ev.targetHp !== undefined && ev.targetId && map[ev.targetId]) map[ev.targetId].hp = ev.targetHp;
        }
        return map;
    }, [team, enemy, result, step]);

    if (!result) return null;

    const total = result.events.length;
    const fim = step >= total;
    const vitoria = result.winner === 'player';
    const atual = step > 0 ? result.events[step - 1] : null;

    return (
        <section className="battle">
            <h2>{fim ? (vitoria ? '🏆 Vitória!' : '💀 Derrota') : `Rodada ${result.events[step]?.round ?? result.rounds}`}</h2>
            <p className="bp-line">
                Seu BP <b>{teamPower(team)}</b> vs Inimigo BP <b>{teamPower(enemy)}</b>
            </p>

            {/* Replay visual: os dois times com HP bars */}
            <div className="battle-layout">
                <div className="battle-side">
                    <h3>Seu time</h3>
                    {team.map((c, i) => {
                        const st = hpMap[c.id];
                        return (
                            <UnitCard
                                key={`${c.id}-${i}`}
                                id={c.id}
                                recipe={c.recipe}
                                hp={st?.hp ?? 0}
                                max={st?.max ?? 1}
                                dead={st?.hp === 0}
                            />
                        );
                    })}
                </div>

                <div className="battle-vs">VS</div>

                <div className="battle-side">
                    <h3>Inimigo</h3>
                    {enemy.map((c, i) => {
                        const st = hpMap[c.id];
                        return (
                            <UnitCard
                                key={`${c.id}-${i}`}
                                id={c.id}
                                recipe={c.recipe}
                                hp={st?.hp ?? 0}
                                max={st?.max ?? 1}
                                dead={st?.hp === 0}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Evento atual em destaque */}
            {atual && !fim && (
                <p className="event-line">
                    {describeEvent(atual, maxMap)}
                </p>
            )}

            {/* Controles do replay */}
            <div className="replay-controls">
                <button className="mini" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                    ◀ Anterior
                </button>
                <button className="mini" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={fim}>
                    Próximo ▶
                </button>
                <button className="mini" onClick={() => setStep(total)} disabled={fim}>
                    ⏭ Ver resultado
                </button>
                <span className="step-count">
                    {step}/{total}
                </span>
            </div>

            {/* Log compacto (IDs + HP), apenas o que já foi visto */}
            {step > 0 && (
                <ul className="log">
                    {result.events.slice(0, step).map((ev, i) => (
                        <li key={i}>
                            [R{ev.round}] {ev.actorId} → {ev.targetId ?? '—'} · {ev.kind}
                            {ev.amount !== undefined ? ` (${ev.amount})` : ''}
                            {ev.note ? ` — ${ev.note}` : ''}
                            {hpSuffix(ev, maxMap)}
                        </li>
                    ))}
                </ul>
            )}

            {fim && (
                <button className="battle-btn" onClick={() => continueAfterBattle(result)}>
                    Continuar
                </button>
            )}
        </section>
    );
}

function UnitCard({ id, recipe, hp, max, dead }: {
    id: string;
    recipe: { core: string; body: string; instinct: string; origin: string };
    hp: number;
    max: number;
    dead: boolean;
}) {
    const pct = Math.max(0, Math.min(100, (hp / max) * 100));
    const tone = pct > 50 ? 'good' : pct > 25 ? 'warn' : 'bad';
    return (
        <div className={`unit-card ${dead ? 'dead' : ''}`}>
            <div className="unit-head">
                <div className="squares">
                    <PartSquare axis="CORE" part={recipe.core} />
                    <PartSquare axis="BODY" part={recipe.body} />
                    <PartSquare axis="INSTINCT" part={recipe.instinct} />
                    <PartSquare axis="ORIGIN" part={recipe.origin} />
                </div>
                <strong>#{id}</strong>
            </div>
            <div className={`hp-bar ${tone}`}>
                <div className="hp-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="hp-text">{dead ? '💀' : `${hp}/${max} HP`}</span>
        </div>
    );
}

// Agora tipados com o tipo real BattleEvent (não tipos inline parciais).
function describeEvent(ev: BattleEvent, maxMap: Record<string, HpState>): string {
    const maxOf = (id: string | null) => (id && maxMap[id] ? maxMap[id].max : 0);
    if (ev.kind === 'ataque' && ev.targetId) {
        return `⚔️ ${ev.actorId} atacou ${ev.targetId} causando ${ev.amount} — ${ev.targetId} agora tem ${ev.targetHp ?? 0}/${maxOf(ev.targetId)} HP`;
    }
    if (ev.kind === 'passiva') {
        return `✨ ${ev.actorId} — ${ev.note}`;
    }
    if (ev.kind === 'morte') {
        return `💀 ${ev.actorId} caiu!`;
    }
    return `${ev.actorId} — ${ev.kind}`;
}

function hpSuffix(ev: BattleEvent, maxMap: Record<string, HpState>): string {
    if (ev.targetId && ev.targetHp !== undefined && maxMap[ev.targetId]) {
        return ` · HP ${ev.targetHp}/${maxMap[ev.targetId].max}`;
    }
    if (ev.actorHp !== undefined && maxMap[ev.actorId]) {
        return ` · HP ${ev.actorHp}/${maxMap[ev.actorId].max}`;
    }
    return '';
}