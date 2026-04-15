import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  async login() {
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

  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return null;
    }
    
    return data.session;
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  },

  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

export const dbService = {
  async saveStrategy(userId, strategyJson) {
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

export default authService;