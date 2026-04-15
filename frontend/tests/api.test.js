import { describe, it, expect } from 'vitest';
import { validateBacktestResponse, validateOptimizationResponse } from '../services/api';

describe('API Service', () => {
  describe('validateBacktestResponse', () => {
    it('validates correct backtest response', () => {
      const data = {
        win_rate: 0.65,
        net_profit: 1500,
        total_trades: 20,
        trade_logs: []
      };
      const result = validateBacktestResponse(data);
      expect(result.valid).toBe(true);
    });

    it('rejects response missing win_rate', () => {
      const data = {
        net_profit: 1500,
        total_trades: 20,
        trade_logs: []
      };
      const result = validateBacktestResponse(data);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('win_rate');
    });

    it('rejects invalid response format', () => {
      const result = validateBacktestResponse(null);
      expect(result.valid).toBe(false);
    });

    it('rejects empty response', () => {
      const result = validateBacktestResponse({});
      expect(result.valid).toBe(false);
    });
  });

  describe('validateOptimizationResponse', () => {
    it('validates correct optimization response', () => {
      const data = {
        results: [
          { params: {}, metrics: { net_profit: 100 } }
        ]
      };
      const result = validateOptimizationResponse(data);
      expect(result.valid).toBe(true);
    });

    it('rejects response without results array', () => {
      const data = { status: 'ok' };
      const result = validateOptimizationResponse(data);
      expect(result.valid).toBe(false);
    });

    it('rejects invalid response format', () => {
      const result = validateOptimizationResponse(null);
      expect(result.valid).toBe(false);
    });
  });
});