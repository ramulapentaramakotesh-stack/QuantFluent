import { useState } from 'react';
import './Auth.css';
import { authService, validateEmail, validatePassword, validatePasswordMatch } from '../services/auth';

function EmailAuth({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!validatePasswordMatch(password, confirmPassword)) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const result = await authService.signup(email, password);
      
      if (result.success) {
        if (result.requiresVerification) {
          setMessage('Check your email to verify your account before logging in.');
          setMode('login');
        }
      } else {
        setError(result.error);
      }
    } else {
      const result = await authService.loginWithPassword(email, password);
      
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-login">
      <div className="login-card">
        <h1>QuantFluent</h1>
        <p>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              disabled={loading}
            />
          </div>
          
          {mode === 'signup' && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          )}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        
        <div className="auth-toggle">
          {mode === 'login' ? (
            <p>
              Don't have an account? 
              <button onClick={() => setMode('signup')}>Sign Up</button>
            </p>
          ) : (
            <p>
              Already have an account? 
              <button onClick={() => setMode('login')}>Sign In</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailAuth;