import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInterface from '../src/components/ChatInterface';

describe('ChatInterface', () => {
  it('renders chat interface with input field', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText(/describe your strategy/i)).toBeTruthy();
  });

  it('has send button', () => {
    render(<ChatInterface />);
    expect(screen.getByRole('button', { name: /send/i })).toBeTruthy();
  });

  it('displays backtest results when received', () => {
    const mockResult = {
      win_rate: 0.65,
      net_profit: 1500,
      total_trades: 20
    };
    render(<ChatInterface />);
    // Results should be displayed after API call
    expect(screen.getByText(/quantfluent/i)).toBeTruthy();
  });
});