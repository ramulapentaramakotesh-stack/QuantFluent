import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../src/components/Dashboard';

describe('Dashboard', () => {
  const mockStrategies = [
    {
      id: '1',
      strategy_json: JSON.stringify({ indicator: { fast: 9, slow: 21 }, risk_reward_ratio: 2.0 }),
      created_at: '2026-04-15T10:00:00Z'
    }
  ];

  const mockBacktests = [
    {
      id: '1',
      results_json: JSON.stringify({ win_rate: 0.65, net_profit: 1500, total_trades: 20 }),
      created_at: '2026-04-15T11:00:00Z'
    }
  ];

  const mockOptimizations = [
    {
      id: '1',
      results_json: JSON.stringify({ results: [{ metrics: { net_profit: 2000 } }] }),
      created_at: '2026-04-15T12:00:00Z'
    }
  ];

  it('displays empty state when no data', () => {
    render(<Dashboard strategies={[]} backtests={[]} optimizations={[]} />);
    expect(screen.getByText(/no strategies yet/i)).toBeTruthy();
  });

  it('displays strategies when provided', () => {
    render(<Dashboard strategies={mockStrategies} backtests={[]} optimizations={[]} />);
    expect(screen.getByText(/EMA 9\/21/i)).toBeTruthy();
  });

  it('displays backtest metrics', () => {
    render(<Dashboard strategies={[]} backtests={mockBacktests} optimizations={[]} />);
    expect(screen.getByText(/65%/i)).toBeTruthy();
    expect(screen.getByText(/\$1500/i)).toBeTruthy();
  });

  it('calls onRunAgain when run button clicked', () => {
    const onRun = vi.fn();
    render(<Dashboard strategies={mockStrategies} backtests={[]} optimizations={[]} onRunAgain={onRun} />);
    fireEvent.click(screen.getByText(/run again/i));
    expect(onRun).toHaveBeenCalled();
  });
});