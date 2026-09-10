import { useEffect } from 'react';
import { useGame } from './store';
import TeamView from './components/TeamView';
import OfferPanel from './components/OfferPanel';
import ScoutingView from './components/ScoutingView';
import BattleView from './components/BattleView';
import ResultView from './components/ResultView';

export default function App() {
    const phase = useGame((s) => s.phase);
    const stage = useGame((s) => s.stage);
    const startRun = useGame((s) => s.startRun);
    const contract = useGame((s) => s.contract);

    useEffect(() => {
        startRun();
    }, [startRun]);

    return (
        <div className="app">
            <header className="topbar">
                <h1>Jogo — F0</h1>
                <span className="stage">Etapa {stage} / 5</span>
            </header>

            {contract && (
                <p className="contract-badge">
                    🎯 Contrato: <b>{contract.title}</b> — {contract.desc}
                </p>
            )}

            <TeamView />

            {phase === 'offer' && <OfferPanel />}
            {phase === 'scouting' && <ScoutingView />}
            {phase === 'battle' && <BattleView />}
            {(phase === 'result' || phase === 'victory') && <ResultView />}
        </div>
    );
}