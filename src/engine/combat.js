/**
 * Tactical turn-based d20 combat engine with Enemy Intent Telegraphs,
 * Class Skills, Guard/Ward shields, Boss Relic Weaknesses, and Consumables.
 */

import { getModifier, rollDie } from "./dice.js";
import { computeDerivedStats, getClassById } from "./state.js";

export function createCombatSession({ state, enemyId, victoryNext, fleeNext, catalog }) {
  const template = catalog.enemies[enemyId];
  if (!template) {
    throw new Error(`Unknown enemyId: ${enemyId}`);
  }

  let hp = template.hp;
  let ac = template.ac;
  let weaknessTriggered = false;
  const log = [];

  if (template.weaknessRelic && state.hero.relics.includes(template.weaknessRelic)) {
    weaknessTriggered = true;
    ac = Math.max(10, ac - 2);
    const bonusCrack = Math.max(5, Math.round(template.hp * 0.2));
    hp = Math.max(6, hp - bonusCrack);
    log.push({
      tone: "gold",
      text: `Relic Synergy! ${template.weaknessNote}`
    });
  } else {
    log.push({
      tone: "neutral",
      text: `${template.name} steps forward! Watch its telegraphed intent before choosing your stance.`
    });
  }

  return {
    enemyId: template.id,
    name: template.name,
    title: template.title,
    isBoss: Boolean(template.isBoss),
    artKey: template.artKey,
    hp,
    maxHp: template.hp,
    ac,
    attackBonus: template.attackBonus,
    rewardGold: template.rewardGold || 25,
    intents: template.intents,
    intentIndex: 0,
    enemyWard: 0,
    enemyStunned: false,
    playerWard: 0,
    playerEvasion: 0,
    round: 1,
    victoryNext,
    fleeNext,
    weaknessTriggered,
    status: "active", // "active" | "victory" | "defeat" | "fled"
    lastRoll: null,
    log
  };
}

export function getCurrentEnemyIntent(combat) {
  return combat.intents[combat.intentIndex % combat.intents.length];
}

function advanceIntent(combat) {
  combat.intentIndex = (combat.intentIndex + 1) % combat.intents.length;
}

function applyEnemyDamage(combat, rawDamage, pierceArmor = false) {
  let remaining = Math.max(1, rawDamage);
  let absorbed = 0;
  if (!pierceArmor && combat.enemyWard > 0) {
    absorbed = Math.min(combat.enemyWard, remaining);
    combat.enemyWard -= absorbed;
    remaining -= absorbed;
  }
  combat.hp = Math.max(0, combat.hp - remaining);
  return { dealt: remaining, absorbed };
}

function resolveEnemyTurn(state, combat, derived, rng) {
  if (combat.hp <= 0) return;

  if (combat.enemyStunned) {
    combat.enemyStunned = false;
    combat.log.push({
      tone: "emerald",
      text: `${combat.name} is ensnared and misses its turn!`
    });
    advanceIntent(combat);
    combat.playerWard = 0;
    combat.playerEvasion = 0;
    combat.round += 1;
    return;
  }

  const intent = getCurrentEnemyIntent(combat);

  if (intent.type === "guard") {
    combat.enemyWard += intent.ward || 5;
    combat.log.push({
      tone: "neutral",
      text: `${combat.name} uses ${intent.label}, gaining +${intent.ward || 5} Ward.`
    });
  } else {
    const roll = rollDie(20, rng);
    const total = roll + combat.attackBonus;
    const effectiveAC = derived.armor + combat.playerEvasion;

    if (roll === 1 || (roll !== 20 && total < effectiveAC)) {
      combat.log.push({
        tone: "emerald",
        text: `${combat.name}'s ${intent.label} misses! (Rolled ${roll} + ${combat.attackBonus} = ${total} vs AC ${effectiveAC})`
      });
    } else {
      const baseDmg = intent.damage || 5;
      const incoming = roll === 20 ? Math.round(baseDmg * 1.5) : baseDmg;
      const absorbed = Math.min(combat.playerWard, incoming);
      const netDamage = Math.max(0, incoming - absorbed);
      state.hp = Math.max(0, state.hp - netDamage);

      let dreadMsg = "";
      if (intent.dread > 0) {
        if (state.hero.classId === "warden" && !state.wardenDreadShieldUsed) {
          state.wardenDreadShieldUsed = true;
          dreadMsg = " (Whisper of Roots negates the Veil Dread!)";
        } else {
          state.dread = Math.min(state.maxDread, state.dread + intent.dread);
          dreadMsg = ` (+${intent.dread} Veil Dread!)`;
        }
      }

      combat.log.push({
        tone: "crimson",
        text: `${combat.name} lands ${intent.label}${roll === 20 ? " (CRIT!)" : ""} for ${netDamage} damage${
          absorbed > 0 ? ` (${absorbed} blocked by Ward)` : ""
        }.${dreadMsg}`
      });

      if (state.hp <= 0) {
        combat.status = "defeat";
        combat.log.push({
          tone: "crimson",
          text: "Your strength fails as shadows close around the arena..."
        });
      }
    }
  }

  advanceIntent(combat);
  combat.playerWard = 0;
  combat.playerEvasion = 0;
  combat.round += 1;
}

function handleVictoryIfDead(state, combat, cls) {
  if (combat.hp > 0) return false;
  combat.status = "victory";
  state.gold += combat.rewardGold;
  if (combat.isBoss) state.bossesDefeated += 1;
  else state.enemiesDefeated += 1;

  let healNote = "";
  if (cls.id === "warden" && state.hp > 0) {
    state.hp = Math.min(state.maxHp, state.hp + 2);
    healNote = " Whisper of Roots mends +2 Vitality.";
  }

  combat.log.push({
    tone: "gold",
    text: `Victory! ${combat.name} is vanquished (+${combat.rewardGold} gold).${healNote}`
  });
  return true;
}

export function performCombatAction({ state, combat, action, itemId = null, catalog, rng = Math.random }) {
  if (combat.status !== "active") return combat;

  const cls = getClassById(catalog, state.hero.classId);
  const derived = computeDerivedStats(state.hero, catalog);
  const primaryMod = getModifier(derived.stats[derived.primaryStat]);
  const intent = getCurrentEnemyIntent(combat);

  if (action === "strike") {
    const roll = rollDie(20, rng);
    const total = roll + primaryMod + derived.attackBonus;
    combat.lastRoll = { roll, modifier: primaryMod + derived.attackBonus, total, target: combat.ac };

    if (roll === 20 || (roll !== 1 && total >= combat.ac)) {
      const dmgRoll = rollDie(derived.damageDie, rng);
      const raw = Math.max(2, dmgRoll + Math.max(0, primaryMod) + (roll === 20 ? derived.damageDie : 0));
      const { dealt, absorbed } = applyEnemyDamage(combat, raw, false);
      combat.log.push({
        tone: roll === 20 ? "gold" : "emerald",
        text: `${roll === 20 ? "Critical Strike! " : ""}You strike ${combat.name} for ${dealt} damage${
          absorbed ? ` (${absorbed} absorbed)` : ""
        } (d20: ${roll} + ${primaryMod + derived.attackBonus} = ${total} vs AC ${combat.ac}).`
      });
      if (handleVictoryIfDead(state, combat, cls)) return combat;
    } else {
      combat.log.push({
        tone: "neutral",
        text: `Your strike glances off ${combat.name}'s guard (d20: ${roll} + ${
          primaryMod + derived.attackBonus
        } = ${total} vs AC ${combat.ac}).`
      });
    }

    resolveEnemyTurn(state, combat, derived, rng);
    return combat;
  }

  if (action === "skill") {
    const skill = cls.skill;
    if (state.focus < skill.cost) {
      combat.log.push({
        tone: "neutral",
        text: `Not enough Focus for ${skill.name} (needs ${skill.cost} Focus). Guard & Channel to restore Focus!`
      });
      return combat;
    }

    state.focus -= skill.cost;
    const roll = rollDie(20, rng);
    const attackMod = primaryMod + derived.attackBonus + 2; // Class skills have +2 accuracy edge
    const total = roll + attackMod;
    combat.lastRoll = { roll, modifier: attackMod, total, target: combat.ac };

    if (skill.evade) {
      combat.playerEvasion += 4;
    }

    const hits = skill.pierceArmor ? roll !== 1 : roll === 20 || (roll !== 1 && total >= combat.ac);
    if (hits) {
      let bonus = skill.bonusDamage || 3;
      if (skill.telegraphBonus && intent.type === "heavy") {
        bonus += skill.telegraphBonus;
      }
      const dmgRoll = rollDie(derived.damageDie, rng);
      const raw = Math.max(3, dmgRoll + Math.max(0, primaryMod) + bonus + (roll === 20 ? 4 : 0));
      const { dealt, absorbed } = applyEnemyDamage(combat, raw, skill.pierceArmor);

      const extras = [];
      if (skill.stun) {
        combat.enemyStunned = true;
        extras.push("Target Stunned!");
      }
      if (skill.evade) {
        extras.push("+4 Evasion");
      }
      if (skill.cleanseDreadOnCritOrKill && (roll === 20 || combat.hp <= 0) && state.dread > 0) {
        state.dread = Math.max(0, state.dread - 1);
        extras.push("Cleansed 1 Veil Dread!");
      }

      combat.log.push({
        tone: "gold",
        text: `${skill.name} hits ${combat.name} for ${dealt} damage${
          absorbed ? ` (${absorbed} absorbed)` : ""
        }! ${extras.join(" ")}`
      });
      if (handleVictoryIfDead(state, combat, cls)) return combat;
    } else {
      combat.log.push({
        tone: "neutral",
        text: `${skill.name} barely misses ${combat.name} (rolled ${total} vs AC ${combat.ac}).`
      });
    }

    resolveEnemyTurn(state, combat, derived, rng);
    return combat;
  }

  if (action === "guard") {
    const wardGain = 6 + Math.max(0, getModifier(derived.stats.might));
    combat.playerWard += wardGain;
    state.focus = Math.min(state.maxFocus, state.focus + 2);
    combat.log.push({
      tone: "emerald",
      text: `You raise a Ward (+${wardGain} Shield this turn) and channel +2 Focus.`
    });
    resolveEnemyTurn(state, combat, derived, rng);
    return combat;
  }

  if (action === "item" && itemId) {
    const idx = state.hero.consumables.indexOf(itemId);
    const item = catalog.consumables[itemId];
    if (idx === -1 || !item) return combat;

    state.hero.consumables.splice(idx, 1);
    const notes = [];
    if (item.healHp) {
      state.hp = Math.min(state.maxHp, state.hp + item.healHp);
      notes.push(`+${item.healHp} Vitality`);
    }
    if (item.restoreFocus) {
      state.focus = Math.min(state.maxFocus, state.focus + item.restoreFocus);
      notes.push(`+${item.restoreFocus} Focus`);
    }
    if (item.wardBonus) {
      combat.playerWard += item.wardBonus;
      notes.push(`+${item.wardBonus} Ward`);
    }
    if (item.cleanseDread && state.dread > 0) {
      state.dread = Math.max(0, state.dread - item.cleanseDread);
      notes.push(`-${item.cleanseDread} Veil Dread`);
    }

    combat.log.push({
      tone: "gold",
      text: `Used ${item.name} (${notes.join(", ")}). Quick action—you may still act or brace!`
    });
    return combat;
  }

  if (action === "flee") {
    const agiMod = getModifier(derived.stats.agility);
    const roll = rollDie(20, rng);
    const total = roll + agiMod;
    if (roll === 20 || total >= 11) {
      combat.status = "fled";
      combat.log.push({
        tone: "neutral",
        text: `You slip away from ${combat.name} into the mist (Agility ${total} vs DC 11).`
      });
      return combat;
    }
    combat.log.push({
      tone: "crimson",
      text: `Escape blocked! (Agility ${total} vs DC 11) — ${combat.name} presses the attack!`
    });
    resolveEnemyTurn(state, combat, derived, rng);
    return combat;
  }

  return combat;
}
