import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCategories() {
    console.log('Checking categories in BOTH products and products_motherboard...');

    // Check main products table
    const { data: pData, error: pError } = await supabase
        .from('products')
        .select('search_query');

    if (pError) console.error('Error in products:', pError.message);
    else {
        const counts: Record<string, number> = {};
        pData?.forEach(r => {
            counts[r.search_query] = (counts[r.search_query] || 0) + 1;
        });
        console.log('Products table categories:', counts);
    }

    // Check motherboard table
    const { data: mbData, error: mbError } = await supabase
        .from('products_motherboard')
        .select('search_query');

    if (mbError) console.error('Error in products_motherboard:', mbError.message);
    else {
        const counts: Record<string, number> = {};
        mbData?.forEach(r => {
            counts[r.search_query] = (counts[r.search_query] || 0) + 1;
        });
        console.log('Motherboard table categories:', counts);
    }
}

checkCategories();
