const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  backtest: `${API_BASE_URL}/api/backtest`,
  optimize: `${API_BASE_URL}/api/optimize`,
  parseStrategy: `${API_BASE_URL}/api/parse-strategy`
};

export const apiService = {
  async checkHealth() {
    try {
      const response = await fetch(API_ENDPOINTS.health);
      return {
        success: true,
        data: await response.json()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Cannot connect to backend. Make sure backend is running on port 8000.'
      };
    }
  },

  async runBacktest(strategy, options = {}) {
    const payload = {
      strategy: strategy,
      instrument: options.instrument || 'BTCUSDT',
      timeframe: options.timeframe || '1h',
      start_date: options.start_date || '2026-01-01',
      end_date: options.end_date || '2026-04-15'
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(API_ENDPOINTS.backtest, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to run backtest'
      };
    }
  },

  async runOptimization(strategy, options = {}) {
    const payload = {
      strategy: strategy,
      instrument: options.instrument || 'BTCUSDT',
      timeframe: options.timeframe || '1h',
      start_date: options.start_date || '2026-01-01',
      end_date: options.end_date || '2026-04-15',
      target: options.target || 'net_profit',
      num_variations: options.num_variations || 5
    };

    try {
      const response = await fetch(API_ENDPOINTS.optimize, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to run optimization'
      };
    }
  }
};

export const validateBacktestResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format' };
  }

  const requiredFields = ['win_rate', 'net_profit', 'total_trades', 'trade_logs'];
  const missingFields = requiredFields.filter(field => !(field in data));

  if (missingFields.length > 0) {
    return { valid: false, error: `Missing fields: ${missingFields.join(', ')}` };
  }

  return { valid: true };
};

export const validateOptimizationResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format' };
  }

  if (!Array.isArray(data.results)) {
    return { valid: false, error: 'Missing results array' };
  }

  return { valid: true };
};

export default apiService;