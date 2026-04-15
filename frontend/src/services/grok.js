const BACKEND_URL = 'http://localhost:8000';

const localParse = (text) => {
  const params = {
    indicator: { type: 'EMA_CROSS' },
    risk_reward_ratio: 2.0,
    atr_sl_multiplier: 1.5,
    risk_per_trade: 100
  };
  
  const rrMatch = text.match(/(\d+\.?\d*)\s*[:(-]?\s*risk.?reward|rr\s*[:=]?\s*(\d+\.?\d*)/i);
  if (rrMatch) {
    params.risk_reward_ratio = parseFloat(rrMatch[1] || rrMatch[2]) || 2.0;
  }
  
  const atrMatch = text.match(/atr\s*[:=]?\s*(\d+\.?\d*)|stop\s*loss.*atr\s*[:=]?\s*(\d+\.?\d*)/i);
  if (atrMatch) {
    params.atr_sl_multiplier = parseFloat(atrMatch[1] || atrMatch[2]) || 1.5;
  }
  
  const riskMatch = text.match(/\$?(\d+)\s*risk|risk\s*(?:per\s*trade)?\s*[:\$]?\s*\$?(\d+)/i);
  if (riskMatch) {
    params.risk_per_trade = parseFloat(riskMatch[1] || riskMatch[2]) || 100;
  }
  
  const emaMatch = text.match(/ema\s*(\d+)\s*(?:\/|and)\s*ema\s*(\d+)/i);
  if (emaMatch) {
    params.indicator = { type: 'EMA_CROSS', fast: parseInt(emaMatch[1]), slow: parseInt(emaMatch[2]) };
  }
  
  console.log('[FALLBACK] Local parser used');
  return params;
};

export const grokService = {
  async generateStrategy(userMessage) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${BACKEND_URL}/api/parse-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.fallback_used) {
        console.log('[GROK] Using fallback parser');
        return {
          success: true,
          data: data.strategy,
          fallback: true,
          message: 'Local parser used'
        };
      }
      
      if (!data.strategy) {
        throw new Error('No strategy returned');
      }
      
      console.log('[GROK] Success with AI parsing');
      return {
        success: true,
        data: data.strategy,
        fallback: false,
        message: 'AI parsing used'
      };
    } catch (error) {
      console.log('[GROK] Error, using fallback:', error.message);
      const fallbackParams = localParse(userMessage);
      return {
        success: true,
        data: fallbackParams,
        fallback: true,
        message: 'Fallback parser used'
      };
    }
  }
};

export default grokService;