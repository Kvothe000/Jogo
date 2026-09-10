import { create } from 'zustand';
import {
    applyBattleResult,
    applyOffer,
    applyRecovery,
    buildEnemyTeam,
    generateContractForRun,
    generateOffers,
    newRun,
    resolveSacrifice,
    simulateBattle,
    withTarget,
    STAGES_TOTAL,
    type Axis,
    type BattleResult,
    type Creature,
    type Offer,
    type RunContract,
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
    contract: RunContract | null;
    casualties: number;
    createdCount: number;
    sacrificedCount: number;

    startRun: () => void;
    chooseOffer: (offer: Offer, opts?: { targetIndex?: number; victimIndex?: number; axis?: Axis }) => void;
    toBattle: () => void;
    startBattle: () => void;
    moveCreature: (from: number, to: number) => void;
    continueAfterBattle: (result: BattleResult) => void;
    recover: (healPct: number) => void;
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
    contract: null,
    casualties: 0,
    createdCount: 0,
    sacrificedCount: 0,

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
            contract: generateContractForRun(run.runSeed),
            casualties: 0,
            createdCount: 0,
            sacrificedCount: 0,
        });
    },

    // Aplica a oferta e AVANÇA para o reconhecimento — 1 escolha por etapa.
    chooseOffer: (offer: Offer, opts?: { targetIndex?: number; victimIndex?: number; axis?: Axis }) => {
        const { team, runSeed, stage, createdCount, sacrificedCount } = get();
        let final: Offer = offer;
        if (offer.kind === 'MUTAR') final = withTarget(offer, opts?.targetIndex ?? 0);
        if (offer.kind === 'SACRIFICAR') {
            final = resolveSacrifice(offer, opts?.victimIndex ?? 0, opts?.targetIndex ?? 0, opts?.axis ?? 'CORE');
        }
        const nextTeam = applyOffer(team, final);
        const enemy = buildEnemyTeam(stage, runSeed);
        set({
            team: nextTeam,
            enemy,
            result: null,
            phase: 'scouting',
            createdCount: offer.kind === 'CRIAR' ? createdCount + 1 : createdCount,
            sacrificedCount: offer.kind === 'SACRIFICAR' ? sacrificedCount + 1 : sacrificedCount,
        });
    },

    // "Pular escolha" / ir direto para a batalha.
    toBattle: () => {
        const { team, stage, runSeed } = get();
        const enemy = buildEnemyTeam(stage, runSeed);
        set({ enemy, phase: 'scouting' });
    },

    startBattle: () => {
        const { team, enemy, casualties } = get();
        const result = simulateBattle(team, enemy);
        const playerIds = new Set(team.map((c) => c.id));
        const deaths = result.events.filter((e) => e.kind === 'morte' && playerIds.has(e.actorId)).length;
        set({ result, phase: 'battle', casualties: casualties + deaths });
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
        // Persistência de HP (GDD 7.3, F1): grava o HP que sobrou no time.
        // Criaturas que caíram ficam com hp = 0 até serem recuperadas.
        const teamAfter = applyBattleResult(team, result);
        console.log('HP após batalha:', teamAfter.map((c) => `${c.id}=${c.hp}/${c.stats.hp}`));

        if (stage >= STAGES_TOTAL) {
            set({ team: teamAfter, phase: 'victory' });
            return;
        }
        const nextStage = stage + 1;
        set({
            stage: nextStage,
            team: teamAfter,
            phase: 'offer',
            result: null,
            enemy: [],
            offers: generateOffers(runSeed, nextStage, teamAfter),
        });
    },

    // Cura o time (nó RECUPERAÇÃO do mapa de rotas). Não muta o original.
    recover: (healPct: number) => {
        const { team } = get();
        set({ team: applyRecovery(team, healPct) });
    },

    novaRun: () => get().startRun(),
}));