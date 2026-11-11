// translate.js — ALL player-facing strings live here.
// Never hardcode user-visible text in components; add a key here and use t().

const STRINGS = {
  en: {
    title: 'Bui',
    subtitle: 'An autobattler',
    start: 'Start',

    // Explore / edit phase
    exploreTitle: 'Explore',
    exploreIntro: 'Drag nodes and equipment into your fighter, and drag equipment to reorder it. Anything left floating is lost when the battle starts.',
    fight: 'Fight!',

    // Battle phase
    vs: 'vs',
    hp: 'HP {hp}/{max}',
    shield: 'Shield {amount}',
    play: 'Play',
    pause: 'Pause',
    restart: 'Restart',
    skip: 'Skip',
    speed: '×{n}',
    victory: 'Victory!',
    defeat: 'Defeat...',
    draw: 'Draw',
    back: 'Back',
    emptySlot: 'Empty slot',

    // Fighters
    'fighter.knight': 'Knight',
    'fighter.brute': 'Brute',

    // Equipment
    'equipment.sword': 'Sword',
    'equipment.shield': 'Shield',
    'equipment.charm': 'Charm',
    'equipment.pack': 'Pack',

    // Tooltips
    tipLevel: 'Level {n}',
    // {charge} and {slot} are drawn as symbols
    // Metric displays (small bordered stat boxes)
    metricCharge: '{n} {charge}',
    metricSlots: '{n} {slot}',
    metricChargeRate: '{n} {charge}/s',
    tipUpgrade: 'Drop a matching node of the same level on it to upgrade',

    // Effect keywords
    'effect.attack': 'Attack',
    'effect.shield': 'Shield',
    'effect.heal': 'Heal',

    // Nodes
    'node.slash': 'Slash',
    'node.bash': 'Bash',
    'node.guard': 'Guard',
    'node.mend': 'Mend',
    'node.spin': 'Spin',
  },
};

let currentLang = 'en';

export function setLanguage(lang) {
  if (STRINGS[lang]) currentLang = lang;
}

export function getLanguage() {
  return currentLang;
}

// Look up a string by key. Supports {placeholder} substitution:
// t('greeting', { name: 'Bui' }) with "Hello {name}" -> "Hello Bui"
export function t(key, vars = {}) {
  const str = STRINGS[currentLang]?.[key] ?? STRINGS.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}
