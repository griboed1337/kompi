import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getCorrectTable(title: string, currentCategory: string): string {
    const t = title.toLowerCase();
    const c = currentCategory.toLowerCase();

    // Priorities based on title keywords
    if (t.includes('ryzen') || t.includes('core i') || t.includes('intel core') || t.includes('amd b') === false && t.includes('процессор')) return 'products_cpu';
    if (t.includes('geforce') || t.includes('rtx') || t.includes('radeon') || t.includes('видеокарт')) return 'products_gpu';
    if (t.includes('ddr') || t.includes('набор памяти') || t.includes('память kingston') || t.includes('g.skill')) return 'products_ram';
    if (t.includes('материнская') || t.includes('motherboard') || t.includes('b650') || t.includes('z790') || t.includes('b550') || t.includes('am5') || t.includes('lga')) return 'products_motherboard';
    if (t.includes('ssd') || t.includes('nvme') || t.includes('накопитель')) return 'products_ssd';
    if (t.includes('блок питания') || t.includes('psu') || t.includes('750w') || t.includes('650w') || t.includes('gold')) {
        if (!t.includes('видеокарт')) return 'products_psu'; // Avoid matching PSU reqs in GPUs
    }
    if (t.includes('корпус') || t.includes('case')) return 'products_case';
    if (t.includes('кулер') || t.includes('охлаждение') || t.includes('cooler')) return 'products_cooling';

    // Fallback to current category if title is vague
    if (c.includes('процессор')) return 'products_cpu';
    if (c.includes('видеокарт')) return 'products_gpu';
    if (c.includes('память')) return 'products_ram';

    return 'products';
}

async function resort() {
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

    console.log('--- Collecting all products ---');
    let allProducts: any[] = [];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
            continue;
        }
        if (data) allProducts = [...allProducts, ...data.map(p => ({ ...p, sourceTable: table }))];
    }

    console.log(`Found ${allProducts.length} total products.`);

    console.log('--- Re-sorting and Cleaning ---');
    let movedCount = 0;
    let deletedCount = 0;

    for (const product of allProducts) {
        const targetTable = getCorrectTable(product.title, product.search_query);

        // 1. If product is in the wrong table, move it (upsert to correct, delete from source)
        if (product.sourceTable !== targetTable) {
            console.log(`Moving "${product.title}" from ${product.sourceTable} to ${targetTable}...`);

            const { error: insertError } = await supabase.from(targetTable).upsert({
                title: product.title,
                price: product.price,
                original_price: product.original_price,
                discount: product.discount,
                link: product.link,
                image: product.image,
                availability: product.availability,
                rating: product.rating,
                store: product.store,
                specs: product.specs,
                search_query: product.search_query,
                created_at: product.created_at,
                updated_at: product.updated_at
            }, { onConflict: 'link,store' });

            if (insertError) {
                console.error(`  Error inserting into ${targetTable}:`, insertError.message);
            } else {
                const { error: deleteError } = await supabase.from(product.sourceTable).delete().eq('id', product.id);
                if (deleteError) {
                    console.error(`  Error deleting from ${product.sourceTable}:`, deleteError.message);
                } else {
                    movedCount++;
                }
            }
        }
    }

    // 2. Final cleanup: remove duplicates across tables (keep only in targetTable)
    // To be extra safe, we'll run a final check based on link/store uniqueness

    console.log(`\nResort complete! Moved ${movedCount} products.`);
}

resort();
