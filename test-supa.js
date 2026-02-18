import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fjtoxkurdzzezuadhagp.supabase.co"
const supabaseKey = "sb_publishable_FztWLSHDJ3TxrSNvx--MxQ_bUJ1JFNm" // This key looks weird for a standard anon key. Usually they are long JWTs. This looks like a custom format or maybe I misread it?
// Standard anon keys start with `eyJ...`. This starts with `sb_publishable_`.
// User might be using a new Supabase feature or a different service wrapper.
// Let's try to init and see.

// Ideally, env vars should represent this.
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable(tableName) {
    try {
        const { error } = await supabase.from(tableName).select('*').limit(1)
        if (error) {
            // Postgres error for missing table is typically code P0001 or 42P01 "relation does not exist"
            // Supabase JS often returns message "relation \"public.tablename\" does not exist"
            if (error.message.includes('does not exist')) {
                console.log(`[MISSING] ${tableName}`)
            } else {
                console.log(`[ERROR] ${tableName}: ${error.message}`)
            }
        } else {
            console.log(`[EXISTS] ${tableName}`)
        }
    } catch (err) {
        console.log(`[Check Failed] ${tableName}`, err)
    }
}

async function inspectTable(tableName) {
    try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1)
        if (error) {
            console.log(`[ERROR] ${tableName}: ${error.message}`)
        } else if (data && data.length > 0) {
            console.log(`[SCHEMA] ${tableName}:`, Object.keys(data[0]))
        } else {
            console.log(`[EMPTY] ${tableName} (Exists but no data to infer schema)`)
        }
    } catch (err) {
        console.log(`[Inspect Failed] ${tableName}`, err)
    }
}

async function checkMessMenu() {
    const { data, error } = await supabase.from('mess_menu').select('*').limit(3)
    if (error) {
        console.log('[ERROR] mess_menu:', error.message)
    } else {
        console.log('[SUCCESS] mess_menu data:', data.slice(0, 3).map(d => d.day_of_week))
    }
}

checkMessMenu()
