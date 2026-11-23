/**
 * Tabletop d20 & ability score mechanics for Chronicles of Valenmoor.
 */

export const STAT_KEYS = ["might", "arcana", "agility", "presence"];

export const STAT_LABELS = {
  might: "Might",
  arcana: "Arcana",
  agility: "Agility",
  presence: "Presence"
};

export function getModifier(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return 0;
  return Math.floor((numeric - 10) / 2);
}

export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function rollDie(sides, rng = Math.random) {
  return Math.floor(rng() * sides) + 1;
}

export function roll4d6DropLowest(rng = Math.random) {
  const rolls = [rollDie(6, rng), rollDie(6, rng), rollDie(6, rng), rollDie(6, rng)];
  rolls.sort((a, b) => a - b);
  return {
    rolls,
    dropped: rolls[0],
    total: rolls[1] + rolls[2] + rolls[3]
  };
}

export function rollStatArray(rng = Math.random) {
  return STAT_KEYS.map(() => roll4d6DropLowest(rng).total).sort((a, b) => b - a);
}

/**
 * Exact probability (0..100%) of meeting or beating DC on a d20 + modifier.
 * Natural 20 always succeeds; natural 1 always fails.
 */
export function calculateCheckOdds(statScore, dc, hasAdvantage = false) {
  const mod = getModifier(statScore);
  let singleSuccesses = 0;
  for (let face = 1; face <= 20; face += 1) {
    if (face === 20 || (face !== 1 && face + mod >= dc)) {
      singleSuccesses += 1;
    }
  }
  const pSingle = singleSuccesses / 20;
  const p = hasAdvantage ? 1 - (1 - pSingle) * (1 - pSingle) : pSingle;
  return Math.round(p * 100);
}

export function resolveSkillCheck({ statScore, dc, hasAdvantage = false, rng = Math.random }) {
  const mod = getModifier(statScore);
  const r1 = rollDie(20, rng);
  const r2 = hasAdvantage ? rollDie(20, rng) : null;
  const chosen = hasAdvantage ? Math.max(r1, r2) : r1;
  const total = chosen + mod;
  const isCritSuccess = chosen === 20;
  const isCritFail = chosen === 1;
  const success = isCritSuccess || (!isCritFail && total >= dc);

  return {
    rolls: hasAdvantage ? [r1, r2] : [r1],
    chosen,
    modifier: mod,
    total,
    dc,
    hasAdvantage,
    isCritSuccess,
    isCritFail,
    success
  };
}
