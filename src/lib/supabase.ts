import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a valid URL format for the placeholder to avoid "Invalid supabaseUrl" crash
const DEFAULT_URL = 'https://placeholder-project.supabase.co';
const DEFAULT_KEY = 'placeholder-key';

// Helper to check if a string is a valid URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http');
  } catch {
    return false;
  }
};

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : DEFAULT_URL;
const finalKey = (supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') ? supabaseAnonKey : DEFAULT_KEY;

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
  console.error('Supabase configuration is missing or invalid! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(finalUrl, finalKey);
