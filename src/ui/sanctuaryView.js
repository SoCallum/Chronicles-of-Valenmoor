/**
 * Oakhaven Bastion Sanctuary Hub — Evolves Arondale Quest's Tavern & Eltons' Shop.
 * Between chapters, players rest at the Hearth, trade with Master Elric, equip gear,
 * choose their next Reach on the Chronicle Map, or retire with honor to lock in their score.
 */

import { computeChronicleScore } from "../engine/scoring.js";
import { buildScoringInput } from "../engine/state.js";
import { renderIconSvg, renderSceneSvg } from "./art.js";
import { escapeHtml, randomItem } from "./utils.js";

const SHOP_GEAR_STOCK = [
  "gear_runebound_greatsword",
  "gear_celestial_scepter",
  "gear_nightglass_fang",
  "gear_sovereign_halberd",
  "gear_valen_plate",
  "gear_starlight_vestments",
  "gear_lantern_brooch"
];

function summarizeItemStats(item) {
  const bits = [];
  if (item.damageDie) bits.push(`1d${item.damageDie} dmg`);
  if (item.attackBonus) bits.push(`+${item.attackBonus} Atk`);
  if (item.armorBonus) bits.push(`+${item.armorBonus} AC`);
  if (item.maxHpBonus) bits.push(`+${item.maxHpBonus} HP`);
  if (item.maxFocusBonus) bits.push(`+${item.maxFocusBonus} Focus`);
  if (item.bonusStats) {
    Object.entries(item.bonusStats).forEach(([k, v]) => {
      if (v) bits.push(`+${v} ${k.slice(0, 3).toUpperCase()}`);
    });
  }
  return bits.join(" · ");
}

export function renderSanctuaryView({
  container,
  state,
  chaptersMeta,
  catalog,
  banterLine,
  onStartChapter,
  onHearthRest,
  onPurgeDread,
  onBuyGear,
  onEquipGear,
  onBuyConsumable,
  onRetireChronicle
}) {
  const scorePreview = computeChronicleScore(buildScoringInput(state, catalog));
  const clearedSet = new Set(state.completedChapters);
  const allCleared = chaptersMeta.chapters.every((ch) => clearedSet.has(ch.chapterId));
  const quote = banterLine || randomItem(catalog.elricBanter);

  const chapterCards = chaptersMeta.chapters
    .map((ch) => {
      const isCleared = clearedSet.has(ch.chapterId);
      const prevCleared =
        ch.order === 1 || clearedSet.has(chaptersMeta.chapters[ch.order - 2]?.chapterId);
      const locked = !isCleared && !prevCleared;
      const result = state.chapterResults.find((r) => r.chapterId === ch.chapterId);

      return `
        <article class="reach-card ${isCleared ? "is-cleared" : ""} ${locked ? "is-locked" : ""}">
          <div class="reach-card__head">
            <span class="reach-card__tier">${escapeHtml(ch.difficulty)}</span>
            ${
              isCleared
                ? `<span class="reach-badge reach-badge--done">${escapeHtml(result?.endingType || "Cleared")}</span>`
                : locked
                  ? `<span class="reach-badge reach-badge--locked">Locked</span>`
                  : `<span class="reach-badge reach-badge--open">Ready</span>`
            }
          </div>
          <h4>${escapeHtml(ch.title)}</h4>
          <p class="reach-card__region">${escapeHtml(ch.region)}</p>
          <p class="reach-card__desc">${escapeHtml(ch.summary)}</p>
          <div class="reach-card__foot">
            <button
              type="button"
              class="btn ${isCleared ? "btn--ghost" : "btn--primary"}"
              data-start-chapter="${ch.chapterId}"
              ${locked ? "disabled" : ""}
            >
              ${isCleared ? "Replay Chapter" : locked ? "Complete Previous Reach" : "Embark on Expedition"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  const gearShopRows = SHOP_GEAR_STOCK.map((id) => {
    const item = catalog.equipment[id];
    if (!item) return "";
    const owned = state.hero.ownedGear.includes(id);
    const equipped = state.hero.equipment[item.slot] === id;
    const canAfford = state.gold >= item.price;

    return `
      <div class="shop-item">
        <div class="shop-item__info">
          <div class="shop-item__title-row">
            <strong class="rarity--${item.rarity}">${escapeHtml(item.name)}</strong>
            <span class="shop-slot">${escapeHtml(item.slot)}</span>
          </div>
          <p class="shop-item__stats">${escapeHtml(summarizeItemStats(item))}</p>
          <p class="shop-item__desc">${escapeHtml(item.description)}</p>
        </div>
        <div class="shop-item__action">
          ${
            equipped
              ? `<span class="equipped-tag">Equipped</span>`
              : owned
                ? `<button type="button" class="btn btn--secondary btn--sm" data-equip-gear="${id}">Equip</button>`
                : `<button type="button" class="btn btn--primary btn--sm" data-buy-gear="${id}" ${
                    canAfford ? "" : "disabled"
                  }>Buy · ${item.price}g</button>`
          }
        </div>
      </div>
    `;
  }).join("");

  const consumableRows = Object.values(catalog.consumables)
    .map((item) => {
      const canAfford = state.gold >= item.price;
      return `
        <div class="shop-item shop-item--compact">
          <div class="shop-item__info">
            <strong>${escapeHtml(item.name)}</strong>
            <p class="shop-item__desc">${escapeHtml(item.description)}</p>
          </div>
          <div class="shop-item__action">
            <button type="button" class="btn btn--secondary btn--sm" data-buy-consumable="${item.id}" ${
              canAfford ? "" : "disabled"
            }>Buy · ${item.price}g</button>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <section class="sanctuary">
      <div class="sanctuary__hero">
        <div class="sanctuary__art">
          ${renderSceneSvg("oakhaven_bastion")}
        </div>
        <div class="sanctuary__welcome">
          <p class="sanctuary__kicker">Sanctuary Hub · Oakhaven Bastion</p>
          <h2>The Hearth of Oaths</h2>
          <p>
            You return beneath Oakhaven's cedar rafters with <strong>${state.gold} gold</strong> and a projected
            Chronicle Score of <strong>${scorePreview.total}</strong> (<em>${escapeHtml(scorePreview.legendTitle)}</em>).
          </p>
          <div class="sanctuary__hearth-actions">
            <button type="button" class="btn btn--secondary" id="hearth-rest-btn" ${
              state.hearthRestedThisVisit ? "disabled" : ""
            }>
              ${renderIconSvg("hearth")} ${
                state.hearthRestedThisVisit ? "Rested by the Hearth" : "Rest at Hearth (Full Vitality & Focus)"
              }
            </button>
            <button type="button" class="btn btn--ghost" id="purge-dread-btn" ${
              state.dread === 0 || state.gold < 25 ? "disabled" : ""
            }>
              Cleansing Vigil (−1 Veil Dread · 25g)
            </button>
            <button type="button" class="btn ${allCleared ? "btn--primary" : "btn--ghost"}" id="retire-chronicle-btn">
              ${allCleared ? "Seal Completed Chronicle & Enter Hall of Legends" : "Retire Early & Record Score"}
            </button>
          </div>
        </div>
      </div>

      <div class="sanctuary__section">
        <div class="sanctuary__section-head">
          <h3>Chronicle Map — The Four Reaches</h3>
          <span>${state.completedChapters.length} / ${chaptersMeta.chapters.length} Chapters Cleared</span>
        </div>
        <div class="reach-grid">${chapterCards}</div>
      </div>

      <div class="sanctuary__section">
        <div class="sanctuary__section-head">
          <h3>Master Elric's Curio Forge</h3>
          <span class="gold-pill">Treasury: ${state.gold} Gold</span>
        </div>
        <blockquote class="elric-banter">${escapeHtml(quote)}</blockquote>
        <div class="shop-columns">
          <div>
            <h4 class="shop-subhead">Arms, Armor &amp; Talismans</h4>
            <div class="shop-list">${gearShopRows}</div>
          </div>
          <div>
            <h4 class="shop-subhead">Alchemical Draughts &amp; Wards</h4>
            <div class="shop-list">${consumableRows}</div>
          </div>
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll("[data-start-chapter]").forEach((btn) => {
    btn.addEventListener("click", () => onStartChapter(btn.dataset.startChapter));
  });
  container.querySelectorAll("[data-buy-gear]").forEach((btn) => {
    btn.addEventListener("click", () => onBuyGear(btn.dataset.buyGear));
  });
  container.querySelectorAll("[data-equip-gear]").forEach((btn) => {
    btn.addEventListener("click", () => onEquipGear(btn.dataset.equipGear));
  });
  container.querySelectorAll("[data-buy-consumable]").forEach((btn) => {
    btn.addEventListener("click", () => onBuyConsumable(btn.dataset.buyConsumable));
  });

  const restBtn = container.querySelector("#hearth-rest-btn");
  if (restBtn) restBtn.addEventListener("click", onHearthRest);
  const purgeBtn = container.querySelector("#purge-dread-btn");
  if (purgeBtn) purgeBtn.addEventListener("click", onPurgeDread);
  const retireBtn = container.querySelector("#retire-chronicle-btn");
  if (retireBtn) retireBtn.addEventListener("click", onRetireChronicle);
}
