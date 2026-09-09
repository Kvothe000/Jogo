import type { SynergyRule } from '../types';

// Sinergias como DADOS (GDD seção 5.3): adicionar combinação = adicionar linha.
// Regra de volume F0: máx. 1–2 regras por par de eixos; sem regra = neutra.

export const SYNERGY_RULES: SynergyRule[] = [
    // --- Positivas (reforço) ---
    {
        id: 'furia-crescente',
        axisA: 'CORE', partA: 'FOGO',
        axisB: 'BODY', partB: 'BESTIAL',
        effect: {
            id: 'furia-crescente', name: 'Fúria Crescente', kind: 'buff',
            desc: 'Bônus de ataque em batalhas rápidas.',
            stats: { atk: 0.2 },
        },
    },
    {
        id: 'mare-de-cristal',
        axisA: 'CORE', partA: 'AGUA',
        axisB: 'BODY', partB: 'CRISTALINO',
        effect: {
            id: 'mare-de-cristal', name: 'Maré de Cristal', kind: 'buff',
            desc: 'Cura um pouco ao início de cada rodada.',
            healPerBattle: true,
        },
    },
    {
        id: 'mente-colmeia',
        axisA: 'INSTINCT', partA: 'SINCRONIA',
        axisB: 'ORIGIN', partB: 'HIBRIDO',
        effect: {
            id: 'mente-colmeia', name: 'Mente Colmeia', kind: 'buff',
            desc: 'Age duas vezes por rodada enquanto outro aliado tiver Sincronia.',
            extraActionOnSync: true,
        },
    },

    // --- Negativas (custo real) ---
    {
        id: 'combustao-instavel',
        axisA: 'CORE', partA: 'FOGO',
        axisB: 'BODY', partB: 'VEGETAL',
        effect: {
            id: 'combustao-instavel', name: 'Combustão Instável', kind: 'debuff',
            desc: 'O corpo vegetal queima: -30% de HP.',
            stats: { hp: -0.3 },
        },
    },
    {
        id: 'conflito-interno',
        axisA: 'CORE', partA: 'LUZ',
        axisB: 'ORIGIN', partB: 'SOMBRA',
        effect: {
            id: 'conflito-interno', name: 'Conflito Interno', kind: 'debuff',
            desc: 'A Sombra apaga a Luz: passivas desativadas.',
            disablePassives: true,
        },
    },
];