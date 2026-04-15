import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Landing from './components/Landing';
import ChatSystem from './components/ChatSystem';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import AuthGuard from './components/AuthGuard';
import Footer from './components/Footer';
import { authService } from './services/auth';
import './App.css';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);
    } catch (e) {
      console.log('Not logged in');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <Landing 
          onDemo={() => window.location.href = '/demo'}
          onGetStarted={() => window.location.href = '/login'}
        />
      } />
      
      <Route path="/demo" element={
        <>
          <DemoNav user={user} onLogout={handleLogout} />
          <ChatSystem skipAuth={true} />
          <Footer />
        </>
      } />
      
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" /> : <Auth onAuthSuccess={checkUser} />
      } />
      
      <Route path="/dashboard" element={
        user ? (
          <ProtectedLayout user={user} onLogout={handleLogout}>
            <Dashboard />
          </ProtectedLayout>
        ) : <Navigate to="/login" />
      } />
      
      <Route path="/chat" element={
        user ? (
          <ProtectedLayout user={user} onLogout={handleLogout}>
            <ChatSystem />
          </ProtectedLayout>
        ) : <Navigate to="/login" />
      } />
    </Routes>
  );
}

function DemoNav({ user, onLogout }) {
  return (
    <motion.nav 
      className="app-nav"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <a href="/" className="nav-logo">QuantFluent</a>
      <div className="nav-links">
        <a href="/demo">Demo</a>
        {user ? (
          <>
            <a href="/chat">Chat</a>
            <a href="/dashboard">Dashboard</a>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <a href="/login">Login</a>
        )}
      </div>
    </motion.nav>
  );
}

function ProtectedLayout({ user, onLogout, children }) {
  return (
    <div className="app-layout">
      <motion.nav 
        className="app-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <a href="/" className="nav-logo">QuantFluent</a>
        <div className="nav-links">
          <a href="/chat" className="active">Chat</a>
          <a href="/dashboard">Dashboard</a>
        </div>
        <div className="nav-user">
          <span>{user?.email}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </motion.nav>
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

export default App;