import { TacticCard } from '../content/cards';

export function drawThree(availableCards: TacticCard[]): TacticCard[] {
  if (availableCards.length === 0) return [];
  if (availableCards.length <= 3) return [...availableCards];

  // Fisher-Yates partial shuffle — pick 3 unique cards
  const deck = [...availableCards];
  const count = Math.min(3, deck.length);

  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (deck.length - i));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }

  return deck.slice(0, count);
}
