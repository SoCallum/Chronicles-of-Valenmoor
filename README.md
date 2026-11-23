# Chronicles of Valenmoor

> **A High-Fantasy Roguelike Narrative RPG** — the next evolution of **Arondale Quest** and **Codexplore (File Noir)**.

Chronicles of Valenmoor unites the tabletop RPG depth and town-hub progression of *Arondale Quest* with the data-driven narrative craft, interactive flippable relic puzzles, escalating tension meter, and deterministic Hall of Legends leaderboard of *Codexplore* — elevated into an original illuminated high-fantasy world.

## Highlights & Improvements Over Both Predecessors
- **4 Handcrafted High-Fantasy Chapters + Interactive Prologue**: Modular JSON scene graphs (`data/chapter-01.json` through `data/chapter-04.json`, plus `data/tutorial.json`) with branching paths, multiple endings (`Legendary`, `Triumph`, `Bittersweet`, `Fallen`), and cross-chapter Oaths.
- **Illuminated Guild Charter Creation**: 3D-tilting Charter Seal, 4 playable Orders (*Paladin of the Dawn*, *Arcane Scholar*, *Shadowblade*, *Fey Warden*) with active mechanical perks & class skills, bespoke portraits, epithet generator, and fast 4d6-drop-lowest or Point-Buy stat assignment.
- **Transparent d20 Skill Checks & Relic Golden Paths**: Live DC & success probability badges, class Advantage, Shadowblade Fate Rerolls, and Satchel Relic bypasses that reward thorough exploration.
- **Interactive 3D Flippable Relic Riddles**: Flip glowing scene cards to decipher Elder Runes, earn Lore Mastery, acquire key Satchel Relics, and expose boss weaknesses.
- **Tactical Turn-Based Combat Arena**: Enemy Intent Telegraphs, weapon attacks, Class Skills with Focus cost & tactical effects (Stun, Pierce, Cleanse Dread, Evasion), Guard/Ward timing, and combat consumables.
- **Oakhaven Bastion Hub**: Between chapters, trade with Master Elric's Curio Forge (equip weapons, armor, talismans, and buy draughts), rest at the Hearth of Oaths to restore Vitality or purge Veil Dread, choose your next reach on the Chronicle Map, or retire early to lock in your Hall of Legends score.
- **Deterministic Server-Authoritative Scoring & Hall of Legends**: Shared client/server ES Module scoring engine (`src/engine/scoring.js`), playstyle Legend Titles, filterable Hall of Legends & Recent Chronicles board, Charter inspection modal, and seamless `localStorage` auto-save & offline fallback.

## Quick Start

Requires **Node.js 20+** (zero external npm dependencies required).

```bash
# Run automated engine & chapter graph integrity tests
npm test

# Syntax check core modules
npm run check

# Start the local game server (default http://127.0.0.1:3080)
npm start
```

## Architecture
- `index.html` & `styles.css` — Semantic illuminated grimoire frontend (vanilla HTML/CSS/ESM, zero build step).
- `src/engine/` — Pure, testable game logic (`dice.js`, `scoring.js`, `state.js`, `combat.js`, `campaign.js`).
- `src/ui/` — Modular UI renderers (`art.js`, `characterModal.js`, `sceneView.js`, `combatView.js`, `sanctuaryView.js`, `sidebarView.js`, `recapModal.js`, `leaderboardView.js`, `sound.js`).
- `data/` — Data-first chapter graphs (`chapters.json`, `catalog.json`, `tutorial.json`, `chapter-01.json`–`chapter-04.json`).
- `server.js` — Lightweight zero-dependency HTTP server with static asset delivery, strict security headers, server-authoritative scoring on `POST /api/runs`, and `GET /api/leaderboard`.
- `tests/engine.test.js` — Automated unit + campaign graph integrity suite.
- `docs/` — Comparative review (`design-review.md`), world bible (`world-lore.md`), node schema (`scene-node-schema.md`), and scoring rules (`scoring-rules.md`).

## Security-First Policy
- Never commit `.env`, credentials, secrets, or personal data.
- All leaderboard inputs are strictly validated, length-bounded, sanitized, and re-scored authoritatively on the server.
- Static file serving prevents directory traversal and restricts access to dotfiles and internal storage.
