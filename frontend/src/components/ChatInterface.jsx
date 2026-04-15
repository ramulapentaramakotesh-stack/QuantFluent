import { useState } from 'react';
import './ChatInterface.css';

const API_URL = 'http://localhost:8000';

function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Describe your trading strategy in plain English. I will extract the parameters and run a backtest.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [params, setParams] = useState({});

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
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    const extractedParams = extractStrategyParams(userMessage);
    setParams(extractedParams);
    
    try {
      const response = await fetch(`${API_URL}/api/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: extractedParams,
          instrument: 'BTCUSDT',
          timeframe: '1h',
          start_date: '2026-01-01',
          end_date: '2026-04-15'
        })
      });
      
      const data = await response.json();
      setResults(data);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Backtest complete! Win Rate: ${(data.win_rate * 100).toFixed(1)}%, Net Profit: $${data.net_profit.toFixed(2)}, Total Trades: ${data.total_trades}`
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error running backtest. Make sure the backend is running on localhost:8000'
      }]);
    }
    
    setLoading(false);
  };

  const runOptimization = async () => {
    if (!params.indicator || loading) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: 'Run optimization' }]);
    
    try {
      const response = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: params,
          instrument: 'BTCUSDT',
          timeframe: '1h',
          start_date: '2026-01-01',
          end_date: '2026-04-15',
          target: 'net_profit',
          num_variations: 5
        })
      });
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Optimization best: EMA ${best.params.indicator.fast}/${best.params.indicator.slow}, Net Profit: $${best.metrics.net_profit.toFixed(2)}`
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No optimization results' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error running optimization' }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>QuantFluent AI</h1>
        <p>Describe your trading strategy</p>
      </div>
      
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