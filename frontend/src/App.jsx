import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthGuard from './components/AuthGuard';
import { authService } from './services/auth';
import './App.css';

function App() {
  const [page, setPage] = useState('chat');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.reload();
  };

  const handleRunStrategy = (strategy) => {
    window.strategyToRun = strategy;
    setPage('chat');
  };

  return (
    <AuthGuard>
      <div className="app-container">
        <Navbar 
          user={user} 
          currentPage={page}
          onNavigate={setPage}
          onLogout={handleLogout}
        />
        
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="page-container"
            >
              {page === 'chat' ? (
                <ChatInterface onStrategyLoad={window.strategyToRun} />
              ) : (
                <Dashboard onRunStrategy={handleRunStrategy} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <Footer />
      </div>
    </AuthGuard>
  );
}

export default App;