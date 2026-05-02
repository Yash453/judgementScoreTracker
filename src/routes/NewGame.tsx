import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildCardSequence, defaultStartCards, newId } from '@/lib/game';
import type { Player, RoundStructure } from '@/lib/types';
import { useGameStore } from '@/store/useGameStore';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 7;

export const NewGame = () => {
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);
  const currentGame = useGameStore((s) => s.currentGame);

  const [players, setPlayers] = useState<Player[]>([
    { id: newId(), name: '' },
    { id: newId(), name: '' },
    { id: newId(), name: '' },
    { id: newId(), name: '' },
  ]);
  const [structure, setStructure] = useState<RoundStructure>('down-up');
  const [overrideStart, setOverrideStart] = useState(false);
  const computedStart = defaultStartCards(players.length);
  const [startCards, setStartCards] = useState(computedStart);
  const [fixedRounds, setFixedRounds] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const effectiveStart = overrideStart ? startCards : computedStart;
  const sequence = useMemo(
    () => buildCardSequence(effectiveStart, structure, fixedRounds),
    [effectiveStart, structure, fixedRounds],
  );

  const setName = (id: string, name: string) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));

  const move = (id: string, direction: -1 | 1) =>
    setPlayers((ps) => {
      const idx = ps.findIndex((p) => p.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= ps.length) return ps;
      const copy = [...ps];
      [copy[idx], copy[target]] = [copy[target]!, copy[idx]!];
      return copy;
    });

  const removePlayer = (id: string) =>
    setPlayers((ps) => (ps.length > MIN_PLAYERS ? ps.filter((p) => p.id !== id) : ps));

  const addPlayer = () =>
    setPlayers((ps) =>
      ps.length < MAX_PLAYERS ? [...ps, { id: newId(), name: '' }] : ps,
    );

  const submit = () => {
    const trimmed = players.map((p) => ({ ...p, name: p.name.trim() }));
    if (trimmed.some((p) => !p.name)) {
      setError('Each player needs a name.');
      return;
    }
    const names = new Set(trimmed.map((p) => p.name.toLowerCase()));
    if (names.size !== trimmed.length) {
      setError('Player names must be unique.');
      return;
    }
    if (effectiveStart < 1 || effectiveStart * trimmed.length > 52) {
      setError(`Start cards × players cannot exceed 52 (you'd need ${effectiveStart * trimmed.length}).`);
      return;
    }
    startGame(trimmed, {
      structure,
      startCards: effectiveStart,
      fixedRounds: structure === 'fixed' ? fixedRounds : undefined,
    });
    navigate('/game');
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="btn-ghost px-2">
          ← Back
        </button>
        <h1 className="font-display text-2xl font-bold">New game</h1>
        <span className="w-16" />
      </div>

      {currentGame && (
        <div className="mb-4 rounded-xl bg-accent-rose/10 p-3 text-sm text-accent-rose ring-1 ring-accent-rose/30">
          Starting a new game will replace your in-progress game.
        </div>
      )}

      <section className="surface mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="label">Players · {players.length}</h2>
          <button
            onClick={addPlayer}
            disabled={players.length >= MAX_PLAYERS}
            className="btn-ghost px-2 py-1 text-sm"
          >
            + Add
          </button>
        </div>
        <ol className="space-y-2">
          {players.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-6 text-center text-ink-400 text-sm">{i + 1}</span>
              <input
                className="input flex-1"
                value={p.name}
                onChange={(e) => setName(p.id, e.target.value)}
                placeholder={`Player ${i + 1}`}
                aria-label={`Player ${i + 1} name`}
              />
              <button
                onClick={() => move(p.id, -1)}
                disabled={i === 0}
                className="btn-ghost px-2 py-1 text-base"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => move(p.id, 1)}
                disabled={i === players.length - 1}
                className="btn-ghost px-2 py-1 text-base"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removePlayer(p.id)}
                disabled={players.length <= MIN_PLAYERS}
                className="btn-ghost px-2 py-1 text-base"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-400">
          Bidding starts to the left of the dealer. Dealer rotates each round.
        </p>
      </section>

      <section className="surface mb-6 p-5">
        <h2 className="label mb-3">Round structure</h2>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { v: 'down-up', label: 'Down & up', hint: `${computedStart} → 1 → ${computedStart}` },
              { v: 'down-only', label: 'Down only', hint: `${computedStart} → 1` },
              { v: 'up-only', label: 'Up only', hint: `1 → ${computedStart}` },
              { v: 'fixed', label: 'Fixed N', hint: `${fixedRounds} × ${computedStart}` },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              onClick={() => setStructure(opt.v)}
              className={`pad-btn flex-col h-auto py-3 ${
                structure === opt.v
                  ? 'bg-felt-500 text-white ring-felt-400'
                  : 'bg-ink-800 text-ink-100 hover:bg-ink-700'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-xs font-normal opacity-80">{opt.hint}</span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-200">
          <input
            type="checkbox"
            checked={overrideStart}
            onChange={(e) => {
              setOverrideStart(e.target.checked);
              if (e.target.checked) setStartCards(computedStart);
            }}
            className="accent-felt-500"
          />
          Override start cards (default {computedStart} for {players.length} players)
        </label>
        {overrideStart && (
          <input
            type="number"
            min={1}
            max={Math.floor(52 / players.length)}
            value={startCards}
            onChange={(e) => setStartCards(Math.max(1, Number(e.target.value) || 1))}
            className="input mt-2"
          />
        )}
        {structure === 'fixed' && (
          <div className="mt-3">
            <label className="label">Number of rounds</label>
            <input
              type="number"
              min={1}
              max={52}
              value={fixedRounds}
              onChange={(e) => setFixedRounds(Math.max(1, Number(e.target.value) || 1))}
              className="input mt-1"
            />
          </div>
        )}

        <div className="mt-4 rounded-xl bg-ink-900/50 p-3 text-sm">
          <div className="label mb-1">Preview · {sequence.length} rounds</div>
          <div className="flex flex-wrap gap-1.5">
            {sequence.map((c, i) => (
              <span key={i} className="chip bg-ink-700 text-ink-100">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl bg-accent-rose/10 p-3 text-sm text-accent-rose ring-1 ring-accent-rose/30">
          {error}
        </div>
      )}

      <button onClick={submit} className="btn-primary w-full">
        Start game
      </button>
    </div>
  );
};
