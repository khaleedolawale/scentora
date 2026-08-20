// ============================================
// SUPABASE CLIENT SETUP
// Creates the connection every other file uses
// ============================================

const supabaseClient = supabase.createClient(
  CONFIG.supabaseUrl,
  CONFIG.supabaseAnonKey
);
