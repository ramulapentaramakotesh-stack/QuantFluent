import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, dbService } from '../services/auth';
import Card from './Card';

function Dashboard({ onRunStrategy }) {
  const [strategies, setStrategies] = useState([]);
  const [backtests, setBacktests] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('strategies');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await authService.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const [strategiesRes, backtestsRes, optimizationsRes] = await Promise.all([
      dbService.getStrategies(user.id),
      dbService.getBacktests(user.id),
      dbService.getOptimizations(user.id)
    ]);

    setStrategies(strategiesRes.data || []);
    setBacktests(backtestsRes.data || []);
    setOptimizations(optimizationsRes.data || []);
    setLoading(false);
  };

  const handleRunAgain = (strategy) => {
    if (onRunStrategy) {
      onRunStrategy(JSON.parse(strategy.strategy_json));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStrategies = () => {
    if (strategies.length === 0) {
      return <div className="empty-state">No strategies saved yet</div>;
    }

    return strategies.map((item, index) => {
      const strategy = JSON.parse(item.strategy_json || '{}');
      return (
        <Card key={item.id} delay={index * 0.1}>
          <div className="card-header">
            <span className="card-type">Strategy</span>
            <span className="timestamp">{formatDate(item.created_at)}</span>
          </div>
          <div className="card-metrics">
            <div className="metric">
              <span className="label">Indicator</span>
              <span className="value">{strategy.indicator?.type || 'EMA_CROSS'}</span>
            </div>
            <div className="metric">
              <span className="label">EMA</span>
              <span className="value">{strategy.indicator?.fast || 9}/{strategy.indicator?.slow || 21}</span>
            </div>
            <div className="metric">
              <span className="label">RR</span>
              <span className="value">{strategy.risk_reward_ratio || 2.0}</span>
            </div>
          </div>
          <button className="run-btn" onClick={() => handleRunAgain(item)}>
            Run Again
          </button>
        </Card>
      );
    });
  };

  const renderBacktests = () => {
    if (backtests.length === 0) {
      return <div className="empty-state">No backtests run yet</div>;
    }

    return backtests.map((item, index) => {
      const results = JSON.parse(item.results_json || '{}');
      const profitColor = results.net_profit >= 0 ? '#28a745' : '#dc3545';
      
      return (
        <Card key={item.id} delay={index * 0.1}>
          <div className="card-header">
            <span className="card-type">Backtest</span>
            <span className="timestamp">{formatDate(item.created_at)}</span>
          </div>
          <div className="card-metrics">
            <div className="metric">
              <span className="label">Win Rate</span>
              <span className="value">{((results.win_rate || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Net Profit</span>
              <span className="value" style={{ color: profitColor }}>
                ${(results.net_profit || 0).toFixed(2)}
              </span>
            </div>
            <div className="metric">
              <span className="label">Trades</span>
              <span className="value">{results.total_trades || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Max DD</span>
              <span className="value">${(results.max_drawdown || 0).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      );
    });
  };

  const renderOptimizations = () => {
    if (optimizations.length === 0) {
      return <div className="empty-state">No optimizations run yet</div>;
    }

    return optimizations.map((item, index) => {
      const results = JSON.parse(item.results_json || '{}');
      const bestResult = results.results?.[0];
      
      return (
        <Card key={item.id} delay={index * 0.1}>
          <div className="card-header">
            <span className="card-type">Optimization</span>
            <span className="timestamp">{formatDate(item.created_at)}</span>
          </div>
          <div className="card-metrics">
            {bestResult ? (
              <>
                <div className="metric">
                  <span className="label">Best EMA</span>
                  <span className="value">{bestResult.params?.indicator?.fast}/{bestResult.params?.indicator?.slow}</span>
                </div>
                <div className="metric">
                  <span className="label">Best Profit</span>
                  <span className="value" style={{ color: '#28a745' }}>
                    ${(bestResult.metrics?.net_profit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="metric">
                  <span className="label">Win Rate</span>
                  <span className="value">{((bestResult.metrics?.win_rate || 0) * 100).toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <p>No results available</p>
            )}
          </div>
        </Card>
      );
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Your Dashboard
      </motion.h2>
      
      <div className="tabs">
        {['strategies', 'backtests', 'optimizations'].map((tab) => {
          const count = tab === 'strategies' ? strategies.length : 
                       tab === 'backtests' ? backtests.length : optimizations.length;
          return (
            <button 
              key={tab}
              className={activeTab === tab ? 'active' : ''} 
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'strategies' && renderStrategies()}
            {activeTab === 'backtests' && renderBacktests()}
            {activeTab === 'optimizations' && renderOptimizations()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Dashboard;