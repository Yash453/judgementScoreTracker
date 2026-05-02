export type Suit = 'spades' | 'diamonds' | 'clubs' | 'hearts';
export const SUIT_ORDER: readonly Suit[] = ['spades', 'diamonds', 'clubs', 'hearts'] as const;

export const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
};

export const SUIT_LABEL: Record<Suit, string> = {
  spades: 'Spades',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  hearts: 'Hearts',
};

export type RoundPhase = 'bidding' | 'playing' | 'complete';

export type Player = {
  id: string;
  name: string;
};

export type RoundResult = {
  playerId: string;
  bid: number | null;
  tricks: number | null;
  scoreThisRound: number;
  cumulative: number;
};

export type Round = {
  index: number;
  cardsPerPlayer: number;
  trump: Suit;
  dealerId: string;
  results: RoundResult[];
  phase: RoundPhase;
};

export type RoundStructure = 'down-up' | 'down-only' | 'up-only' | 'fixed';

export type GameConfig = {
  startCards: number;
  structure: RoundStructure;
  fixedRounds?: number;
};

export type Game = {
  id: string;
  startedAt: number;
  completedAt?: number;
  players: Player[];
  config: GameConfig;
  rounds: Round[];
  currentRoundIndex: number;
};
