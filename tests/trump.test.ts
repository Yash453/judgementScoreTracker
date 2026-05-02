import { describe, expect, it } from 'vitest';
import { trumpForRound } from '@/lib/trump';

describe('trumpForRound', () => {
  it('cycles spades → diamonds → clubs → hearts', () => {
    expect(trumpForRound(0)).toBe('spades');
    expect(trumpForRound(1)).toBe('diamonds');
    expect(trumpForRound(2)).toBe('clubs');
    expect(trumpForRound(3)).toBe('hearts');
  });

  it('wraps after every 4 rounds', () => {
    expect(trumpForRound(4)).toBe('spades');
    expect(trumpForRound(8)).toBe('spades');
    expect(trumpForRound(11)).toBe('hearts');
    expect(trumpForRound(18)).toBe('clubs');
  });

  it('handles negative input safely', () => {
    expect(trumpForRound(-1)).toBe('hearts');
  });
});
