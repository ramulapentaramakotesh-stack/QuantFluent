import { describe, it, expect, vi } from 'vitest';
import { authService } from '../services/auth';

const mockSupabase = {
  auth: {
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({ data: [], error: null })),
    insert: vi.fn(() => ({ data: [], error: null })),
    eq: vi.fn(() => ({ data: [], error: null }))
  }))
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

describe('Auth Service', () => {
  describe('login', () => {
    it('calls supabase signInWithOAuth', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: null });
      
      const result = await authService.login();
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
    });
  });

  describe('logout', () => {
    it('calls supabase signOut', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
      
      await authService.logout();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('returns session data', async () => {
      const mockSession = { access_token: 'token', user: { id: '123' } };
      mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });
      
      const result = await authService.getSession();
      expect(result).toEqual(mockSession);
    });

    it('returns null on error', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
      
      const result = await authService.getSession();
      expect(result).toBeNull();
    });
  });
});