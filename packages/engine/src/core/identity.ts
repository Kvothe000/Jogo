import type { Recipe, Axis, PartValue } from '../types';

// Identidade determinística (GDD seção 3): mesma receita → mesmo ID, em qualquer conta.
// Hash versionada: mudar a lógica = mudar HASH_VERSION (receitas antigas não quebram).

export const HASH_VERSION = 1;

export function recipeKey(recipe: Recipe): string {
    return [recipe.core, recipe.body, recipe.instinct, recipe.origin].join('.');
}

export function axisPart(recipe: Recipe, axis: Axis): PartValue {
    switch (axis) {
        case 'CORE': return recipe.core;
        case 'BODY': return recipe.body;
        case 'INSTINCT': return recipe.instinct;
        case 'ORIGIN': return recipe.origin;
    }
}

export function withAxisPart(recipe: Recipe, axis: Axis, part: PartValue): Recipe {
    switch (axis) {
        case 'CORE': return { ...recipe, core: part as Recipe['core'] };
        case 'BODY': return { ...recipe, body: part as Recipe['body'] };
        case 'INSTINCT': return { ...recipe, instinct: part as Recipe['instinct'] };
        case 'ORIGIN': return { ...recipe, origin: part as Recipe['origin'] };
    }
}

function fnv1a(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/** Gera o ID de 6 dígitos, pseudo-aleatório mas reproduzível. Ex.: "018392". */
export function recipeId(recipe: Recipe): string {
    const h = fnv1a(`${HASH_VERSION}:${recipeKey(recipe)}`);
    const n = h % 1_000_000;
    return n.toString().padStart(6, '0');
}