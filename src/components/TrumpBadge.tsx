import { SUIT_GLYPH, SUIT_LABEL, type Suit } from '@/lib/types';

const TONE: Record<Suit, string> = {
  spades: 'suit-black',
  clubs: 'suit-black',
  diamonds: 'suit-red',
  hearts: 'suit-red',
};

type Props = {
  suit: Suit;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

const SIZES = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-4xl',
} as const;

export const TrumpBadge = ({ suit, size = 'md', showLabel = true }: Props) => (
  <span className="inline-flex items-center gap-2">
    <span aria-hidden className={`${SIZES[size]} ${TONE[suit]} leading-none`}>
      {SUIT_GLYPH[suit]}
    </span>
    {showLabel && (
      <span className="text-sm font-medium text-ink-200">{SUIT_LABEL[suit]}</span>
    )}
  </span>
);
