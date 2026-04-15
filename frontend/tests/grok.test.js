import { describe, it, expect, vi } from 'vitest';
import { grokService, parseGrokResponse, validateGrokStrategy } from '../services/grok';

const mockFetch = vi.fn();

global.fetch = mockFetch;

describe('Grok Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GROK_API_KEY', 'test-api-key');
  });

  describe('parseGrokResponse', () => {
    it('parses valid Grok JSON response', () => {
      const response = {
        choices: [{
          message: {
            content: JSON.stringify({
              entry: { type: 'EMA_CROSS', fast: 9, slow: 21 },
              exit: { type: 'EMA_CROSS', fast: 21, slow: 50 },
              risk_management: {
                risk_reward_ratio: 2.0,
                atr_sl_multiplier: 1.5,
                risk_per_trade: 100
              },
              indicators: [{ type: 'EMA', period: 9 }, { type: 'EMA', period: 21 }]
            })
          }
        }]
      };

      const result = parseGrokResponse(response);
      expect(result).toBeTruthy();
      expect(result.risk_management.risk_reward_ratio).toBe(2.0);
    });

    it('returns null for invalid JSON', () => {
      const response = {
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      };

      const result = parseGrokResponse(response);
      expect(result).toBeNull();
    });
  });

  describe('validateGrokStrategy', () => {
    it('validates complete strategy', () => {
      const strategy = {
        entry: { type: 'EMA_CROSS', fast: 9, slow: 21 },
        exit: { type: 'EMA_CROSS', fast: 21, slow: 50 },
        risk_management: {
          risk_reward_ratio: 2.0,
          atr_sl_multiplier: 1.5,
          risk_per_trade: 100
        },
        indicators: []
      };

      const result = validateGrokStrategy(strategy);
      expect(result.valid).toBe(true);
    });

    it('rejects strategy missing risk_reward_ratio', () => {
      const strategy = {
        entry: { type: 'EMA_CROSS' },
        risk_management: {
          atr_sl_multiplier: 1.5
        }
      };

      const result = validateGrokStrategy(strategy);
      expect(result.valid).toBe(false);
    });
  });

  describe('grokService.generateStrategy', () => {
    it('calls Grok API with prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                entry: { type: 'EMA_CROSS', fast: 9, slow: 21 },
                risk_management: { risk_reward_ratio: 2.0, atr_sl_multiplier: 1.5, risk_per_trade: 100 }
              })
            }
          }]
        })
      });

      const result = await grokService.generateStrategy('Buy when EMA 9 crosses EMA 21');
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('returns error when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await grokService.generateStrategy('Test prompt');
      expect(result.success).toBe(false);
    });
  });
});