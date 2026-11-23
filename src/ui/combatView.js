/**
 * Tactical Turn-Based Combat Arena Renderer:
 * Displays Enemy Intent Telegraphs, animated d20 rolls, Ward shields,
 * Class Skills, Consumables, and transparent combat log.
 */

import { getCurrentEnemyIntent } from "../engine/combat.js";
import { getClassById } from "../engine/state.js";
import { renderEnemySvg, renderIconSvg } from "./art.js";
import { escapeHtml } from "./utils.js";

function renderIntentBadge(combat) {
  if (combat.status !== "active") {
    return `<span class="intent-pill intent-pill--done">${escapeHtml(combat.status.toUpperCase())}</span>`;
  }
  if (combat.enemyStunned) {
    return `<span class="intent-pill intent-pill--stunned">Stunned — Skipping Next Turn!</span>`;
  }
  const intent = getCurrentEnemyIntent(combat);
  if (intent.type === "guard") {
    return `<span class="intent-pill intent-pill--guard">${renderIconSvg("shield")} Intent: ${escapeHtml(
      intent.label
    )} (+${intent.ward} Ward)</span>`;
  }
  if (intent.type === "dread") {
    return `<span class="intent-pill intent-pill--dread">${renderIconSvg("spark")} Intent: ${escapeHtml(
      intent.label
    )} (${intent.damage} dmg · +${intent.dread} Dread)</span>`;
  }
  if (intent.type === "heavy") {
    return `<span class="intent-pill intent-pill--heavy">${renderIconSvg("sword")} Telegraph: ${escapeHtml(
      intent.label
    )} (${intent.damage} HEAVY dmg!)</span>`;
  }
  return `<span class="intent-pill intent-pill--attack">${renderIconSvg("sword")} Intent: ${escapeHtml(
    intent.label
  )} (${intent.damage} dmg)</span>`;
}

export function renderCombatView({ container, state, combat, catalog, onAction, onContinue }) {
  const cls = getClassById(catalog, state.hero.classId);
  const skill = cls.skill;
  const enemyHpPct = Math.max(0, Math.min(100, Math.round((combat.hp / combat.maxHp) * 100)));
  const heroHpPct = Math.max(0, Math.min(100, Math.round((state.hp / state.maxHp) * 100)));

  // Count unique consumables in satchel
  const consumableCounts = {};
  state.hero.consumables.forEach((id) => {
    consumableCounts[id] = (consumableCounts[id] || 0) + 1;
  });

  const consumableButtons = Object.entries(consumableCounts)
    .map(([id, count]) => {
      const item = catalog.consumables[id];
      if (!item) return "";
      return `
        <button type="button" class="combat-item-btn" data-combat-item="${id}">
          ${renderIconSvg("potion")} ${escapeHtml(item.name)} (×${count})
        </button>
      `;
    })
    .join("");

  const lastRollHtml = combat.lastRoll
    ? `
      <div class="combat-roll-pill">
        ${renderIconSvg("d20")}
        Last Roll: <strong>${combat.lastRoll.roll}</strong>
        ${combat.lastRoll.modifier >= 0 ? "+" : ""}${combat.lastRoll.modifier}
        = <strong>${combat.lastRoll.total}</strong> vs AC ${combat.lastRoll.target}
      </div>
    `
    : "";

  const logHtml = combat.log
    .slice(-6)
    .reverse()
    .map((entry) => `<li class="battle-log__item battle-log__item--${entry.tone || "neutral"}">${escapeHtml(entry.text)}</li>`)
    .join("");

  let controlsHtml = "";
  if (combat.status === "active") {
    const canUseSkill = state.focus >= skill.cost;
    controlsHtml = `
      <div class="combat-actions">
        <button type="button" class="combat-btn combat-btn--strike" data-combat-action="strike">
          <span class="combat-btn__title">${renderIconSvg("sword")} Strike</span>
          <span class="combat-btn__sub">d20 weapon attack vs AC ${combat.ac}</span>
        </button>
        <button type="button" class="combat-btn combat-btn--skill" data-combat-action="skill" ${
          canUseSkill ? "" : "disabled"
        }>
          <span class="combat-btn__title">${renderIconSvg("spark")} ${escapeHtml(skill.name)} (${skill.cost} Focus)</span>
          <span class="combat-btn__sub">${escapeHtml(skill.description)}</span>
        </button>
        <button type="button" class="combat-btn combat-btn--guard" data-combat-action="guard">
          <span class="combat-btn__title">${renderIconSvg("shield")} Guard &amp; Channel</span>
          <span class="combat-btn__sub">Gain Ward Shield this turn &amp; restore +2 Focus</span>
        </button>
        <button type="button" class="combat-btn combat-btn--flee" data-combat-action="flee">
          <span class="combat-btn__title">Disengage</span>
          <span class="combat-btn__sub">Agility DC 11 to fall back</span>
        </button>
      </div>
      ${
        consumableButtons
          ? `<div class="combat-satchel"><span class="combat-satchel__label">Quick Satchel (free action):</span>${consumableButtons}</div>`
          : ""
      }
    `;
  } else {
    const btnLabel =
      combat.status === "victory"
        ? "Claim Victory & Continue"
        : combat.status === "fled"
          ? "Regroup Along the Trail"
          : "Face the Chronicle Recap";
    controlsHtml = `
      <div class="combat-finish">
        <button type="button" class="btn btn--primary" id="combat-continue-btn">${btnLabel}</button>
      </div>
    `;
  }

  container.innerHTML = `
    <section class="combat-arena" aria-label="Tactical Combat Arena">
      <header class="combat-arena__header">
        <div>
          <p class="combat-arena__kicker">Round ${combat.round} · ${combat.isBoss ? "Boss Encounter" : "Skirmish"}</p>
          <h2 class="combat-arena__title">${escapeHtml(combat.name)}</h2>
          <p class="combat-arena__sub">${escapeHtml(combat.title)}</p>
        </div>
        ${renderIntentBadge(combat)}
      </header>

      <div class="combat-stage">
        <div class="combat-enemy-card">
          <div class="combat-enemy-card__art">
            ${renderEnemySvg(combat.artKey, combat.isBoss)}
          </div>
          <div class="combat-enemy-card__stats">
            <div class="meter-row">
              <span>Enemy Vitality</span>
              <strong>${combat.hp} / ${combat.maxHp}${combat.enemyWard > 0 ? ` (+${combat.enemyWard} Ward)` : ""}</strong>
            </div>
            <div class="bar-track"><div class="bar-fill bar-fill--crimson" style="width:${enemyHpPct}%"></div></div>
            <div class="combat-stat-pills">
              <span>Armor Class: <strong>${combat.ac}</strong></span>
              <span>Attack: <strong>+${combat.attackBonus}</strong></span>
              <span>Bounty: <strong>${combat.rewardGold}g</strong></span>
            </div>
          </div>
        </div>

        <div class="combat-hero-bar">
          <div class="meter-row">
            <span>${escapeHtml(state.hero.name)} · Vitality</span>
            <strong>${state.hp} / ${state.maxHp}${combat.playerWard > 0 ? ` (+${combat.playerWard} Ward)` : ""}</strong>
          </div>
          <div class="bar-track"><div class="bar-fill bar-fill--emerald" style="width:${heroHpPct}%"></div></div>
          <div class="combat-hero-meta">
            <span>Focus: <strong>${state.focus} / ${state.maxFocus}</strong></span>
            ${lastRollHtml}
          </div>
        </div>
      </div>

      ${controlsHtml}

      <div class="battle-log">
        <p class="battle-log__kicker">Battle Chronicle</p>
        <ul>${logHtml}</ul>
      </div>
    </section>
  `;

  container.querySelectorAll("[data-combat-action]").forEach((btn) => {
    btn.addEventListener("click", () => onAction(btn.dataset.combatAction));
  });
  container.querySelectorAll("[data-combat-item]").forEach((btn) => {
    btn.addEventListener("click", () => onAction("item", btn.dataset.combatItem));
  });

  const contBtn = container.querySelector("#combat-continue-btn");
  if (contBtn) {
    contBtn.addEventListener("click", onContinue);
  }
}
