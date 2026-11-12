// translate.js — ALL player-facing strings live here.
// Never hardcode user-visible text in components; add a key here and use t().

const STRINGS = {
  en: {
    title: "Bui",
    subtitle: "An autobattler",
    start: "Start",
    seed: "Seed {seed}",

    // Explore / edit phase
    exploreTitle: "Prepare",
    // Run display (the run as a line of battles and encounters)
    "runStep.battle": "Battle {n}",
    "runStep.boss": "Boss Battle {n}",
    "runStep.encounter": "Encounter",
    "runState.complete": "Done",
    "runState.current": "Now",
    "runState.future": "Ahead",
    runEnemy: "Against: {names}",
    slotHint: "Drag a node here",
    takeThings: "Take {n} Things",
    takeThing: "Take 1 Thing",
    dragEffectHint: "Drag it onto a node",
    leave: "Leave",
    continue: "Continue",
    runWon: "The run is won!",
    runLost: "The run is over.",
    toTitle: "Back to title",
    // Encounter params shown in descriptions
    paramEffect: "{name} {value}",
    paramEffectDelta: "{name} {value} (+{delta} per level)",
    fight: "Fight!",

    // Battle phase
    vs: "vs",
    play: "Play",
    pause: "Pause",
    restart: "Restart",
    skip: "Skip",
    speed: "×{n}",
    victory: "Victory!",
    defeat: "Defeat...",
    draw: "Draw",
    back: "Back",
    emptySlot: "Empty slot",
    // What sort of thing a tooltip is about (next to its title)
    "kind.fighter": "Fighter",
    "kind.equipment": "Equipment",
    "kind.node": "Node",
    "kind.effect": "Effect",

    // Fighters
    "fighter.ant": "Ant",
    "fighter.maxed": "Maxed Ant",
    "fighter.mite": "Mite",

    // Equipment
    "equipment.bluefur": "Blue Fur",
    "equipment.redplate": "Red Plate",
    "equipment.leafnecklace": "Leaf Necklace",
    "equipment.pack": "Pack",
    "equipment.powerstone": "Power Stone",

    // Tooltips
    // {charge}, {slot}, {hp} and {lvl} are drawn as symbols
    // Metric displays (small bordered stat boxes)
    metricCharge: "{n} {charge}",
    metricSlots: "{n} {slot}",
    metricChargeRate: "{n} {charge}/s",
    metricHp: "{n} {hp}",
    metricHealth: "{current}/{max} {hp}",
    metricLevel: "{n} {lvl}",
    metricEquipment: "Holds {n} equipment",
    // Each metric's name, the header of its tooltip: the concept, then its symbol
    "metricName.metricCharge": "Charge {charge}",
    "metricName.metricSlots": "Node Slots {slot}",
    "metricName.metricChargeRate": "Charge Rate {charge}",
    "metricName.metricHp": "Max Health {hp}",
    "metricName.metricLevel": "Level {lvl}",
    "metricName.fighterHp": "Max Health {hp}",
    "metricName.metricHealth": "Health {hp}",
    "metricName.metricEquipment": "Equipment Slots",
    // What each metric means (no numbers: the metric shows those)
    "metricTip.metricCharge":
      "How much {charge} the node needs to fire. Equipment charges the nodes touching it.",
    "metricTip.metricSlots":
      "How many {slot} this equipment adds to its row: tiles that nodes can sit in.",
    "metricTip.metricChargeRate":
      "How much {charge} this equipment gives each node touching it, every second.",
    "metricTip.metricHp":
      "How much {hp} this equipment adds to the max of the fighter holding it.",
    "metricTip.metricLevel":
      "The node's {lvl}. Each {lvl} adds the upgrade bonus to its effects. Drop a matching node of the same level on it to upgrade it.",
    "metricTip.fighterHp":
      "Max {hp}: the base, plus what each equipped piece adds.",
    "metricTip.metricHealth":
      "This fighter's {hp} right now, out of its max. At 0 it is defeated. Shield counters block damage first.",
    "metricTip.metricEquipment":
      "How many pieces of equipment this fighter can hold.",

    // Status counters (battle only)
    "status.shield": "Shield",
    "statusTip.shield": "Each counter blocks 1 damage, then is used up.",
    "status.focus": "Focus",
    "statusTip.focus":
      "Each counter makes this fighter's next Attack deal {percent}% more damage, then is used up.",
    statusCount: "{n} counters",

    // Rarities
    "rarity.common": "Common",
    "rarity.uncommon": "Uncommon",
    "rarity.rare": "Rare",

    // Encounters (name, description, action button). Descriptions can show
    // the encounter's params as {param}.
    "encounter.lootArea": "Loot Area",
    "encounterTip.lootArea": "Search the area and gain {count} random nodes.",
    "encounterAction.lootArea": "Search",
    "encounter.lootCarcass": "Loot Carcass",
    "encounterTip.lootCarcass": "Take one of {options} {nodeRarity} nodes.",
    "encounterAction.lootCarcass": "Search",
    "encounter.travelingMerchant": "Traveling Merchant",
    "encounterTip.travelingMerchant": "Choose one of {options} equipment.",
    "encounterAction.travelingMerchant": "Trade",
    "encounter.intenseTraining": "Intense Training",
    "encounterTip.intenseTraining":
      "Drag a node up and train it: it goes up {levels} level.",
    "encounterAction.intenseTraining": "Upgrade",
    "encounter.sharpen": "Sharpen",
    "encounterTip.sharpen": "Sharpen a node: it gains {effect}.",
    "encounterAction.sharpen": "Sharpen",
    "encounter.meditation": "Meditation",
    "encounterTip.meditation": "Gain {amount} max equipment.",
    "encounterAction.meditation": "Meditate",

    // Effect keywords
    "effect.attack": "Attack",
    "effect.shield": "Shield",
    "effect.heal": "Heal",
    "effect.strengthen": "Strengthen",
    "effect.strengthenAll": "Strengthen All",
    // What each effect does (no numbers: the effect row shows those)
    "effectTip.attack":
      "Deals damage to the first enemy still standing. Shield counters block it first.",
    "effectTip.shield":
      "Gives this fighter shield counters. Each blocks 1 damage, then is used up.",
    "effectTip.heal": "Restores {hp} to this fighter, never above its max.",
    "effectTip.strengthen":
      "Every Attack on this node deals that much more damage, for the rest of the battle. Stacks.",
    "effect.focus": "Focus",
    "effectTip.focus":
      "Gives this fighter focus counters. Each makes its next Attack deal {percent}% more damage, then is used up.",
    "effectTip.strengthenAll":
      "Every Attack on all of this fighter's nodes deals that much more damage, for the rest of the battle. Stacks.",

    // Nodes
    "node.redgrassblade": "Redgrass Blade",
    "node.stalkclub": "Stalk Club",
    "node.claw": "Claw",
    "node.bite": "Bite",
    "node.block": "Block",
    "node.battlestance": "Battle Stance",
  },
};

let currentLang = "en";

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
