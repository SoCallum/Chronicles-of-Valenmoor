/**
 * Shared deterministic scoring & Legend Title engine.
 * Imported directly by both browser client and Node server (authoritative re-scoring).
 */

export const ENDING_SCORES = {
  legendary: 750,
  triumph: 550,
  bittersweet: 325,
  fallen: 0
};

export const SCORE_WEIGHTS = {
  criticalLore: 65,
  optionalLore: 25,
  riddleSolved: 75,
  relicUnlock: 100,
  enemyDefeated: 80,
  bossDefeated: 180,
  stanceBeat: 20,
  stanceCapPerChapter: 140,
  stanceCapCampaign: 360,
  cleanDreadBonus: 120,
  lowDreadBonus: 60,
  highDreadPenaltyPerPoint: 25,
  veilBreachPenalty: 150,
  hoardCap: 400
};

const clampInt = (value, min = 0, max = 999999) => {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

export function deriveLegendTitle(run = {}) {
  const chapters = Array.isArray(run.chapterResults) ? run.chapterResults : [];
  const completedCount = chapters.filter((c) => c && c.endingType && c.endingType !== "fallen").length;
  const hasFinaleLegendary = chapters.some(
    (c) => c && c.chapterId === "chapter-04" && c.endingType === "legendary"
  );

  if (completedCount >= 4 && hasFinaleLegendary) {
    return { id: "mythic", title: "Mythic Sovereign" };
  }

  const stances = run.stanceCounts || {};
  const heroic = clampInt(stances.heroic, 0, 500);
  const arcane = clampInt(stances.arcane, 0, 500);
  const cunning = clampInt(stances.cunning, 0, 500);
  const witty = clampInt(stances.witty, 0, 500);

  const ranked = [
    { id: "witty", title: "Silver-Tongued Bard", value: witty },
    { id: "arcane", title: "Arcane Savant", value: arcane + clampInt(run.riddlesSolved, 0, 50) },
    { id: "heroic", title: "Ironclad Vanguard", value: heroic + clampInt(run.bossesDefeated, 0, 20) },
    { id: "cunning", title: "Ghost of the Reach", value: cunning }
  ].sort((a, b) => b.value - a.value);

  if (ranked[0].value >= 2) {
    return { id: ranked[0].id, title: ranked[0].title };
  }
  return { id: "balanced", title: "Wayfarer of Valenmoor" };
}

export function computeChronicleScore(run = {}) {
  const chapterResults = Array.isArray(run.chapterResults) ? run.chapterResults : [];

  let chapterCompletion = 0;
  let dreadControl = 0;

  chapterResults.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const endingType = entry.endingType || "fallen";
    chapterCompletion += ENDING_SCORES[endingType] ?? 0;

    if (endingType !== "fallen") {
      const dread = clampInt(entry.dreadAtEnd, 0, 20);
      if (dread === 0) {
        dreadControl += SCORE_WEIGHTS.cleanDreadBonus;
      } else if (dread <= 2) {
        dreadControl += SCORE_WEIGHTS.lowDreadBonus;
      } else if (dread >= 4) {
        dreadControl -= (dread - 3) * SCORE_WEIGHTS.highDreadPenaltyPerPoint;
      }
    }
  });

  const criticalLoreCount = clampInt(run.criticalLoreCount, 0, 50);
  const optionalLoreCount = clampInt(run.optionalLoreCount, 0, 50);
  const riddlesSolved = clampInt(run.riddlesSolved, 0, 30);
  const relicUnlocks = clampInt(run.relicUnlocks, 0, 30);

  const loreAndRelics =
    criticalLoreCount * SCORE_WEIGHTS.criticalLore +
    optionalLoreCount * SCORE_WEIGHTS.optionalLore +
    riddlesSolved * SCORE_WEIGHTS.riddleSolved +
    relicUnlocks * SCORE_WEIGHTS.relicUnlock;

  const enemiesDefeated = clampInt(run.enemiesDefeated, 0, 50);
  const bossesDefeated = clampInt(run.bossesDefeated, 0, 20);
  const combatMastery =
    enemiesDefeated * SCORE_WEIGHTS.enemyDefeated +
    bossesDefeated * SCORE_WEIGHTS.bossDefeated;

  const stances = run.stanceCounts || {};
  const totalStanceBeats =
    clampInt(stances.witty, 0, 100) +
    clampInt(stances.heroic, 0, 100) +
    clampInt(stances.arcane, 0, 100) +
    clampInt(stances.cunning, 0, 100);
  const cap = Math.min(
    SCORE_WEIGHTS.stanceCapCampaign,
    Math.max(1, chapterResults.length) * SCORE_WEIGHTS.stanceCapPerChapter
  );
  const styleBonus = Math.min(totalStanceBeats * SCORE_WEIGHTS.stanceBeat, cap);

  const hoardPoints = Math.min(
    SCORE_WEIGHTS.hoardCap,
    clampInt(run.gold, 0, 5000) + Math.floor(clampInt(run.gearValue, 0, 5000) / 2)
  );

  const veilBreaches = clampInt(run.veilBreaches, 0, 10);
  const penalties = veilBreaches * SCORE_WEIGHTS.veilBreachPenalty;

  const total = Math.max(
    0,
    chapterCompletion + loreAndRelics + combatMastery + styleBonus + dreadControl + hoardPoints - penalties
  );

  const legend = deriveLegendTitle(run);

  let overallEnding = "fallen";
  if (chapterResults.length > 0) {
    const last = chapterResults[chapterResults.length - 1];
    overallEnding = last?.endingType || "fallen";
  }

  return {
    total,
    overallEnding,
    legendTitle: legend.title,
    legendStyle: legend.id,
    chaptersCleared: chapterResults.filter((c) => c && c.endingType && c.endingType !== "fallen").length,
    breakdown: {
      chapterCompletion,
      loreAndRelics,
      combatMastery,
      styleBonus,
      dreadControl,
      hoardPoints,
      penalties: -penalties
    }
  };
}
