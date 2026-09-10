import { describe, expect, it } from 'vitest';
import { buildCreature } from '../src/core/creature';
import { CONTRACT_IDS, evaluateContract, generateContractForRun, getContract } from '../src/run/contracts';
import type { ContractContext } from '../src/run/contracts';

function ctx(partial: Partial<ContractContext> = {}): ContractContext {
    return { victory: true, playerCasualties: 0, finalTeam: [], createdCount: 0, sacrificedCount: 0, ...partial };
}

const teamOf3 = () => [
    buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' }),
    buildCreature({ core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' }),
    buildCreature({ core: 'LUZ', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'SOMBRA' }),
];

describe('Contratos de Run (GDD 7.1, ⚠️ v0.6)', () => {
    it('gera contrato determinístico a partir do mesmo runSeed', () => {
        expect(generateContractForRun(42).id).toBe(generateContractForRun(42).id);
    });

    it('SEM_PERDAS: só cumpre com vitória e 0 baixas', () => {
        const c = getContract('SEM_PERDAS');
        expect(evaluateContract(c, ctx())).toBe(true);
        expect(evaluateContract(c, ctx({ playerCasualties: 1 }))).toBe(false);
        expect(evaluateContract(c, ctx({ victory: false }))).toBe(false);
    });

    it('TRES_CORES: exige 3 criaturas com COREs distintos', () => {
        const c = getContract('TRES_CORES');
        expect(evaluateContract(c, ctx({ finalTeam: teamOf3() }))).toBe(true);
        const duplicados = [
            buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' }),
            buildCreature({ core: 'FOGO', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' }),
            buildCreature({ core: 'AGUA', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'SOMBRA' }),
        ];
        expect(evaluateContract(c, ctx({ finalTeam: duplicados }))).toBe(false);
        expect(evaluateContract(c, ctx({ finalTeam: teamOf3().slice(0, 2) }))).toBe(false);
    });

    it('DOIS_SOZINHOS: exige vitória com 2 criaturas', () => {
        const c = getContract('DOIS_SOZINHOS');
        expect(evaluateContract(c, ctx({ finalTeam: teamOf3().slice(0, 2) }))).toBe(true);
        expect(evaluateContract(c, ctx({ finalTeam: teamOf3() }))).toBe(false);
    });

    it('SEM_CRIAR: falha se CRIAR foi usado', () => {
        const c = getContract('SEM_CRIAR');
        expect(evaluateContract(c, ctx())).toBe(true);
        expect(evaluateContract(c, ctx({ createdCount: 1 }))).toBe(false);
    });

    it('SACRIFICADOR: exige pelo menos 1 sacrifício', () => {
        const c = getContract('SACRIFICADOR');
        expect(evaluateContract(c, ctx({ sacrificedCount: 1 }))).toBe(true);
        expect(evaluateContract(c, ctx({ sacrificedCount: 0 }))).toBe(false);
    });

    it('nenhum contrato é cumprido com derrota', () => {
        for (const id of CONTRACT_IDS) {
            const c = getContract(id);
            expect(evaluateContract(c, ctx({ victory: false, playerCasualties: 0, sacrificedCount: 1, finalTeam: teamOf3() }))).toBe(false);
        }
    });
});