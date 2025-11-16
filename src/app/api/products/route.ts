import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, searchProducts } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const store = searchParams.get('store');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let result;

    if (query) {
      // Поиск продуктов
      result = await searchProducts(query, store || undefined);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    } else {
      // Получение всех продуктов
      result = await getAllProducts(page, limit, store || undefined);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    return NextResponse.json({
      products: result.products,
      total: 'total' in result ? result.total : result.products.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Ошибка в API products:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}