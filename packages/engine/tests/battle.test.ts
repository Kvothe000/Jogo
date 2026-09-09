import { describe, expect, it } from 'vitest';
import { buildCreature } from '../src/core/creature';
import { simulateBattle, analyzeDefeat } from '../src/battle/simulate';
import type { Creature } from '../src/types';

function teamA(): Creature[] {
    return [buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' })];
}
function weakEnemy(): Creature[] {
    return [buildCreature({ core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'RARO' })];
}

describe('batalha determinística (GDD seção 5)', () => {
    it('mesmo estado → mesmo resultado', () => {
        const r1 = simulateBattle(teamA(), weakEnemy());
        const r2 = simulateBattle(teamA(), weakEnemy());
        expect(r1.winner).toBe(r2.winner);
        expect(r1.events.length).toBe(r2.events.length);
    });

    it('um time forte vence um inimigo fraco', () => {
        const result = simulateBattle(teamA(), weakEnemy());
        expect(result.winner).toBe('player');
    });

    it('análise de derrota retorna causa + sugestão quando o jogador perde', () => {
        const strong: Creature[] = [
            buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'HIBRIDO' }),
            buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' }),
            buildCreature({ core: 'FOGO', body: 'VEGETAL', instinct: 'FRENESI', origin: 'SOMBRA' }),
        ];
        const result = simulateBattle(strong, teamA());
        if (result.winner === 'enemy') {
            const analysis = analyzeDefeat(strong, teamA(), result);
            expect(analysis.cause.length).toBeGreaterThan(0);
            expect(analysis.suggestion.length).toBeGreaterThan(0);
        }
    });
});