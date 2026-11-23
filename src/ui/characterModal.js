/**
 * 3D-Tilting Illuminated Guild Charter Character Creator.
 * Unites Codexplore's tactile 3D ID Card with Arondale's tabletop classes & 4d6 stat rolling.
 */

import { STAT_KEYS, STAT_LABELS, formatModifier, getModifier, rollStatArray } from "../engine/dice.js";
import { renderIconSvg, renderPortraitSvg } from "./art.js";
import { sound } from "./sound.js";
import { escapeHtml, generateFantasyName } from "./utils.js";

export function createCharacterModalController({ modalEl, catalog, onConfirm }) {
  let selectedClassId = catalog.classes[0].id;
  let selectedPortrait = catalog.classes[0].portraitKey;
  let heroName = generateFantasyName(catalog.epithets);
  let stats = { ...catalog.classes[0].recommendedStats };
  let isTutorialMode = false;

  const cardEl = modalEl.querySelector("#charter-card");
  const portraitWrapEl = modalEl.querySelector("#charter-portrait");
  const aliasPreviewEl = modalEl.querySelector("#charter-alias-preview");
  const orderPreviewEl = modalEl.querySelector("#charter-order-preview");
  const perkPreviewEl = modalEl.querySelector("#charter-perk-preview");
  const nameInputEl = modalEl.querySelector("#hero-name-input");
  const rollNameBtn = modalEl.querySelector("#roll-name-btn");
  const orderGridEl = modalEl.querySelector("#order-grid");
  const portraitGridEl = modalEl.querySelector("#portrait-grid");
  const statsGridEl = modalEl.querySelector("#creator-stats-grid");
  const rollStatsBtn = modalEl.querySelector("#roll-stats-btn");
  const presetStatsBtn = modalEl.querySelector("#preset-stats-btn");
  const confirmBtn = modalEl.querySelector("#charter-confirm-btn");
  const closeBtn = modalEl.querySelector("#charter-close-btn");

  function getSelectedClass() {
    return catalog.classes.find((c) => c.id === selectedClassId) || catalog.classes[0];
  }

  function smartAssignRolledArray(rolledDesc, cls) {
    const order = [cls.primaryStat, ...STAT_KEYS.filter((k) => k !== cls.primaryStat)];
    const assigned = {};
    order.forEach((statKey, idx) => {
      assigned[statKey] = rolledDesc[idx] ?? 12;
    });
    return assigned;
  }

  function renderPreview() {
    const cls = getSelectedClass();
    portraitWrapEl.innerHTML = renderPortraitSvg(selectedPortrait);
    aliasPreviewEl.textContent = heroName || "Unnamed Wayfarer";
    orderPreviewEl.textContent = cls.name;
    perkPreviewEl.textContent = `${cls.perkName}: ${cls.perkDescription}`;
    confirmBtn.textContent = isTutorialMode ? "Begin Interactive Prologue" : "Seal Charter & Embark";
  }

  function renderOrders() {
    orderGridEl.innerHTML = catalog.classes
      .map(
        (cls) => `
          <button
            type="button"
            class="order-card ${cls.id === selectedClassId ? "is-selected" : ""}"
            data-class-id="${cls.id}"
            aria-pressed="${cls.id === selectedClassId}"
          >
            <div class="order-card__head">
              <strong>${escapeHtml(cls.name)}</strong>
              <span class="order-card__stat">${STAT_LABELS[cls.primaryStat]}</span>
            </div>
            <p class="order-card__tagline">${escapeHtml(cls.tagline)}</p>
            <p class="order-card__perk"><em>${escapeHtml(cls.perkName)}:</em> ${escapeHtml(cls.perkDescription)}</p>
            <p class="order-card__skill">Skill: <strong>${escapeHtml(cls.skill.name)}</strong> (${cls.skill.cost} Focus)</p>
          </button>
        `
      )
      .join("");
  }

  function renderPortraits() {
    portraitGridEl.innerHTML = catalog.classes
      .map(
        (cls) => `
          <button
            type="button"
            class="portrait-choice ${cls.portraitKey === selectedPortrait ? "is-selected" : ""}"
            data-portrait-key="${cls.portraitKey}"
            aria-label="Select ${escapeHtml(cls.shortTitle)} portrait"
          >
            ${renderPortraitSvg(cls.portraitKey)}
          </button>
        `
      )
      .join("");
  }

  function renderStats() {
    statsGridEl.innerHTML = STAT_KEYS.map((key) => {
      const val = stats[key];
      const mod = formatModifier(getModifier(val));
      return `
        <div class="creator-stat">
          <span class="creator-stat__name">${STAT_LABELS[key]}</span>
          <div class="creator-stat__controls">
            <button type="button" class="stat-step-btn" data-stat-dec="${key}" aria-label="Decrease ${STAT_LABELS[key]}">−</button>
            <strong class="creator-stat__val">${val} <small>(${mod})</small></strong>
            <button type="button" class="stat-step-btn" data-stat-inc="${key}" aria-label="Increase ${STAT_LABELS[key]}">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderAll() {
    nameInputEl.value = heroName;
    renderPreview();
    renderOrders();
    renderPortraits();
    renderStats();
  }

  // Interactive 3D tilt on Charter Card
  if (cardEl) {
    cardEl.addEventListener("pointermove", (event) => {
      const rect = cardEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const tiltX = (0.5 - y) * 10;
      const tiltY = (x - 0.5) * 14;
      cardEl.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
    });
    cardEl.addEventListener("pointerleave", () => {
      cardEl.style.transform = "";
    });
  }

  nameInputEl.addEventListener("input", () => {
    heroName = nameInputEl.value.trim().slice(0, 32);
    renderPreview();
  });

  rollNameBtn.addEventListener("click", () => {
    sound.diceRoll();
    heroName = generateFantasyName(catalog.epithets);
    nameInputEl.value = heroName;
    renderPreview();
  });

  orderGridEl.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-class-id]");
    if (!btn) return;
    sound.pageTurn();
    selectedClassId = btn.dataset.classId;
    const cls = getSelectedClass();
    selectedPortrait = cls.portraitKey;
    stats = { ...cls.recommendedStats };
    renderAll();
  });

  portraitGridEl.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-portrait-key]");
    if (!btn) return;
    sound.pageTurn();
    selectedPortrait = btn.dataset.portraitKey;
    renderPortraits();
    renderPreview();
  });

  statsGridEl.addEventListener("click", (event) => {
    const inc = event.target.closest("[data-stat-inc]");
    const dec = event.target.closest("[data-stat-dec]");
    if (!inc && !dec) return;
    const total = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
    if (inc) {
      const key = inc.dataset.statInc;
      if (stats[key] < 18 && total < 54) {
        stats[key] += 1;
        renderStats();
      }
    } else if (dec) {
      const key = dec.dataset.statDec;
      if (stats[key] > 8) {
        stats[key] -= 1;
        renderStats();
      }
    }
  });

  rollStatsBtn.innerHTML = `${renderIconSvg("d20")} Roll 4d6`;
  rollStatsBtn.addEventListener("click", () => {
    sound.diceRoll();
    const rolled = rollStatArray();
    stats = smartAssignRolledArray(rolled, getSelectedClass());
    renderStats();
  });

  presetStatsBtn.addEventListener("click", () => {
    sound.pageTurn();
    stats = { ...getSelectedClass().recommendedStats };
    renderStats();
  });

  function close() {
    modalEl.hidden = true;
    document.body.classList.remove("modal-open");
  }

  closeBtn.addEventListener("click", close);
  modalEl.addEventListener("click", (event) => {
    if (event.target === modalEl) close();
  });

  confirmBtn.addEventListener("click", () => {
    const cleanName = (nameInputEl.value.trim() || generateFantasyName(catalog.epithets)).slice(0, 32);
    sound.victory();
    close();
    onConfirm({
      heroName: cleanName,
      classId: selectedClassId,
      portraitKey: selectedPortrait,
      baseStats: { ...stats },
      tutorialMode: isTutorialMode
    });
  });

  return {
    open({ tutorialMode = false } = {}) {
      isTutorialMode = tutorialMode;
      if (!heroName) heroName = generateFantasyName(catalog.epithets);
      renderAll();
      modalEl.hidden = false;
      document.body.classList.add("modal-open");
    },
    close
  };
}
