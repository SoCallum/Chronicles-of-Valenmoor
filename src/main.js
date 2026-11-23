/**
 * Chronicles of Valenmoor — Main Application Orchestrator.
 */

import {
  applyNodeEffects,
  recordChapterEnding,
  resolveNarrativeChoice,
  solveRelicRiddle
} from "./engine/campaign.js";
import { createCombatSession, performCombatAction } from "./engine/combat.js";
import { computeChronicleScore } from "./engine/scoring.js";
import {
  buildScoringInput,
  clearRunStorage,
  createNewRunState,
  equipGearItem,
  loadRunFromStorage,
  saveRunToStorage
} from "./engine/state.js";
import { renderIconSvg, renderPortraitSvg, renderSceneSvg } from "./ui/art.js";
import { createCharacterModalController } from "./ui/characterModal.js";
import { renderCombatView } from "./ui/combatView.js";
import { createLeaderboardController } from "./ui/leaderboardView.js";
import { createRecapModalController } from "./ui/recapModal.js";
import { renderSanctuaryView } from "./ui/sanctuaryView.js";
import { renderSceneView } from "./ui/sceneView.js";
import { renderSidebarView } from "./ui/sidebarView.js";
import { sound } from "./ui/sound.js";
import { randomItem } from "./ui/utils.js";

const chapterCache = new Map();

let catalog = null;
let chaptersMeta = null;
let state = null;
let activeCombat = null;
let activeChapterNodes = new Map();
let activeChapterMeta = null;
let currentBanter = "";

const dom = {
  heroSection: document.querySelector("#hero-section"),
  heroArtFrame: document.querySelector("#hero-art-frame"),
  resumeBanner: document.querySelector("#resume-banner"),
  resumeSummary: document.querySelector("#resume-summary"),
  resumeBtn: document.querySelector("#resume-run-btn"),
  discardSaveBtn: document.querySelector("#discard-save-btn"),
  playSection: document.querySelector("#play-section"),
  playHeaderTitle: document.querySelector("#active-chapter-title"),
  playHeaderSubtitle: document.querySelector("#active-chapter-subtitle"),
  playStage: document.querySelector("#play-stage"),
  playSidebar: document.querySelector("#play-sidebar"),
  boardSection: document.querySelector("#board-section"),
  featuresSection: document.querySelector("#features-section"),
  headerProfile: document.querySelector("#header-profile"),
  headerAvatar: document.querySelector("#header-avatar"),
  headerName: document.querySelector("#header-hero-name"),
  headerOrder: document.querySelector("#header-hero-order"),
  soundToggleBtn: document.querySelector("#sound-toggle-btn"),
  navPrologueBtn: document.querySelector("#nav-prologue-btn"),
  navStartBtn: document.querySelector("#nav-start-btn"),
  heroStartBtn: document.querySelector("#hero-start-btn"),
  heroPrologueBtn: document.querySelector("#hero-prologue-btn"),
  returnBoardBtn: document.querySelector("#return-board-btn"),
  toastEl: document.querySelector("#toast-banner"),
  characterModal: document.querySelector("#character-modal"),
  recapModal: document.querySelector("#recap-modal"),
  inspectModal: document.querySelector("#inspect-modal")
};

let toastTimer = null;
function showToast(message, tone = "gold") {
  if (!dom.toastEl || !message) return;
  dom.toastEl.textContent = message;
  dom.toastEl.className = `toast-banner toast-banner--${tone}`;
  dom.toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toastEl.hidden = true;
  }, 3400);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

function getChapterMeta(chapterId) {
  if (chapterId === "tutorial") return chaptersMeta.tutorial;
  return chaptersMeta.chapters.find((c) => c.chapterId === chapterId) || chaptersMeta.chapters[0];
}

async function loadChapterGraph(chapterId) {
  const meta = getChapterMeta(chapterId);
  if (chapterCache.has(meta.chapterId)) {
    return { meta, nodesById: chapterCache.get(meta.chapterId) };
  }
  const nodes = await fetchJson(meta.dataUrl);
  const map = new Map();
  nodes.forEach((n) => map.set(n.id, n));
  chapterCache.set(meta.chapterId, map);
  return { meta, nodesById: map };
}

function updateHeaderProfile() {
  if (!state) {
    dom.headerProfile.hidden = true;
    return;
  }
  dom.headerProfile.hidden = false;
  dom.headerAvatar.innerHTML = renderPortraitSvg(state.hero.portraitKey);
  dom.headerName.textContent = state.hero.name;
  dom.headerOrder.textContent = state.hero.className;
}

function setScreen(view) {
  const inGame = view === "play";
  dom.heroSection.hidden = inGame;
  dom.featuresSection.hidden = inGame;
  dom.boardSection.hidden = inGame;
  dom.playSection.hidden = !inGame;
  updateHeaderProfile();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function checkResumeBanner() {
  const saved = loadRunFromStorage();
  if (!saved) {
    dom.resumeBanner.hidden = true;
    return;
  }
  dom.resumeBanner.hidden = false;
  const count = saved.completedChapters?.length || 0;
  dom.resumeSummary.textContent = `${saved.hero.name} (${saved.hero.className}) · ${count}/4 Reaches Cleared · ${saved.hp}/${saved.maxHp} Vitality`;
}

let characterModal = null;
let recapModal = null;
let leaderboard = null;

function renderSidebar() {
  if (!state) return;
  renderSidebarView({
    container: dom.playSidebar,
    state,
    catalog,
    onUseConsumable: (itemId) => {
      if (state.mode === "combat") return;
      const idx = state.hero.consumables.indexOf(itemId);
      const item = catalog.consumables[itemId];
      if (idx === -1 || !item) return;
      state.hero.consumables.splice(idx, 1);
      if (item.healHp) state.hp = Math.min(state.maxHp, state.hp + item.healHp);
      if (item.restoreFocus) state.focus = Math.min(state.maxFocus, state.focus + item.restoreFocus);
      if (item.cleanseDread) state.dread = Math.max(0, state.dread - item.cleanseDread);
      sound.ward();
      showToast(`Used ${item.name}!`, "emerald");
      saveRunToStorage(state);
      renderCurrentPlayMode();
    },
    onEquipGear: (itemId) => {
      if (equipGearItem(state, itemId, catalog)) {
        sound.pageTurn();
        showToast(`Equipped ${catalog.equipment[itemId]?.name}`, "gold");
        saveRunToStorage(state);
        renderCurrentPlayMode();
      }
    }
  });
}

function triggerVeilBreachOrDefeat(reason) {
  sound.warning();
  const isDread = reason === "dread";
  if (isDread) {
    state.veilBreaches += 1;
  }

  const fallenEnding = {
    type: "fallen",
    headline: isDread ? "Consumed by the Aether Veil" : "Fallen in the Sundered Reach",
    epilogue: isDread
      ? "Veil Dread overwhelms your lantern-ward. The Star-Spires dim as Oakhaven rings the mourning bell for a lost Wayfarer."
      : "Your strength yields beneath alien skies, yet Oakhaven's archivists inscribe your courage into the Hall of Legends.",
    rewardGold: 0
  };

  if (!state.tutorialMode && activeChapterMeta) {
    recordChapterEnding({
      state,
      chapterMeta: activeChapterMeta,
      endingNode: { title: fallenEnding.headline, ending: fallenEnding },
      catalog
    });
  }

  sealAndSubmitChronicle(fallenEnding);
}

async function sealAndSubmitChronicle(endingOverride = null) {
  if (!state) return;
  state.mode = "ended";
  activeCombat = null;
  clearRunStorage();

  const scoreInput = buildScoringInput(state, catalog);
  const clientScore = computeChronicleScore(scoreInput);

  if (!state.tutorialMode && !state.scoreSubmitted) {
    state.scoreSubmitted = true;
    await leaderboard.submitRun({
      runId: state.runId,
      heroName: state.hero.name,
      classId: state.hero.classId,
      className: state.hero.className,
      portraitKey: state.hero.portraitKey,
      scoringInput: scoreInput,
      clientScore
    });
  }

  const finalEnding = endingOverride || {
    type: clientScore.overallEnding || "triumph",
    headline: clientScore.legendTitle,
    epilogue:
      state.chapterResults[state.chapterResults.length - 1]?.epilogue ||
      "Your charter is sealed in Oakhaven's Great Ledger. Bards will carry your deeds across Valenmoor."
  };

  recapModal.open({
    state,
    catalog,
    chapterTitle: "Chronicle Sealed",
    ending: finalEnding,
    isFinal: true
  });
  checkResumeBanner();
}

function enterSanctuaryHub() {
  if (!state) return;
  state.mode = "sanctuary";
  activeCombat = null;
  state.hearthRestedThisVisit = false;
  state.lastCheckBanner = null;
  currentBanter = randomItem(catalog.elricBanter);
  dom.playHeaderTitle.textContent = "Oakhaven Bastion";
  dom.playHeaderSubtitle.textContent = "Sanctuary Hub · Hearth of Oaths & Elric's Curio Forge";
  saveRunToStorage(state);
  renderCurrentPlayMode();
}

function enterSceneNode(nodeId, { applyOnEnter = true } = {}) {
  const node = activeChapterNodes.get(nodeId);
  if (!node) {
    showToast(`Missing scene node: ${nodeId}`, "crimson");
    return;
  }

  state.mode = "scene";
  state.currentNodeId = nodeId;
  activeCombat = null;

  if (applyOnEnter && node.onEnter) {
    const notes = applyNodeEffects(state, node.onEnter, catalog);
    if (notes.length) showToast(notes.join(" · "), "gold");
  }

  if (state.dread >= state.maxDread) {
    triggerVeilBreachOrDefeat("dread");
    return;
  }
  if (state.hp <= 0) {
    triggerVeilBreachOrDefeat("defeat");
    return;
  }

  dom.playHeaderTitle.textContent = activeChapterMeta.title;
  dom.playHeaderSubtitle.textContent = activeChapterMeta.subtitle;
  saveRunToStorage(state);
  renderCurrentPlayMode();
}

async function beginChapter(chapterId) {
  const { meta, nodesById } = await loadChapterGraph(chapterId);
  activeChapterMeta = meta;
  activeChapterNodes = nodesById;
  state.activeChapterId = meta.chapterId;
  state.wardenDreadShieldUsed = false;
  state.rerollUsedStages = [];
  state.lastCheckBanner = null;

  const firstNode = nodesById.values().next().value;
  setScreen("play");
  sound.pageTurn();
  enterSceneNode(firstNode.id, { applyOnEnter: true });
}

function renderCurrentPlayMode() {
  if (!state) return;
  renderSidebar();

  if (state.mode === "sanctuary") {
    renderSanctuaryView({
      container: dom.playStage,
      state,
      chaptersMeta,
      catalog,
      banterLine: currentBanter,
      onStartChapter: (chapterId) => beginChapter(chapterId),
      onHearthRest: () => {
        if (state.hearthRestedThisVisit) return;
        state.hearthRestedThisVisit = true;
        state.hp = state.maxHp;
        state.focus = state.maxFocus;
        sound.ward();
        showToast("Rested by the silver-oak hearth — Vitality & Focus fully restored!", "emerald");
        saveRunToStorage(state);
        renderCurrentPlayMode();
      },
      onPurgeDread: () => {
        if (state.dread <= 0 || state.gold < 25) return;
        state.gold -= 25;
        state.dread = Math.max(0, state.dread - 1);
        sound.runeSolve();
        showToast("Dawnfire vigil completed — purged 1 Veil Dread.", "gold");
        saveRunToStorage(state);
        renderCurrentPlayMode();
      },
      onBuyGear: (itemId) => {
        const item = catalog.equipment[itemId];
        if (!item || state.gold < item.price) return;
        state.gold -= item.price;
        equipGearItem(state, itemId, catalog);
        sound.runeSolve();
        showToast(`Purchased & equipped ${item.name}!`, "gold");
        saveRunToStorage(state);
        renderCurrentPlayMode();
      },
      onEquipGear: (itemId) => {
        if (equipGearItem(state, itemId, catalog)) {
          sound.pageTurn();
          showToast(`Equipped ${catalog.equipment[itemId]?.name}`, "gold");
          saveRunToStorage(state);
          renderCurrentPlayMode();
        }
      },
      onBuyConsumable: (itemId) => {
        const item = catalog.consumables[itemId];
        if (!item || state.gold < item.price) return;
        state.gold -= item.price;
        state.hero.consumables.push(itemId);
        sound.pageTurn();
        showToast(`Added ${item.name} to Satchel!`, "emerald");
        saveRunToStorage(state);
        renderCurrentPlayMode();
      },
      onRetireChronicle: () => {
        sound.victory();
        sealAndSubmitChronicle();
      }
    });
    return;
  }

  if (state.mode === "combat" && activeCombat) {
    renderCombatView({
      container: dom.playStage,
      state,
      combat: activeCombat,
      catalog,
      onAction: (action, itemId) => {
        if (action === "strike" || action === "skill") sound.strike();
        else if (action === "guard" || action === "item") sound.ward();
        else sound.diceRoll();

        performCombatAction({ state, combat: activeCombat, action, itemId, catalog });

        if (activeCombat.status === "victory") {
          sound.victory();
        } else if (activeCombat.status === "defeat") {
          sound.warning();
        }

        renderCurrentPlayMode();
      },
      onContinue: () => {
        if (activeCombat.status === "defeat" || state.hp <= 0) {
          triggerVeilBreachOrDefeat("defeat");
          return;
        }
        if (state.dread >= state.maxDread) {
          triggerVeilBreachOrDefeat("dread");
          return;
        }
        const nextId =
          activeCombat.status === "victory" ? activeCombat.victoryNext : activeCombat.fleeNext;
        state.lastCheckBanner =
          activeCombat.status === "victory"
            ? {
                tone: "gold",
                title: `Victory over ${activeCombat.name}`,
                detail: `Claimed +${activeCombat.rewardGold} gold and pressed deeper into the reach.`
              }
            : {
                tone: "neutral",
                title: `Disengaged from ${activeCombat.name}`,
                detail: "You regroup along an alternate trail."
              };
        enterSceneNode(nextId, { applyOnEnter: true });
      }
    });
    return;
  }

  const node = activeChapterNodes.get(state.currentNodeId);
  if (!node) return;

  renderSceneView({
    container: dom.playStage,
    node,
    state,
    catalog,
    onSolveRiddle: (riddleId, answerIndex) => {
      const outcome = solveRelicRiddle({ state, riddleId, answerIndex, catalog });
      if (outcome.status === "solved") {
        sound.runeSolve();
        showToast(outcome.message, "gold");
      } else if (outcome.status === "failed") {
        sound.warning();
        showToast(outcome.message, "crimson");
      }
      saveRunToStorage(state);
      renderCurrentPlayMode();
    },
    onSelectChoice: (choice) => {
      sound.diceRoll();
      const outcome = resolveNarrativeChoice({ state, node, choice, catalog });
      state.lastCheckBanner = outcome.banner;

      if (state.dread >= state.maxDread) {
        triggerVeilBreachOrDefeat("dread");
        return;
      }
      if (state.hp <= 0) {
        triggerVeilBreachOrDefeat("defeat");
        return;
      }

      if (outcome.type === "combat") {
        state.mode = "combat";
        activeCombat = createCombatSession({
          state,
          enemyId: outcome.combatConfig.enemyId,
          victoryNext: outcome.combatConfig.victoryNext,
          fleeNext: outcome.combatConfig.fleeNext,
          catalog
        });
        renderCurrentPlayMode();
        return;
      }

      enterSceneNode(outcome.nextNodeId, { applyOnEnter: true });
    },
    onCompleteEnding: (endingNode) => {
      sound.victory();
      if (state.tutorialMode) {
        showToast("Prologue complete! Now forge your true Wayfarer Charter.", "gold");
        state = null;
        setScreen("home");
        characterModal.open({ tutorialMode: false });
        return;
      }

      const { ending, rewardGear } = recordChapterEnding({
        state,
        chapterMeta: activeChapterMeta,
        endingNode,
        catalog
      });
      saveRunToStorage(state);

      const isGrandFinale = activeChapterMeta.chapterId === "chapter-04";
      if (isGrandFinale) {
        sealAndSubmitChronicle(ending);
        return;
      }

      recapModal.open({
        state,
        catalog,
        chapterTitle: activeChapterMeta.title,
        ending,
        rewardGear,
        isFinal: false
      });
    }
  });
}

function updateSoundButton() {
  const on = sound.isEnabled();
  dom.soundToggleBtn.innerHTML = renderIconSvg(on ? "soundOn" : "soundOff");
  dom.soundToggleBtn.setAttribute("aria-pressed", String(on));
  dom.soundToggleBtn.title = on ? "Mute chimes" : "Enable chimes";
}

async function init() {
  try {
    [catalog, chaptersMeta] = await Promise.all([
      fetchJson("data/catalog.json"),
      fetchJson("data/chapters.json")
    ]);
  } catch (err) {
    dom.heroArtFrame.innerHTML = `<p class="error-box">Could not load realm data: ${err.message}</p>`;
    return;
  }

  // Render hero key artwork
  dom.heroArtFrame.innerHTML = renderSceneSvg("oakhaven_bastion");

  leaderboard = createLeaderboardController({
    boardSection: dom.boardSection,
    inspectModal: dom.inspectModal
  });
  await leaderboard.fetchRuns();

  characterModal = createCharacterModalController({
    modalEl: dom.characterModal,
    catalog,
    onConfirm: ({ heroName, classId, portraitKey, baseStats, tutorialMode }) => {
      state = createNewRunState({
        heroName,
        classId,
        portraitKey,
        baseStats,
        catalog,
        tutorialMode
      });
      beginChapter(tutorialMode ? "tutorial" : "chapter-01");
    }
  });

  recapModal = createRecapModalController({
    modalEl: dom.recapModal,
    onContinueSanctuary: () => enterSanctuaryHub(),
    onSealChronicle: () => sealAndSubmitChronicle(),
    onReturnBoard: () => {
      state = null;
      setScreen("home");
      leaderboard.fetchRuns();
    }
  });

  updateSoundButton();
  dom.soundToggleBtn.addEventListener("click", () => {
    sound.toggle();
    updateSoundButton();
    if (sound.isEnabled()) sound.pageTurn();
  });

  const openCampaignCreator = () => characterModal.open({ tutorialMode: false });
  const openPrologueCreator = () => characterModal.open({ tutorialMode: true });

  dom.navStartBtn.addEventListener("click", openCampaignCreator);
  dom.heroStartBtn.addEventListener("click", openCampaignCreator);
  dom.navPrologueBtn.addEventListener("click", openPrologueCreator);
  dom.heroPrologueBtn.addEventListener("click", openPrologueCreator);

  dom.returnBoardBtn.addEventListener("click", () => {
    if (state && !state.tutorialMode && state.mode !== "ended") {
      saveRunToStorage(state);
    }
    setScreen("home");
    checkResumeBanner();
    leaderboard.fetchRuns();
  });

  dom.resumeBtn.addEventListener("click", async () => {
    const saved = loadRunFromStorage();
    if (!saved) return;
    state = saved;
    sound.pageTurn();
    setScreen("play");
    if (state.mode === "sanctuary") {
      enterSanctuaryHub();
    } else {
      const { meta, nodesById } = await loadChapterGraph(state.activeChapterId || "chapter-01");
      activeChapterMeta = meta;
      activeChapterNodes = nodesById;
      const nodeId = nodesById.has(state.currentNodeId)
        ? state.currentNodeId
        : nodesById.values().next().value.id;
      enterSceneNode(nodeId, { applyOnEnter: false });
    }
  });

  dom.discardSaveBtn.addEventListener("click", () => {
    clearRunStorage();
    checkResumeBanner();
    showToast("Saved chronicle cleared.", "neutral");
  });

  // Keyboard shortcuts (1-4 for scene choices when no modal is open)
  window.addEventListener("keydown", (event) => {
    if (document.body.classList.contains("modal-open")) return;
    if (!state || state.mode !== "scene") return;
    const idx = Number(event.key) - 1;
    if (idx >= 0 && idx <= 3) {
      const buttons = dom.playStage.querySelectorAll("[data-choice-id]");
      if (buttons[idx]) buttons[idx].click();
    }
  });

  checkResumeBanner();
}

init();
