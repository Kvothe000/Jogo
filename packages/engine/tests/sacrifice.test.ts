import { describe, expect, it } from 'vitest';
import type { Creature, Offer } from '../src/types';
import { applySacrifice, buildCreature } from '../src/core/creature';
import { applyOffer, generateOffers, resolveSacrifice } from '../src/core/offers';

function teamOf3(): Creature[] {
    return [
        buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' }),
        buildCreature({ core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' }),
        buildCreature({ core: 'LUZ', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'SOMBRA' }),
    ];
}

describe('SACRIFICAR (GDD seção 4.1, F1)', () => {
    it('remove a vítima e transfere a parte escolhida para o alvo', () => {
        const team = teamOf3();
        const next = applySacrifice(team, 0, 1, 'BODY');
        expect(next).toHaveLength(2);
        // alvo (índice 1 na lista original) herdou o BODY da vítima
        expect(next[0].recipe.body).toBe('BESTIAL');
        // vítima (FOGO/BESTIAL) foi removida
        expect(next.some((c) => c.id === team[0].id)).toBe(false);
    });

    it('recalcula o índice do alvo quando a vítima vem antes dele', () => {
        const team = teamOf3();
        const next = applySacrifice(team, 0, 2, 'CORE');
        expect(next).toHaveLength(2);
        // vítima (índice 0) removida → alvo original (índice 2) agora é o índice 1
        expect(next[1].recipe.core).toBe('FOGO');
    });

    it('lança erro com time de 1 criatura', () => {
        const team = teamOf3().slice(0, 1);
        expect(() => applySacrifice(team, 0, 1, 'BODY')).toThrow();
    });

    it('lança erro quando vítima e alvo são iguais', () => {
        const team = teamOf3();
        expect(() => applySacrifice(team, 1, 1, 'BODY')).toThrow();
    });

    it('é determinístico: mesma entrada → mesmo resultado', () => {
        const team = teamOf3();
        const a = applySacrifice(team, 0, 1, 'INSTINCT');
        const b = applySacrifice(team, 0, 1, 'INSTINCT');
        expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
        expect(a[0].effects.map((fx) => fx.id)).toEqual(b[0].effects.map((fx) => fx.id));
    });

    it('a parte transferida pode ativar/remover sinergias (reconstrução)', () => {
        const team = [
            buildCreature({ core: 'AGUA', body: 'VEGETAL', instinct: 'GUARDIAO', origin: 'RARO' }),
            buildCreature({ core: 'FOGO', body: 'CRISTALINO', instinct: 'FRENESI', origin: 'RARO' }),
        ];
        const next = applySacrifice(team, 0, 1, 'BODY');
        // alvo herdou BODY Vegetal → FOGO + VEGETAL ativa Combustão Instável (-30% HP)
        expect(next[0].effects.some((fx) => fx.id === 'combustao-instavel')).toBe(true);
    });
});

describe('SACRIFICAR no fluxo de ofertas (F1)', () => {
    it('time cheio recebe SACRIFICAR como 2ª oferta (em vez de CRIAR)', () => {
        const offers = generateOffers(1234, 1, teamOf3());
        expect(offers).toHaveLength(3);
        expect(offers.some((o) => o.kind === 'SACRIFICAR')).toBe(true);
        expect(offers.some((o) => o.kind === 'CRIAR')).toBe(false);
    });

    it('time com slot vazio continua recebendo CRIAR (sem SACRIFICAR)', () => {
        const offers = generateOffers(1234, 1, teamOf3().slice(0, 2));
        expect(offers.some((o) => o.kind === 'CRIAR')).toBe(true);
        expect(offers.some((o) => o.kind === 'SACRIFICAR')).toBe(false);
    });

    it('applyOffer resolve SACRIFICAR e devolve o time reduzido', () => {
        const team = teamOf3();
        const offers = generateOffers(99, 2, team);
        const sac = offers.find((o) => o.kind === 'SACRIFICAR') as Extract<Offer, { kind: 'SACRIFICAR' }>;
        const resolved = resolveSacrifice(sac, 1, 2, 'ORIGIN');
        const next = applyOffer(team, resolved);
        expect(next).toHaveLength(2);
        expect(next[1].recipe.origin).toBe('HIBRIDO'); // vítima (índice 1) era HIBRIDO
    });

    it('SACRIFICAR incompleto lança erro', () => {
        const team = teamOf3();
        const offers = generateOffers(99, 2, team);
        const sac = offers.find((o) => o.kind === 'SACRIFICAR') as Extract<Offer, { kind: 'SACRIFICAR' }>;
        expect(() => applyOffer(team, sac)).toThrow();
    });
});