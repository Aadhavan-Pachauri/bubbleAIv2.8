
import { createClient } from '@supabase/supabase-js'

// =================================================================================
// IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS
// =================================================================================
// You can find your project URL and anon key in your Supabase project settings.
// Go to Settings > API in your Supabase dashboard.
//
// VITE_SUPABASE_URL should look like: 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co'
// VITE_SUPABASE_ANON_KEY should look like: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...'
//
// For production, it's recommended to use environment variables.
// For this project, you can hardcode them here for simplicity.
// =================================================================================

const supabaseUrl = 'https://ivwxzoqhzogchqrniapd.supabase.co' // <-- Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2d3h6b3Foem9nY2hxcm5pYXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzcwMTYsImV4cCI6MjA3Mzk1MzAxNn0.VFnH911Muw2rX_1XhIyZL0_8IGce7dwW7VPS6mu2IGo' // <-- Replace with your Supabase Anon Key

// Explicitly set the db schema to 'public' to prevent client-side schema cache errors,
// which manifest as "schema cache" or "relation does not exist" issues. This is a more
// robust solution than a page refresh.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
});
