import { useState } from 'react';
import { teamPower } from '@jogo/engine';
import { useGame } from '../store';

export default function BattleView() {
    const result = useGame((s) => s.result);
    const team = useGame((s) => s.team);
    const enemy = useGame((s) => s.enemy);
    const continueAfterBattle = useGame((s) => s.continueAfterBattle);
    const [open, setOpen] = useState(false);
    if (!result) return null;

    const vitoria = result.winner === 'player';

    return (
        <section className="battle">
            <h2>{vitoria ? '🏆 Vitória!' : '💀 Derrota'}</h2>
            <p className="bp-line">
                Seu BP <b>{teamPower(team)}</b> vs Inimigo BP <b>{teamPower(enemy)}</b>
            </p>
            <p>
                {result.rounds} rodada(s) · sobreviventes: {result.playerSurvivors}/3
            </p>
            <button onClick={() => setOpen((v) => !v)}>Ver batalha {open ? '▲' : '▼'}</button>
            {open && (
                <ul className="log">
                    {result.events.map((ev, i) => (
                        <li key={i}>
                            [R{ev.round}] {ev.actorLabel} → {ev.targetLabel ?? '—'} · {ev.kind}
                            {ev.amount !== undefined ? ` (${ev.amount})` : ''}
                            {ev.note ? ` — ${ev.note}` : ''}
                        </li>
                    ))}
                </ul>
            )}
            <button className="battle-btn" onClick={() => continueAfterBattle(result)}>
                Continuar
            </button>
        </section>
    );
}