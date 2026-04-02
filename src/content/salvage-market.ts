// Salvage Market — mid-tier hardware listings purchasable with echo + salvage

export interface MarketListing {
  hardwareId: string;
  echoCost: number;
  salvageCost: number; // in scrap units (1 scrap = 1 unit)
  salvageTier: 'scrap' | 'components' | 'relic';
}

/**
 * Mid-tier hardware available for purchase at the Salvage Market.
 * These items are not obtainable through research tracks.
 * Prices are set to represent meaningful investment for mid-game progression.
 */
export const SALVAGE_MARKET_LISTINGS: MarketListing[] = [
  // Common tier hardware — 3 echo + salvage
  {
    hardwareId: 'ablative_armor',
    echoCost: 3,
    salvageCost: 2,
    salvageTier: 'scrap',
  },
  {
    hardwareId: 'deep_scanner',
    echoCost: 3,
    salvageCost: 3,
    salvageTier: 'scrap',
  },
  {
    hardwareId: 'extraction_rig',
    echoCost: 3,
    salvageCost: 2,
    salvageTier: 'scrap',
  },
  {
    hardwareId: 'shield_recycler',
    echoCost: 3,
    salvageCost: 2,
    salvageTier: 'scrap',
  },
  {
    hardwareId: 'med_scanner',
    echoCost: 3,
    salvageCost: 2,
    salvageTier: 'scrap',
  },

  // Uncommon tier hardware — 5 echo + components
  {
    hardwareId: 'bot_chassis',
    echoCost: 5,
    salvageCost: 2,
    salvageTier: 'components',
  },
  {
    hardwareId: 'bulkhead_plating',
    echoCost: 5,
    salvageCost: 3,
    salvageTier: 'components',
  },
  {
    hardwareId: 'bot_overclocker',
    echoCost: 5,
    salvageCost: 2,
    salvageTier: 'components',
  },
  {
    hardwareId: 'reactive_plating',
    echoCost: 5,
    salvageCost: 2,
    salvageTier: 'components',
  },
  {
    hardwareId: 'extended_tanks',
    echoCost: 5,
    salvageCost: 2,
    salvageTier: 'components',
  },

  // Rare tier hardware — 8 echo + relics
  {
    hardwareId: 'void_resonator',
    echoCost: 8,
    salvageCost: 1,
    salvageTier: 'relic',
  },
  {
    hardwareId: 'echo_battery',
    echoCost: 8,
    salvageCost: 1,
    salvageTier: 'relic',
  },
];

/**
 * Get a listing by hardware ID.
 */
export function getMarketListing(hardwareId: string): MarketListing | undefined {
  return SALVAGE_MARKET_LISTINGS.find((l) => l.hardwareId === hardwareId);
}

/**
 * Check if the player can afford a specific market listing.
 */
export function canAffordListing(
  listing: MarketListing,
  voidEcho: number,
  salvageInventory: Array<{ tier: string; quantity: number }>,
): boolean {
  if (voidEcho < listing.echoCost) return false;

  const salvageEntry = salvageInventory.find(
    (e) => e.tier === listing.salvageTier,
  );
  const hasSalvage = (salvageEntry?.quantity ?? 0) >= listing.salvageCost;

  return hasSalvage;
}

/**
 * Check if a hardware item is already owned (equipped or in inventory).
 */
export function isHardwareOwned(
  hardwareId: string,
  equippedItems: Record<string, string | null>,
  itemInventory: string[],
): boolean {
  const equippedValues = Object.values(equippedItems).filter(Boolean);
  return equippedValues.includes(hardwareId) || itemInventory.includes(hardwareId);
}
