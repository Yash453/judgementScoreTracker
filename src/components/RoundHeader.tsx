import type { Player, Round } from '@/lib/types';
import { TrumpBadge } from './TrumpBadge';

type Props = {
  round: Round;
  totalRounds: number;
  dealer: Player | undefined;
};

const PHASE_LABEL: Record<Round['phase'], string> = {
  bidding: 'Bidding',
  playing: 'Playing',
  complete: 'Complete',
};

export const RoundHeader = ({ round, totalRounds, dealer }: Props) => (
  <div className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-4">
    <div className="flex items-center gap-4">
      <div>
        <div className="label">Round</div>
        <div className="font-display text-2xl font-bold leading-none">
          {round.index + 1}
          <span className="text-ink-300 text-base font-medium">/{totalRounds}</span>
        </div>
      </div>
      <div className="h-10 w-px bg-white/10" />
      <div>
        <div className="label">Cards</div>
        <div className="font-display text-2xl font-bold leading-none">
          {round.cardsPerPlayer}
        </div>
      </div>
      <div className="h-10 w-px bg-white/10" />
      <div>
        <div className="label">Trump</div>
        <TrumpBadge suit={round.trump} size="md" />
      </div>
    </div>

    <div className="flex items-center gap-3">
      <span className="chip bg-ink-700/80 text-ink-200">
        Dealer: <strong className="ml-1 text-ink-100">{dealer?.name ?? '—'}</strong>
      </span>
      <span className="chip bg-felt-700/40 text-felt-100">{PHASE_LABEL[round.phase]}</span>
    </div>
  </div>
);
