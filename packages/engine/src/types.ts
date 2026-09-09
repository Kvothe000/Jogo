// Tipos centrais do motor — GDD v0.4.1, seções 2, 3, 4 e 5.

// ---- Eixos ----
export type Axis = 'CORE' | 'BODY' | 'INSTINCT' | 'ORIGIN';
export const AXES: Axis[] = ['CORE', 'BODY', 'INSTINCT', 'ORIGIN'];

export type CoreId = 'FOGO' | 'AGUA' | 'LUZ';
export type BodyId = 'BESTIAL' | 'CRISTALINO' | 'VEGETAL';
export type InstinctId = 'FRENESI' | 'GUARDIAO' | 'SINCRONIA';
export type OriginId = 'RARO' | 'SOMBRA' | 'HIBRIDO';

export type PartValue = CoreId | BodyId | InstinctId | OriginId;

export interface Recipe {
    core: CoreId;
    body: BodyId;
    instinct: InstinctId;
    origin: OriginId;
}

// ---- Atributos e papéis ----
export interface Stats {
    hp: number;
    atk: number;
    def: number;
    spd: number;
}

export type Role = 'dano' | 'suporte' | 'tanque';
export type TargetMode = 'maior-ameaca' | 'menor-hp' | 'maior-hp';

// ---- Definições de partes (dados de conteúdo) ----
export interface CoreDef {
    id: CoreId;
    label: string;
    color: string;
    desc: string;
    stats: Partial<Stats>;
}

export interface BodyDef {
    id: BodyId;
    label: string;
    color: string;
    desc: string;
    role: Role;
    target: TargetMode;
    stats: Partial<Stats>;
}

export interface InstinctDef {
    id: InstinctId;
    label: string;
    color: string;
    desc: string;
}

export interface OriginDef {
    id: OriginId;
    label: string;
    color: string;
    desc: string;
    stats: Partial<Stats>;
}

// ---- Sinergia (declarativa — nunca código por combinação) ----
export type SynergyKind = 'buff' | 'debuff';

export interface SynergyEffect {
    id: string;
    name: string;
    desc: string;
    kind: SynergyKind;
    /** Ajustes percentuais aplicados sobre o stat derivado (ex.: { hp: -0.3 } = -30% HP). */
    stats?: Partial<Stats>;
    healPerBattle?: boolean;
    extraActionOnSync?: boolean;
    disablePassives?: boolean;
}

export interface SynergyRule {
    id: string;
    axisA: Axis;
    partA: PartValue;
    axisB: Axis;
    partB: PartValue;
    effect: SynergyEffect;
}

// ---- Criatura ----
export interface Creature {
    /** ID determinístico de 6 dígitos (ex.: "018392") — token de compartilhamento. */
    id: string;
    recipe: Recipe;
    /** Apresentação textual (nome procedural fica para o F2). */
    label: string;
    /** Atributos derivados das partes, SEM sinergias. */
    baseStats: Stats;
    /** Sinergias ativas desta criatura. */
    effects: SynergyEffect[];
    /** Atributos finais = baseStats + efeitos de sinergia. */
    stats: Stats;
    /** true quando LUZ+SOMBRA (Conflito Interno) desativa o INSTINCT. */
    disabledPassives: boolean;
}

// ---- Ofertas (escolhas da run) ----
export type Offer =
    | { kind: 'MUTAR'; offerId: string; axis: Axis; partId: PartValue; targetIndex: number | null }
    | { kind: 'CRIAR'; offerId: string; recipe: Recipe };

export interface OfferPreview {
    teamAfter: Creature[];
    hpTotalBefore: number;
    hpTotalAfter: number;
    atkTotalBefore: number;
    atkTotalAfter: number;
    defTotalBefore: number;
    defTotalAfter: number;
    spdTotalBefore: number;
    spdTotalAfter: number;
    effectsAdded: SynergyEffect[];
    effectsRemoved: SynergyEffect[];
}

// ---- Batalha ----
export type BattleSide = 'player' | 'enemy';

export interface BattleEvent {
    round: number;
    actorId: string;
    actorLabel: string;
    targetId: string | null;
    targetLabel: string | null;
    kind: 'ataque' | 'passiva' | 'morte';
    amount?: number;
    note?: string;
}

export interface BattleUnit {
    id: string;
    label: string;
    recipe: Recipe;
    stats: Stats;
    maxHp: number;
    hp: number;
    effects: SynergyEffect[];
    disabledPassives: boolean;
    side: BattleSide;
}

export interface BattleResult {
    winner: BattleSide;
    rounds: number;
    events: BattleEvent[];
    playerSurvivors: number;
}

export interface DefeatAnalysis {
    cause: string;
    suggestion: string;
}