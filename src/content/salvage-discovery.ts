// Salvage discovery narrative text — atmospheric descriptions for finding each salvage tier.
// Every salvage gain should feel like discovering buried treasure in the wreck.

import type { SalvageTier } from './salvage';

/** Discovery context — where/how the salvage was found. */
export type DiscoveryContext = 'combat' | 'exploration' | 'breach' | 'cache' | 'relay';

/** Narrative descriptions for finding scrap — twisted metal, broken things, disaster's aftermath. */
const SCRAP_DISCOVERY: string[] = [
  "Twisted hull plating crumpled like paper. The collision that tore this ship apart left nothing whole behind.",
  "Scorched bulkhead segments float in zero-g, their edges still sharp enough to tear a suit. Someone's ship became scrap metal.",
  "Piping and conduit tangled in frozen knots. The emergency systems failed here—you can tell by how the metal bent.",
  "A cargo container breached open, its contents long gone. The frame remains: twisted aluminum, worth melting down.",
  "Jagged struts and severed cable bundles drift past your viewport. The wreck gives up its bones reluctantly.",
  "Fragments of a bulkhead door, warped by explosive decompression. Whatever happened here happened fast.",
  "Mangled support beams groan as you cut them free. This ship died screaming, and you're harvesting its remains.",
  "Rusted machinery parts fused together in the heat of the disaster. Nothing works, but the metal remembers how.",
];

/** Narrative descriptions for finding components — viable parts, working machinery, unfinished repairs. */
const COMPONENTS_DISCOVERY: string[] = [
  "A capacitor bank still holds charge. The diagnostic light blinks green—someone's repair interrupted by catastrophe.",
  "Coolant pumps whir when you apply auxiliary power. They were fixing the engine when the hull failed.",
  "Stacked fuel cells in a partially flooded bay. The water never reached the top row—they'll hold a charge.",
  "Navigation computer modules, salvaged before the crash. Someone valued their data more than their life.",
  "Thermal regulators wrapped in protective foam. Whoever stowed them expected to finish the job later.",
  "Servo motors in a partially collapsed storage locker. The casing cracked, but the windings test clean.",
  "Backup generator components in a sealed maintenance pod. Never deployed, never used, never claimed.",
  "Pressure seals and valve assemblies in a toolbox someone left behind. They were coming back for these.",
];

/** Narrative descriptions for finding relics — glowing, strange, valuable, dangerous. */
const RELIC_DISCOVERY: string[] = [
  "A cylinder of crystal lattice hums at a frequency you feel in your teeth. It was important to whoever died protecting it.",
  "Orbital mechanics etched into a metal sphere that shouldn't exist yet. The alloy doesn't match any known register.",
  "A memory core glowing with violet phosphorescence. The data is encrypted in a protocol your ship doesn't recognize.",
  "Strange geometries folded into a device no larger than your fist. It emits radiation in rhythmic pulses—almost like breathing.",
  "An insignia you don't recognize stamped into ceramic armor. The material is older than the wreck that contained it.",
  "Crystalline matrices suspended in magnetic suspension. Whatever they stored, someone didn't want it degrading.",
  "A handheld device displaying coordinates to a system not on any chart. The battery still holds centuries of charge.",
  "Metallic shards that rearrange themselves when unobserved. You catch them moving in your peripheral vision.",
];

/** Narrative descriptions for finding medtech — life-saving, sterile, frozen second chances. */
const MEDTECH_DISCOVERY: string[] = [
  "Surgical implements in a sterile pouch, expiration date centuries away. Someone's second chance, vacuum-sealed.",
  "Auto-injectors filled with stabilized nanite suspension. The medical bay flooded, but these stayed dry in their case.",
  "A portable cardiac stabilizer still in its original packaging. The crew never got to use their own emergency equipment.",
  "Cryo-preservation vials in a temperature-regulated container. Biological samples—someone's research, someone's legacy.",
  "Trauma foam canisters rated for hull-breach injuries. The instructions are printed in twelve languages. Universally needed.",
  "A field surgery kit with instruments that sharpen themselves. Never opened, never needed, never forgotten until now.",
  "Diagnostic scanner with calibration still valid. It was charging when the power failed—fully topped off, waiting for patients who never came.",
  "Synthetic skin patches and organ stabilizers in a crash-resistant case. Whoever packed this believed they might survive.",
];

/** Map of salvage tiers to their discovery description arrays. */
export const SALVAGE_DISCOVERY_TEXT: Record<SalvageTier, string[]> = {
  scrap: SCRAP_DISCOVERY,
  components: COMPONENTS_DISCOVERY,
  relic: RELIC_DISCOVERY,
  medtech: MEDTECH_DISCOVERY,
};

/** Context prefixes that modify the discovery narrative. */
const CONTEXT_PREFIXES: Record<DiscoveryContext, string[]> = {
  combat: [
    "In the aftermath of the skirmish, you find:",
    "The fighting cleared debris from hidden compartments:",
    "Amid the wreckage of the encounter:",
    "Your opponent's defeat reveals:",
  ],
  exploration: [
    "Searching the derelict corridors, you discover:",
    "Your scanners pick up an anomaly:",
    "Behind a sealed hatch marked with faded warnings:",
    "The quiet of the dead ship yields:",
  ],
  breach: [
    "Through the hull breach, floating debris reveals:",
    "Exposed to vacuum by the rupture:",
    "The torn compartment disgorges its contents:",
    "Where the hull failed, treasure spills:",
  ],
  cache: [
    "Inside the sealed cache, preserved against time:",
    "The container opens with a hiss of stale air:",
    "Someone stored this carefully, planning to return:",
    "Hidden away from the disaster that claimed the rest:",
  ],
  relay: [
    "The relay drone returns from base with confirmation:",
    "Transmission complete. The haul is secured at the hub:",
    "Through encrypted channels, salvage reaches safety:",
    "Smuggler's network confirms delivery:",
  ],
};

/** Quantity descriptors for small vs large finds. */
function quantityDescriptor(quantity: number, tier: SalvageTier): string {
  if (tier === 'scrap') {
    if (quantity <= 2) return "a handful of twisted fragments";
    if (quantity <= 4) return "several battered pieces";
    if (quantity <= 6) return "a respectable pile of debris";
    return "a significant haul of wreckage";
  }
  if (tier === 'components') {
    if (quantity <= 2) return "a few viable units";
    if (quantity <= 4) return "several working parts";
    if (quantity <= 6) return "a cache of useful components";
    return "an impressive stockpile of equipment";
  }
  if (tier === 'relic') {
    if (quantity === 1) return "a single enigmatic object";
    if (quantity <= 2) return "a pair of strange artifacts";
    if (quantity <= 4) return "several mysterious items";
    return "a collection of inexplicable objects";
  }
  if (tier === 'medtech') {
    if (quantity <= 2) return "a few precious medical supplies";
    if (quantity <= 4) return "several life-saving implements";
    if (quantity <= 6) return "a substantial medical cache";
    return "an invaluable trove of medical equipment";
  }
  return `${quantity} units`;
}

/**
 * Format a discovery narrative for salvage found during a run.
 *
 * Returns randomized, contextualized discovery text combining:
 * - Optional context prefix (combat/exploration/breach)
 * - Random discovery description for the tier
 * - Quantity descriptor
 *
 * @param tier - The salvage tier found
 * @param quantity - How many units were discovered
 * @param context - Optional context for the discovery (affects prefix)
 * @returns Formatted narrative string for display
 */
export function formatDiscoveryNarrative(
  tier: SalvageTier,
  quantity: number,
  context?: DiscoveryContext,
): string {
  const descriptions = SALVAGE_DISCOVERY_TEXT[tier];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  const qtyDesc = quantityDescriptor(quantity, tier);

  let result = "";

  // Add context prefix if provided (50% chance to use one)
  if (context) {
    const prefixes = CONTEXT_PREFIXES[context];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    result = `${prefix}\n\n`;
  }

  // Combine description with quantity
  result += `${description}\n\nFound: ${qtyDesc}.`;

  return result;
}

/** Simple random selection without context — for quick narrative display. */
export function getRandomDiscoveryText(tier: SalvageTier): string {
  const descriptions = SALVAGE_DISCOVERY_TEXT[tier];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}
