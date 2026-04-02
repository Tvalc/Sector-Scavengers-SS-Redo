import { ALL_CARDS, TacticCard } from '../content/cards';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  stats: {
    total: number;
    byRarity: Record<string, number>;
    withEnergyCost: number;
    withOvercharge: number;
    withRefund: number;
    withSurge: number;
    missingEnergyCost: string[];
    invalidByRarity: string[];
    surgeWithoutZeroCost: string[];
  };
}

export function validateCardEnergy(): ValidationResult {
  const errors: string[] = [];
  const missingEnergyCost: string[] = [];
  const invalidByRarity: string[] = [];
  const surgeWithoutZeroCost: string[] = [];

  const byRarity: Record<string, number> = {
    starter: 0,
    common: 0,
    uncommon: 0,
    rare: 0,
  };

  let withEnergyCost = 0;
  let withOvercharge = 0;
  let withRefund = 0;
  let withSurge = 0;

  for (const card of ALL_CARDS) {
    byRarity[card.rarity] = (byRarity[card.rarity] || 0) + 1;

    // Check energyCost exists
    if (card.energyCost === undefined) {
      missingEnergyCost.push(`${card.id} (${card.name})`);
      errors.push(`Missing energyCost: ${card.id}`);
    } else {
      withEnergyCost++;
    }

    // Validate rarity-based cost rules
    const cost = card.energyCost ?? 0;
    switch (card.rarity) {
      case 'starter':
        if (cost !== 0) {
          invalidByRarity.push(`${card.id}: starter should be 0⚡, got ${cost}⚡`);
          errors.push(`Invalid cost for starter ${card.id}: ${cost}⚡ (should be 0)`);
        }
        break;
      case 'common':
        if (cost !== 0 && cost !== 1) {
          invalidByRarity.push(`${card.id}: common should be 0-1⚡, got ${cost}⚡`);
          errors.push(`Invalid cost for common ${card.id}: ${cost}⚡ (should be 0-1)`);
        }
        break;
      case 'uncommon':
        if (cost !== 1) {
          invalidByRarity.push(`${card.id}: uncommon should be 1⚡, got ${cost}⚡`);
          errors.push(`Invalid cost for uncommon ${card.id}: ${cost}⚡ (should be 1)`);
        }
        break;
      case 'rare':
        if (cost !== 2) {
          invalidByRarity.push(`${card.id}: rare should be 2⚡, got ${cost}⚡`);
          errors.push(`Invalid cost for rare ${card.id}: ${cost}⚡ (should be 2)`);
        }
        break;
    }

    // Validate surge cards
    if (card.isSurge) {
      withSurge++;
      if (cost !== 0) {
        surgeWithoutZeroCost.push(`${card.id}: surge with ${cost}⚡ cost`);
        errors.push(`Surge card ${card.id} has non-zero cost: ${cost}⚡`);
      }
    }

    // Count overcharge
    if (card.overchargeEffect) {
      withOvercharge++;
    }

    // Count refunds
    if (card.energyRefund) {
      withRefund++;
    }

    // Special validation: extract cards shouldn't have overcharge (binary effect)
    if (card.id.includes('extract') && card.overchargeEffect) {
      errors.push(`Warning: ${card.id} has overcharge on extraction (binary effect)`);
    }
  }

  // Calculate percentages
  const total = ALL_CARDS.length;
  const refundPercentage = ((withRefund / total) * 100).toFixed(1);

  console.log('=== Card Energy Validation Results ===');
  console.log(`Total cards: ${total}`);
  console.log(`By rarity:`, byRarity);
  console.log(`With energyCost: ${withEnergyCost}/${total}`);
  console.log(`With overchargeEffect: ${withOvercharge} (target: ≥20)`);
  console.log(`With energyRefund: ${withRefund} (${refundPercentage}%, target: ~15%)`);
  console.log(`With isSurge: ${withSurge}`);
  console.log('');

  if (missingEnergyCost.length > 0) {
    console.log('⚠️ Missing energyCost:', missingEnergyCost);
    console.log('');
  }

  if (invalidByRarity.length > 0) {
    console.log('⚠️ Invalid costs by rarity:', invalidByRarity);
    console.log('');
  }

  if (surgeWithoutZeroCost.length > 0) {
    console.log('⚠️ Surge cards without 0⚡ cost:', surgeWithoutZeroCost);
    console.log('');
  }

  if (errors.length === 0) {
    console.log('✅ All cards have valid energy configurations!');
  } else {
    console.log(`❌ Found ${errors.length} issues`);
  }

  // Check targets
  if (withOvercharge < 20) {
    console.log(`⚠️ Only ${withOvercharge} cards have overcharge (target: ≥20)`);
  } else {
    console.log(`✅ Overcharge count: ${withOvercharge} (meets target ≥20)`);
  }

  const refundPct = withRefund / total;
  if (refundPct < 0.12 || refundPct > 0.20) {
    console.log(`⚠️ Refund percentage ${refundPercentage}% (target: ~15%)`);
  } else {
    console.log(`✅ Refund percentage: ${refundPercentage}% (within target ~15%)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      total,
      byRarity,
      withEnergyCost,
      withOvercharge,
      withRefund,
      withSurge,
      missingEnergyCost,
      invalidByRarity,
      surgeWithoutZeroCost,
    },
  };
}
