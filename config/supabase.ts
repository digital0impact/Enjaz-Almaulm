
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfyknwvwiftfdjtvzwgp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeWtud3Z3aWZ0ZmRqdHZ6d2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTA4MTYsImV4cCI6MjA2NTU4NjgxNn0.Lx7KXDQuVQ5jZ4B-4Dt8U94H3NTNCw6pW1EX2WWghiM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
