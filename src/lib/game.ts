import { trumpForRound } from './trump';
import type {
  GameConfig,
  Player,
  Round,
  RoundResult,
  RoundStructure,
} from './types';

export const DECK_SIZE = 52;

export const defaultStartCards = (playerCount: number): number =>
  Math.max(1, Math.floor(DECK_SIZE / Math.max(1, playerCount)));

export const buildCardSequence = (
  startCards: number,
  structure: RoundStructure,
  fixedRounds = 1,
): number[] => {
  const start = Math.max(1, startCards);
  switch (structure) {
    case 'down-only':
      return Array.from({ length: start }, (_, i) => start - i);
    case 'up-only':
      return Array.from({ length: start }, (_, i) => i + 1);
    case 'fixed':
      return Array.from({ length: Math.max(1, fixedRounds) }, () => start);
    case 'down-up':
    default: {
      const down = Array.from({ length: start }, (_, i) => start - i); // start..1
      const up = Array.from({ length: start - 1 }, (_, i) => i + 2); // 2..start
      return [...down, ...up];
    }
  }
};

export type RoundPlanEntry = {
  index: number;
  cardsPerPlayer: number;
  trump: ReturnType<typeof trumpForRound>;
  dealerIndex: number;
};

export const buildRoundPlan = (
  playerCount: number,
  config: GameConfig,
): RoundPlanEntry[] => {
  const sequence = buildCardSequence(
    config.startCards,
    config.structure,
    config.fixedRounds ?? 1,
  );
  return sequence.map((cardsPerPlayer, index) => ({
    index,
    cardsPerPlayer,
    trump: trumpForRound(index),
    dealerIndex: index % Math.max(1, playerCount),
  }));
};

export const initialiseRounds = (
  players: Player[],
  config: GameConfig,
): Round[] => {
  const plan = buildRoundPlan(players.length, config);
  return plan.map((entry) => ({
    index: entry.index,
    cardsPerPlayer: entry.cardsPerPlayer,
    trump: entry.trump,
    dealerId: players[entry.dealerIndex]!.id,
    phase: 'bidding',
    results: orderResultsForRound(players, entry.dealerIndex).map((p) => ({
      playerId: p.id,
      bid: null,
      tricks: null,
      scoreThisRound: 0,
      cumulative: 0,
    })),
  }));
};

// Bidding starts to the LEFT of the dealer; dealer bids last.
export const orderResultsForRound = (
  players: Player[],
  dealerIndex: number,
): Player[] => {
  const n = players.length;
  if (n === 0) return [];
  const start = (dealerIndex + 1) % n;
  return Array.from({ length: n }, (_, i) => players[(start + i) % n]!);
};

export const scoreFor = (bid: number | null, tricks: number | null): number => {
  if (bid === null || tricks === null) return 0;
  return bid === tricks ? 10 + bid : 0;
};

export type ValidationResult = { valid: true } | { valid: false; reason: string };

// Dealer (last bidder) cannot bid such that total bids === cardsPerPlayer.
// `proposedBid` is checked against the existing bids in `round` excluding the dealer's own slot.
export const validateDealerBid = (
  round: Round,
  dealerId: string,
  proposedBid: number,
): ValidationResult => {
  if (proposedBid < 0 || proposedBid > round.cardsPerPlayer) {
    return { valid: false, reason: `Bid must be between 0 and ${round.cardsPerPlayer}.` };
  }
  const othersTotal = round.results
    .filter((r) => r.playerId !== dealerId)
    .reduce((sum, r) => sum + (r.bid ?? 0), 0);
  if (othersTotal + proposedBid === round.cardsPerPlayer) {
    return {
      valid: false,
      reason: `Total bids can't equal ${round.cardsPerPlayer}.`,
    };
  }
  return { valid: true };
};

export const forbiddenDealerBids = (round: Round, dealerId: string): number[] => {
  const othersTotal = round.results
    .filter((r) => r.playerId !== dealerId)
    .reduce((sum, r) => sum + (r.bid ?? 0), 0);
  const forbidden = round.cardsPerPlayer - othersTotal;
  return forbidden >= 0 && forbidden <= round.cardsPerPlayer ? [forbidden] : [];
};

export const allBidsPlaced = (round: Round): boolean =>
  round.results.every((r) => r.bid !== null);

export const validateTricks = (round: Round): ValidationResult => {
  const total = round.results.reduce((sum, r) => sum + (r.tricks ?? 0), 0);
  if (round.results.some((r) => r.tricks === null)) {
    return { valid: false, reason: 'Enter hands for every player.' };
  }
  if (total !== round.cardsPerPlayer) {
    return {
      valid: false,
      reason: `Total hands (${total}) must equal cards dealt (${round.cardsPerPlayer}).`,
    };
  }
  return { valid: true };
};

export const computeRoundScores = (
  round: Round,
  priorCumulative: Record<string, number>,
): RoundResult[] =>
  round.results.map((r) => {
    const scoreThisRound = scoreFor(r.bid, r.tricks);
    return {
      ...r,
      scoreThisRound,
      cumulative: (priorCumulative[r.playerId] ?? 0) + scoreThisRound,
    };
  });

export const cumulativeBefore = (
  rounds: Round[],
  upToIndex: number,
): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (let i = 0; i < upToIndex && i < rounds.length; i++) {
    const round = rounds[i]!;
    if (round.phase !== 'complete') continue;
    for (const r of round.results) {
      totals[r.playerId] = (totals[r.playerId] ?? 0) + r.scoreThisRound;
    }
  }
  return totals;
};

export const finalStandings = (
  rounds: Round[],
  players: Player[],
): { player: Player; total: number; position: number }[] => {
  const totals = cumulativeBefore(rounds, rounds.length + 1);
  const sorted = [...players]
    .map((p) => ({ player: p, total: totals[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
  return sorted.map((entry, i) => ({ ...entry, position: i + 1 }));
};

export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
