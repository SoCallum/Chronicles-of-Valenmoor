# Deterministic Scoring & Legend Titles — Chronicles of Valenmoor

Scoring is computed deterministically by `src/engine/scoring.js`, shared between the client preview and the authoritative server endpoint (`POST /api/runs`).

## Score Components

1. **Chapter Endings**
   - `legendary`: **+750**
   - `triumph`: **+550**
   - `bittersweet`: **+325**
   - `fallen`: **+0**
2. **Lore & Relics Discovered**
   - Critical Lore: **+65** each (unique)
   - Optional Lore: **+25** each (unique)
   - Relic Riddles Solved: **+75** each
   - Relic Golden-Path Unlocks: **+100** each
3. **Combat Mastery**
   - Standard foe vanquished: **+80** each
   - Champion / Boss vanquished: **+180** each
4. **Roleplay Stance & Wit Bonus**
   - Witty / Lore-flavored choices (`stance: "witty"` or `"heroic"` / `"arcane"` / `"cunning"` oath beats): **+20** per distinctive beat, capped at **+140** per chapter (or **+360** across a full 4-chapter chronicle).
5. **Veil Dread Control**
   - Clean chapter completion (`dread === 0`): **+120** bonus
   - Controlled (`dread <= 2`): **+60** bonus
   - High Dread (`dread >= 4`): **-25** per point above 3
   - Veil Breach collapse: **-150** penalty
6. **Treasure & Armory Hoard**
   - Gold held + half equipment value (capped at **+400** so gold hoarding complements rather than eclipses heroism).

## Legend Titles (Derived from Playstyle)
- **Mythic Sovereign** — Completed all 4 chapters with a Legendary finale
- **Silver-Tongued Bard** — Predominantly Witty choices
- **Arcane Savant** — Predominantly Arcane choices & riddles solved
- **Ironclad Vanguard** — Predominantly Heroic choices & foes vanquished
- **Ghost of the Reach** — Predominantly Cunning choices & low Veil Dread
- **Wayfarer of Valenmoor** — Balanced path across the realm
