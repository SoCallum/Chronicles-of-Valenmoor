/**
 * Narrative Scene Renderer:
 * - Layered high-fantasy SVG scene art
 * - 3D Flippable Illuminated Relic Riddle cards (with Scholar Sight Unbound hint!)
 * - Transparent d20 skill-check odds, Class Advantage badges, and Golden Path Relic unlocks
 */

import { STAT_LABELS, calculateCheckOdds } from "../engine/dice.js";
import { computeDerivedStats } from "../engine/state.js";
import { renderIconSvg, renderRelicCardSvg, renderSceneSvg } from "./art.js";
import { escapeHtml } from "./utils.js";

const STANCE_LABELS = {
  heroic: "Heroic",
  arcane: "Arcane",
  cunning: "Cunning",
  witty: "Witty"
};

function getScholarCrossedOutIndex(riddle) {
  for (let i = 0; i < riddle.answers.length; i += 1) {
    if (i !== riddle.correctIndex) return i;
  }
  return -1;
}

function renderRelicCardMarkup(relicCard, state, catalog) {
  if (!relicCard?.riddleId) return "";
  const riddle = catalog.riddles[relicCard.riddleId];
  if (!riddle) return "";

  const isSolved = state.solvedRiddles.includes(riddle.id);
  const isFailed = state.failedRiddles.includes(riddle.id);
  const isAnswered = isSolved || isFailed;
  const crossedOutIdx = state.hero.classId === "scholar" ? getScholarCrossedOutIndex(riddle) : -1;

  const answersHtml = riddle.answers
    .map((ans, idx) => {
      const isCrossed = crossedOutIdx === idx && !isAnswered;
      const isCorrectChoice = isAnswered && idx === riddle.correctIndex;
      const classes = [
        "riddle-answer",
        isCrossed ? "is-crossed" : "",
        isCorrectChoice ? "is-correct" : ""
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <button
          type="button"
          class="${classes}"
          data-riddle-id="${riddle.id}"
          data-answer-index="${idx}"
          ${isAnswered || isCrossed ? "disabled" : ""}
        >
          ${escapeHtml(ans)}${isCrossed ? " <em>(Ruled out)</em>" : ""}
        </button>
      `;
    })
    .join("");

  const statusText = isSolved
    ? `Solved! ${riddle.successNote}`
    : isFailed
      ? riddle.failNote
      : state.hero.classId === "scholar"
        ? "Sight Unbound ruled out one false rune."
        : "Choose the true answer to claim a Satchel Relic & +75 Lore Mastery.";

  return `
    <figure class="scene-gallery__relic">
      <div class="relic-flip-card ${isAnswered ? "is-flipped" : ""} ${isSolved ? "is-solved" : ""} ${isFailed ? "is-failed" : ""}" data-relic-flip-card>
        <div class="relic-flip-card__inner">
          <button type="button" class="relic-flip-card__face relic-flip-card__front" data-flip-open aria-label="Inspect relic rune card">
            ${renderRelicCardSvg(relicCard.artKey)}
          </button>
          <div class="relic-flip-card__face relic-flip-card__back">
            <div class="relic-back__head">
              <span class="relic-back__title">${escapeHtml(riddle.title)}</span>
              ${!isAnswered ? `<button type="button" class="relic-back__close" data-flip-close aria-label="Flip back">↺</button>` : ""}
            </div>
            <p class="relic-back__prompt">${escapeHtml(riddle.prompt)}</p>
            <div class="riddle-answers">${answersHtml}</div>
            <p class="relic-back__status">${escapeHtml(statusText)}</p>
          </div>
        </div>
      </div>
      <figcaption>${escapeHtml(relicCard.caption || "Illuminated Relic Card")}</figcaption>
    </figure>
  `;
}

export function renderSceneView({
  container,
  node,
  state,
  catalog,
  onSelectChoice,
  onSolveRiddle,
  onCompleteEnding
}) {
  const derived = computeDerivedStats(state.hero, catalog);
  const isEnding = Array.isArray(node.tags) && node.tags.includes("ending");
  const entryMeta = [node.entry?.location, node.entry?.time].filter(Boolean).join(" · ");

  const bannerHtml = state.lastCheckBanner
    ? `
      <div class="check-banner check-banner--${state.lastCheckBanner.tone || "gold"}" role="status">
        <strong>${escapeHtml(state.lastCheckBanner.title)}</strong>
        <span>${escapeHtml(state.lastCheckBanner.detail)}</span>
      </div>
    `
    : "";

  const relicHtml = node.art?.relicCard ? renderRelicCardMarkup(node.art.relicCard, state, catalog) : "";
  const galleryClass = relicHtml ? "scene-gallery scene-gallery--split" : "scene-gallery";

  const tagsHtml = (node.tags || [])
    .map((t) => `<span class="scene-tag">${escapeHtml(t)}</span>`)
    .join("");

  const proseHtml = (node.text || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");

  let actionsHtml = "";
  if (isEnding) {
    const ending = node.ending || { type: "triumph", headline: node.title };
    actionsHtml = `
      <div class="ending-callout ending-callout--${escapeHtml(ending.type)}">
        <p class="ending-callout__kicker">Chapter Concluded · ${escapeHtml(ending.type.toUpperCase())}</p>
        <h4>${escapeHtml(ending.headline || node.title)}</h4>
        ${ending.epilogue ? `<p>${escapeHtml(ending.epilogue)}</p>` : ""}
        <button type="button" class="btn btn--primary" id="conclude-chapter-btn">
          ${state.tutorialMode ? "Finish Prologue & Enter Valenmoor" : "Open Chronicle Recap"}
        </button>
      </div>
    `;
  } else {
    actionsHtml = `
      <div class="choice-deck">
        ${(node.choices || [])
          .map((choice, idx) => {
            const hasRelicBypass =
              Boolean(choice.relicBypass) && state.hero.relics.includes(choice.relicBypass.itemId);
            const badges = [];

            if (choice.stance && STANCE_LABELS[choice.stance]) {
              badges.push(
                `<span class="choice-badge choice-badge--stance-${choice.stance}">${STANCE_LABELS[choice.stance]}</span>`
              );
            }

            if (hasRelicBypass) {
              const relic = catalog.relics[choice.relicBypass.itemId];
              badges.push(
                `<span class="choice-badge choice-badge--gold">${renderIconSvg("relic")} Golden Path: ${escapeHtml(
                  relic?.name || "Relic"
                )}</span>`
              );
            } else if (choice.combat) {
              const enemy = catalog.enemies[choice.combat.enemyId];
              badges.push(
                `<span class="choice-badge choice-badge--crimson">${renderIconSvg("sword")} Battle: ${escapeHtml(
                  enemy?.name || "Foe"
                )}</span>`
              );
            } else if (choice.check) {
              const statKey = choice.check.stat;
              const hasAdv =
                Array.isArray(choice.check.advantageClasses) &&
                choice.check.advantageClasses.includes(state.hero.classId);
              const odds = calculateCheckOdds(derived.stats[statKey], choice.check.dc, hasAdv);
              badges.push(
                `<span class="choice-badge choice-badge--check">${renderIconSvg("d20")} ${STAT_LABELS[statKey]} DC ${
                  choice.check.dc
                } · ${odds}%${hasAdv ? " (Adv)" : ""}</span>`
              );
            }

            return `
              <button
                type="button"
                class="choice-card ${hasRelicBypass ? "choice-card--golden" : ""}"
                data-choice-id="${escapeHtml(choice.id)}"
              >
                <span class="choice-card__num">${idx + 1}</span>
                <span class="choice-card__body">
                  <span class="choice-card__label">${escapeHtml(choice.label)}</span>
                  <span class="choice-card__badges">${badges.join("")}</span>
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  container.innerHTML = `
    <article class="scene-sheet">
      <header class="scene-sheet__head">
        <div>
          ${entryMeta ? `<p class="scene-sheet__meta">${escapeHtml(entryMeta)}</p>` : ""}
          <h2 class="scene-sheet__title">${escapeHtml(node.title)}</h2>
          ${node.summary ? `<p class="scene-sheet__summary">${escapeHtml(node.summary)}</p>` : ""}
        </div>
        <div class="scene-tags">${tagsHtml}</div>
      </header>

      ${bannerHtml}

      <div class="${galleryClass}">
        <figure class="scene-gallery__main">
          ${renderSceneSvg(node.art?.sceneKey || "oakhaven_bastion")}
          ${node.art?.caption ? `<figcaption>${escapeHtml(node.art.caption)}</figcaption>` : ""}
        </figure>
        ${relicHtml}
      </div>

      <div class="scene-prose">${proseHtml}</div>

      <div class="scene-actions">${actionsHtml}</div>
    </article>
  `;

  // Wire flip card interactions
  const flipCard = container.querySelector("[data-relic-flip-card]");
  if (flipCard) {
    const openBtn = flipCard.querySelector("[data-flip-open]");
    const closeBtn = flipCard.querySelector("[data-flip-close]");
    if (openBtn) {
      openBtn.addEventListener("click", () => flipCard.classList.add("is-flipped"));
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => flipCard.classList.remove("is-flipped"));
    }
    flipCard.querySelectorAll("[data-riddle-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        onSolveRiddle(btn.dataset.riddleId, Number(btn.dataset.answerIndex));
      });
    });
  }

  // Wire choice buttons
  container.querySelectorAll("[data-choice-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = (node.choices || []).find((c) => c.id === btn.dataset.choiceId);
      if (choice) onSelectChoice(choice);
    });
  });

  // Wire ending button
  const concludeBtn = container.querySelector("#conclude-chapter-btn");
  if (concludeBtn) {
    concludeBtn.addEventListener("click", () => onCompleteEnding(node));
  }
}
