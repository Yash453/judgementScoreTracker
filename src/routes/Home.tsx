import { Link } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';

export const Home = () => {
  const currentGame = useGameStore((s) => s.currentGame);
  const history = useGameStore((s) => s.history);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-12">
      <header className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 text-3xl">
          <span className="suit-black">♠</span>
          <span className="suit-red">♦</span>
          <span className="suit-black">♣</span>
          <span className="suit-red">♥</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Judgement</h1>
        <p className="mt-2 text-ink-300">Score tracker for Kachi Fuali</p>
      </header>

      <div className="surface flex flex-col gap-3 p-5">
        {currentGame ? (
          <>
            <Link to="/game" className="btn-primary">
              Resume game · Round {currentGame.currentRoundIndex + 1} / {currentGame.rounds.length}
            </Link>
            <Link to="/new" className="btn-secondary">
              Start new game
            </Link>
          </>
        ) : (
          <Link to="/new" className="btn-primary">
            Start new game
          </Link>
        )}
        <Link to="/history" className="btn-ghost">
          History {history.length > 0 && <span className="ml-2 text-ink-300">({history.length})</span>}
        </Link>
      </div>

      <footer className="mt-auto text-center text-xs text-ink-400">
        Bids that hit score 10 + bid · misses score 0 · trump rotates ♠ ♦ ♣ ♥
      </footer>
    </div>
  );
};
