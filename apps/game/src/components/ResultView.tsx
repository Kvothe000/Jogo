import { useMemo } from 'react';
import { analyzeDefeat } from '@jogo/engine';
import { useGame } from '../store';

export default function ResultView() {
    const phase = useGame((s) => s.phase);
    const result = useGame((s) => s.result);
    const team = useGame((s) => s.team);
    const enemy = useGame((s) => s.enemy);
    const novaRun = useGame((s) => s.novaRun);

    const analysis = useMemo(() => {
        if (!result || result.winner === 'player') return null;
        return analyzeDefeat(team, enemy, result);
    }, [result, team, enemy]);

    const venceu = phase === 'victory';

    return (
        <section className={`result ${venceu ? 'win' : 'lose'}`}>
            {venceu ? (
                <>
                    <h2>🏆 Run concluída!</h2>
                    <p>Seu time venceu o chefe final. Descobrir combinações estranhas é o coração do jogo.</p>
                </>
            ) : (
                <>
                    <h2>💀 Derrota</h2>
                    {analysis && (
                        <>
                            <p className="cause">Causa principal: {analysis.cause}</p>
                            <p className="suggestion">Sugestão: {analysis.suggestion}</p>
                        </>
                    )}
                </>
            )}
            <button className="battle-btn" onClick={novaRun}>
                Nova Run
            </button>
        </section>
    );
}