import { useState } from 'react';
import { teamPower } from '@jogo/engine';
import { useGame } from '../store';
import PartSquare from './PartSquare';

export default function TeamView() {
    const team = useGame((s) => s.team);
    const moveCreature = useGame((s) => s.moveCreature);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const power = teamPower(team);

    function handleDrop(to: number) {
        if (dragIndex !== null) moveCreature(dragIndex, to);
        setDragIndex(null);
    }

    return (
        <section className="team">
            <h2>
                Time ({team.length}/3) · <span className="bp">BP {power}</span>
            </h2>
            <div className="team-grid">
                {team.map((c, i) => (
                    <div
                        key={`${c.id}-${i}`}
                        className={`creature-card tip-wrap ${dragIndex === i ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => {
                            setDragIndex(i);
                            e.dataTransfer.setData('text/plain', String(i));
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(i);
                        }}
                        onDragEnd={() => setDragIndex(null)}
                    >
                        <div className="card-top">
                            <div className="squares">
                                <PartSquare axis="CORE" part={c.recipe.core} />
                                <PartSquare axis="BODY" part={c.recipe.body} />
                                <PartSquare axis="INSTINCT" part={c.recipe.instinct} />
                                <PartSquare axis="ORIGIN" part={c.recipe.origin} />
                            </div>
                            <div className="move-btns">
                                <button className="mini" onClick={() => moveCreature(i, i - 1)} disabled={i === 0} title="Mover para a esquerda">←</button>
                                <button className="mini" onClick={() => moveCreature(i, i + 1)} disabled={i === team.length - 1} title="Mover para a direita">→</button>
                            </div>
                        </div>
                        <strong>#{c.id}</strong>
                        <span className="label">{c.label}</span>
                        <div className="stats">
                            HP {c.stats.hp} · ATK {c.stats.atk} · DEF {c.stats.def} · SPD {c.stats.spd}
                        </div>
                        {c.effects.map((fx) => (
                            <span key={fx.id} className={`fx ${fx.kind} tip`} data-tip={effectTip(fx)}>
                                {fx.name}
                            </span>
                        ))}
                        {c.disabledPassives && (
                            <span className="fx debuff tip" data-tip="Conflito Interno: a Sombra apaga a Luz. Passivas desativadas.">
                                Passivas desativadas
                            </span>
                        )}
                    </div>
                ))}
                {team.length < 3 && <div className="slot-empty">Slot vazio (use CRIAR)</div>}
            </div>
            {team.length > 1 && <p className="muted hint">Arraste os cards (ou use ← →) para reorganizar. A ordem decide desempates de velocidade.</p>}
        </section>
    );
}

function effectTip(fx: { name: string; desc: string; stats?: Partial<Record<'hp' | 'atk' | 'def' | 'spd', number>> }) {
    const nums = fx.stats
        ? Object.entries(fx.stats)
            .map(([k, v]) => `${k.toUpperCase()} ${(v as number) > 0 ? '+' : ''}${Math.round((v as number) * 100)}%`)
            .join(' · ')
        : '';
    return nums ? `${fx.name}: ${fx.desc} (${nums})` : `${fx.name}: ${fx.desc}`;
}