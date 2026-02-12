import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTodayRecords(tableName: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { count, error } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStr);

    if (error) {
        console.error(`Error in ${tableName}:`, error.message);
        return;
    }

    console.log(`[${tableName}] Products added today: ${count}`);

    if (count && count > 0) {
        const { data } = await supabase
            .from(tableName as any)
            .select('title, store, created_at')
            .gte('created_at', todayStr)
            .limit(3);

        data?.forEach(r => console.log(`  - ${r.title} (${r.store}) at ${r.created_at}`));
    }
}

async function main() {
    const tables = [
        'products_cpu', 'products_gpu', 'products_motherboard',
        'products_ram', 'products_ssd', 'products_psu',
        'products_case', 'products_cooling'
    ];
    console.log(`Checking records added since ${new Date().toLocaleDateString()}...`);
    for (const table of tables) {
        await checkTodayRecords(table);
    }
}

main();
