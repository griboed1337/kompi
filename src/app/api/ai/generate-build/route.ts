import { NextRequest, NextResponse } from 'next/server';
import { generateBuildSuggestion } from '@/lib/gemini';
import { searchProducts } from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { context } = body;

        // 1. Получаем рекомендации от AI
        const suggestion = await generateBuildSuggestion(context);

        if (!suggestion || !suggestion.build) {
            throw new Error('AI не смог сгенестрировать сборку');
        }

        // 2. Ищем реальные товары в базе для каждой рекомендации
        // Для соблюдения бюджета, мы можем передавать лимит в поиск
        const budgetLimit = context.budget || 200000;

        // Примерное распределение бюджета для фильтрации (в % от общего)
        const budgetShares: Record<string, number> = {
            cpu: 0.35,
            gpu: 0.50,
            motherboard: 0.15,
            ram: 0.10,
            storage: 0.10,
            psu: 0.10,
            case: 0.10,
            cooler: 0.05
        };

        const matchedBuild = await Promise.all(suggestion.build.map(async (item: any) => {
            const query = item.search_keywords || item.suggestion;
            const categoryShare = budgetShares[item.category] || 0.2;
            const maxPriceForComponent = budgetLimit * (categoryShare + 0.1); // Даем запас 10%

            console.log(`[BuildGen] Searching for ${item.category}: "${query}" (max: ${maxPriceForComponent})`);

            // 1. Попытка: Ключевые слова + лимит цены
            let { products } = await searchProducts(query, undefined, item.category, maxPriceForComponent);

            // 2. Попытка: Если не нашли, пробуем без лимита цены (но AI уже должен был предложить в рамках бюджета)
            if (!products || products.length === 0) {
                console.log(`[BuildGen] No products within price limit for ${query}, trying without limit...`);
                const unlimitedRes = await searchProducts(query, undefined, item.category);
                products = unlimitedRes.products;
            }

            // 3. Попытка: Если все еще пусто, пробуем более широкий поиск (бренд + серия)
            if (!products || products.length === 0) {
                const words = query.split(' ').filter((w: string) => w.length > 2);
                if (words.length > 0) {
                    const broaderQuery = words.slice(0, 2).join(' ');
                    console.log(`[BuildGen] Broader search for ${item.category}: "${broaderQuery}"`);
                    const broaderResults = await searchProducts(broaderQuery, undefined, item.category, maxPriceForComponent * 1.2);
                    products = broaderResults.products;
                }
            }

            // Берем самый дешевый из подходящих (сортировка уже есть в searchProducts)
            const product = products && products.length > 0 ? products[0] : null;

            if (product) {
                console.log(`[BuildGen] Match found for ${item.category}: ${product.title}`);
            } else {
                console.warn(`[BuildGen] FAILED to match any product for ${item.category} (query: ${query})`);
            }

            return {
                category: item.category,
                suggestion: item.suggestion,
                reason: item.reason,
                product: product
            };
        }));

        return NextResponse.json({
            success: true,
            build: matchedBuild,
            summary: suggestion.summary,
            estimated_total: suggestion.estimated_total
        });

    } catch (error) {
        console.error('Error in generate-build API:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Ошибка при генерации сборки'
        }, { status: 500 });
    }
}
