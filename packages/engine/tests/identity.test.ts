import { describe, expect, it } from 'vitest';
import { recipeId, recipeKey } from '../src/core/identity';
import { buildCreature } from '../src/core/creature';
import type { Recipe } from '../src/types';

const RECIPE: Recipe = { core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' };

describe('identidade determinística (GDD seção 3)', () => {
    it('mesma receita → mesma chave e mesmo ID', () => {
        expect(recipeKey(RECIPE)).toBe(recipeKey({ ...RECIPE }));
        expect(recipeId(RECIPE)).toBe(recipeId({ ...RECIPE }));
    });

    it('ID tem 6 dígitos', () => {
        expect(recipeId(RECIPE)).toMatch(/^\d{6}$/);
    });

    it('criaturas com a mesma receita têm o mesmo ID', () => {
        const a = buildCreature(RECIPE);
        const b = buildCreature(RECIPE);
        expect(a.id).toBe(b.id);
        expect(a.id).toBe(a.id);
    });

    it('receitas diferentes tendem a IDs diferentes', () => {
        const other: Recipe = { core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'RARO' };
        expect(recipeId(RECIPE)).not.toBe(recipeId(other));
    });
});