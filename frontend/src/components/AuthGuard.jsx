import { useState, useEffect } from 'react';
import './Auth.css';
import { authService, dbService } from '../services/auth';

function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const session = await authService.getSession();
    if (session) {
      const userData = await authService.getUser();
      setUser(userData);
      loadUserData(userData.id);
    }
    setLoading(false);
  };

  const loadUserData = async (userId) => {
    const result = await dbService.getStrategies(userId);
    if (result.success) {
      setStrategies(result.data);
    }
  };

  const handleLogin = async () => {
    const result = await authService.login();
    if (result.success) {
      checkUser();
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setStrategies([]);
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-login">
        <div className="login-card">
          <h1>QuantFluent</h1>
          <p>AI-Powered Trading Strategy Platform</p>
          <button onClick={handleLogin} className="login-btn">
            Sign in with Google
          </button>
          <p className="login-note">Sign in to save and access your strategies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <header className="auth-header">
        <div className="user-info">
          <span className="user-email">{user.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      {children}
    </div>
  );
}

export default AuthGuard;