import { useState, useEffect } from 'react';
import EmailAuth from './EmailAuth';
import { authService } from '../services/auth';

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

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <EmailAuth onAuthSuccess={checkUser} />;
  }

  return children;
}

export default AuthGuard;