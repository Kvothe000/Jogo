import { describe, expect, it } from 'vitest';
import { buildCreature, applyMutate } from '../src/core/creature';
import type { Recipe } from '../src/types';

describe('sinergias declarativas (GDD seções 4.4 e 5)', () => {
    it('Fogo + Bestial aplica Fúria Crescente (+20% atk)', () => {
        const c = buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' });
        expect(c.effects.some((fx) => fx.id === 'furia-crescente')).toBe(true);
        expect(c.stats.atk).toBeGreaterThan(c.baseStats.atk);
    });

    it('Fogo + Vegetal aplica Combustão Instável (-30% HP)', () => {
        const c = buildCreature({ core: 'FOGO', body: 'VEGETAL', instinct: 'FRENESI', origin: 'RARO' });
        const fx = c.effects.find((e) => e.id === 'combustao-instavel');
        expect(fx).toBeDefined();
        expect(c.stats.hp).toBe(Math.round(c.baseStats.hp * 0.7));
    });

    it('Luz + Sombra desativa passivas', () => {
        const c = buildCreature({ core: 'LUZ', body: 'BESTIAL', instinct: 'FRENESI', origin: 'SOMBRA' });
        expect(c.disabledPassives).toBe(true);
    });

    it('combinação sem regra é neutra', () => {
        const c = buildCreature({ core: 'AGUA', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' });
        expect(c.effects).toHaveLength(0);
    });

    it('MUTAR troca o eixo e recalcula a identidade', () => {
        const team = [buildCreature({ core: 'FOGO', body: 'VEGETAL', instinct: 'FRENESI', origin: 'RARO' })];
        const next = applyMutate(team, 0, 'BODY', 'BESTIAL');
        expect(next[0].effects.some((fx) => fx.id === 'combustao-instavel')).toBe(false);
        expect(next[0].effects.some((fx) => fx.id === 'furia-crescente')).toBe(true);
        expect(next[0].id).not.toBe(team[0].id);
    });
});