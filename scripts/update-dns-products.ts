import { DnsParserService } from '../src/lib/services/dns';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProductsFromCatalog(catalogUrl: string, category: string) {
    console.log(`Starting update for category: ${category} from catalog: ${catalogUrl}`);
    const tableName = `products_${category.toLowerCase()}`;

    try {
        const urls = await DnsParserService.getUrlsFromCatalog(catalogUrl, 3);
        console.log(`Found ${urls.length} live URLs to process.`);

        for (const url of urls) {
            try {
                console.log(`[LOG] About to fetch: ${url}`);
                const { product } = await DnsParserService.parseProduct(url);
                console.log(`[LOG] Successfully parsed product: ${product.title}`);

                if (product.title) {
                    console.log(`[LOG] About to save product to ${tableName}`);

                    const { error } = await supabase
                        .from(tableName as any)
                        .upsert({
                            ...product,
                            search_query: category,
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'link,store'
                        });

                    if (!error) {
                        console.log(`Successfully saved ${product.title}`);
                    } else {
                        console.error(`Failed to save ${product.title}: ${error.message}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${url}:`, error);
            }
        }
    } catch (error) {
        console.error(`Failed to get URLs from catalog:`, error);
    }
}

// Example usage:
const CPU_CATALOG = 'https://www.dns-shop.ru/catalog/17a899cd16404e77/processory/';

if (require.main === module) {
    updateProductsFromCatalog(CPU_CATALOG, 'CPU')
        .then(() => console.log('Update finished'))
        .catch(err => {
            console.error('Fatal error:', err);
            console.error(err.stack);
        });
}
