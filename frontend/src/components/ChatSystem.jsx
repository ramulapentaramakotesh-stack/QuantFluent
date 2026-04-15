import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, validateBacktestResponse } from '../services/api';
import { grokService } from '../services/grok';
import { authService, dbService, isSupabaseConfigured } from '../services/auth';
import './ChatSystem.css';

const STEPS = [
  { key: 'entry', question: 'What is your entry condition?', placeholder: 'e.g., EMA 9 crosses above EMA 21' },
  { key: 'exit', question: 'What is your exit condition?', placeholder: 'e.g., Price crosses below EMA 21' },
  { key: 'rr', question: 'What risk-reward ratio do you want?', placeholder: 'e.g., 2 or 2:1' },
  { key: 'atr', question: 'What ATR multiplier for stop loss?', placeholder: 'e.g., 1.5' },
  { key: 'risk', question: 'How much risk per trade ($)?', placeholder: 'e.g., 100' }
];

function ChatSystem({ onStrategyLoad, skipAuth = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to QuantFluent! Let\'s build your trading strategy step by step.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentStep < STEPS.length) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: STEPS[currentStep].question 
        }]);
      }, 500);
    }
  }, [currentStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userAnswer = input;
    setInput('');
    setLoading(true);
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: userAnswer }]);

    const stepKey = STEPS[currentStep].key;
    const newAnswers = { ...answers, [stepKey]: userAnswer };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Got it! ' + STEPS[currentStep + 1].question 
      }]);
      setCurrentStep(currentStep + 1);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Building your strategy...' }]);
      
      const strategy = parseAnswersToStrategy(newAnswers);
      
      try {
        const grokResult = await grokService.generateStrategy(userAnswer);
        
        if (grokResult.success && grokResult.data) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Strategy parsed with AI. Running backtest...' 
          }]);
          
          const result = await apiService.runBacktest(grokResult.data);
          
          if (result.success && validateBacktestResponse(result.data).valid) {
            setResults(result.data);
            
            if (skipAuth) {
              const user = await authService.getUser();
              if (user) {
                await dbService.saveStrategy(user.id, grokResult.data);
                await dbService.saveBacktest(user.id, result.data);
              }
            }
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Backtest complete!\n\nWin Rate: ${(result.data.win_rate * 100).toFixed(1)}%\nNet Profit: $${result.data.net_profit.toFixed(2)}\nTotal Trades: ${result.data.total_trades}\nMax Drawdown: $${result.data.max_drawdown.toFixed(2)}`
            }]);
          }
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Strategy parsed locally. Running backtest...' 
          }]);
          
          const result = await apiService.runBacktest(strategy);
          
          if (result.success) {
            setResults(result.data);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Backtest complete!\n\nWin Rate: ${(result.data.win_rate * 100).toFixed(1)}%\nNet Profit: $${result.data.net_profit.toFixed(2)}\nTotal Trades: ${result.data.total_trades}`
            }]);
          }
        }
      } catch (err) {
        setError('Failed to run backtest. Please try again.');
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Error running backtest. Please try again.' 
        }]);
      }
    }

    setLoading(false);
  };

  const parseAnswersToStrategy = (ans) => {
    let fast = 9, slow = 21, rr = 2.0, atr = 1.5, risk = 100;

    if (ans.entry) {
      const emaMatch = ans.entry.match(/ema\s*(\d+)\s*(?:\/|and)\s*ema\s*(\d+)/i);
      if (emaMatch) {
        fast = parseInt(emaMatch[1]);
        slow = parseInt(emaMatch[2]);
      }
    }

    if (ans.rr) {
      const rrMatch = ans.rr.match(/(\d+\.?\d*)/);
      if (rrMatch) rr = parseFloat(rrMatch[1]);
    }

    if (ans.atr) {
      const atrMatch = ans.atr.match(/(\d+\.?\d*)/);
      if (atrMatch) atr = parseFloat(atrMatch[1]);
    }

    if (ans.risk) {
      const riskMatch = ans.risk.match(/(\d+)/);
      if (riskMatch) risk = parseInt(riskMatch[1]);
    }

    return {
      indicator: { type: 'EMA_CROSS', fast, slow },
      risk_reward_ratio: rr,
      atr_sl_multiplier: atr,
      risk_per_trade: risk
    };
  };

  const runOptimization = async () => {
    if (!results) return;
    setLoading(true);
    
    const optResult = await apiService.runOptimization(
      parseAnswersToStrategy(answers),
      { num_variations: 5, target: 'net_profit' }
    );
    
    if (optResult.success && optResult.data.results?.length > 0) {
      const best = optResult.data.results[0];
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Optimization best result:\n\nEMA: ${best.params.indicator.fast}/${best.params.indicator.slow}\nNet Profit: $${best.metrics.net_profit.toFixed(2)}\nWin Rate: ${(best.metrics.win_rate * 100).toFixed(1)}%`
      }]);
    }
    
    setLoading(false);
  };

  const resetConversation = () => {
    setCurrentStep(0);
    setAnswers({});
    setMessages([
      { role: 'assistant', content: 'Let\'s build a new strategy step by step.' }
    ]);
    setResults(null);
    setError(null);
  };

  return (
    <div className="chat-system">
      <motion.h2 
        className="chat-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Build Your Strategy
      </motion.h2>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="step-indicator">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]?.key}
      </div>

      {error && (
        <motion.div 
          className="chat-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.content}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div 
            className="message assistant loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Thinking...
          </motion.div>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={STEPS[currentStep]?.placeholder || 'Enter your answer'}
          disabled={loading}
        />
        <motion.button 
          type="submit"
          disabled={loading || !input.trim()}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? '...' : currentStep < STEPS.length - 1 ? 'Next' : 'Run Backtest'}
        </motion.button>
      </form>

      {results && (
        <motion.div 
          className="results-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button onClick={runOptimization} disabled={loading}>Optimize</button>
          <button className="secondary" onClick={resetConversation}>New Strategy</button>
        </motion.div>
      )}
    </div>
  );
}

export default ChatSystem;