import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zufbedawitxfslllnrqh.supabase.co'

const supabaseAnonKey = 'sb_publishable_Bs8RmQnu-nKN9qzNKd48pA_1fqPpRFU'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
