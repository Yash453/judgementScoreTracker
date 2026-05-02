import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScoreTable } from '@/components/ScoreTable';
import { finalStandings } from '@/lib/game';
import { useGameStore } from '@/store/useGameStore';

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const History = () => {
  const navigate = useNavigate();
  const history = useGameStore((s) => s.history);
  const deleteHistoryEntry = useGameStore((s) => s.deleteHistoryEntry);
  const clearHistory = useGameStore((s) => s.clearHistory);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="btn-ghost px-2">
          ← Back
        </button>
        <h1 className="font-display text-2xl font-bold">History</h1>
        {history.length > 0 ? (
          <button
            onClick={() => setConfirmingClear(true)}
            className="btn-ghost px-2 text-sm text-accent-rose"
          >
            Clear all
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {history.length === 0 ? (
        <div className="surface px-5 py-12 text-center text-ink-300">
          <p className="mb-3">No completed games yet.</p>
          <Link to="/new" className="btn-primary inline-flex">
            Start your first game
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {history.map((g) => {
            const standings = finalStandings(g.rounds, g.players);
            const winner = standings[0];
            const isOpen = openId === g.id;
            return (
              <li key={g.id} className="surface p-4">
                <button
                  onClick={() => setOpenId(isOpen ? null : g.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <div className="text-xs text-ink-400">
                      {formatDate(g.completedAt ?? g.startedAt)}
                    </div>
                    <div className="font-display text-lg font-bold">
                      {winner?.player.name} won · {winner?.total} pts
                    </div>
                    <div className="text-sm text-ink-300">
                      {g.players.length} players · {g.rounds.length} rounds
                    </div>
                  </div>
                  <span className="text-2xl text-ink-300">{isOpen ? '▾' : '▸'}</span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {standings.map((s) => (
                        <li
                          key={s.player.id}
                          className="rounded-lg bg-ink-900/40 px-3 py-2 ring-1 ring-white/5"
                        >
                          <div className="text-xs text-ink-400">#{s.position}</div>
                          <div className="font-medium">{s.player.name}</div>
                          <div className="font-display text-base font-bold text-ink-100">
                            {s.total}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <ScoreTable game={g} highlightCurrent={false} />
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteHistoryEntry(g.id)}
                        className="btn-ghost text-xs text-accent-rose"
                      >
                        Delete this game
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {confirmingClear && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="surface w-full max-w-sm p-5">
            <h3 className="font-display text-lg font-bold">Delete all history?</h3>
            <p className="mt-1 text-sm text-ink-300">
              This permanently removes all saved games. Cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmingClear(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmingClear(false);
                }}
                className="btn-danger flex-1"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
