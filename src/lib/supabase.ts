import { createClient } from '@supabase/supabase-js';

// Sanitize URL and Key to remove potential hidden whitespace/newlines
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Use a valid URL format for the placeholder to avoid "Invalid supabaseUrl" crash
const DEFAULT_URL = 'https://placeholder-project.supabase.co';
const DEFAULT_KEY = 'placeholder-key';

// Helper to check if a string is a valid URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http');
  } catch {
    return false;
  }
};

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : DEFAULT_URL;
const finalKey = (supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && supabaseAnonKey !== 'placeholder-key') ? supabaseAnonKey : DEFAULT_KEY;

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseAnonKey !== 'placeholder-key' &&
  !supabaseUrl?.includes('placeholder-project');

if (!isSupabaseConfigured) {
  console.error('Supabase configuration is missing or invalid! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// SAFETY CHECK: Detect if service_role key is accidentally used (VERY DANGEROUS in frontend!)
try {
  if (finalKey && finalKey !== DEFAULT_KEY) {
    const payload = JSON.parse(atob(finalKey.split('.')[1]));
    if (payload.role === 'service_role') {
      console.error(
        '🚨 CRITICAL SECURITY WARNING: You are using the service_role key in the frontend! ' +
        'This exposes FULL DATABASE ACCESS to anyone. ' +
        'Go to Supabase Dashboard > Settings > API and use the "anon" "public" key instead.'
      );
    }
  }
} catch (e) {
  // Not a valid JWT, ignore
}

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Improved reliability for mobile popups/redirects
  }
});
