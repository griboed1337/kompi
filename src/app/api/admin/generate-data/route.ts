import { NextRequest, NextResponse } from 'next/server';
import { generateHardwareData } from '@/lib/gemini';
import { saveProducts, getProductsByQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        // Мы можем передавать категорию в теле запроса, 
        // или генерировать основные категории по умолчанию
        const body = await request.json().catch(() => ({}));
        const { category = 'процессоры', mode = 'full', count = 15 } = body;

        console.log(`[Admin] Запущена генерация (${mode}, ${count} шт.) для: ${category}`);

        // Если режим 'prices', получаем список товаров для обновления
        let existingToUpdate: any[] = [];
        if (mode === 'prices') {
            const { products: existing } = await getProductsByQuery(category);
            existingToUpdate = existing.slice(0, count); // Берем только нужное количество
            console.log(`[Admin] Найдено ${existingToUpdate.length} товаров для обновления цен.`);
        }

        // Если режим 'full', получаем список уже существующих товаров для исключения дубликатов
        let excludeTitles: string[] = [];
        if (mode === 'full') {
            const { products: existing } = await getProductsByQuery(category);
            excludeTitles = existing.map(p => p.title);
            console.log(`[Admin] Найдено ${excludeTitles.length} существующих товаров для исключения.`);
        }

        // 1. Генерируем данные через ИИ с учетом режима, количества и исключений
        const products = await generateHardwareData(category, mode as 'full' | 'prices', count, excludeTitles, existingToUpdate);

        if (!products || products.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'ИИ не вернул данных'
            }, { status: 500 });
        }

        // 2. Сохраняем в базу данных
        // searchQuery используем как метку категории для фильтрации
        const saveResult = await saveProducts(products, category);

        if (!saveResult.success) {
            return NextResponse.json({
                success: false,
                error: `Ошибка сохранения в БД: ${saveResult.error}`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: products.length,
            message: `Успешно сгенерировано и сохранено ${products.length} товаров`
        });

    } catch (error) {
        console.error('Ошибка в API generate-data:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }, { status: 500 });
    }
}
