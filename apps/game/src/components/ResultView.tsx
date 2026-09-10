import { useMemo } from 'react';
import { analyzeDefeat, evaluateContract } from '@jogo/engine';
import type { ContractContext } from '@jogo/engine';
import { useGame } from '../store';

export default function ResultView() {
    const phase = useGame((s) => s.phase);
    const result = useGame((s) => s.result);
    const team = useGame((s) => s.team);
    const enemy = useGame((s) => s.enemy);
    const novaRun = useGame((s) => s.novaRun);
    const contract = useGame((s) => s.contract);
    const casualties = useGame((s) => s.casualties);
    const createdCount = useGame((s) => s.createdCount);
    const sacrificedCount = useGame((s) => s.sacrificedCount);

    const analysis = useMemo(() => {
        if (!result || result.winner === 'player') return null;
        return analyzeDefeat(team, enemy, result);
    }, [result, team, enemy]);

    const venceu = phase === 'victory';

    const contratoCumprido = useMemo(() => {
        if (!contract) return null;
        const ctx: ContractContext = {
            victory: venceu,
            playerCasualties: casualties,
            finalTeam: team,
            createdCount,
            sacrificedCount,
        };
        return evaluateContract(contract, ctx);
    }, [contract, venceu, casualties, team, createdCount, sacrificedCount]);

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

            {contract && contratoCumprido !== null && (
                <p className={`contract-verdict ${contratoCumprido ? 'ok' : 'fail'}`}>
                    {contratoCumprido ? '✅' : '❌'} Contrato: {contract.title} —{' '}
                    {contratoCumprido ? 'cumprido!' : 'não cumprido.'}
                </p>
            )}

            <button className="battle-btn" onClick={novaRun}>
                Nova Run
            </button>
        </section>
    );
}