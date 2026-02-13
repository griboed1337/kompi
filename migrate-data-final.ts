import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getTableName(category: string): string {
    const cat = category.toLowerCase();
    if (cat.includes('плат') || cat.includes('motherboard') || cat === 'mb') return 'products_motherboard';
    if (cat.includes('процессор') || cat === 'cpu') return 'products_cpu';
    if (cat.includes('видеокарт') || cat === 'gpu') return 'products_gpu';
    if (cat.includes('память') || cat.includes('ram')) return 'products_ram';
    if (cat.includes('накопител') || cat.includes('ssd') || cat.includes('hdd') || cat === 'storage') return 'products_ssd';
    if (cat.includes('блок') || cat.includes('питания') || cat.includes('psu')) return 'products_psu';
    if (cat.includes('корпус') || cat === 'case') return 'products_case';
    if (cat.includes('охлажден') || cat.includes('кулер') || cat === 'cooler') return 'products_cooling';
    return 'products';
}

async function migrate() {
    console.log('Starting migration from "products" table...');

    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error.message);
        return;
    }

    console.log(`Found ${products?.length || 0} products in main table.`);
    if (!products) return;

    let migratedCount = 0;
    for (const product of products) {
        const targetTable = getTableName(product.search_query);

        if (targetTable !== 'products') {
            console.log(`Moving "${product.title}" (${product.search_query}) to ${targetTable}...`);

            const { error: insertError } = await supabase
                .from(targetTable)
                .upsert({
                    title: product.title,
                    price: String(product.price),
                    original_price: product.original_price,
                    discount: product.discount,
                    link: product.link,
                    image: product.image,
                    availability: product.availability,
                    rating: product.rating,
                    store: product.store,
                    search_query: product.search_query,
                    created_at: product.created_at,
                    updated_at: product.updated_at
                }, { onConflict: 'link,store' });

            if (insertError) {
                console.error(`  Error inserting:`, insertError.message);
                continue;
            }

            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (deleteError) {
                console.error(`  Error deleting:`, deleteError.message);
            } else {
                migratedCount++;
            }
        }
    }

    console.log(`Migration complete. Moved ${migratedCount} products.`);
}

migrate();
