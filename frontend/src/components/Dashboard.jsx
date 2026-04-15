import { useState, useEffect } from 'react';
import { authService, dbService } from '../services/auth';
import './Dashboard.css';

function Dashboard({ onRunStrategy }) {
  const [strategies, setStrategies] = useState([]);
  const [backtests, setBacktests] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('strategies');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await authService.getUser();
    
    if (!user) {
      setError('Please log in to view your data');
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

    return strategies.map((item) => {
      const strategy = JSON.parse(item.strategy_json || '{}');
      return (
        <div key={item.id} className="data-card">
          <div className="card-header">
            <h4>Strategy</h4>
            <span className="timestamp">{formatDate(item.created_at)}</span>
          </div>
          <div className="card-content">
            <p><strong>Indicator:</strong> {strategy.indicator?.type || 'N/A'}</p>
            <p><strong>EMA:</strong> {strategy.indicator?.fast || 9} / {strategy.indicator?.slow || 21}</p>
            <p><strong>RR:</strong> {strategy.risk_reward_ratio || 2.0}</p>
          </div>
          <button className="run-btn" onClick={() => handleRunAgain(item)}>
            Run Again
          </button>
        </div>
      );
    });
  };

  const renderBacktests = () => {
    if (backtests.length === 0) {
      return <div className="empty-state">No backtests run yet</div>;
    }

    return backtests.map((item) => {
      const results = JSON.parse(item.results_json || '{}');
      return (
        <div key={item.id} className="data-card">
          <div className="card-header">
            <h4>Backtest Result</h4>
            <span className="timestamp">{formatDate(item.created_at)}</span>
          </div>
          <div className="card-content">
            <p><strong>Win Rate:</strong> {((results.win_rate || 0) * 100).toFixed(1)}%</p>
            <p><strong>Net Profit:</strong> ${(results.net_profit || 0).toFixed(2)}</p>
            <p><strong>Total Trades:</strong> {results.total_trades || 0}</p>
            <p><strong>Max Drawdown:</strong> ${(results.max_drawdown || 0).toFixed(2)}</p>
          </div>
        </div>
      );
    });
  };

  const renderOptimizations = () => {
    if (optimizations.length === 0) {
      return <div className="empty-state">No optimizations run yet</div>;
    }

    return optimizations.map((item) => {
      const results = JSON.parse(item.results_json || '{}');
      const bestResult = results.results?.[0];
      return (
        <div key={item.id} className="data-card">
          <div className="card-header">
            <h4>Optimization Result</h4>
            <span className="timestamp">{formatDate(item.created_at)}</span>
          </div>
          <div className="card-content">
            {bestResult ? (
              <>
                <p><strong>Best EMA:</strong> {bestResult.params?.indicator?.fast} / {bestResult.params?.indicator?.slow}</p>
                <p><strong>Best Profit:</strong> ${(bestResult.metrics?.net_profit || 0).toFixed(2)}</p>
              </>
            ) : (
              <p>No results available</p>
            )}
          </div>
        </div>
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

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>Your Dashboard</h2>
      
      <div className="tabs">
        <button 
          className={activeTab === 'strategies' ? 'active' : ''} 
          onClick={() => setActiveTab('strategies')}
        >
          Strategies ({strategies.length})
        </button>
        <button 
          className={activeTab === 'backtests' ? 'active' : ''} 
          onClick={() => setActiveTab('backtests')}
        >
          Backtests ({backtests.length})
        </button>
        <button 
          className={activeTab === 'optimizations' ? 'active' : ''} 
          onClick={() => setActiveTab('optimizations')}
        >
          Optimizations ({optimizations.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'strategies' && renderStrategies()}
        {activeTab === 'backtests' && renderBacktests()}
        {activeTab === 'optimizations' && renderOptimizations()}
      </div>
    </div>
  );
}

export default Dashboard;