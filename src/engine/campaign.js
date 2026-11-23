/**
 * Campaign progression, effect application, Relic Riddle resolution,
 * Shadowblade rerolls, and Veil Dread breach handling.
 */

import { resolveSkillCheck } from "./dice.js";
import { computeDerivedStats, equipGearItem } from "./state.js";

export function applyNodeEffects(state, effects = {}, catalog = null) {
  if (!effects || typeof effects !== "object") return [];
  const notifications = [];

  if (Array.isArray(effects.flagsAdd)) {
    effects.flagsAdd.forEach((flag) => {
      if (flag && !state.flags.includes(flag)) {
        state.flags.push(flag);
      }
    });
  }

  if (Array.isArray(effects.loreAdd)) {
    effects.loreAdd.forEach((loreId) => {
      if (loreId && !state.loreIds.includes(loreId)) {
        state.loreIds.push(loreId);
        const label = catalog?.lore?.[loreId]?.label || loreId;
        notifications.push(`Lore Uncovered: ${label}`);
      }
    });
  }

  if (Array.isArray(effects.relicsAdd)) {
    effects.relicsAdd.forEach((relicId) => {
      if (relicId && !state.hero.relics.includes(relicId)) {
        state.hero.relics.push(relicId);
        const label = catalog?.relics?.[relicId]?.name || relicId;
        notifications.push(`Relic Acquired: ${label}`);
      }
    });
  }

  if (typeof effects.goldDelta === "number" && effects.goldDelta !== 0) {
    state.gold = Math.max(0, state.gold + effects.goldDelta);
    notifications.push(`${effects.goldDelta > 0 ? "+" : ""}${effects.goldDelta} Gold`);
  }

  if (typeof effects.hpDelta === "number" && effects.hpDelta !== 0) {
    state.hp = Math.max(0, Math.min(state.maxHp, state.hp + effects.hpDelta));
    notifications.push(`${effects.hpDelta > 0 ? "+" : ""}${effects.hpDelta} Vitality`);
  }

  if (typeof effects.focusDelta === "number" && effects.focusDelta !== 0) {
    state.focus = Math.max(0, Math.min(state.maxFocus, state.focus + effects.focusDelta));
  }

  if (typeof effects.dreadDelta === "number" && effects.dreadDelta !== 0) {
    if (effects.dreadDelta > 0 && state.hero.classId === "warden" && !state.wardenDreadShieldUsed) {
      state.wardenDreadShieldUsed = true;
      notifications.push("Whisper of Roots negated +1 Veil Dread!");
    } else {
      state.dread = Math.max(0, Math.min(state.maxDread, state.dread + effects.dreadDelta));
      notifications.push(`${effects.dreadDelta > 0 ? "+" : ""}${effects.dreadDelta} Veil Dread`);
    }
  }

  return notifications;
}

export function solveRelicRiddle({ state, riddleId, answerIndex, catalog }) {
  const riddle = catalog.riddles[riddleId];
  if (!riddle) return { status: "missing" };
  if (state.solvedRiddles.includes(riddleId) || state.failedRiddles.includes(riddleId)) {
    return { status: "already-answered" };
  }

  if (answerIndex === riddle.correctIndex) {
    state.solvedRiddles.push(riddleId);
    if (riddle.rewardRelic && !state.hero.relics.includes(riddle.rewardRelic)) {
      state.hero.relics.push(riddle.rewardRelic);
    }
    if (riddle.rewardLore && !state.loreIds.includes(riddle.rewardLore)) {
      state.loreIds.push(riddle.rewardLore);
    }
    return {
      status: "solved",
      message: riddle.successNote,
      rewardRelic: riddle.rewardRelic ? catalog.relics[riddle.rewardRelic] : null
    };
  }

  state.failedRiddles.push(riddleId);
  return {
    status: "failed",
    message: riddle.failNote
  };
}

export function canShadowbladeReroll(state, stage) {
  return state.hero.classId === "shadowblade" && !state.rerollUsedStages.includes(stage);
}

export function resolveNarrativeChoice({ state, node, choice, catalog, rng = Math.random }) {
  state.turns += 1;

  if (choice.stance && Object.prototype.hasOwnProperty.call(state.stanceCounts, choice.stance)) {
    state.stanceCounts[choice.stance] += 1;
  }

  // Combat trigger
  if (choice.combat) {
    applyNodeEffects(state, choice.effects, catalog);
    return {
      type: "combat",
      combatConfig: choice.combat,
      banner: null
    };
  }

  // Relic Golden Path bypass
  if (choice.relicBypass && state.hero.relics.includes(choice.relicBypass.itemId)) {
    state.relicUnlocks += 1;
    applyNodeEffects(state, choice.effects, catalog);
    const relic = catalog.relics[choice.relicBypass.itemId];
    return {
      type: "transition",
      nextNodeId: choice.check ? choice.check.successNext : choice.next,
      banner: {
        tone: "gold",
        title: `Golden Path · ${relic?.name || "Relic"}`,
        detail: choice.relicBypass.bonusText || "Relic unlocked an effortless triumph (+100 Mastery)!"
      }
    };
  }

  // Skill check choice
  if (choice.check) {
    const derived = computeDerivedStats(state.hero, catalog);
    const statScore = derived.stats[choice.check.stat] ?? 10;
    const hasAdvantage =
      Array.isArray(choice.check.advantageClasses) &&
      choice.check.advantageClasses.includes(state.hero.classId);

    let result = resolveSkillCheck({ statScore, dc: choice.check.dc, hasAdvantage, rng });
    let rerolled = false;

    // Shadowblade Fate's Gamble: auto-reroll a failed check once per chapter stage
    if (!result.success && canShadowbladeReroll(state, node.stage || "mid")) {
      state.rerollUsedStages.push(node.stage || "mid");
      result = resolveSkillCheck({ statScore, dc: choice.check.dc, hasAdvantage: true, rng });
      rerolled = true;
    }

    if (result.success) {
      applyNodeEffects(state, choice.effects, catalog);
      return {
        type: "transition",
        nextNodeId: choice.check.successNext,
        banner: {
          tone: "emerald",
          title: `${rerolled ? "Fate's Gamble! " : ""}${choice.check.stat.toUpperCase()} Check Succeeded (${result.total} vs DC ${choice.check.dc})`,
          detail: `Rolled [${result.rolls.join(", ")}] ${result.modifier >= 0 ? "+" : ""}${result.modifier}${
            result.isCritSuccess ? " · Natural 20!" : ""
          }`
        }
      };
    }

    applyNodeEffects(state, choice.check.failEffects, catalog);
    return {
      type: "transition",
      nextNodeId: choice.check.failNext,
      banner: {
        tone: "crimson",
        title: `${choice.check.stat.toUpperCase()} Check Failed (${result.total} vs DC ${choice.check.dc})`,
        detail: `Rolled [${result.rolls.join(", ")}] ${result.modifier >= 0 ? "+" : ""}${result.modifier}${
          result.isCritFail ? " · Natural 1!" : ""
        }`
      }
    };
  }

  // Direct narrative transition
  applyNodeEffects(state, choice.effects, catalog);
  return {
    type: "transition",
    nextNodeId: choice.next,
    banner: null
  };
}

export function recordChapterEnding({ state, chapterMeta, endingNode, catalog }) {
  const ending = endingNode.ending || {
    type: "triumph",
    headline: endingNode.title,
    epilogue: endingNode.summary || "",
    rewardGold: 40
  };

  if (ending.rewardGold) {
    state.gold += ending.rewardGold;
  }

  let rewardGear = null;
  if (ending.rewardItem && catalog.equipment[ending.rewardItem]) {
    rewardGear = catalog.equipment[ending.rewardItem];
    if (!state.hero.ownedGear.includes(ending.rewardItem)) {
      state.hero.ownedGear.push(ending.rewardItem);
    }
    // Auto-equip talisman if slot is currently empty
    if (!state.hero.equipment[rewardGear.slot]) {
      equipGearItem(state, ending.rewardItem, catalog);
    }
  }

  if (!state.tutorialMode) {
    const existingIdx = state.chapterResults.findIndex((c) => c.chapterId === chapterMeta.chapterId);
    const resultEntry = {
      chapterId: chapterMeta.chapterId,
      title: chapterMeta.title,
      endingType: ending.type,
      headline: ending.headline,
      epilogue: ending.epilogue,
      dreadAtEnd: state.dread
    };
    if (existingIdx >= 0) {
      state.chapterResults[existingIdx] = resultEntry;
    } else {
      state.chapterResults.push(resultEntry);
    }

    if (!state.completedChapters.includes(chapterMeta.chapterId) && ending.type !== "fallen") {
      state.completedChapters.push(chapterMeta.chapterId);
    }
  }

  return { ending, rewardGear };
}
