/**
 * Illuminated Chronicle Recap Modal — Shows transparent score breakdown,
 * epilogue scroll, reward gear, and campaign progression / Hall of Legends actions.
 */

import { computeChronicleScore } from "../engine/scoring.js";
import { buildScoringInput } from "../engine/state.js";
import { escapeHtml } from "./utils.js";

export function createRecapModalController({ modalEl, onContinueSanctuary, onSealChronicle, onReturnBoard }) {
  const titleEl = modalEl.querySelector("#recap-title");
  const endingEl = modalEl.querySelector("#recap-ending");
  const scoreEl = modalEl.querySelector("#recap-score");
  const legendEl = modalEl.querySelector("#recap-legend");
  const breakdownEl = modalEl.querySelector("#recap-breakdown");
  const loreEl = modalEl.querySelector("#recap-lore");
  const epilogueEl = modalEl.querySelector("#recap-epilogue");
  const rewardBannerEl = modalEl.querySelector("#recap-reward-banner");
  const primaryBtn = modalEl.querySelector("#recap-primary-btn");
  const secondaryBtn = modalEl.querySelector("#recap-secondary-btn");
  const closeBtn = modalEl.querySelector("#recap-close-btn");

  let mode = "chapter"; // "chapter" | "final"

  function close() {
    modalEl.hidden = true;
    document.body.classList.remove("modal-open");
  }

  closeBtn.addEventListener("click", close);
  modalEl.addEventListener("click", (event) => {
    if (event.target === modalEl) close();
  });

  primaryBtn.addEventListener("click", () => {
    close();
    if (mode === "chapter") {
      onContinueSanctuary();
    } else {
      onReturnBoard();
    }
  });

  secondaryBtn.addEventListener("click", () => {
    close();
    if (mode === "chapter") {
      onSealChronicle();
    } else {
      onReturnBoard();
    }
  });

  return {
    open({ state, catalog, chapterTitle, ending, rewardGear = null, isFinal = false }) {
      mode = isFinal ? "final" : "chapter";
      const score = computeChronicleScore(buildScoringInput(state, catalog));

      titleEl.textContent = isFinal
        ? "Chronicle Sealed — Hall of Legends"
        : `${chapterTitle} — Chapter Recap`;
      endingEl.textContent = (ending?.type || score.overallEnding || "triumph").toUpperCase();
      scoreEl.textContent = `${score.total} pts`;
      legendEl.textContent = score.legendTitle;

      const rows = [
        ["Chapter Triumphs", score.breakdown.chapterCompletion],
        ["Lore, Riddles & Golden Paths", score.breakdown.loreAndRelics],
        ["Combat Mastery", score.breakdown.combatMastery],
        ["Roleplay Stance & Wit", score.breakdown.styleBonus],
        ["Veil Dread Control", score.breakdown.dreadControl],
        ["Treasury & Wargear Hoard", score.breakdown.hoardPoints],
        ["Veil Breach Penalties", score.breakdown.penalties]
      ];

      breakdownEl.innerHTML = rows
        .map(
          ([label, val]) => `
            <li>
              <span>${escapeHtml(label)}</span>
              <strong class="${val < 0 ? "neg" : val > 0 ? "pos" : ""}">${val > 0 ? `+${val}` : val}</strong>
            </li>
          `
        )
        .join("");

      loreEl.innerHTML = state.loreIds.length
        ? state.loreIds
            .map((id) => `<li>${escapeHtml(catalog.lore[id]?.label || id)}</li>`)
            .join("")
        : `<li class="muted-empty">No chronicle lore recorded yet.</li>`;

      epilogueEl.textContent =
        ending?.epilogue ||
        "Oakhaven's archivists record your deeds in iron-gall ink upon the Great Ledger of Valenmoor.";

      if (rewardGear) {
        rewardBannerEl.hidden = false;
        rewardBannerEl.textContent = `Mythic Reward Claimed: ${rewardGear.name} (+${ending?.rewardGold || 0} Gold)`;
      } else if (ending?.rewardGold) {
        rewardBannerEl.hidden = false;
        rewardBannerEl.textContent = `Expedition Bounty Claimed: +${ending.rewardGold} Gold`;
      } else {
        rewardBannerEl.hidden = true;
      }

      if (isFinal) {
        primaryBtn.textContent = "View Hall of Legends";
        secondaryBtn.hidden = true;
      } else {
        primaryBtn.textContent = "Return to Oakhaven Bastion";
        secondaryBtn.hidden = false;
        secondaryBtn.textContent = "Seal Run & Record Score Now";
      }

      modalEl.hidden = false;
      document.body.classList.add("modal-open");
    },
    close
  };
}
