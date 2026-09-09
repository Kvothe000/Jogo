import { create } from 'zustand';
import {
    applyOffer,
    buildEnemyTeam,
    generateOffers,
    newRun,
    simulateBattle,
    withTarget,
    STAGES_TOTAL,
    type BattleResult,
    type Creature,
    type Offer,
    type RunState,
} from '@jogo/engine';

export type Phase = 'offer' | 'scouting' | 'battle' | 'result' | 'victory';

interface GameStore {
    phase: Phase;
    runSeed: number;
    stage: number;
    team: Creature[];
    offers: Offer[];
    enemy: Creature[];
    result: BattleResult | null;

    startRun: () => void;
    chooseOffer: (offer: Offer, targetIndex?: number) => void;
    toBattle: () => void;
    startBattle: () => void;
    moveCreature: (from: number, to: number) => void;
    continueAfterBattle: (result: BattleResult) => void;
    novaRun: () => void;
}

export const useGame = create<GameStore>((set, get) => ({
    phase: 'offer',
    runSeed: 0,
    stage: 1,
    team: [],
    offers: [],
    enemy: [],
    result: null,

    startRun: () => {
        const run: RunState = newRun();
        set({
            runSeed: run.runSeed,
            stage: run.stage,
            team: run.team,
            offers: generateOffers(run.runSeed, run.stage, run.team),
            enemy: [],
            result: null,
            phase: 'offer',
        });
    },

    // Aplica a oferta e AVANÇA para o reconhecimento — 1 escolha por etapa.
    chooseOffer: (offer: Offer, targetIndex?: number) => {
        const { team, runSeed, stage } = get();
        const final = offer.kind === 'MUTAR' ? withTarget(offer, targetIndex ?? 0) : offer;
        const nextTeam = applyOffer(team, final);
        const enemy = buildEnemyTeam(stage, runSeed);
        set({ team: nextTeam, enemy, result: null, phase: 'scouting' });
    },

    // "Pular escolha" / ir direto para a batalha.
    toBattle: () => {
        const { team, stage, runSeed } = get();
        const enemy = buildEnemyTeam(stage, runSeed);
        set({ enemy, phase: 'scouting' });
    },

    startBattle: () => {
        const { team, enemy } = get();
        const result = simulateBattle(team, enemy);
        set({ result, phase: 'battle' });
    },

    moveCreature: (from: number, to: number) =>
        set((s) => {
            if (from === to || from < 0 || to < 0 || from >= s.team.length || to >= s.team.length) return {};
            const team = s.team.slice();
            const [moved] = team.splice(from, 1);
            team.splice(to, 0, moved);
            return { team };
        }),

    continueAfterBattle: (result: BattleResult) => {
        const { stage, runSeed, team } = get();
        if (result.winner !== 'player') {
            set({ phase: 'result' });
            return;
        }
        if (stage >= STAGES_TOTAL) {
            set({ phase: 'victory' });
            return;
        }
        const nextStage = stage + 1;
        set({
            stage: nextStage,
            phase: 'offer',
            result: null,
            enemy: [],
            offers: generateOffers(runSeed, nextStage, team),
        });
    },

    novaRun: () => get().startRun(),
}));