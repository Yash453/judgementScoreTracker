import { useMemo } from 'react';

type Props = {
  max: number;
  value: number | null;
  forbidden?: number[];
  onSelect: (value: number) => void;
  disabled?: boolean;
};

export const BidPad = ({ max, value, forbidden = [], onSelect, disabled }: Props) => {
  const numbers = useMemo(() => Array.from({ length: max + 1 }, (_, i) => i), [max]);
  const forbiddenSet = useMemo(() => new Set(forbidden), [forbidden]);

  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="radiogroup">
      {numbers.map((n) => {
        const isForbidden = forbiddenSet.has(n);
        const isSelected = value === n;
        const isDisabled = disabled || isForbidden;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => onSelect(n)}
            title={isForbidden ? `Total bids cannot equal ${max}` : undefined}
            className={[
              'pad-btn',
              isSelected
                ? 'bg-felt-500 text-white ring-felt-400 shadow-soft'
                : 'bg-ink-800/80 text-ink-100 hover:bg-ink-700',
              isForbidden && 'line-through text-ink-400 hover:bg-ink-800/80 cursor-not-allowed',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
};
