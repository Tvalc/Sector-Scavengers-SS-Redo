// Salvage Market narrative content — rebel economy framing and trader voice.
// The market feels different from the corporate hub — shadowy, whispered, a space
// where Nexus "chooses not to know."

/**
 * Market title variations — different ways to frame the unregistered exchange.
 */
export const MARKET_TITLES: string[] = [
  'THE HOLD — UNREGISTERED EXCHANGE',
  'THE BILGE MARKET — NO QUESTIONS',
  'BELOW-DECK EXCHANGE — OFF MANIFEST',
  'THE UNREGISTERED — SHADOW ECONOMY',
];

/**
 * Trader introduction lines — first contact when opening the market.
 * Establishes the tone: this is where corporate oversight ends.
 */
export const TRADER_INTROS: string[] = [
  "The Company doesn't scan this far down. What you brought stays between us.",
  "Nexus 'chooses not to know' about this level. Their gift to you. Use it.",
  "No manifests filed here. No debt accounting. Just materials and what they mean to people who need them.",
  "Below the audit threshold. Above the survival line. That's where we do business.",
  "The cameras down here record static. The logs show empty rooms. Your cargo is already invisible.",
];

/**
 * Ambient flavor text — bottom of panel atmosphere description.
 * Reinforces the rebel market mood.
 */
export const AMBIENT_FLAVOR: string[] = [
  "Shadows move in the peripheral vents. Everyone here owes something. Nobody asks what.",
  "The lighting flickers with the station's heartbeat. Three hundred years of deferred maintenance.",
  "A trader in the corner counts power cells with gloved hands. Their face is just another shadow.",
  "The air recyclers wheeze. Someone is welding something in a compartment without a door.",
  "You hear footsteps that don't match anyone visible. The Hold has always had its own population.",
  "A child—maybe—watches from behind a collapsed crate. Gone when you look directly.",
];

/**
 * Hardware item trader notes — narrative descriptions of why scavengers want these items.
 * Each note tells a small story about the item's history or the people seeking it.
 */
export const HARDWARE_TRADER_NOTES: Record<string, string> = {
  // Hull items
  hull_plating: "Standard issue. The crew that stripped these died of old age. In this economy, that's optimism.",
  ablative_armor: "The hull plates on deck 7 were still warm when we found them. Someone died making these work.",
  reactive_shell: "Rumor says this came off a ship that jumped without clearance. The shell held. The crew didn't.",
  bulkhead_plating: "Corporate surplus from a decommissioned rig. The paperwork says destroyed. The plating disagrees.",

  // Scanner items
  basic_scanner: "Standard deep-scan unit. Previous owner didn't need it anymore. That's the story with most things here.",
  deep_scanner: "Found in a maintenance locker with a handwritten manual. Previous owner cared about it. Learned from it.",
  void_sensor: "Don't ask how we got this. Don't ask why it hums at frequencies that make teeth hurt. It works.",

  // Utility items
  power_cell: "Fresh from a derelict medical bay. Whatever machine it powered saved someone, once. Maybe it'll save you.",
  shield_recycler: "Salvaged from a fighter escort that took debris damage. Shield held. Pilot didn't need this backup.",
  extraction_rig: "Professional-grade extraction hardware. Some corporate operator upgraded and left this behind. Their loss.",
  bot_chassis: "Frame from a maintenance bot that worked three centuries without complaint. Loyalty like that is rare.",
  shield_emitter: "Military surplus. The kind of hardware that keeps you alive when someone decides you shouldn't be.",

  // Extended hardware — additional narrative notes
  reinforced_bulkhead: "The engineer who designed these believed in over-engineering. Good trait. Bad for their stress levels.",
  adaptive_plating: "Experimental alloy that remembers impacts. Almost certainly not corporate-approved. That's the appeal.",
  emergency_sealant: "Rapid-harden foam. One canister saved a crew of twelve when the forward compartment blew. One canister.",
  structural_integrity: "Analysis rig from a decommissioned station. It calculated exactly when that station would fail. Accurately.",
  predictive_scanner: "Found in a lab that doesn't appear on any registry. The coordinates in its memory lead to void space.",
  resonance_detector: "Picks up signals that shouldn't exist. The last owner went looking for one. We're selling their gear.",
  neural_interface: "Direct neural hardware. Illegal in seventeen jurisdictions. We're in jurisdiction eighteen.",
  emergency_reserves: "Power systems from a lifeboat that never launched. Someone chose to stay. Someone else gets to leave.",
  salvage_drone: "Autonomous recovery unit. Works without asking questions. More reliable than most crew I've known.",
};

/**
 * Get a random element from an array.
 */
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get a random market title for the panel header.
 */
export function getRandomMarketTitle(): string {
  return getRandomElement(MARKET_TITLES);
}

/**
 * Get a random trader introduction line.
 */
export function getRandomTraderIntro(): string {
  return getRandomElement(TRADER_INTROS);
}

/**
 * Get random ambient flavor text for the market atmosphere.
 */
export function getRandomAmbientFlavor(): string {
  return getRandomElement(AMBIENT_FLAVOR);
}

/**
 * Get the trader note for a hardware item.
 * Falls back to a generic note if no specific story exists.
 */
export function getHardwareTraderNote(itemId: string): string {
  return HARDWARE_TRADER_NOTES[itemId] ?? "Standard hardware. No history attached. Yet.";
}

/**
 * Color scheme for the rebel market — distinct from corporate cyan.
 * Uses warmer, darker tones: amber, deep bronze, shadow colors.
 */
export const REBEL_MARKET_COLORS = {
  border: '#8b5a2b',        // Warm bronze
  borderHighlight: '#d4a574', // Light amber
  accent: '#cd853f',        // Peru/tan
  accentGlow: '#daa520',    // Goldenrod
  bgDark: '#0f0c08',        // Deep shadow brown
  bgCard: '#1a1410',        // Warm dark card bg
  textMuted: '#a09080',     // Warm gray
};
