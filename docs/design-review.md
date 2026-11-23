# Comparative Review: Arondale Quest & Codexplore (File Noir) -> Chronicles of Valenmoor

This document captures the architectural and game-design audit of **Arondale Quest** and **Codexplore (File Noir)** and explains how **Chronicles of Valenmoor** evolves both lineages into a cohesive High Fantasy Roguelike Narrative RPG.

## 1. Arondale Quest — Strengths & Opportunities

### What Worked Well
- **Tabletop RPG Soul**: Classic ability scores, Hit Dice, Armor Class, d20 rolls with advantage, and iconic fantasy classes (Fighter, Wizard, Rogue) gave players immediate roleplay identity.
- **Persistent Town Hub Loop**: Returning to the Fallen Heroes Inn and Encampment to shop with Eltons, equip gear across slots, heal, and choose the next quest created an addictive risk-reward loop.
- **Charming Lore & Humorous Voice**: `LORE_Arondale.md` and Eltons' banter gave the world warmth and character.

### Key Limitations Addressed
- **Monolithic Codebase**: Over 7,500 lines lived inside a single `index.html` with inline CSS/JS and hand-wired quest scripts, making iteration and bug-fixing fragile.
- **One-Button Combat**: Combat revolved around clicking "Roll Attack" repeatedly without tactical agency, class abilities, defensive timing, or enemy telegraphs.
- **Flat Scoring & Presentation**: Final score was a basic sum (`score + gold + sellValue`) with minimal visual atmosphere and no scene illustrations.

---

## 2. Codexplore (File Noir) — Strengths & Opportunities

### What Worked Well
- **Data-Driven Narrative Engine**: Clean JSON case files (`data/cases.json`, `data/case-XX.json`) separated narrative authoring from runtime logic.
- **Tactile Interactive Polish**: 3D-tilting Character ID Card, flippable Clue Cards with embedded micro-puzzles, a visual satchel of found items, and bespoke scene artwork elevated browser interactive fiction.
- **Deterministic Server-Authoritative Scoring**: Transparent score breakdowns (Completion, Clue Quality, Style/Wit, Suspicion Control, Solve Bonus, Penalties) and a Hall of Fame / Recent Runs leaderboard with style filters drove replayability.
- **Escalating Tension Meter**: The Suspicion Meter introduced continuous strategic pressure across scenes.

### Key Limitations Addressed
- **Monolithic Client Script**: `app.js` grew to 3,500+ lines in a single global scope with no automated tests.
- **Random Choice Locks**: Random d6 availability locks could disable choices without RPG stat agency or clear tactical counterplay.
- **No Character Progression or Hub Loop**: Runs lacked gear builds, gold economy, combat encounters, or rest/upgrade choices between cases.

---

## 3. Chronicles of Valenmoor — Next-Generation Evolution

| Pillar | Arondale Quest | Codexplore (File Noir) | Chronicles of Valenmoor |
| --- | --- | --- | --- |
| **Genre & Tone** | Medieval fantasy text RPG | Humorous noir detective CYOA | **High-fantasy illuminated roguelike narrative RPG** |
| **Architecture** | Single 7.5k-line HTML file | 3.5k-line global `app.js` | **Modular ES Modules (`src/engine/`, `src/ui/`), data-first JSON chapters, & automated `node:test` suite** |
| **Character Creation** | Multi-step manual forms | 3D-tilting ID card + 3 authorities | **3D-tilting Illuminated Guild Charter, 4 Orders with active perks & skills, 4d6/Point-Buy quick stat assignment, portrait & epithet generator** |
| **Skill Checks & Agency** | d20 checks with class advantage | Random d6 locks & item unlocks | **Transparent d20 Skill Checks with live DC & success odds, Class Advantage, Shadowblade Fate Rerolls, and Relic-powered Golden Paths** |
| **Combat** | Repeated "Roll Attack" | None | **Tactical turn-based d20 Combat Arena with Enemy Intent Telegraphs, Class Skills, Guard/Ward, Focus management, & Consumables** |
| **Investigation & Riddles** | Text tooltips | Flippable Clue Cards | **3D Flippable Illuminated Relic Cards with High Fantasy Riddles that grant Lore Mastery, Satchel Relics, & Boss Weaknesses** |
| **Escalating Tension** | HP only | Suspicion Meter | **Vitality (HP) + Focus (MP) + Veil Dread (0–6) corruption meter that alters encounters and can trigger Veil Breach crises** |
| **Between-Chapter Loop** | Inn + Eltons' Shop | Linear case queue | **Oakhaven Bastion Hub: Master Elric's Curio Forge (buy/equip/sell gear), Hearth Rest & Veil Cleansing, Chronicle Map, and Push-Your-Luck Retirement** |
| **Scoring & Leaderboard** | Basic score sum | Server-authoritative breakdown + Hall of Fame | **Shared Client/Server ESM Scoring Engine, Legend Titles by Playstyle Stance, Hall of Legends + Recent Chronicles, Charter Inspection, & offline fallback** |
