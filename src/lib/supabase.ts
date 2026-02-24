import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjkckvjbnrfsmhmsbvyn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa2NrdmpibnJmc21obXNidnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE4NTAsImV4cCI6MjA4NzMzNzg1MH0.1nbJ00LRt4nss70aqDMF5KOPI0mCqPCdWDO7QMnYNlU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
