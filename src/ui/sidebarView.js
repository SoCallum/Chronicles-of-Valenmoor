/**
 * Live Wayfarer Ledger Sidebar:
 * Displays hero portrait, Vitality/Focus/Veil Dread meters, Stats + Modifiers,
 * Equipped Gear, Satchel Relics & Consumables, Discovered Lore, and Oaths/Flags.
 */

import { STAT_KEYS, STAT_LABELS, formatModifier, getModifier } from "../engine/dice.js";
import { computeChronicleScore } from "../engine/scoring.js";
import { buildScoringInput, computeDerivedStats } from "../engine/state.js";
import { renderIconSvg, renderPortraitSvg } from "./art.js";
import { escapeHtml } from "./utils.js";

function getDreadNote(dread) {
  if (dread <= 0) return "Starlight holds steady. The Veil sleeps.";
  if (dread <= 2) return "Faint whispers curl at the edge of torchlight.";
  if (dread <= 4) return "Shadows lengthen. The Veil tests your resolve.";
  if (dread === 5) return "Critical! One more Dread triggers a Veil Breach!";
  return "THE VEIL BREACHES!";
}

export function renderSidebarView({ container, state, catalog, onUseConsumable, onEquipGear }) {
  const derived = computeDerivedStats(state.hero, catalog);
  const scoreSummary = computeChronicleScore(buildScoringInput(state, catalog));

  const hpPct = Math.max(0, Math.min(100, Math.round((state.hp / state.maxHp) * 100)));
  const focusPct = Math.max(0, Math.min(100, Math.round((state.focus / state.maxFocus) * 100)));
  const dreadPct = Math.max(0, Math.min(100, Math.round((state.dread / state.maxDread) * 100)));

  const statsHtml = STAT_KEYS.map((key) => {
    const val = derived.stats[key];
    const mod = formatModifier(getModifier(val));
    return `
      <div class="ledger-stat">
        <span>${STAT_LABELS[key]}</span>
        <strong>${val} <small>(${mod})</small></strong>
      </div>
    `;
  }).join("");

  const equipHtml = ["weapon", "armor", "talisman"]
    .map((slot) => {
      const id = state.hero.equipment[slot];
      const item = id ? catalog.equipment[id] : null;
      return `
        <li class="ledger-equip-row">
          <span class="ledger-equip-slot">${slot}</span>
          <strong class="${item ? `rarity--${item.rarity}` : "muted"}">${
            item ? escapeHtml(item.name) : "Empty"
          }</strong>
        </li>
      `;
    })
    .join("");

  const bagGearHtml = state.hero.ownedGear
    .filter((id) => !Object.values(state.hero.equipment).includes(id))
    .map((id) => {
      const item = catalog.equipment[id];
      if (!item) return "";
      return `
        <li class="ledger-bag-gear">
          <span class="rarity--${item.rarity}">${escapeHtml(item.name)}</span>
          <button type="button" class="link-btn" data-sidebar-equip="${id}">Equip</button>
        </li>
      `;
    })
    .join("");

  const relicsHtml = state.hero.relics.length
    ? state.hero.relics
        .map((id) => {
          const relic = catalog.relics[id];
          return `
            <li class="relic-chip" title="${escapeHtml(relic?.description || "")}">
              ${renderIconSvg("relic")} ${escapeHtml(relic?.name || id)}
            </li>
          `;
        })
        .join("")
    : `<li class="muted-empty">Flip illuminated Rune Cards in scenes to uncover Relics.</li>`;

  const consumableCounts = {};
  state.hero.consumables.forEach((id) => {
    consumableCounts[id] = (consumableCounts[id] || 0) + 1;
  });

  const consumablesHtml = Object.keys(consumableCounts).length
    ? Object.entries(consumableCounts)
        .map(([id, qty]) => {
          const item = catalog.consumables[id];
          if (!item) return "";
          const canUseNow = state.mode !== "combat";
          return `
            <li class="satchel-item-row">
              <span>${escapeHtml(item.name)} ×${qty}</span>
              ${
                canUseNow
                  ? `<button type="button" class="link-btn" data-sidebar-use="${id}">Use</button>`
                  : `<span class="muted">In combat</span>`
              }
            </li>
          `;
        })
        .join("")
    : `<li class="muted-empty">No draughts carried.</li>`;

  const loreHtml = state.loreIds.length
    ? state.loreIds
        .map((id) => {
          const entry = catalog.lore[id];
          const isCrit = entry?.type === "critical";
          return `<li class="lore-chip ${isCrit ? "lore-chip--crit" : ""}">${escapeHtml(
            entry?.label || id
          )}</li>`;
        })
        .join("")
    : `<li class="muted-empty">No chronicle entries recorded yet.</li>`;

  container.innerHTML = `
    <div class="ledger-card">
      <div class="ledger-hero">
        <div class="ledger-hero__portrait">${renderPortraitSvg(state.hero.portraitKey)}</div>
        <div class="ledger-hero__info">
          <p class="ledger-kicker">Chronicle #${escapeHtml(state.runId)}</p>
          <h3>${escapeHtml(state.hero.name)}</h3>
          <p class="ledger-order">${escapeHtml(state.hero.className)}</p>
          <div class="ledger-pills">
            <span>AC <strong>${derived.armor}</strong></span>
            <span>Gold <strong>${state.gold}g</strong></span>
            <span>Score <strong>${scoreSummary.total}</strong></span>
          </div>
        </div>
      </div>

      <div class="ledger-meters">
        <div class="meter-block">
          <div class="meter-row"><span>Vitality</span><strong>${state.hp} / ${state.maxHp}</strong></div>
          <div class="bar-track"><div class="bar-fill bar-fill--emerald" style="width:${hpPct}%"></div></div>
        </div>
        <div class="meter-block">
          <div class="meter-row"><span>Focus</span><strong>${state.focus} / ${state.maxFocus}</strong></div>
          <div class="bar-track"><div class="bar-fill bar-fill--gold" style="width:${focusPct}%"></div></div>
        </div>
        <div class="meter-block">
          <div class="meter-row"><span>Veil Dread</span><strong>${state.dread} / ${state.maxDread}</strong></div>
          <div class="bar-track"><div class="bar-fill bar-fill--crimson" style="width:${dreadPct}%"></div></div>
          <p class="dread-note">${escapeHtml(getDreadNote(state.dread))}</p>
        </div>
      </div>

      <div class="ledger-section">
        <p class="ledger-section__title">Attributes</p>
        <div class="ledger-stats-grid">${statsHtml}</div>
      </div>

      <div class="ledger-section">
        <p class="ledger-section__title">Equipped Wargear</p>
        <ul class="ledger-equip-list">${equipHtml}</ul>
        ${bagGearHtml ? `<ul class="ledger-bag-list">${bagGearHtml}</ul>` : ""}
      </div>

      <div class="ledger-section">
        <div class="ledger-section__head">
          <p class="ledger-section__title">Satchel Relics</p>
          <span class="count-pill">${state.hero.relics.length}</span>
        </div>
        <ul class="chip-list">${relicsHtml}</ul>
      </div>

      <div class="ledger-section">
        <div class="ledger-section__head">
          <p class="ledger-section__title">Draughts &amp; Wards</p>
          <span class="count-pill">${state.hero.consumables.length}</span>
        </div>
        <ul class="satchel-list">${consumablesHtml}</ul>
      </div>

      <div class="ledger-section">
        <div class="ledger-section__head">
          <p class="ledger-section__title">Uncovered Lore</p>
          <span class="count-pill">${state.loreIds.length}</span>
        </div>
        <ul class="chip-list">${loreHtml}</ul>
      </div>
    </div>
  `;

  container.querySelectorAll("[data-sidebar-use]").forEach((btn) => {
    btn.addEventListener("click", () => onUseConsumable(btn.dataset.sidebarUse));
  });
  container.querySelectorAll("[data-sidebar-equip]").forEach((btn) => {
    btn.addEventListener("click", () => onEquipGear(btn.dataset.sidebarEquip));
  });
}
