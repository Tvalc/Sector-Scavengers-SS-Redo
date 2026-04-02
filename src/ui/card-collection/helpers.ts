// Card Collection Panel - Helper Functions

import { CardRarity } from '../../content/cards';

export function getRarityColor(rarity: CardRarity): string {
  switch (rarity) {
    case 'starter': return '#a0aec0';
    case 'common': return '#48bb78';
    case 'uncommon': return '#63b3ed';
    case 'rare': return '#f6e05e';
    default: return '#718096';
  }
}
