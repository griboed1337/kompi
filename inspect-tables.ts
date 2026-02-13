import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    const tables = [
        'products_cpu',
        'products_gpu',
        'products_ram',
        'products_motherboard',
        'products_ssd',
        'products_psu',
        'products_case',
        'products_cooling',
        'products'
    ];

    for (const table of tables) {
        console.log(`\n--- TABLE: ${table} ---`);
        const { data, error, count } = await supabase
            .from(table)
            .select('title, search_query', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
            continue;
        }

        console.log(`Total count: ${count}`);
        data?.forEach(p => {
            console.log(`  [${p.search_query}] ${p.title}`);
        });
    }
}

inspect();
