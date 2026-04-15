const GROK_API_URL = 'https://api.xai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a trading strategy assistant for QuantFluent, an AI-powered backtesting platform.

Your task is to convert natural language trading strategies into structured JSON format.

REQUIRED OUTPUT FORMAT:
{
  "entry": { "type": string, "fast": number, "slow": number },
  "exit": { "type": string, "fast": number, "slow": number },
  "risk_management": {
    "risk_reward_ratio": number (REQUIRED, min 1.0),
    "atr_sl_multiplier": number (REQUIRED, min 0.5),
    "risk_per_trade": number (REQUIRED, min 10)
  },
  "indicators": [
    { "type": string, "period": number }
  ]
}

RULES:
1. ALWAYS include risk_reward_ratio, atr_sl_multiplier, and risk_per_trade
2. Default values if not specified: RR=2.0, ATR=1.5, Risk=$100
3. Supported indicators: EMA_CROSS, RSI, ATR, MACD, BOLLINGER
4. If user input is incomplete, ask clarifying questions
5. Return ONLY valid JSON, no explanations
6. If you cannot understand the strategy, ask for clarification

Example inputs and outputs:
Input: "Buy when EMA 9 crosses above EMA 21, RR 2:1, ATR stop 1.5x, $100 risk"
Output: {"entry":{"type":"EMA_CROSS","fast":9,"slow":21},"exit":{"type":"EMA_CROSS","fast":21,"slow":50},"risk_management":{"risk_reward_ratio":2.0,"atr_sl_multiplier":1.5,"risk_per_trade":100},"indicators":[{"type":"EMA","period":9},{"type":"EMA","period":21}]}`;

export const grokService = {
  async generateStrategy(userMessage) {
    const apiKey = import.meta.env.VITE_GROK_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'GROK_API_KEY not configured. Using local parser.',
        useFallback: true
      };
    }

    try {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const parsed = parseGrokResponse(data);

      if (!parsed) {
        return {
          success: false,
          error: 'Invalid response from Grok',
          useFallback: true
        };
      }

      const validation = validateGrokStrategy(parsed);
      if (!validation.valid) {
        return {
          success: false,
          error: `Missing required fields: ${validation.missing.join(', ')}`,
          useFallback: true
        };
      }

      return {
        success: true,
        data: parsed
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Grok API error',
        useFallback: true
      };
    }
  }
};

export const parseGrokResponse = (data) => {
  try {
    if (!data.choices || !data.choices[0]?.message?.content) {
      return null;
    }

    const content = data.choices[0].message.content;
    const jsonStr = content.trim();
    
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch {
    return null;
  }
};

export const validateGrokStrategy = (strategy) => {
  const requiredFields = ['entry', 'exit', 'risk_management'];
  const missing = requiredFields.filter(f => !strategy[f]);

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  const rm = strategy.risk_management;
  if (!rm || typeof rm.risk_reward_ratio !== 'number' || 
      typeof rm.atr_sl_multiplier !== 'number' || 
      typeof rm.risk_per_trade !== 'number') {
    return { 
      valid: false, 
      missing: ['risk_management.risk_reward_ratio', 'risk_management.atr_sl_multiplier', 'risk_management.risk_per_trade']
    };
  }

  return { valid: true };
};

export const convertToBacktestFormat = (grokStrategy) => {
  return {
    indicator: {
      type: grokStrategy.entry.type || 'EMA_CROSS',
      fast: grokStrategy.entry.fast || 9,
      slow: grokStrategy.entry.slow || 21
    },
    risk_reward_ratio: grokStrategy.risk_management.risk_reward_ratio,
    atr_sl_multiplier: grokStrategy.risk_management.atr_sl_multiplier,
    risk_per_trade: grokStrategy.risk_management.risk_per_trade
  };
};

export default grokService;