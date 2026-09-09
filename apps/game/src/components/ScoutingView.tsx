import { creaturePower, teamPower } from '@jogo/engine';
import { useGame } from '../store';
import PartSquare from './PartSquare';

export default function ScoutingView() {
    const enemy = useGame((s) => s.enemy);
    const team = useGame((s) => s.team);
    const stage = useGame((s) => s.stage);
    const startBattle = useGame((s) => s.startBattle);

    const myPower = teamPower(team);
    const enemyPower = teamPower(enemy);

    return (
        <section className="scouting">
            <h2>⚠️ Inimigos da etapa {stage}</h2>
            <p className="bp-line">
                Seu BP <b>{myPower}</b> vs Inimigo BP <b>{enemyPower}</b>
                {enemyPower > myPower * 1.15 && <span className="warning"> — desafio alto!</span>}
                {enemyPower < myPower * 0.85 && <span className="good"> — vantagem sua.</span>}
            </p>
            <p className="muted">Apenas o tipo e o nome — os atributos ficam em segredo.</p>
            <div className="team-grid">
                {enemy.map((c, i) => (
                    <div className="creature-card" key={`${c.id}-${i}`}>
                        <div className="squares">
                            <PartSquare axis="CORE" part={c.recipe.core} />
                            <PartSquare axis="BODY" part={c.recipe.body} />
                            <PartSquare axis="INSTINCT" part={c.recipe.instinct} />
                            <PartSquare axis="ORIGIN" part={c.recipe.origin} />
                        </div>
                        <strong>#{c.id}</strong>
                        <span className="label">{c.label}</span>
                        <span className="stats">BP {creaturePower(c)}</span>
                    </div>
                ))}
            </div>
            <button className="battle-btn" onClick={startBattle}>
                Iniciar batalha
            </button>
        </section>
    );
}