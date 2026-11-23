import assert from "node:assert/strict";
import fsp from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyNodeEffects,
  recordChapterEnding,
  resolveNarrativeChoice,
  solveRelicRiddle
} from "../src/engine/campaign.js";
import { createCombatSession, performCombatAction } from "../src/engine/combat.js";
import { calculateCheckOdds, getModifier, resolveSkillCheck, roll4d6DropLowest } from "../src/engine/dice.js";
import { computeChronicleScore, deriveLegendTitle } from "../src/engine/scoring.js";
import { buildScoringInput, computeDerivedStats, createNewRunState, equipGearItem } from "../src/engine/state.js";
import { createServer } from "../server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const catalog = JSON.parse(await fsp.readFile(path.join(ROOT, "data/catalog.json"), "utf-8"));
const chaptersMeta = JSON.parse(await fsp.readFile(path.join(ROOT, "data/chapters.json"), "utf-8"));

test("dice mechanics: modifiers, 4d6-drop-lowest, and exact check odds", () => {
  assert.equal(getModifier(10), 0);
  assert.equal(getModifier(16), 3);
  assert.equal(getModifier(8), -1);

  const rolled = roll4d6DropLowest(() => 0.99);
  assert.equal(rolled.total, 18);

  // With stat 10 (mod 0) vs DC 11 -> rolls 11..20 succeed (10/20 = 50%)
  assert.equal(calculateCheckOdds(10, 11, false), 50);
  // With advantage -> 1 - 0.5^2 = 75%
  assert.equal(calculateCheckOdds(10, 11, true), 75);

  const critFail = resolveSkillCheck({ statScore: 18, dc: 5, rng: () => 0.0 });
  assert.equal(critFail.chosen, 1);
  assert.equal(critFail.success, false);

  const critSuccess = resolveSkillCheck({ statScore: 8, dc: 25, rng: () => 0.99 });
  assert.equal(critSuccess.chosen, 20);
  assert.equal(critSuccess.success, true);
});

test("state & equipment: equipping gear updates derived HP, Focus, AC, and Attack", () => {
  const state = createNewRunState({
    heroName: "Aldric",
    classId: "paladin",
    catalog
  });
  const before = computeDerivedStats(state.hero, catalog);

  equipGearItem(state, "gear_runebound_greatsword", catalog);
  equipGearItem(state, "gear_valen_plate", catalog);
  equipGearItem(state, "gear_silverleaf_charm", catalog);

  const after = computeDerivedStats(state.hero, catalog);
  assert.ok(after.attackBonus > before.attackBonus);
  assert.ok(after.armor > before.armor);
  assert.ok(after.maxHp > before.maxHp);
  assert.equal(after.damageDie, 10);
});

test("combat engine: boss relic weakness, Ward, Stun, and victory bounty", () => {
  const state = createNewRunState({
    heroName: "Rowan",
    classId: "warden",
    catalog
  });
  state.hero.relics.push("relic_silver_bell");

  const boss = catalog.enemies.hollow_warden;
  const combat = createCombatSession({
    state,
    enemyId: "hollow_warden",
    victoryNext: "ch1_end_triumph",
    fleeNext: "ch1_end_bittersweet",
    catalog
  });

  assert.equal(combat.weaknessTriggered, true);
  assert.ok(combat.hp < boss.hp);
  assert.equal(combat.ac, boss.ac - 2);

  // Briar Grasp stuns the boss so enemy misses its turn
  const hpBefore = state.hp;
  performCombatAction({ state, combat, action: "skill", catalog, rng: () => 0.85 });
  assert.equal(state.hp, hpBefore);
  assert.equal(combat.enemyStunned, false); // consumed during skipped enemy turn

  // Guard & Channel restores Focus
  const focusBefore = state.focus;
  performCombatAction({ state, combat, action: "guard", catalog, rng: () => 0.1 });
  assert.equal(state.focus, Math.min(state.maxFocus, focusBefore + 2));
});

test("campaign engine: Relic Riddle, Golden Path unlock, Warden Dread shield, and Shadowblade reroll", () => {
  const warden = createNewRunState({ heroName: "Elowen", classId: "warden", catalog });
  applyNodeEffects(warden, { dreadDelta: 1 }, catalog);
  assert.equal(warden.dread, 0);
  assert.equal(warden.wardenDreadShieldUsed, true);
  applyNodeEffects(warden, { dreadDelta: 1 }, catalog);
  assert.equal(warden.dread, 1);

  const solved = solveRelicRiddle({
    state: warden,
    riddleId: "riddle_silver_bark",
    answerIndex: 0,
    catalog
  });
  assert.equal(solved.status, "solved");
  assert.ok(warden.hero.relics.includes("relic_moonstone_lens"));

  // Relic Golden Path bypasses check automatically
  const choice = {
    id: "test_golden",
    stance: "arcane",
    relicBypass: { itemId: "relic_moonstone_lens", bonusText: "Unlocked!" },
    check: { stat: "arcana", dc: 20, successNext: "win_node", failNext: "lose_node" }
  };
  const res = resolveNarrativeChoice({
    state: warden,
    node: { stage: "opening" },
    choice,
    catalog,
    rng: () => 0.0
  });
  assert.equal(res.nextNodeId, "win_node");
  assert.equal(warden.relicUnlocks, 1);

  // Shadowblade rerolls failed check automatically once per stage
  const rogue = createNewRunState({ heroName: "Vespera", classId: "shadowblade", catalog });
  let rollStep = 0;
  const sequence = [0.05, 0.9, 0.9]; // initial roll fails, reroll succeeds
  const rerollRes = resolveNarrativeChoice({
    state: rogue,
    node: { stage: "investigation" },
    choice: {
      id: "test_reroll",
      stance: "cunning",
      check: { stat: "agility", dc: 14, successNext: "ok", failNext: "bad" }
    },
    catalog,
    rng: () => sequence[rollStep++] ?? 0.5
  });
  assert.equal(rerollRes.nextNodeId, "ok");
  assert.ok(rogue.rerollUsedStages.includes("investigation"));
});

test("deterministic scoring & Legend Titles", () => {
  const state = createNewRunState({ heroName: "Seren", classId: "scholar", catalog });
  state.loreIds.push("lore_waystone_cipher", "lore_dryad_pact");
  state.solvedRiddles.push("riddle_silver_bark");
  state.relicUnlocks = 1;
  state.enemiesDefeated = 1;
  state.bossesDefeated = 1;
  state.stanceCounts.arcane = 4;

  recordChapterEnding({
    state,
    chapterMeta: chaptersMeta.chapters[0],
    endingNode: {
      title: "The Heart-Tree Blooms Anew",
      ending: { type: "legendary", headline: "Savior", epilogue: "Done", rewardGold: 85, rewardItem: "gear_silverleaf_charm" }
    },
    catalog
  });

  const result = computeChronicleScore(buildScoringInput(state, catalog));
  assert.ok(result.total > 1200);
  assert.equal(result.legendTitle, "Arcane Savant");
  assert.equal(result.chaptersCleared, 1);

  const mythic = deriveLegendTitle({
    chapterResults: [
      { chapterId: "chapter-01", endingType: "triumph" },
      { chapterId: "chapter-02", endingType: "triumph" },
      { chapterId: "chapter-03", endingType: "triumph" },
      { chapterId: "chapter-04", endingType: "legendary" }
    ]
  });
  assert.equal(mythic.title, "Mythic Sovereign");
});

test("campaign JSON graph integrity across tutorial and all 4 chapters", async () => {
  const allChapters = [chaptersMeta.tutorial, ...chaptersMeta.chapters];

  for (const meta of allChapters) {
    const raw = await fsp.readFile(path.join(ROOT, meta.dataUrl), "utf-8");
    const nodes = JSON.parse(raw);
    assert.ok(Array.isArray(nodes) && nodes.length >= 2, `${meta.chapterId} has nodes`);

    const byId = new Map(nodes.map((n) => [n.id, n]));
    assert.equal(byId.size, nodes.length, `${meta.chapterId} has unique node IDs`);

    let endingCount = 0;
    for (const node of nodes) {
      if (node.art?.relicCard?.riddleId) {
        assert.ok(
          catalog.riddles[node.art.relicCard.riddleId],
          `Unknown riddle ${node.art.relicCard.riddleId} in ${node.id}`
        );
      }
      if (node.tags?.includes("ending")) {
        endingCount += 1;
        assert.ok(node.ending?.type, `Ending node ${node.id} missing ending.type`);
        if (node.ending.rewardItem) {
          assert.ok(catalog.equipment[node.ending.rewardItem], `Unknown rewardItem ${node.ending.rewardItem}`);
        }
        continue;
      }

      assert.ok(Array.isArray(node.choices) && node.choices.length > 0, `Non-ending node ${node.id} needs choices`);
      for (const ch of node.choices) {
        if (ch.next) assert.ok(byId.has(ch.next), `Broken next '${ch.next}' in ${node.id}`);
        if (ch.check) {
          assert.ok(byId.has(ch.check.successNext), `Broken successNext '${ch.check.successNext}' in ${node.id}`);
          assert.ok(byId.has(ch.check.failNext), `Broken failNext '${ch.check.failNext}' in ${node.id}`);
        }
        if (ch.combat) {
          assert.ok(catalog.enemies[ch.combat.enemyId], `Unknown enemy '${ch.combat.enemyId}' in ${node.id}`);
          assert.ok(byId.has(ch.combat.victoryNext), `Broken victoryNext '${ch.combat.victoryNext}' in ${node.id}`);
          assert.ok(byId.has(ch.combat.fleeNext), `Broken fleeNext '${ch.combat.fleeNext}' in ${node.id}`);
        }
        if (ch.relicBypass) {
          assert.ok(catalog.relics[ch.relicBypass.itemId], `Unknown relic '${ch.relicBypass.itemId}' in ${node.id}`);
        }
        for (const loreId of ch.effects?.loreAdd || []) {
          assert.ok(catalog.lore[loreId], `Unknown lore '${loreId}' in ${node.id}`);
        }
      }
    }
    assert.ok(endingCount >= 1, `${meta.chapterId} has at least one ending`);
  }
});

test("HTTP server API: authoritative scoring and static security guards", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const homeRes = await fetch(`${base}/`);
    assert.equal(homeRes.status, 200);
    const html = await homeRes.text();
    assert.ok(html.includes("Chronicles of Valenmoor"));

    const blockedRes = await fetch(`${base}/server.js`);
    assert.equal(blockedRes.status, 403);

    const dotRes = await fetch(`${base}/.env.example`);
    assert.equal(dotRes.status, 403);

    const boardRes = await fetch(`${base}/api/leaderboard`);
    assert.equal(boardRes.status, 200);
    const boardJson = await boardRes.json();
    assert.ok(Array.isArray(boardJson.runs) && boardJson.runs.length > 0);

    // Submit a run with a spoofed clientScore to verify authoritative server scoring
    const postRes = await fetch(`${base}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: "TEST-AUTH-1",
        heroName: "Test Hero",
        classId: "paladin",
        portraitKey: "portrait_paladin",
        clientScore: { total: 999999 },
        scoringInput: {
          chapterResults: [{ chapterId: "chapter-01", endingType: "triumph", dreadAtEnd: 1 }],
          criticalLoreCount: 1,
          optionalLoreCount: 0,
          riddlesSolved: 1,
          relicUnlocks: 0,
          enemiesDefeated: 1,
          bossesDefeated: 0,
          stanceCounts: { heroic: 2, arcane: 0, cunning: 0, witty: 0 },
          gold: 50,
          gearValue: 80,
          veilBreaches: 0
        }
      })
    });
    assert.equal(postRes.status, 201);
    const postJson = await postRes.json();
    // 550 (triumph) + 60 (low dread) + 65 (crit lore) + 75 (riddle) + 80 (enemy) + 40 (stance) + 90 (hoard) = 960
    assert.equal(postJson.run.score, 960);
    assert.notEqual(postJson.run.score, 999999);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    // Clean up test storage file if created
    await fsp.rm(path.join(ROOT, "storage"), { recursive: true, force: true });
  }
});
