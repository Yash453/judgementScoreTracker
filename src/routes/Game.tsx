import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BidPad } from '@/components/BidPad';
import { RoundHeader } from '@/components/RoundHeader';
import { ScoreTable } from '@/components/ScoreTable';
import { forbiddenDealerBids, validateTricks } from '@/lib/game';
import { useGameStore } from '@/store/useGameStore';

export const Game = () => {
  const navigate = useNavigate();
  const game = useGameStore((s) => s.currentGame);
  const setBid = useGameStore((s) => s.setBid);
  const undoLastBid = useGameStore((s) => s.undoLastBid);
  const clearBidFrom = useGameStore((s) => s.clearBidFrom);
  const finishBidding = useGameStore((s) => s.finishBidding);
  const backToBidding = useGameStore((s) => s.backToBidding);
  const setTricks = useGameStore((s) => s.setTricks);
  const submitTricks = useGameStore((s) => s.submitTricks);
  const goToPreviousRound = useGameStore((s) => s.goToPreviousRound);
  const abandonGame = useGameStore((s) => s.abandonGame);
  const [error, setError] = useState<string | null>(null);
  const [showAbandon, setShowAbandon] = useState(false);

  if (!game) return <Navigate to="/" replace />;

  const round = game.rounds[game.currentRoundIndex]!;
  const dealer = game.players.find((p) => p.id === round.dealerId);
  const nextBidderIdx = round.results.findIndex((r) => r.bid === null);
  const nextBidder = nextBidderIdx >= 0 ? round.results[nextBidderIdx] : null;
  const nextBidderPlayer = game.players.find((p) => p.id === nextBidder?.playerId);
  const allBidsIn = nextBidderIdx === -1;
  const isDealerBidding = nextBidder?.playerId === round.dealerId;
  const forbidden = useMemo(
    () => (isDealerBidding ? forbiddenDealerBids(round, round.dealerId) : []),
    [isDealerBidding, round],
  );

  const tricksTotal = round.results.reduce((s, r) => s + (r.tricks ?? 0), 0);
  const tricksValid = validateTricks(round).valid;
  const anyBidPlaced = round.results.some((r) => r.bid !== null);

  const handleBid = (n: number) => {
    if (!nextBidder) return;
    const result = setBid(nextBidder.playerId, n);
    if (!result.ok) setError(result.reason);
    else setError(null);
  };

  const handleFinishBidding = () => {
    const result = finishBidding();
    if (!result.ok) setError(result.reason);
    else setError(null);
  };

  const handleSubmitTricks = () => {
    const result = submitTricks();
    if (!result.ok) setError(result.reason);
    else setError(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="btn-ghost px-2">
          ← Home
        </button>
        <button onClick={() => setShowAbandon(true)} className="btn-ghost text-accent-rose px-2 text-sm">
          Abandon
        </button>
      </div>

      <RoundHeader round={round} totalRounds={game.rounds.length} dealer={dealer} />

      {error && (
        <div className="mt-3 rounded-xl bg-accent-rose/10 p-3 text-sm text-accent-rose ring-1 ring-accent-rose/30 animate-fade-in">
          {error}
        </div>
      )}

      <section className="surface mt-4 p-5 animate-slide-up">
        {round.phase === 'bidding' && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold">Bids</h3>
              <span className="text-sm text-ink-300">
                Total so far:{' '}
                <strong className="text-ink-100">
                  {round.results.reduce((s, r) => s + (r.bid ?? 0), 0)}
                </strong>{' '}
                / {round.cardsPerPlayer}
              </span>
            </div>

            <ol className="mb-5 space-y-1.5">
              {round.results.map((r, i) => {
                const player = game.players.find((p) => p.id === r.playerId);
                const isNext = i === nextBidderIdx;
                const isDealer = r.playerId === round.dealerId;
                const hasBid = r.bid !== null;
                const rowClass = `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${
                  isNext ? 'bg-felt-700/30 ring-1 ring-felt-400/40' : 'bg-ink-900/40'
                } ${hasBid ? 'cursor-pointer hover:bg-ink-700/60 transition' : ''}`;
                const inner = (
                  <>
                    <span className="flex items-center gap-2">
                      <span className="text-ink-200">{player?.name}</span>
                      {isDealer && (
                        <span className="chip bg-accent-gold/20 text-accent-gold">
                          Dealer
                        </span>
                      )}
                      {isNext && (
                        <span className="chip bg-felt-500 text-white">Bidding</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 font-display text-lg font-bold tabular-nums">
                      {r.bid === null ? '—' : r.bid}
                      {hasBid && (
                        <span className="text-xs font-normal text-ink-400" aria-hidden>
                          ✎
                        </span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={r.playerId}>
                    {hasBid ? (
                      <button
                        type="button"
                        onClick={() => clearBidFrom(r.playerId)}
                        className={rowClass}
                        aria-label={`Edit ${player?.name}'s bid`}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className={rowClass}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>

            {!allBidsIn ? (
              <div>
                <div className="mb-2 text-sm text-ink-300">
                  <strong className="text-ink-100">{nextBidderPlayer?.name}</strong>{' '}
                  bid · 0 to {round.cardsPerPlayer}
                  {isDealerBidding && forbidden.length > 0 && (
                    <span className="ml-2 text-accent-gold">
                      (cannot bid {forbidden.join(', ')})
                    </span>
                  )}
                </div>
                <BidPad
                  max={round.cardsPerPlayer}
                  value={null}
                  forbidden={forbidden}
                  onSelect={handleBid}
                />
                {anyBidPlaced && (
                  <button
                    onClick={() => undoLastBid()}
                    className="btn-ghost mt-3 w-full text-sm"
                  >
                    ← Undo last bid
                  </button>
                )}
              </div>
            ) : (
              <>
                <button onClick={handleFinishBidding} className="btn-primary w-full">
                  Lock bids · start playing
                </button>
                <button
                  onClick={() => undoLastBid()}
                  className="btn-ghost mt-2 w-full text-sm"
                >
                  ← Undo last bid
                </button>
                <p className="mt-2 text-center text-xs text-ink-400">
                  Tap any bid above to edit it.
                </p>
              </>
            )}
          </>
        )}

        {round.phase === 'playing' && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold">Hands won</h3>
              <span className="text-sm text-ink-300">
                Total:{' '}
                <strong
                  className={
                    tricksTotal === round.cardsPerPlayer
                      ? 'text-felt-400'
                      : 'text-accent-rose'
                  }
                >
                  {tricksTotal}
                </strong>{' '}
                / {round.cardsPerPlayer}
              </span>
            </div>
            <ul className="mb-5 space-y-3">
              {round.results.map((r) => {
                const player = game.players.find((p) => p.id === r.playerId);
                return (
                  <li
                    key={r.playerId}
                    className="rounded-xl bg-ink-900/40 px-3 py-3 ring-1 ring-white/5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-ink-100">{player?.name}</span>
                      <span className="chip bg-ink-700 text-ink-200">
                        Bid {r.bid}
                      </span>
                    </div>
                    <BidPad
                      max={round.cardsPerPlayer}
                      value={r.tricks}
                      onSelect={(n) => setTricks(r.playerId, n)}
                    />
                  </li>
                );
              })}
            </ul>
            <button
              onClick={handleSubmitTricks}
              disabled={!tricksValid}
              className="btn-primary w-full"
            >
              {game.currentRoundIndex === game.rounds.length - 1
                ? 'Finish game'
                : 'Save round → next'}
            </button>
            <button
              onClick={() => backToBidding()}
              className="btn-ghost mt-2 w-full text-sm"
            >
              ← Edit bids (this round)
            </button>
            {game.currentRoundIndex > 0 && (
              <button
                onClick={() => goToPreviousRound()}
                className="btn-ghost mt-2 w-full text-sm"
              >
                ← Edit previous round
              </button>
            )}
          </>
        )}
      </section>

      <section className="mt-6">
        <h2 className="label mb-2 px-1">Scoreboard</h2>
        <ScoreTable game={game} />
      </section>

      {showAbandon && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="surface w-full max-w-sm p-5">
            <h3 className="font-display text-lg font-bold">Abandon this game?</h3>
            <p className="mt-1 text-sm text-ink-300">
              Progress will be lost. This game won't be saved to history.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowAbandon(false)}
                className="btn-secondary flex-1"
              >
                Keep playing
              </button>
              <button
                onClick={() => {
                  abandonGame();
                  navigate('/');
                }}
                className="btn-danger flex-1"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
