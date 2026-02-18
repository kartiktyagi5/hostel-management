import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fjtoxkurdzzezuadhagp.supabase.co"
const supabaseKey = "sb_publishable_FztWLSHDJ3TxrSNvx--MxQ_bUJ1JFNm"

export const supabase = createClient(supabaseUrl, supabaseKey)
