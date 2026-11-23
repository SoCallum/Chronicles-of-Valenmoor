# Scene Node Schema — Chronicles of Valenmoor

Every chapter in `data/chapter-XX.json` is an array of portable JSON scene nodes.

## Node Structure
```json
{
  "id": "ch1_n1",
  "chapterId": "chapter-01",
  "stage": "opening",
  "title": "The Silverwood Threshold",
  "summary": "Frost-bitten thorns choke the lantern road beneath the Whispering Canopy.",
  "entry": {
    "location": "Whispering Canopy · Lantern Arch",
    "time": "Golden Dusk",
    "mood": ["high-fantasy", "mystery"]
  },
  "tags": ["opening", "exploration"],
  "art": {
    "sceneKey": "silverwood_gate",
    "caption": "Silver birches arch over a runed waystone pulsing with pale emerald mist.",
    "relicCard": {
      "riddleId": "riddle_silver_bark",
      "artKey": "relic_bark_seal",
      "caption": "Inscribed dryad bark-seal — click to inspect runes"
    }
  },
  "text": [
    "Paragraph one...",
    "Paragraph two..."
  ],
  "onEnter": {
    "flagsAdd": ["Entered Silverwood"],
    "dreadDelta": 0,
    "goldDelta": 0,
    "hpDelta": 0
  },
  "choices": [
    {
      "id": "ch1_n1_study",
      "label": "Decode the waystone runes before stepping into the mist.",
      "stance": "arcane",
      "check": {
        "stat": "arcana",
        "dc": 12,
        "advantageClasses": ["scholar"],
        "successNext": "ch1_n2",
        "failNext": "ch1_n3",
        "failEffects": { "dreadDelta": 1 }
      },
      "relicBypass": {
        "itemId": "relic_moonstone_lens",
        "bonusText": "Moonstone Lens reveals the cipher automatically (+100 Mastery)"
      },
      "effects": {
        "loreAdd": ["lore_waystone_cipher"],
        "flagsAdd": ["Waystone Decoded"],
        "goldDelta": 15
      }
    },
    {
      "id": "ch1_n1_fight",
      "label": "Draw steel and confront the Thorn Stalker prowling the roots.",
      "stance": "heroic",
      "combat": {
        "enemyId": "thorn_stalker",
        "victoryNext": "ch1_n4",
        "fleeNext": "ch1_n3"
      }
    }
  ]
}
```

## Terminal Ending Nodes
Ending nodes include `"tags": ["ending"]` and an `"ending"` block:
```json
"ending": {
  "type": "legendary",
  "headline": "The Heart-Tree Blooms Anew",
  "epilogue": "Silver blossoms drift across Oakhaven's rooftops as the Canopy sings once more.",
  "rewardGold": 85,
  "rewardItem": "gear_silverleaf_charm"
}
```
Valid ending types: `legendary`, `triumph`, `bittersweet`, `fallen`.
