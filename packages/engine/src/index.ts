// API pública do motor — o app de UI importa APENAS daqui.
export * from './types';

// dados
export { CORES, BODIES, INSTINCTS, ORIGINS, CORE_LIST, BODY_LIST, INSTINCT_LIST, ORIGIN_LIST, BASE_STATS, STARTER_RECIPES } from './data/parts';
export { SYNERGY_RULES } from './data/synergy-rules';

// core
export { buildCreature, applyMutate, applyCreate, applySacrifice, applyBattleResult, creatureLabel, teamDelta, teamHpTotal, teamAtkTotal, teamDefTotal, teamSpdTotal, creaturePower, teamPower } from './core/creature';
export { mulberry32, randomRecipe, generateOffers, applyOffer, previewOffer, withTarget, resolveSacrifice } from './core/offers';
export { recipeId, recipeKey, axisPart, withAxisPart, HASH_VERSION } from './core/identity';


// battle
export { simulateBattle, analyzeDefeat, toUnits } from './battle/simulate';

// run
export { newRun, buildEnemyTeam, nextStage, STAGES_TOTAL } from './run/run';
export type { RunState } from './run/run';
export { CONTRACTS, CONTRACT_IDS, generateContractForRun, evaluateContract, getContract } from './run/contracts';
export type { RunContract, ContractId, ContractContext } from './run/contracts';
export { generateRunMap, selectNode, buildNodeRewards, applyRecovery, MAP_DECISION_LAYERS, MAP_LAYERS_TOTAL } from './run/map';
export type { RunMap, MapNode, MapNodeType } from './run/map';
