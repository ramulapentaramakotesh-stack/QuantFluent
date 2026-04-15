import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import AuthGuard from './components/AuthGuard';
import './App.css';

function App() {
  const [page, setPage] = useState('chat');

  const handleRunStrategy = (strategy) => {
    window.strategyToRun = strategy;
    setPage('chat');
  };

  return (
    <AuthGuard>
      <nav className="app-nav">
        <button 
          className={page === 'chat' ? 'active' : ''} 
          onClick={() => setPage('chat')}
        >
          Chat
        </button>
        <button 
          className={page === 'dashboard' ? 'active' : ''} 
          onClick={() => setPage('dashboard')}
        >
          Dashboard
        </button>
      </nav>
      {page === 'chat' ? (
        <ChatInterface onStrategyLoad={window.strategyToRun} />
      ) : (
        <Dashboard onRunStrategy={handleRunStrategy} />
      )}
    </AuthGuard>
  );
}

export default App;