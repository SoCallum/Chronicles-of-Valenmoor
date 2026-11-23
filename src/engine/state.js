/**
 * Run state creation, derived stats/equipment calculations, and localStorage persistence.
 */

import { STAT_KEYS } from "./dice.js";

export const SAVE_STORAGE_KEY = "valenmoor_chronicle_save_v1";

export function getClassById(catalog, classId) {
  return catalog.classes.find((c) => c.id === classId) || catalog.classes[0];
}

export function computeDerivedStats(hero, catalog) {
  const cls = getClassById(catalog, hero.classId);
  const stats = { ...hero.baseStats };
  let attackBonus = 0;
  let damageDie = 6;
  let armor = cls.baseArmor;
  let maxHp = cls.baseHp;
  let maxFocus = cls.baseFocus;
  let gearValue = 0;

  // Might adds bonus HP, Arcana adds bonus Focus
  maxHp += Math.max(0, Math.floor((stats.might - 10) / 2) * 2);
  maxFocus += Math.max(0, Math.floor((stats.arcana - 10) / 2));

  const slots = ["weapon", "armor", "talisman"];
  slots.forEach((slot) => {
    const itemId = hero.equipment?.[slot];
    if (!itemId) return;
    const item = catalog.equipment[itemId];
    if (!item) return;

    gearValue += item.price || 0;
    if (item.slot === "weapon") {
      damageDie = item.damageDie || damageDie;
    }
    attackBonus += item.attackBonus || 0;
    armor += item.armorBonus || 0;
    maxHp += item.maxHpBonus || 0;
    maxFocus += item.maxFocusBonus || 0;

    if (item.bonusStats) {
      STAT_KEYS.forEach((key) => {
        stats[key] = (stats[key] || 10) + (item.bonusStats[key] || 0);
      });
    }
  });

  // Agility also helps armor slightly
  armor += Math.max(0, Math.floor((stats.agility - 12) / 2));

  return {
    stats,
    attackBonus,
    damageDie,
    armor,
    maxHp,
    maxFocus,
    gearValue,
    primaryStat: cls.primaryStat
  };
}

export function createNewRunState({ heroName, classId, portraitKey, baseStats, catalog, tutorialMode = false }) {
  const cls = getClassById(catalog, classId);
  const hero = {
    name: heroName || "Aldric Dawnblade",
    classId: cls.id,
    className: cls.name,
    shortTitle: cls.shortTitle,
    portraitKey: portraitKey || cls.portraitKey,
    baseStats: {
      might: baseStats?.might ?? cls.recommendedStats.might,
      arcana: baseStats?.arcana ?? cls.recommendedStats.arcana,
      agility: baseStats?.agility ?? cls.recommendedStats.agility,
      presence: baseStats?.presence ?? cls.recommendedStats.presence
    },
    equipment: { ...cls.startingGear },
    ownedGear: Object.values(cls.startingGear).filter(Boolean),
    consumables: [...cls.startingItems],
    relics: []
  };

  const derived = computeDerivedStats(hero, catalog);

  return {
    runId: `VM-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    startedAt: new Date().toISOString(),
    tutorialMode,
    mode: "scene", // "scene" | "combat" | "sanctuary" | "ended"
    activeChapterId: tutorialMode ? "tutorial" : "chapter-01",
    currentNodeId: null,
    hero,
    hp: derived.maxHp,
    maxHp: derived.maxHp,
    focus: derived.maxFocus,
    maxFocus: derived.maxFocus,
    gold: 45,
    dread: 0,
    maxDread: 6,
    wardenDreadShieldUsed: false,
    rerollUsedStages: [],
    completedChapters: [],
    chapterResults: [],
    flags: [],
    loreIds: [],
    solvedRiddles: [],
    failedRiddles: [],
    relicUnlocks: 0,
    enemiesDefeated: 0,
    bossesDefeated: 0,
    veilBreaches: 0,
    turns: 0,
    stanceCounts: {
      heroic: 0,
      arcane: 0,
      cunning: 0,
      witty: 0
    },
    hearthRestedThisVisit: false,
    scoreSubmitted: false,
    lastCheckBanner: null
  };
}

export function syncHeroCaps(state, catalog) {
  const derived = computeDerivedStats(state.hero, catalog);
  const hpDiff = derived.maxHp - state.maxHp;
  const focusDiff = derived.maxFocus - state.maxFocus;
  state.maxHp = derived.maxHp;
  state.maxFocus = derived.maxFocus;
  if (hpDiff > 0) state.hp += hpDiff;
  if (focusDiff > 0) state.focus += focusDiff;
  state.hp = Math.max(0, Math.min(state.maxHp, state.hp));
  state.focus = Math.max(0, Math.min(state.maxFocus, state.focus));
  return derived;
}

export function equipGearItem(state, itemId, catalog) {
  const item = catalog.equipment[itemId];
  if (!item) return false;
  if (!state.hero.ownedGear.includes(itemId)) {
    state.hero.ownedGear.push(itemId);
  }
  state.hero.equipment[item.slot] = itemId;
  syncHeroCaps(state, catalog);
  return true;
}

export function getLoreCounts(state, catalog) {
  let critical = 0;
  let optional = 0;
  (state.loreIds || []).forEach((id) => {
    const entry = catalog.lore[id];
    if (entry?.type === "critical") critical += 1;
    else optional += 1;
  });
  return { critical, optional };
}

export function buildScoringInput(state, catalog) {
  const derived = computeDerivedStats(state.hero, catalog);
  const { critical, optional } = getLoreCounts(state, catalog);
  return {
    chapterResults: state.chapterResults,
    criticalLoreCount: critical,
    optionalLoreCount: optional,
    riddlesSolved: state.solvedRiddles.length,
    relicUnlocks: state.relicUnlocks,
    enemiesDefeated: state.enemiesDefeated,
    bossesDefeated: state.bossesDefeated,
    stanceCounts: state.stanceCounts,
    gold: state.gold,
    gearValue: derived.gearValue,
    veilBreaches: state.veilBreaches
  };
}

export function saveRunToStorage(state) {
  if (typeof localStorage === "undefined" || !state || state.tutorialMode) return false;
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadRunFromStorage() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.hero || !parsed.runId || parsed.mode === "ended") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRunStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // ignore storage restrictions
  }
}
