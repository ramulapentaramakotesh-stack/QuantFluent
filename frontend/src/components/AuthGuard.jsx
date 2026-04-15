import { useState, useEffect } from 'react';
import './Auth.css';
import EmailAuth from './EmailAuth';
import { authService, dbService } from '../services/auth';

function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const session = await authService.getSession();
    if (session) {
      const userData = await authService.getUser();
      setUser(userData);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
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
      <EmailAuth onAuthSuccess={checkUser} />
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