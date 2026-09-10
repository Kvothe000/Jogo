import { describe, expect, it } from 'vitest';
import { applyBattleResult, buildCreature } from '../src/core/creature';
import { simulateBattle } from '../src/battle/simulate';
import { applyRecovery } from '../src/run/map';
import type { Creature } from '../src/types';

const teamOf3 = () => [
    buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' }),
    buildCreature({ core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' }),
    buildCreature({ core: 'LUZ', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'SOMBRA' }),
];

const weakEnemy = () => [buildCreature({ core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'RARO' })];

describe('Persistência de HP entre batalhas (GDD 7.3, F1)', () => {
    it('buildCreature nasce com HP cheio', () => {
        const c = buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' });
        expect(c.hp).toBe(c.stats.hp);
    });

    it('applyBattleResult preserva o HP sobrevivente após a batalha', () => {
        const team = teamOf3();
        const result = simulateBattle(team, weakEnemy());
        const after = applyBattleResult(team, result);
        for (const c of after) {
            expect(c.hp).toBeGreaterThanOrEqual(0);
            expect(c.hp).toBeLessThanOrEqual(c.stats.hp);
        }
    });

    it('é determinístico: mesma entrada → mesmo HP final', () => {
        const a = applyBattleResult(teamOf3(), simulateBattle(teamOf3(), weakEnemy()));
        const b = applyBattleResult(teamOf3(), simulateBattle(teamOf3(), weakEnemy()));
        expect(a.map((c) => c.hp)).toEqual(b.map((c) => c.hp));
    });

    it('applyRecovery cura até o teto e não ultrapassa', () => {
        const c = buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' });
        const hurt = { ...c, hp: Math.floor(c.stats.hp * 0.5) };
        const healed = applyRecovery([hurt], 0.25);
        expect(healed[0].hp).toBe(Math.min(hurt.stats.hp, hurt.hp + Math.round(hurt.stats.hp * 0.25)));
        const full = applyRecovery([hurt], 10);
        expect(full[0].hp).toBe(hurt.stats.hp);
    });

    it('applyRecovery não muta o time original', () => {
        const c = buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' });
        const hurt = { ...c, hp: Math.floor(c.stats.hp * 0.5) };
        const before = hurt.hp;
        applyRecovery([hurt], 0.5);
        expect(hurt.hp).toBe(before);
    });

    it('MUTAR preserva o HP da criatura-alvo', async () => {
        const { applyMutate } = await import('../src/core/creature');
        const team = teamOf3();
        team[0].hp = 50;
        const next = applyMutate(team, 0, 'BODY', 'CRISTALINO');
        expect(next[0].hp).toBe(Math.min(next[0].stats.hp, 50));
    });
    it('a criatura perde HP após a batalha (pega regressão)', () => {
        const team = teamOf3();
        const result = simulateBattle(team, weakEnemy());
        const after = applyBattleResult(team, result);
        const perdeu = after.some((c) => c.hp < c.stats.hp);
        expect(perdeu).toBe(true);
    });
});