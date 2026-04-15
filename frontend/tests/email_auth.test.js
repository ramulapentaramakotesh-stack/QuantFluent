import { describe, it, expect, vi } from 'vitest';
import { authService } from '../services/auth';

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn()
  }
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

describe('Email Authentication', () => {
  describe('signup', () => {
    it('signs up user with email and password', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: '123' }, session: null },
        error: null
      });
      
      const result = await authService.signup('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('returns error when signup fails', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already taken' }
      });
      
      const result = await authService.signup('test@example.com', 'password123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already taken');
    });

    it('requires email verification', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null
      });
      
      const result = await authService.signup('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.requiresVerification).toBe(true);
    });
  });

  describe('login', () => {
    it('logs in with email and password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null
      });
      
      const result = await authService.loginWithPassword('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('returns error for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' }
      });
      
      const result = await authService.loginWithPassword('test@example.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });
  });

  describe('validation', () => {
    it('validates email format', () => {
      const { validateEmail } = authService;
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('validates password length', () => {
      const { validatePassword } = authService;
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('12345')).toBe(false);
    });

    it('validates password match', () => {
      const { validatePasswordMatch } = authService;
      expect(validatePasswordMatch('pass', 'pass')).toBe(true);
      expect(validatePasswordMatch('pass', 'different')).toBe(false);
    });
  });
});