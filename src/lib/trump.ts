import { SUIT_ORDER, type Suit } from './types';

export const trumpForRound = (roundIndex: number): Suit =>
  SUIT_ORDER[((roundIndex % SUIT_ORDER.length) + SUIT_ORDER.length) % SUIT_ORDER.length];
