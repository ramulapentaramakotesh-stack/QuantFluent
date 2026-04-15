import { useState } from 'react';
import './ChatInterface.css';
import { apiService, validateBacktestResponse, validateOptimizationResponse } from '../services/api';
import { grokService } from '../services/grok';

function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Describe your trading strategy in plain English. I will extract the parameters and run a backtest.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [params, setParams] = useState({});
  const [error, setError] = useState(null);

  const extractStrategyParams = (text) => {
    const params = {
      indicator: { type: 'EMA_CROSS' },
      entry_condition: '',
      exit_condition: '',
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
    
    return params;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    setInput('');
    setLoading(true);
    setError(null);
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    let extractedParams;
    let useGrok = true;
    
    const grokResult = await grokService.generateStrategy(userMessage);
    
    if (grokResult.success && grokResult.data) {
      extractedParams = grokResult.data;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: grokResult.message || 'Strategy parsed. Running backtest...' 
      }]);
    } else {
      useGrok = false;
      extractedParams = extractStrategyParams(userMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Using local parser. Running backtest...' 
      }]);
    }
    
    setParams(extractedParams);
    
    const result = await apiService.runBacktest(extractedParams);
    
    if (!result.success) {
      setError(result.error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${result.error}` 
      }]);
      setLoading(false);
      return;
    }
    
    const validation = validateBacktestResponse(result.data);
    if (!validation.valid) {
      setError(validation.error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Validation Error: ${validation.error}` 
      }]);
      setLoading(false);
      return;
    }
    
    setResults(result.data);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Backtest complete! Win Rate: ${(result.data.win_rate * 100).toFixed(1)}%, Net Profit: $${result.data.net_profit.toFixed(2)}, Total Trades: ${result.data.total_trades}`
    }]);
    
    setLoading(false);
  };

  const runOptimization = async () => {
    if (!params.indicator || loading) return;
    
    setLoading(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: 'Run optimization' }]);
    
    const result = await apiService.runOptimization(params);
    
    if (!result.success) {
      setError(result.error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Optimization Error: ${result.error}` 
      }]);
      setLoading(false);
      return;
    }
    
    const validation = validateOptimizationResponse(result.data);
    if (!validation.valid) {
      setError(validation.error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Validation Error: ${validation.error}` 
      }]);
      setLoading(false);
      return;
    }
    
    if (result.data.results && result.data.results.length > 0) {
      const best = result.data.results[0];
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Optimization best: EMA ${best.params.indicator.fast}/${best.params.indicator.slow}, Net Profit: $${best.metrics.net_profit.toFixed(2)}`
      }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'No optimization results' }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>QuantFluent AI</h1>
        <p>Describe your trading strategy</p>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="e.g., Buy when EMA 9 crosses above EMA 21, RR 2:1, ATR stop 1.5x, $100 risk"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
      
      {results && (
        <div className="results-panel">
          <button onClick={runOptimization} disabled={loading}>Optimize</button>
        </div>
      )}
    </div>
  );
}

export default ChatInterface;