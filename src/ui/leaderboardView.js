/**
 * Hall of Legends & Recent Chronicles Leaderboard View.
 * Syncs with /api/leaderboard & /api/runs when running on Node server,
 * and gracefully persists to localStorage when played offline / statically!
 */

import { renderPortraitSvg } from "./art.js";
import { escapeHtml, formatShortDate } from "./utils.js";

const LOCAL_LEADERBOARD_KEY = "valenmoor_leaderboard_v1";
const PAGE_SIZE = 8;

const SEED_LEGENDS = [
  {
    id: "seed-1",
    heroName: "Seren Starweaver",
    classId: "scholar",
    className: "Arcane Scholar",
    portraitKey: "portrait_scholar",
    legendTitle: "Mythic Sovereign",
    legendStyle: "mythic",
    chaptersCleared: 4,
    overallEnding: "legendary",
    score: 3685,
    createdAt: "2026-11-18T18:00:00.000Z"
  },
  {
    id: "seed-2",
    heroName: "Aldric Dawnblade",
    classId: "paladin",
    className: "Paladin of the Dawn",
    portraitKey: "portrait_paladin",
    legendTitle: "Ironclad Vanguard",
    legendStyle: "heroic",
    chaptersCleared: 4,
    overallEnding: "triumph",
    score: 3140,
    createdAt: "2026-11-19T14:20:00.000Z"
  },
  {
    id: "seed-3",
    heroName: "Lyra Nighthollow",
    classId: "shadowblade",
    className: "Shadowblade",
    portraitKey: "portrait_shadowblade",
    legendTitle: "Silver-Tongued Bard",
    legendStyle: "witty",
    chaptersCleared: 3,
    overallEnding: "legendary",
    score: 2560,
    createdAt: "2026-11-20T09:45:00.000Z"
  },
  {
    id: "seed-4",
    heroName: "Rowan Thornbrook",
    classId: "warden",
    className: "Fey Warden",
    portraitKey: "portrait_warden",
    legendTitle: "Ghost of the Reach",
    legendStyle: "cunning",
    chaptersCleared: 2,
    overallEnding: "triumph",
    score: 1840,
    createdAt: "2026-11-21T16:10:00.000Z"
  }
];

function readLocalRuns() {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [...SEED_LEGENDS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...SEED_LEGENDS];
  } catch {
    return [...SEED_LEGENDS];
  }
}

function writeLocalRuns(runs) {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(runs.slice(0, 80)));
  } catch {
    // ignore
  }
}

export function createLeaderboardController({ boardSection, inspectModal }) {
  let allRuns = readLocalRuns();
  let mode = "hall"; // "hall" | "recent"
  let styleFilter = "all";
  let page = 1;

  const tbody = boardSection.querySelector("#board-body");
  const statusEl = boardSection.querySelector("#board-page-status");
  const prevBtn = boardSection.querySelector("#board-prev");
  const nextBtn = boardSection.querySelector("#board-next");

  async function fetchRuns() {
    try {
      const res = await fetch("/api/leaderboard", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("offline");
      const payload = await res.json();
      if (Array.isArray(payload.runs) && payload.runs.length > 0) {
        allRuns = payload.runs;
        writeLocalRuns(allRuns);
      } else {
        allRuns = readLocalRuns();
      }
    } catch {
      allRuns = readLocalRuns();
    }
    render();
  }

  async function submitRun(runPayload) {
    let savedEntry = null;
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(runPayload)
      });
      if (res.ok) {
        const data = await res.json();
        savedEntry = data.run;
      }
    } catch {
      // fallback to local storage below
    }

    if (!savedEntry) {
      savedEntry = {
        id: runPayload.runId || `local-${Date.now()}`,
        heroName: runPayload.heroName,
        classId: runPayload.classId,
        className: runPayload.className,
        portraitKey: runPayload.portraitKey,
        legendTitle: runPayload.clientScore.legendTitle,
        legendStyle: runPayload.clientScore.legendStyle,
        chaptersCleared: runPayload.clientScore.chaptersCleared,
        overallEnding: runPayload.clientScore.overallEnding,
        score: runPayload.clientScore.total,
        createdAt: new Date().toISOString()
      };
    }

    allRuns = [savedEntry, ...allRuns.filter((r) => r.id !== savedEntry.id)];
    writeLocalRuns(allRuns);
    render();
    return savedEntry;
  }

  function getFilteredRows() {
    let rows = [...allRuns];
    if (styleFilter !== "all") {
      rows = rows.filter((r) => r.legendStyle === styleFilter);
    }
    if (mode === "hall") {
      rows.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else {
      rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return rows;
  }

  function openInspectModal(entry) {
    if (!inspectModal) return;
    inspectModal.querySelector("#inspect-portrait").innerHTML = renderPortraitSvg(entry.portraitKey);
    inspectModal.querySelector("#inspect-name").textContent = entry.heroName;
    inspectModal.querySelector("#inspect-order").textContent = entry.className;
    inspectModal.querySelector("#inspect-title").textContent = entry.legendTitle;
    inspectModal.querySelector("#inspect-score").textContent = `${entry.score} pts`;
    inspectModal.querySelector("#inspect-chapters").textContent = `${entry.chaptersCleared || 0} / 4 Reaches Cleared`;
    inspectModal.querySelector("#inspect-ending").textContent = (entry.overallEnding || "triumph").toUpperCase();
    inspectModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  if (inspectModal) {
    const closeBtn = inspectModal.querySelector("#inspect-close-btn");
    const closeInspect = () => {
      inspectModal.hidden = true;
      document.body.classList.remove("modal-open");
    };
    if (closeBtn) closeBtn.addEventListener("click", closeInspect);
    inspectModal.addEventListener("click", (e) => {
      if (e.target === inspectModal) closeInspect();
    });
  }

  function render() {
    const rows = getFilteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    page = Math.max(1, Math.min(page, totalPages));
    const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted-empty">No chronicles match this Legend Style yet.</td></tr>`;
    } else {
      tbody.innerHTML = slice
        .map((row, idx) => {
          const rank = (page - 1) * PAGE_SIZE + idx + 1;
          return `
            <tr class="board-row" data-run-id="${escapeHtml(row.id)}">
              <td class="board-rank">${mode === "hall" ? `#${rank}` : "·"}</td>
              <td>
                <div class="board-hero-cell">
                  <span class="board-avatar">${renderPortraitSvg(row.portraitKey)}</span>
                  <div>
                    <strong>${escapeHtml(row.heroName)}</strong>
                    <small>${escapeHtml(row.className)}</small>
                  </div>
                </div>
              </td>
              <td><span class="legend-pill legend-pill--${escapeHtml(row.legendStyle || "balanced")}">${escapeHtml(
            row.legendTitle || "Wayfarer"
          )}</span></td>
              <td>${row.chaptersCleared ?? 0} / 4</td>
              <td class="board-score">${row.score}</td>
              <td><span class="ending-pill ending-pill--${escapeHtml(row.overallEnding || "triumph")}">${escapeHtml(
            row.overallEnding || "triumph"
          )}</span></td>
              <td>${escapeHtml(formatShortDate(row.createdAt))}</td>
            </tr>
          `;
        })
        .join("");
    }

    statusEl.textContent = `Page ${page} of ${totalPages}`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
  }

  boardSection.querySelectorAll("[data-board-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.boardMode;
      page = 1;
      boardSection.querySelectorAll("[data-board-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  boardSection.querySelectorAll("[data-style-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      styleFilter = btn.dataset.styleFilter;
      page = 1;
      boardSection
        .querySelectorAll("[data-style-filter]")
        .forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  prevBtn.addEventListener("click", () => {
    page -= 1;
    render();
  });
  nextBtn.addEventListener("click", () => {
    page += 1;
    render();
  });

  tbody.addEventListener("click", (event) => {
    const tr = event.target.closest("[data-run-id]");
    if (!tr) return;
    const entry = allRuns.find((r) => String(r.id) === tr.dataset.runId);
    if (entry) openInspectModal(entry);
  });

  return {
    fetchRuns,
    submitRun,
    render
  };
}
