import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[Auth] Supabase URL configured:', !!supabaseUrl);
console.log('[Auth] Supabase Key configured:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Auth] Supabase environment variables not configured properly');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const authService = {
  async login() {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  async signup(email, password) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!data.session && data.user) {
      return { success: true, requiresVerification: true };
    }
    
    return { success: true, data };
  },

  async loginWithPassword(email, password) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data.user };
  },

  async logout() {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  },

  async getSession() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return null;
    }
    
    return data.session;
  },

  async getUser() {
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  },

  onAuthChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

export const dbService = {
  async saveStrategy(userId, strategyJson) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase
      .from('strategies')
      .insert({
        user_id: userId,
        strategy_json: JSON.stringify(strategyJson),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  async getStrategies(userId) {
    if (!supabase) return { success: false, error: 'Supabase not configured', data: [] };
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data };
  },

  async saveBacktest(userId, resultsJson) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase
      .from('backtests')
      .insert({
        user_id: userId,
        results_json: JSON.stringify(resultsJson),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  async getBacktests(userId) {
    if (!supabase) return { success: false, error: 'Supabase not configured', data: [] };
    const { data, error } = await supabase
      .from('backtests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data };
  },

  async saveOptimization(userId, resultsJson) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase
      .from('optimizations')
      .insert({
        user_id: userId,
        results_json: JSON.stringify(resultsJson),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  async getOptimizations(userId) {
    if (!supabase) return { success: false, error: 'Supabase not configured', data: [] };
    const { data, error } = await supabase
      .from('optimizations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data };
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export default authService;