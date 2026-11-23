/**
 * Bespoke Illuminated High-Fantasy SVG Art & Iconography System.
 * Zero external image dependencies, razor-sharp at any DPI, richly layered
 * with warm amber, obsidian, emerald, alabaster, and antique gold palettes.
 */

const SCENE_THEMES = {
  oakhaven_bastion: {
    skyTop: "#1a1714",
    skyMid: "#3c2a1d",
    skyBot: "#9d6833",
    accent: "#e2b866",
    mist: "#d9a760",
    motif: "bastion"
  },
  silverwood_gate: {
    skyTop: "#0f1916",
    skyMid: "#1b332b",
    skyBot: "#3a5c4a",
    accent: "#7ed4a7",
    mist: "#9de0bc",
    motif: "forest"
  },
  silverwood_shrine: {
    skyTop: "#101b19",
    skyMid: "#1e3a34",
    skyBot: "#5c7a62",
    accent: "#e3c57b",
    mist: "#a7e2c1",
    motif: "shrine"
  },
  silverwood_heart: {
    skyTop: "#141112",
    skyMid: "#2c1e20",
    skyBot: "#4b5a42",
    accent: "#88e0a4",
    mist: "#d48556",
    motif: "heart_tree"
  },
  star_vault: {
    skyTop: "#0e151d",
    skyMid: "#18293a",
    skyBot: "#2c4c63",
    accent: "#e2bf72",
    mist: "#8ec5de",
    motif: "astrolabe"
  },
  star_vault_core: {
    skyTop: "#0a1119",
    skyMid: "#1a2f46",
    skyBot: "#46687f",
    accent: "#f2d388",
    mist: "#a8d8ec",
    motif: "orrery"
  },
  ashenspire_forge: {
    skyTop: "#19100e",
    skyMid: "#3a1b14",
    skyBot: "#9b3d1d",
    accent: "#f4a340",
    mist: "#e3682e",
    motif: "forge"
  },
  ashenspire_heart: {
    skyTop: "#1b0d0b",
    skyMid: "#4d1a11",
    skyBot: "#c75522",
    accent: "#ffcf6e",
    mist: "#f07c36",
    motif: "drake_crucible"
  },
  glass_crown: {
    skyTop: "#12161c",
    skyMid: "#263242",
    skyBot: "#687a8c",
    accent: "#f3dca1",
    mist: "#d5e4f0",
    motif: "spire"
  },
  glass_loom: {
    skyTop: "#151412",
    skyMid: "#332a1e",
    skyBot: "#856c42",
    accent: "#ffe296",
    mist: "#f0d494",
    motif: "loom"
  }
};

function renderSceneMotif(motif, accent) {
  switch (motif) {
    case "bastion":
      return `
        <!-- Floating Star-Spires in distance -->
        <g opacity="0.85">
          <polygon points="150,48 164,84 150,104 136,84" fill="#e9dcc2" opacity="0.82"/>
          <polygon points="150,48 164,84 150,104" fill="#c9a86c" opacity="0.45"/>
          <line x1="150" y1="36" x2="150" y2="115" stroke="${accent}" stroke-width="1.2" opacity="0.6"/>
          <polygon points="485,36 497,70 485,88 473,70" fill="#e9dcc2" opacity="0.72"/>
          <circle cx="485" cy="64" r="18" fill="none" stroke="${accent}" stroke-width="0.9" opacity="0.45"/>
        </g>
        <!-- Distant peaks -->
        <path d="M0,220 L90,145 L180,185 L270,120 L380,175 L490,130 L640,210 L640,360 L0,360 Z" fill="#231914" opacity="0.75"/>
        <!-- Waterfall gorge -->
        <path d="M0,235 L220,235 L255,360 L0,360 Z" fill="#17120f"/>
        <path d="M640,230 L415,230 L385,360 L640,360 Z" fill="#17120f"/>
        <rect x="292" y="242" width="56" height="118" fill="url(#waterGrad)" opacity="0.6"/>
        <!-- Citadel Bridge & Towers -->
        <path d="M180,235 Q320,192 460,235 L460,256 Q320,216 180,256 Z" fill="#2b211b" stroke="${accent}" stroke-width="1" opacity="0.95"/>
        <rect x="200" y="155" width="44" height="90" fill="#1f1713" stroke="${accent}" stroke-width="0.8"/>
        <polygon points="196,155 222,118 248,155" fill="#2e2018"/>
        <rect x="396" y="148" width="48" height="95" fill="#1f1713" stroke="${accent}" stroke-width="0.8"/>
        <polygon points="392,148 420,108 448,148" fill="#2e2018"/>
        <rect x="288" y="168" width="64" height="60" fill="#241b16" stroke="${accent}" stroke-width="0.8"/>
        <polygon points="282,168 320,132 358,168" fill="#35251a"/>
        <!-- Warm Torch Windows -->
        <g fill="#ffcf70">
          <rect x="217" y="175" width="10" height="16" rx="5"/>
          <rect x="415" y="170" width="10" height="16" rx="5"/>
          <rect x="312" y="185" width="16" height="22" rx="8"/>
          <circle cx="268" cy="216" r="3"/>
          <circle cx="372" cy="216" r="3"/>
        </g>
      `;
    case "forest":
    case "shrine":
    case "heart_tree":
      return `
        <!-- Sun/Moon shaft -->
        <polygon points="260,0 385,0 440,360 200,360" fill="${accent}" opacity="0.09"/>
        <!-- Silver Birch Trunks -->
        <g fill="#26332c" stroke="#c8d6cb" stroke-width="1" opacity="0.85">
          <rect x="52" y="20" width="22" height="340"/>
          <rect x="128" y="40" width="16" height="320"/>
          <rect x="495" y="30" width="18" height="330"/>
          <rect x="558" y="15" width="26" height="345"/>
        </g>
        <!-- Central Landmark -->
        ${
          motif === "heart_tree"
            ? `<path d="M255,360 C275,280 280,210 272,140 C240,120 210,95 190,60 C245,88 282,102 320,70 C358,102 395,88 450,60 C430,95 400,120 368,140 C360,210 365,280 385,360 Z" fill="#18221d" stroke="${accent}" stroke-width="1.3"/>
               <ellipse cx="320" cy="212" rx="22" ry="34" fill="${accent}" opacity="0.85"/>
               <ellipse cx="320" cy="212" rx="46" ry="58" fill="${accent}" opacity="0.22"/>
               <path d="M298,195 L345,232" stroke="#221012" stroke-width="6" stroke-linecap="round"/>`
            : motif === "shrine"
              ? `<path d="M230,305 L230,155 Q320,85 410,155 L410,305" fill="none" stroke="#d8ccb4" stroke-width="10"/>
                 <path d="M250,305 L250,165 Q320,110 390,165 L390,305" fill="none" stroke="${accent}" stroke-width="1.5"/>
                 <circle cx="320" cy="185" r="24" fill="${accent}" opacity="0.25"/>
                 <path d="M308,180 L332,180 L328,205 L312,205 Z" fill="#e5d7b8" stroke="${accent}" stroke-width="1.4"/>`
              : `<path d="M275,310 L292,165 L320,138 L348,165 L365,310 Z" fill="#1d2b24" stroke="${accent}" stroke-width="1.5"/>
                 <circle cx="320" cy="202" r="18" fill="none" stroke="${accent}" stroke-width="2"/>
                 <path d="M320,175 L320,230 M302,202 L338,202" stroke="${accent}" stroke-width="1.6"/>`
        }
        <!-- Forest Floor -->
        <path d="M0,295 Q160,275 320,298 Q480,320 640,285 L640,360 L0,360 Z" fill="#101815"/>
      `;
    case "astrolabe":
    case "orrery":
      return `
        <!-- Vaulted Dome Arches -->
        <path d="M60,360 L60,150 Q320,-10 580,150 L580,360" fill="none" stroke="#3c5c74" stroke-width="8" opacity="0.65"/>
        <path d="M120,360 L120,165 Q320,40 520,165 L520,360" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.5"/>
        <!-- Giant Brass Astrolabe Rings -->
        <g transform="translate(320, 168)">
          <circle r="92" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.85"/>
          <circle r="76" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="6 5" opacity="0.7"/>
          <ellipse rx="92" ry="34" fill="none" stroke="${accent}" stroke-width="2" transform="rotate(-24)" opacity="0.85"/>
          <ellipse rx="92" ry="34" fill="none" stroke="${accent}" stroke-width="1.5" transform="rotate(28)" opacity="0.65"/>
          <circle r="18" fill="${accent}" opacity="0.88"/>
          <circle r="34" fill="${accent}" opacity="0.18"/>
          <line x1="0" y1="-108" x2="0" y2="108" stroke="${accent}" stroke-width="1.4" opacity="0.7"/>
        </g>
        <!-- Mirror Lake Reflection Floor -->
        <rect x="0" y="275" width="640" height="85" fill="#0b141d" opacity="0.9"/>
        <ellipse cx="320" cy="312" rx="140" ry="14" fill="${accent}" opacity="0.16"/>
        <line x1="160" y1="305" x2="480" y2="305" stroke="${accent}" stroke-width="1" opacity="0.45"/>
      `;
    case "forge":
    case "drake_crucible":
      return `
        <!-- Hanging Obsidian Chains -->
        <g stroke="#2a1d1a" stroke-width="7" stroke-dasharray="14 6">
          <line x1="145" y1="0" x2="185" y2="210"/>
          <line x1="495" y1="0" x2="455" y2="210"/>
        </g>
        <!-- Molten Caldera Floor -->
        <path d="M0,285 Q160,260 320,288 Q480,315 640,275 L640,360 L0,360 Z" fill="#d96426" opacity="0.82"/>
        <path d="M0,305 Q200,290 320,315 Q480,335 640,300 L640,360 L0,360 Z" fill="#ffbe55" opacity="0.5"/>
        <!-- Foundry Crucible Deck -->
        <polygon points="150,215 490,215 455,275 185,275" fill="#1d1412" stroke="${accent}" stroke-width="1.5"/>
        ${
          motif === "drake_crucible"
            ? `<!-- Cinder-Drake Silhouette -->
               <path d="M320,108 L265,78 L212,132 L262,152 L288,210 L352,210 L378,152 L428,132 L375,78 Z" fill="#1a100f" stroke="${accent}" stroke-width="1.8"/>
               <circle cx="310" cy="126" r="4" fill="#ffe184"/>
               <circle cx="330" cy="126" r="4" fill="#ffe184"/>
               <circle cx="320" cy="180" r="28" fill="${accent}" opacity="0.25"/>`
            : `<!-- Master Anvil & Flaming Crucible -->
               <rect x="278" y="138" width="84" height="78" fill="#231613" stroke="${accent}" stroke-width="1.2"/>
               <ellipse cx="320" cy="140" rx="44" ry="12" fill="#ffb84d"/>
               <path d="M292,140 Q320,76 348,140 Z" fill="#ff9436" opacity="0.85"/>`
        }
      `;
    case "spire":
    case "loom":
    default:
      return `
        <!-- Radiant Veil Halo -->
        <circle cx="320" cy="150" r="118" fill="${accent}" opacity="0.12"/>
        <circle cx="320" cy="150" r="82" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.7"/>
        ${
          motif === "loom"
            ? `<!-- Sovereign Loom Harp Strings -->
               <path d="M210,300 L245,65 L395,65 L430,300" fill="none" stroke="#f0e4c8" stroke-width="5"/>
               <g stroke="${accent}" stroke-width="1.4" opacity="0.85">
                 <line x1="265" y1="68" x2="255" y2="295"/>
                 <line x1="292" y1="68" x2="288" y2="295"/>
                 <line x1="320" y1="68" x2="320" y2="295"/>
                 <line x1="348" y1="68" x2="352" y2="295"/>
                 <line x1="375" y1="68" x2="385" y2="295"/>
               </g>
               <polygon points="320,108 344,150 320,192 296,150" fill="${accent}" opacity="0.9"/>`
            : `<!-- Fractured Floating Crown of Glass -->
               <polygon points="320,42 365,148 320,235 275,148" fill="#ebe3d2" opacity="0.9"/>
               <polygon points="320,42 365,148 320,235" fill="#c7b28a" opacity="0.5"/>
               <polygon points="240,110 264,152 246,195 222,152" fill="#e5dbc5" opacity="0.72"/>
               <polygon points="400,110 418,152 394,195 376,152" fill="#e5dbc5" opacity="0.72"/>
               <path d="M292,135 L348,162 M302,175 L340,122" stroke="${accent}" stroke-width="2.2"/>`
        }
        <!-- Alabaster Sky Bridge -->
        <path d="M110,360 L275,260 L365,260 L530,360 Z" fill="#1e2228" stroke="${accent}" stroke-width="1.2"/>
      `;
  }
}

export function renderSceneSvg(sceneKey = "oakhaven_bastion") {
  const theme = SCENE_THEMES[sceneKey] || SCENE_THEMES.oakhaven_bastion;
  const uid = `sc_${sceneKey}`;
  return `
    <svg class="art-svg art-svg--scene" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${sceneKey.replace(/_/g, " ")} illustration">
      <defs>
        <linearGradient id="${uid}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${theme.skyTop}"/>
          <stop offset="58%" stop-color="${theme.skyMid}"/>
          <stop offset="100%" stop-color="${theme.skyBot}"/>
        </linearGradient>
        <radialGradient id="${uid}_glow" cx="50%" cy="42%" r="48%">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e5c88c"/>
          <stop offset="100%" stop-color="#354f5e"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#${uid}_sky)"/>
      <rect width="640" height="360" fill="url(#${uid}_glow)"/>
      <!-- Subtle Starfield -->
      <g fill="#f5e6c4" opacity="0.65">
        <circle cx="84" cy="46" r="1.4"/><circle cx="195" cy="30" r="1.1"/><circle cx="290" cy="54" r="1.6"/>
        <circle cx="425" cy="34" r="1.3"/><circle cx="540" cy="58" r="1.5"/><circle cx="592" cy="92" r="1.1"/>
        <circle cx="122" cy="86" r="1"/><circle cx="468" cy="82" r="1.2"/>
      </g>
      ${renderSceneMotif(theme.motif, theme.accent)}
      <!-- Atmospheric Mist Band -->
      <ellipse cx="320" cy="340" rx="340" ry="42" fill="${theme.mist}" opacity="0.12"/>
      <!-- Illuminated Gold Leaf Border -->
      <rect x="8" y="8" width="624" height="344" fill="none" stroke="${theme.accent}" stroke-width="1.2" opacity="0.48"/>
      <rect x="13" y="13" width="614" height="334" fill="none" stroke="${theme.accent}" stroke-width="0.6" opacity="0.28"/>
    </svg>
  `;
}

export function renderPortraitSvg(portraitKey = "portrait_paladin") {
  const configs = {
    portrait_paladin: {
      bg1: "#2a1f15",
      bg2: "#5b3b1e",
      gold: "#e5be6a",
      cloak: "#8f2c24",
      emblem: `<path d="M100,40 L118,62 L100,84 L82,62 Z" fill="#f3d27d"/><circle cx="100" cy="62" r="24" fill="none" stroke="#e5be6a" stroke-width="1.5"/>`,
      silhouette: `
        <path d="M46,192 Q100,145 154,192 L162,220 L38,220 Z" fill="#8f2c24" stroke="#e5be6a" stroke-width="1.5"/>
        <path d="M68,144 L132,144 L126,188 L74,188 Z" fill="#c9c2b4" stroke="#e5be6a" stroke-width="1.4"/>
        <path d="M74,88 Q100,58 126,88 L124,132 Q100,146 76,132 Z" fill="#d8cfc0" stroke="#e5be6a" stroke-width="1.6"/>
        <path d="M84,104 L116,104 L112,113 L88,113 Z" fill="#231914"/>
        <line x1="100" y1="74" x2="100" y2="132" stroke="#e5be6a" stroke-width="2"/>
      `
    },
    portrait_scholar: {
      bg1: "#121f28",
      bg2: "#244354",
      gold: "#e6c678",
      cloak: "#1e4b5c",
      emblem: `<circle cx="100" cy="62" r="28" fill="none" stroke="#e6c678" stroke-width="1.4" stroke-dasharray="4 3"/><circle cx="100" cy="62" r="18" fill="none" stroke="#9ad6e8" stroke-width="1.2"/>`,
      silhouette: `
        <path d="M42,195 Q100,140 158,195 L164,220 L36,220 Z" fill="#1e4b5c" stroke="#e6c678" stroke-width="1.5"/>
        <path d="M66,94 Q100,48 134,94 L142,145 Q100,162 58,145 Z" fill="#183847" stroke="#e6c678" stroke-width="1.5"/>
        <ellipse cx="100" cy="112" rx="20" ry="24" fill="#d9c6b0"/>
        <circle cx="92" cy="110" r="2.4" fill="#243a47"/><circle cx="108" cy="110" r="2.4" fill="#243a47"/>
        <path d="M72,96 Q100,82 128,96" fill="none" stroke="#e6c678" stroke-width="2.2"/>
        <circle cx="100" cy="86" r="5" fill="#9de2f2"/>
      `
    },
    portrait_shadowblade: {
      bg1: "#171413",
      bg2: "#352925",
      gold: "#d9b066",
      cloak: "#282220",
      emblem: `<path d="M64,58 Q100,32 136,58" fill="none" stroke="#d9b066" stroke-width="1.4"/><polygon points="100,42 106,62 100,72 94,62" fill="#d9b066"/>`,
      silhouette: `
        <path d="M44,195 Q100,144 156,195 L164,220 L36,220 Z" fill="#241e1c" stroke="#d9b066" stroke-width="1.4"/>
        <path d="M68,88 Q100,52 132,88 L138,146 L62,146 Z" fill="#1b1615" stroke="#d9b066" stroke-width="1.4"/>
        <ellipse cx="100" cy="110" rx="19" ry="22" fill="#cdb8a1"/>
        <path d="M80,114 L120,114 L116,134 L84,134 Z" fill="#2a2321" stroke="#d9b066" stroke-width="1"/>
        <line x1="87" y1="104" x2="96" y2="106" stroke="#181210" stroke-width="2.4"/>
        <line x1="113" y1="104" x2="104" y2="106" stroke="#181210" stroke-width="2.4"/>
      `
    },
    portrait_warden: {
      bg1: "#112018",
      bg2: "#264736",
      gold: "#d8be74",
      cloak: "#244734",
      emblem: `<path d="M74,64 Q100,32 126,64 M100,38 L100,74" fill="none" stroke="#8de0ae" stroke-width="1.6"/>`,
      silhouette: `
        <path d="M42,195 Q100,144 158,195 L164,220 L36,220 Z" fill="#244734" stroke="#d8be74" stroke-width="1.5"/>
        <path d="M66,94 L54,60 M134,94 L146,60 M62,74 L46,72 M138,74 L154,72" stroke="#d8be74" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="100" cy="112" rx="20" ry="24" fill="#d8c5ae"/>
        <path d="M78,95 Q100,76 122,95" fill="none" stroke="#8de0ae" stroke-width="2.6"/>
        <circle cx="92" cy="110" r="2.5" fill="#183324"/><circle cx="108" cy="110" r="2.5" fill="#183324"/>
      `
    }
  };

  const c = configs[portraitKey] || configs.portrait_paladin;
  const uid = `pt_${portraitKey}`;
  return `
    <svg class="art-svg art-svg--portrait" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${portraitKey}">
      <defs>
        <radialGradient id="${uid}_bg" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stop-color="${c.bg2}"/>
          <stop offset="100%" stop-color="${c.bg1}"/>
        </radialGradient>
      </defs>
      <rect width="200" height="220" fill="url(#${uid}_bg)"/>
      ${c.emblem}
      ${c.silhouette}
      <rect x="7" y="7" width="186" height="206" fill="none" stroke="${c.gold}" stroke-width="1.6" opacity="0.65"/>
      <rect x="12" y="12" width="176" height="196" fill="none" stroke="${c.gold}" stroke-width="0.7" opacity="0.35"/>
    </svg>
  `;
}

export function renderRelicCardSvg(artKey = "relic_seal_card") {
  const glyphs = {
    relic_seal_card: `<polygon points="120,42 156,100 120,158 84,100" fill="none" stroke="#f0cc75" stroke-width="3"/><circle cx="120" cy="100" r="24" fill="#f0cc75" opacity="0.24"/><circle cx="120" cy="100" r="9" fill="#f0cc75"/>`,
    relic_bark_seal: `<path d="M120,44 C156,64 156,136 120,156 C84,136 84,64 120,44 Z" fill="none" stroke="#87dda9" stroke-width="3"/><circle cx="120" cy="100" r="18" fill="#87dda9" opacity="0.26"/><path d="M120,66 L120,134 M102,100 L138,100" stroke="#f0cc75" stroke-width="2"/>`,
    relic_bell_card: `<path d="M96,132 L144,132 L134,82 Q120,58 106,82 Z" fill="none" stroke="#e8dcbe" stroke-width="3"/><circle cx="120" cy="142" r="7" fill="#f0cc75"/><path d="M80,94 Q70,104 80,114 M160,94 Q170,104 160,114" fill="none" stroke="#87dda9" stroke-width="2"/>`,
    relic_mirror_card: `<ellipse cx="120" cy="94" rx="34" ry="44" fill="#8ec5de" opacity="0.18" stroke="#f0cc75" stroke-width="3"/><line x1="120" y1="138" x2="120" y2="164" stroke="#f0cc75" stroke-width="4"/><circle cx="110" cy="82" r="5" fill="#fff2c2"/>`,
    relic_key_card: `<circle cx="120" cy="74" r="22" fill="none" stroke="#f0cc75" stroke-width="3.5"/><line x1="120" y1="96" x2="120" y2="156" stroke="#f0cc75" stroke-width="4"/><line x1="120" y1="132" x2="140" y2="132" stroke="#f0cc75" stroke-width="3.5"/><line x1="120" y1="148" x2="134" y2="148" stroke="#f0cc75" stroke-width="3.5"/>`,
    relic_quench_card: `<polygon points="120,42 134,86 176,100 134,114 120,158 106,114 64,100 106,86" fill="none" stroke="#9ad6e8" stroke-width="2.6"/><circle cx="120" cy="100" r="14" fill="#f4a340" opacity="0.5"/>`,
    relic_charter_card: `<rect x="82" y="54" width="76" height="92" rx="6" fill="none" stroke="#f0cc75" stroke-width="2.8"/><line x1="96" y1="78" x2="144" y2="78" stroke="#e8dcbe" stroke-width="2"/><line x1="96" y1="96" x2="144" y2="96" stroke="#e8dcbe" stroke-width="2"/><circle cx="120" cy="124" r="11" fill="#c74a38"/>`,
    relic_prism_card: `<polygon points="120,42 164,140 76,140" fill="#f0cc75" opacity="0.16" stroke="#f5dfa0" stroke-width="3"/><line x1="56" y1="106" x2="108" y2="98" stroke="#ffffff" stroke-width="2"/><line x1="132" y1="96" x2="184" y2="78" stroke="#f0cc75" stroke-width="2"/><line x1="134" y1="106" x2="184" y2="122" stroke="#87dda9" stroke-width="2"/>`,
    relic_lantern_card: `<path d="M98,74 L142,74 L148,136 L92,136 Z" fill="none" stroke="#f0cc75" stroke-width="3"/><path d="M120,86 Q134,108 120,126 Q106,108 120,86 Z" fill="#ffcf6e"/><path d="M104,74 Q120,50 136,74" fill="none" stroke="#f0cc75" stroke-width="2.5"/>`
  };

  return `
    <svg class="art-svg art-svg--relic" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illuminated Relic Rune Card">
      <defs>
        <radialGradient id="rc_${artKey}" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#3a2c1c"/>
          <stop offset="100%" stop-color="#171310"/>
        </radialGradient>
      </defs>
      <rect width="240" height="200" fill="url(#rc_${artKey})"/>
      <circle cx="120" cy="100" r="74" fill="none" stroke="#d4aa5a" stroke-width="1" stroke-dasharray="4 6" opacity="0.5"/>
      ${glyphs[artKey] || glyphs.relic_seal_card}
      <rect x="8" y="8" width="224" height="184" fill="none" stroke="#d4aa5a" stroke-width="1.3" opacity="0.6"/>
      <text x="120" y="180" text-anchor="middle" fill="#e5c782" font-size="11" letter-spacing="2" font-family="serif">INSPECT RUNE</text>
    </svg>
  `;
}

export function renderEnemySvg(artKey = "enemy_thorn", isBoss = false) {
  const accent = isBoss ? "#e86343" : "#d9ad5b";
  const shapes = {
    enemy_construct: `<rect x="74" y="54" width="52" height="68" rx="6" fill="#2a221c" stroke="${accent}" stroke-width="2.4"/><circle cx="100" cy="40" r="18" fill="#2a221c" stroke="${accent}" stroke-width="2.4"/><line x1="88" y1="38" x2="112" y2="38" stroke="#ffcf6e" stroke-width="3"/>`,
    enemy_thorn: `<path d="M48,124 Q78,52 100,66 Q122,52 152,124 L126,112 L100,136 L74,112 Z" fill="#18271e" stroke="#7ed4a7" stroke-width="2.4"/><circle cx="88" cy="84" r="4" fill="#ff7452"/><circle cx="112" cy="84" r="4" fill="#ff7452"/>`,
    enemy_dryad_boss: `<path d="M56,142 L74,78 L50,42 L86,62 L100,28 L114,62 L150,42 L126,78 L144,142 Z" fill="#1a241d" stroke="${accent}" stroke-width="2.4"/><circle cx="100" cy="92" r="14" fill="#7ed4a7" opacity="0.7"/><line x1="86" y1="80" x2="114" y2="104" stroke="#220f10" stroke-width="4"/>`,
    enemy_sentinel: `<polygon points="100,28 134,70 124,142 76,142 66,70" fill="#1c3140" stroke="#e5c171" stroke-width="2.4"/><line x1="100" y1="22" x2="100" y2="148" stroke="#8ec5de" stroke-width="2"/>`,
    enemy_astral_boss: `<circle cx="100" cy="84" r="46" fill="none" stroke="#f0ce7c" stroke-width="2.2"/><ellipse cx="100" cy="84" rx="54" ry="20" fill="none" stroke="#8ec5de" stroke-width="2" transform="rotate(-25 100 84)"/><path d="M76,136 Q100,40 124,136 Z" fill="#1a2c3d" stroke="${accent}" stroke-width="2"/>`,
    enemy_zealot: `<path d="M64,142 L100,32 L136,142 Z" fill="#3a1914" stroke="#f4a340" stroke-width="2.4"/><path d="M100,56 Q114,76 100,92 Q86,76 100,56 Z" fill="#ffcf6e"/>`,
    enemy_drake_boss: `<path d="M26,72 L74,56 L100,30 L126,56 L174,72 L138,104 L126,142 L74,142 L62,104 Z" fill="#2a120f" stroke="#ffae42" stroke-width="2.6"/><circle cx="88" cy="70" r="4.5" fill="#ffe184"/><circle cx="112" cy="70" r="4.5" fill="#ffe184"/>`,
    enemy_veil_knight: `<polygon points="100,26 142,84 100,144 58,84" fill="#222a34" stroke="#f0d99c" stroke-width="2.4"/><line x1="76" y1="62" x2="124" y2="108" stroke="#e86343" stroke-width="2.2"/>`,
    enemy_sovereign_boss: `<polygon points="100,22 122,52 152,40 132,88 148,142 52,142 68,88 48,40 78,52" fill="#231c15" stroke="#ffdb7d" stroke-width="2.6"/><circle cx="100" cy="84" r="18" fill="#ffdb7d" opacity="0.3"/><circle cx="100" cy="84" r="7" fill="#ff7c52"/>`
  };

  return `
    <svg class="art-svg art-svg--enemy" viewBox="0 0 200 164" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Enemy crest">
      <rect width="200" height="164" rx="10" fill="#171210"/>
      <circle cx="100" cy="84" r="56" fill="${accent}" opacity="0.1"/>
      ${shapes[artKey] || shapes.enemy_thorn}
      <rect x="6" y="6" width="188" height="152" rx="8" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.55"/>
    </svg>
  `;
}

export function renderIconSvg(name = "sword") {
  const icons = {
    sword: `<path d="M14.5 3.5L20.5 9.5L9 21H3V15L14.5 3.5ZM12 6L18 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    shield: `<path d="M12 3L19 6V12C19 16.5 15.8 19.8 12 21C8.2 19.8 5 16.5 5 12V6L12 3Z" stroke="currentColor" stroke-width="1.8" fill="none"/>`,
    spark: `<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.7" fill="none"/>`,
    potion: `<path d="M9 3H15M10 3V7L6 14A4 4 0 0 0 9.5 20H14.5A4 4 0 0 0 18 14L14 7V3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    d20: `<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke="currentColor" stroke-width="1.8" fill="none"/><polygon points="12,5 18,16 6,16" stroke="currentColor" stroke-width="1.3" fill="none"/>`,
    relic: `<polygon points="12,2 19,9 12,22 5,9" stroke="currentColor" stroke-width="1.8" fill="none"/><line x1="5" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.4"/>`,
    hearth: `<path d="M12 3C14 7 18 9 18 14A6 6 0 1 1 6 14C6 10.5 8 8.5 9.5 6.5C10 8.5 11.5 9 12 3Z" stroke="currentColor" stroke-width="1.8" fill="none"/>`,
    soundOn: `<path d="M5 9H9L14 5V19L9 15H5V9ZM17 9A4 4 0 0 1 17 15M19.5 6.5A7.5 7.5 0 0 1 19.5 17.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    soundOff: `<path d="M5 9H9L14 5V19L9 15H5V9ZM17 9L21 15M21 9L17 15" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  };
  return `<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
}
