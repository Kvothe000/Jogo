import { describe, expect, it } from 'vitest';
import { buildCreature } from '../src/core/creature';
import { applyRecovery, buildNodeRewards, generateRunMap, MAP_DECISION_LAYERS, MAP_LAYERS_TOTAL, selectNode } from '../src/run/map';

const one = () => buildCreature({ core: 'FOGO', body: 'BESTIAL', instinct: 'FRENESI', origin: 'RARO' });

const teamOf3 = () => [
    one(),
    buildCreature({ core: 'AGUA', body: 'CRISTALINO', instinct: 'GUARDIAO', origin: 'HIBRIDO' }),
    buildCreature({ core: 'LUZ', body: 'VEGETAL', instinct: 'SINCRONIA', origin: 'SOMBRA' }),
];

describe('Mapa de Rotas (GDD 7.1, ⚠️ v0.6)', () => {
    it('é determinístico: mesmo seed → mesmo mapa', () => {
        expect(JSON.stringify(generateRunMap(7))).toBe(JSON.stringify(generateRunMap(7)));
    });

    it('tem 4 camadas de decisão + 1 camada de chefe', () => {
        const map = generateRunMap(1);
        expect(map.layers).toHaveLength(MAP_LAYERS_TOTAL);
        expect(map.layers).toHaveLength(MAP_DECISION_LAYERS + 1);
    });

    it('a última camada é sempre o chefe', () => {
        const last = selectNode(generateRunMap(9), MAP_LAYERS_TOTAL, 0);
        expect(last.type).toBe('CHEFE');
    });

    it('cada camada de decisão tem exatamente 1 COMBATE, 1 MUTACAO e 1 RECUPERACAO', () => {
        const map = generateRunMap(3);
        for (let layer = 1; layer <= MAP_DECISION_LAYERS; layer++) {
            const types = map.layers[layer - 1].map((n) => n.type).sort();
            expect(types).toEqual(['COMBATE', 'MUTACAO', 'RECUPERACAO']);
        }
    });

    it('seeds diferentes produzem ordens diferentes (não-trivialidade)', () => {
        const a = generateRunMap(5);
        const b = generateRunMap(6);
        expect(JSON.stringify(a.layers[0])).not.toBe(JSON.stringify(b.layers[0]));
    });

    it('selectNode valida camada/nó inexistente', () => {
        const map = generateRunMap(2);
        expect(() => selectNode(map, 99, 0)).toThrow();
        expect(() => selectNode(map, 1, 9)).toThrow();
    });
});

describe('Recompensas por tipo de nó', () => {
    it('COMBATE gera ofertas padrão (contém MUTAR)', () => {
        const node = generateRunMap(11).layers[0].find((n) => n.type === 'COMBATE')!;
        const offers = buildNodeRewards(11, node, teamOf3());
        expect(offers.length).toBeGreaterThan(0);
        expect(offers.some((o) => o.kind === 'MUTAR')).toBe(true);
    });

    it('MUTACAO gera leque apenas com MUTARs', () => {
        const node = generateRunMap(13).layers[1].find((n) => n.type === 'MUTACAO')!;
        const offers = buildNodeRewards(13, node, teamOf3());
        expect(offers.length).toBeGreaterThan(0);
        expect(offers.every((o) => o.kind === 'MUTAR')).toBe(true);
    });

    it('RECUPERACAO não gera ofertas', () => {
        const node = generateRunMap(17).layers[2].find((n) => n.type === 'RECUPERACAO')!;
        expect(buildNodeRewards(17, node, teamOf3())).toHaveLength(0);
    });

    it('CHEFE não gera ofertas', () => {
        const node = selectNode(generateRunMap(19), MAP_LAYERS_TOTAL, 0);
        expect(buildNodeRewards(19, node, teamOf3())).toHaveLength(0);
    });
});

describe('applyRecovery (prepara a persistência de HP do F1)', () => {
    it('cura o percentual e respeita o teto de HP', () => {
        const c = one();
        const hurt = { ...c, hp: Math.floor(c.stats.hp * 0.5) };
        const next = applyRecovery([hurt], 0.25);
        expect(next[0].hp).toBe(Math.min(hurt.stats.hp, hurt.hp + Math.round(hurt.stats.hp * 0.25)));
    });

    it('não ultrapassa o maxHp', () => {
        const c = one();
        const low = { ...c, hp: Math.floor(c.stats.hp * 0.1) };
        expect(applyRecovery([low], 10)[0].hp).toBe(low.stats.hp);
    });

    it('não muta o time original', () => {
        const c = one();
        const low = { ...c, hp: Math.floor(c.stats.hp * 0.5) };
        const originalHp = low.hp;
        applyRecovery([low], 0.5);
        expect(low.hp).toBe(originalHp);
    });
});