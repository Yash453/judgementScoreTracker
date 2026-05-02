import type { Game } from '@/lib/types';
import { SUIT_GLYPH } from '@/lib/types';

type Props = {
  game: Game;
  highlightCurrent?: boolean;
};

const tone = (suit: 'spades' | 'diamonds' | 'clubs' | 'hearts') =>
  suit === 'diamonds' || suit === 'hearts' ? 'suit-red' : 'suit-black';

export const ScoreTable = ({ game, highlightCurrent = true }: Props) => {
  const totals: Record<string, number> = {};
  for (const player of game.players) totals[player.id] = 0;

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-900/60 text-ink-300">
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Cards</th>
              <th className="px-3 py-2 text-left font-medium">Trump</th>
              {game.players.map((p) => (
                <th
                  key={p.id}
                  className="px-3 py-2 text-center font-semibold text-ink-100"
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {game.rounds.map((round, idx) => {
              const isCurrent = idx === game.currentRoundIndex;
              const rowClass =
                round.phase === 'complete'
                  ? 'bg-transparent'
                  : highlightCurrent && isCurrent
                    ? 'bg-felt-700/15 ring-1 ring-inset ring-felt-400/30'
                    : 'opacity-60';
              return (
                <tr key={round.index} className={`${rowClass} border-t border-white/5`}>
                  <td className="px-3 py-2 text-ink-300">{round.index + 1}</td>
                  <td className="px-3 py-2 font-semibold">{round.cardsPerPlayer}</td>
                  <td className={`px-3 py-2 ${tone(round.trump)} text-base`}>
                    {SUIT_GLYPH[round.trump]}
                  </td>
                  {game.players.map((p) => {
                    const result = round.results.find((r) => r.playerId === p.id);
                    if (!result || round.phase !== 'complete') {
                      return (
                        <td
                          key={p.id}
                          className="px-3 py-2 text-center text-ink-400"
                        >
                          —
                        </td>
                      );
                    }
                    totals[p.id] = result.cumulative;
                    const hit =
                      result.bid !== null &&
                      result.tricks !== null &&
                      result.bid === result.tricks;
                    return (
                      <td key={p.id} className="px-3 py-2 text-center">
                        <div className="font-semibold">
                          {result.cumulative}
                        </div>
                        <div
                          className={`text-xs ${hit ? 'text-felt-400' : 'text-ink-400'}`}
                        >
                          {result.bid}/{result.tricks}
                          <span className="ml-1">
                            {hit ? `+${result.scoreThisRound}` : '0'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-ink-900/70 text-ink-100">
              <td colSpan={3} className="px-3 py-3 text-left font-semibold uppercase tracking-wider text-ink-300">
                Total
              </td>
              {game.players.map((p) => (
                <td
                  key={p.id}
                  className="px-3 py-3 text-center font-display text-lg font-bold"
                >
                  {totals[p.id] ?? 0}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
