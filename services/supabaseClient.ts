import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment variables
// Security is handled by Row Level Security (RLS) policies on the database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        mode: import.meta.env.MODE,
        allKeys: Object.keys(import.meta.env)
    });
    throw new Error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

console.log('Supabase initialized', { url: supabaseUrl.substring(0, 30) + '...' });

export const supabase = createClient(supabaseUrl, supabaseAnonKey);