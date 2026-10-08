import { createClient } from '@supabase/supabase-js'

// ১. আপনার সঠিক Supabase URL (প্রজেক্টের রুট ডোমেইন)
const supabaseUrl = 'https://zufbedawitxfslllnrqh.supabase.co' 

// ২. আপনার Supabase Anon Key
const supabaseAnonKey = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZmJlZGF3aXR4ZnNsbGxucnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjE2MzQsImV4cCI6MjEwNzAzNzYzNH0.y6T9n8Zmg57u0Q_JJNMK9cbm4KN2n7EqZRzF8ITaJiI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
