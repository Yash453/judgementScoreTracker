import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  computeRoundScores,
  cumulativeBefore,
  defaultStartCards,
  initialiseRounds,
  newId,
  validateDealerBid,
  validateTricks,
} from '@/lib/game';
import type { Game, GameConfig, Player, Round } from '@/lib/types';

type State = {
  currentGame: Game | null;
  history: Game[];
};

type Actions = {
  startGame: (players: Player[], config?: Partial<GameConfig>) => void;
  abandonGame: () => void;
  setBid: (playerId: string, bid: number) => { ok: true } | { ok: false; reason: string };
  undoLastBid: () => void;
  clearBidFrom: (playerId: string) => void;
  finishBidding: () => { ok: true } | { ok: false; reason: string };
  backToBidding: () => void;
  setTricks: (playerId: string, tricks: number) => void;
  submitTricks: () => { ok: true } | { ok: false; reason: string };
  goToPreviousRound: () => void;
  deleteHistoryEntry: (id: string) => void;
  clearHistory: () => void;
};

const updateCurrentRound = (game: Game, mutator: (round: Round) => Round): Game => {
  const rounds = game.rounds.map((r, i) =>
    i === game.currentRoundIndex ? mutator(r) : r,
  );
  return { ...game, rounds };
};

export const useGameStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      currentGame: null,
      history: [],

      startGame: (players, configPatch = {}) => {
        const config: GameConfig = {
          startCards: configPatch.startCards ?? defaultStartCards(players.length),
          structure: configPatch.structure ?? 'down-up',
          fixedRounds: configPatch.fixedRounds,
        };
        const game: Game = {
          id: newId(),
          startedAt: Date.now(),
          players,
          config,
          rounds: initialiseRounds(players, config),
          currentRoundIndex: 0,
        };
        set({ currentGame: game });
      },

      abandonGame: () => set({ currentGame: null }),

      setBid: (playerId, bid) => {
        const game = get().currentGame;
        if (!game) return { ok: false, reason: 'No active game.' };
        const round = game.rounds[game.currentRoundIndex]!;
        if (round.phase !== 'bidding') {
          return { ok: false, reason: 'Bidding is closed for this round.' };
        }

        // Bidding order is sequential: only the next-undecided player can bid.
        const nextIdx = round.results.findIndex((r) => r.bid === null);
        if (nextIdx === -1) {
          return { ok: false, reason: 'All bids placed.' };
        }
        if (round.results[nextIdx]!.playerId !== playerId) {
          return { ok: false, reason: 'Bids must be entered in seating order.' };
        }

        const isDealer = playerId === round.dealerId;
        if (isDealer) {
          const v = validateDealerBid(round, playerId, bid);
          if (!v.valid) return { ok: false, reason: v.reason };
        } else if (bid < 0 || bid > round.cardsPerPlayer) {
          return {
            ok: false,
            reason: `Bid must be between 0 and ${round.cardsPerPlayer}.`,
          };
        }

        const newRound: Round = {
          ...round,
          results: round.results.map((r) =>
            r.playerId === playerId ? { ...r, bid } : r,
          ),
        };
        set({ currentGame: updateCurrentRound(game, () => newRound) });
        return { ok: true };
      },

      undoLastBid: () => {
        const game = get().currentGame;
        if (!game) return;
        const round = game.rounds[game.currentRoundIndex]!;
        if (round.phase !== 'bidding') return;
        let lastIdx = -1;
        for (let i = round.results.length - 1; i >= 0; i--) {
          if (round.results[i]!.bid !== null) {
            lastIdx = i;
            break;
          }
        }
        if (lastIdx === -1) return;
        set({
          currentGame: updateCurrentRound(game, (r) => ({
            ...r,
            results: r.results.map((res, i) =>
              i === lastIdx ? { ...res, bid: null } : res,
            ),
          })),
        });
      },

      clearBidFrom: (playerId) => {
        const game = get().currentGame;
        if (!game) return;
        const round = game.rounds[game.currentRoundIndex]!;
        if (round.phase !== 'bidding') return;
        const idx = round.results.findIndex((r) => r.playerId === playerId);
        if (idx === -1) return;
        set({
          currentGame: updateCurrentRound(game, (r) => ({
            ...r,
            results: r.results.map((res, i) =>
              i >= idx ? { ...res, bid: null } : res,
            ),
          })),
        });
      },

      finishBidding: () => {
        const game = get().currentGame;
        if (!game) return { ok: false, reason: 'No active game.' };
        const round = game.rounds[game.currentRoundIndex]!;
        if (round.results.some((r) => r.bid === null)) {
          return { ok: false, reason: 'Every player must place a bid first.' };
        }
        set({
          currentGame: updateCurrentRound(game, (r) => ({ ...r, phase: 'playing' })),
        });
        return { ok: true };
      },

      backToBidding: () => {
        const game = get().currentGame;
        if (!game) return;
        const round = game.rounds[game.currentRoundIndex]!;
        if (round.phase !== 'playing') return;
        set({
          currentGame: updateCurrentRound(game, (r) => ({ ...r, phase: 'bidding' })),
        });
      },

      setTricks: (playerId, tricks) => {
        const game = get().currentGame;
        if (!game) return;
        set({
          currentGame: updateCurrentRound(game, (round) => {
            if (round.phase !== 'playing') return round;
            return {
              ...round,
              results: round.results.map((r) =>
                r.playerId === playerId ? { ...r, tricks } : r,
              ),
            };
          }),
        });
      },

      submitTricks: () => {
        const game = get().currentGame;
        if (!game) return { ok: false, reason: 'No active game.' };
        const round = game.rounds[game.currentRoundIndex]!;
        const v = validateTricks(round);
        if (!v.valid) return { ok: false, reason: v.reason };

        const prior = cumulativeBefore(game.rounds, game.currentRoundIndex);
        const scored = computeRoundScores(round, prior);

        const isLast = game.currentRoundIndex === game.rounds.length - 1;
        const updatedRound: Round = {
          ...round,
          results: scored,
          phase: 'complete',
        };
        const rounds = game.rounds.map((r, i) =>
          i === game.currentRoundIndex ? updatedRound : r,
        );

        if (isLast) {
          const completed: Game = {
            ...game,
            rounds,
            currentRoundIndex: rounds.length,
            completedAt: Date.now(),
          };
          set((s) => ({
            currentGame: null,
            history: [completed, ...s.history],
          }));
        } else {
          set({
            currentGame: { ...game, rounds, currentRoundIndex: game.currentRoundIndex + 1 },
          });
        }
        return { ok: true };
      },

      goToPreviousRound: () => {
        const game = get().currentGame;
        if (!game || game.currentRoundIndex === 0) return;
        const previousIndex = game.currentRoundIndex - 1;
        const players = game.players;
        const reset = initialiseRounds(players, game.config)[previousIndex]!;
        const rounds = game.rounds.map((r, i) =>
          i === previousIndex ? { ...reset, phase: 'bidding' as const } : r,
        );
        set({ currentGame: { ...game, rounds, currentRoundIndex: previousIndex } });
      },

      deleteHistoryEntry: (id) =>
        set((s) => ({ history: s.history.filter((g) => g.id !== id) })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'judgement-tracker-v1',
      partialize: (state) => ({
        currentGame: state.currentGame,
        history: state.history,
      }),
    },
  ),
);
