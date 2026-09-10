import type { Creature } from '../types';

/** Contratos de run (GDD seção 7.1, ⚠️ PROPOSTA v0.6) — objetivos opcionais determinísticos. */
export type ContractId = 'SEM_PERDAS' | 'TRES_CORES' | 'DOIS_SOZINHOS' | 'SEM_CRIAR' | 'SACRIFICADOR';

export interface RunContract {
    id: ContractId;
    title: string; // UI pt-BR
    desc: string;  // UI pt-BR
}

export const CONTRACTS: Record<ContractId, Omit<RunContract, 'id'>> = {
    SEM_PERDAS: {
        title: 'Sem Perdas',
        desc: 'Vença a run sem perder nenhuma criatura.',
    },
    TRES_CORES: {
        title: 'Três Essências',
        desc: 'Vença a run com 3 criaturas de COREs diferentes no time.',
    },
    DOIS_SOZINHOS: {
        title: 'Dupla Improvável',
        desc: 'Vença a run com apenas 2 criaturas no time.',
    },
    SEM_CRIAR: {
        title: 'Purista',
        desc: 'Vença a run sem usar CRIAR (apenas mutações e sacrifícios).',
    },
    SACRIFICADOR: {
        title: 'Mão Pesada',
        desc: 'Vença a run usando SACRIFICAR pelo menos 1 vez.',
    },
};

export const CONTRACT_IDS: ContractId[] = Object.keys(CONTRACTS) as ContractId[];

/** Contexto de avaliação — preenchido pelo estado da run ao longo das etapas. */
export interface ContractContext {
    victory: boolean;
    playerCasualties: number; // criaturas do jogador que morreram em toda a run
    finalTeam: Creature[];    // time no momento do fim da run
    createdCount: number;     // quantas vezes CRIAR foi aplicado na run
    sacrificedCount: number;  // quantas vezes SACRIFICAR foi aplicado na run
}

export function getContract(id: ContractId): RunContract {
    return { id, ...CONTRACTS[id] };
}

/** Escolhe 1 contrato determinístico para a run a partir do runSeed. */
export function generateContractForRun(runSeed: number): RunContract {
    const h = Math.abs((runSeed ^ 0x9e3779b9) >>> 0);
    return getContract(CONTRACT_IDS[h % CONTRACT_IDS.length]);
}

/** Avalia se o contrato foi cumprido (puro e determinístico). */
export function evaluateContract(contract: RunContract, ctx: ContractContext): boolean {
    if (!ctx.victory) return false;
    switch (contract.id) {
        case 'SEM_PERDAS':
            return ctx.playerCasualties === 0;
        case 'TRES_CORES':
            return ctx.finalTeam.length === 3 && new Set(ctx.finalTeam.map((c) => c.recipe.core)).size === 3;
        case 'DOIS_SOZINHOS':
            return ctx.finalTeam.length === 2;
        case 'SEM_CRIAR':
            return ctx.createdCount === 0;
        case 'SACRIFICADOR':
            return ctx.sacrificedCount >= 1;
    }
}