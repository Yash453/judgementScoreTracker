import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { useGameStore } from '@/store/useGameStore';

describe('App smoke', () => {
  beforeEach(() => {
    useGameStore.setState({ currentGame: null, history: [] });
    window.localStorage.clear();
  });

  it('renders the home screen', () => {
    render(<App />);
    expect(screen.getByText('Judgement')).toBeInTheDocument();
    expect(screen.getByText(/Start new game/i)).toBeInTheDocument();
  });

  it('navigates to new-game and starts a 5-player game', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText(/Start new game/i));

    // 4 default players → add 1 more
    await user.click(screen.getByText('+ Add'));
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const names = ['Asha', 'Bilal', 'Chitra', 'Dev', 'Eli'];
    for (let i = 0; i < names.length; i++) {
      await user.clear(inputs[i]!);
      await user.type(inputs[i]!, names[i]!);
    }

    await user.click(screen.getByRole('button', { name: 'Start game' }));

    // We should now be on the Game screen with round 1 of 19, 10 cards, ♠.
    expect(screen.getByRole('heading', { name: /Bids/ })).toBeInTheDocument();
    expect(screen.getByText('Spades')).toBeInTheDocument();
    const game = useGameStore.getState().currentGame!;
    expect(game.rounds).toHaveLength(19);
    expect(game.rounds[0]!.cardsPerPlayer).toBe(10);
    expect(game.rounds[0]!.trump).toBe('spades');
    expect(game.players.map((p) => p.name)).toEqual(names);
  });
});
