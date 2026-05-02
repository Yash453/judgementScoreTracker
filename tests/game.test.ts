import { describe, expect, it } from 'vitest';
import {
  buildCardSequence,
  buildRoundPlan,
  computeRoundScores,
  cumulativeBefore,
  defaultStartCards,
  finalStandings,
  forbiddenDealerBids,
  initialiseRounds,
  orderResultsForRound,
  scoreFor,
  validateDealerBid,
  validateTricks,
} from '@/lib/game';
import type { GameConfig, Player, Round } from '@/lib/types';

const players: Player[] = [
  { id: 'a', name: 'Asha' },
  { id: 'b', name: 'Bilal' },
  { id: 'c', name: 'Chitra' },
  { id: 'd', name: 'Dev' },
  { id: 'e', name: 'Eli' },
];

const baseConfig: GameConfig = {
  startCards: defaultStartCards(players.length),
  structure: 'down-up',
};

describe('defaultStartCards', () => {
  it('returns floor(52/players)', () => {
    expect(defaultStartCards(2)).toBe(26);
    expect(defaultStartCards(3)).toBe(17);
    expect(defaultStartCards(4)).toBe(13);
    expect(defaultStartCards(5)).toBe(10);
    expect(defaultStartCards(7)).toBe(7);
  });
});

describe('buildCardSequence', () => {
  it('down-up for 5 players is 10→1→10 (19 rounds)', () => {
    const seq = buildCardSequence(10, 'down-up');
    expect(seq).toHaveLength(19);
    expect(seq[0]).toBe(10);
    expect(seq[9]).toBe(1);
    expect(seq[seq.length - 1]).toBe(10);
  });

  it('down-only', () => {
    expect(buildCardSequence(5, 'down-only')).toEqual([5, 4, 3, 2, 1]);
  });

  it('up-only', () => {
    expect(buildCardSequence(5, 'up-only')).toEqual([1, 2, 3, 4, 5]);
  });

  it('fixed', () => {
    expect(buildCardSequence(5, 'fixed', 4)).toEqual([5, 5, 5, 5]);
  });
});

describe('buildRoundPlan', () => {
  it('rotates trump through suits', () => {
    const plan = buildRoundPlan(5, baseConfig);
    expect(plan[0]!.trump).toBe('spades');
    expect(plan[1]!.trump).toBe('diamonds');
    expect(plan[2]!.trump).toBe('clubs');
    expect(plan[3]!.trump).toBe('hearts');
    expect(plan[4]!.trump).toBe('spades');
  });

  it('rotates dealer index by 1 each round', () => {
    const plan = buildRoundPlan(5, baseConfig);
    expect(plan[0]!.dealerIndex).toBe(0);
    expect(plan[1]!.dealerIndex).toBe(1);
    expect(plan[4]!.dealerIndex).toBe(4);
    expect(plan[5]!.dealerIndex).toBe(0);
  });
});

describe('orderResultsForRound', () => {
  it('starts to the left of dealer; dealer is last', () => {
    const ordered = orderResultsForRound(players, 0).map((p) => p.id);
    expect(ordered).toEqual(['b', 'c', 'd', 'e', 'a']);
  });
});

describe('scoreFor', () => {
  it('returns 10 + bid on exact hit', () => {
    expect(scoreFor(0, 0)).toBe(10);
    expect(scoreFor(3, 3)).toBe(13);
    expect(scoreFor(7, 7)).toBe(17);
  });

  it('returns 0 on miss', () => {
    expect(scoreFor(3, 2)).toBe(0);
    expect(scoreFor(0, 1)).toBe(0);
  });

  it('treats nulls as 0', () => {
    expect(scoreFor(null, 3)).toBe(0);
    expect(scoreFor(3, null)).toBe(0);
  });
});

const makeRound = (cards: number, dealerId: string, bids: (number | null)[]): Round => ({
  index: 0,
  cardsPerPlayer: cards,
  trump: 'spades',
  dealerId,
  phase: 'bidding',
  results: orderResultsForRound(players, players.findIndex((p) => p.id === dealerId)).map(
    (p, i) => ({
      playerId: p.id,
      bid: bids[i] ?? null,
      tricks: null,
      scoreThisRound: 0,
      cumulative: 0,
    }),
  ),
});

describe('validateDealerBid', () => {
  it('rejects a dealer bid that makes total === cards', () => {
    // 5-player, 10 cards. Others bid 2,2,2,2 = 8. Dealer bid of 2 → total 10, forbidden.
    const round = makeRound(10, 'a', [2, 2, 2, 2, null]);
    const result = validateDealerBid(round, 'a', 2);
    expect(result.valid).toBe(false);
  });

  it('accepts other dealer bids', () => {
    const round = makeRound(10, 'a', [2, 2, 2, 2, null]);
    expect(validateDealerBid(round, 'a', 1).valid).toBe(true);
    expect(validateDealerBid(round, 'a', 3).valid).toBe(true);
  });

  it('rejects out-of-range bids', () => {
    const round = makeRound(10, 'a', [2, 2, 2, 2, null]);
    expect(validateDealerBid(round, 'a', -1).valid).toBe(false);
    expect(validateDealerBid(round, 'a', 11).valid).toBe(false);
  });
});

describe('forbiddenDealerBids', () => {
  it('returns the single forbidden value', () => {
    const round = makeRound(10, 'a', [3, 2, 2, 1, null]);
    expect(forbiddenDealerBids(round, 'a')).toEqual([2]);
  });

  it('returns empty if forbidden value is out of range', () => {
    const round = makeRound(10, 'a', [10, 5, 0, 0, null]);
    // others total 15, forbidden = 10 - 15 = -5, out of range
    expect(forbiddenDealerBids(round, 'a')).toEqual([]);
  });
});

describe('validateTricks', () => {
  it('passes when tricks sum to cards dealt', () => {
    const round = makeRound(10, 'a', [2, 2, 2, 2, 2]);
    round.results.forEach((r, i) => (r.tricks = [3, 2, 2, 2, 1][i]!));
    expect(validateTricks(round).valid).toBe(true);
  });

  it('fails when tricks sum is wrong', () => {
    const round = makeRound(10, 'a', [2, 2, 2, 2, 2]);
    round.results.forEach((r, i) => (r.tricks = [3, 2, 2, 2, 0][i]!));
    expect(validateTricks(round).valid).toBe(false);
  });

  it('fails when any tricks entry is missing', () => {
    const round = makeRound(10, 'a', [2, 2, 2, 2, 2]);
    expect(validateTricks(round).valid).toBe(false);
  });
});

describe('computeRoundScores + cumulativeBefore + finalStandings', () => {
  it('accumulates correctly across rounds', () => {
    const rounds = initialiseRounds(players, { startCards: 2, structure: 'down-only' });
    // Round 0: 2 cards, dealer = a, order = b,c,d,e,a
    rounds[0]!.results = rounds[0]!.results.map((r) => {
      // bid=tricks for b and d → score 12 / 12; others miss
      const map: Record<string, [number, number]> = {
        b: [1, 1],
        c: [0, 1],
        d: [1, 1],
        e: [0, 0],
        a: [0, 0],
      };
      const [bid, tricks] = map[r.playerId]!;
      return { ...r, bid, tricks };
    });
    rounds[0]!.results = computeRoundScores(rounds[0]!, {});
    rounds[0]!.phase = 'complete';

    const totals = cumulativeBefore(rounds, 1);
    expect(totals.b).toBe(11);
    expect(totals.d).toBe(11);
    expect(totals.e).toBe(10);
    expect(totals.a).toBe(10);
    expect(totals.c).toBe(0);

    const standings = finalStandings(rounds, players);
    expect(standings[0]!.position).toBe(1);
    expect([standings[0]!.player.id, standings[1]!.player.id]).toContain('b');
  });
});

describe('initialiseRounds — 5 player default', () => {
  it('produces 19 rounds, first has 10 cards spades, dealer index 0', () => {
    const rounds = initialiseRounds(players, baseConfig);
    expect(rounds).toHaveLength(19);
    expect(rounds[0]!.cardsPerPlayer).toBe(10);
    expect(rounds[0]!.trump).toBe('spades');
    expect(rounds[0]!.dealerId).toBe('a');
    expect(rounds[9]!.cardsPerPlayer).toBe(1);
    expect(rounds[18]!.cardsPerPlayer).toBe(10);
  });
});
