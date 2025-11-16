import { NextRequest, NextResponse } from 'next/server';
import { scrapeCitilink } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, store = 'Citilink', options = {} } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Параметр query обязателен' },
        { status: 400 }
      );
    }

    console.log(`Запуск скрейпинга для запроса: ${query}, магазин: ${store}`);

    let result;
    if (store === 'Citilink') {
      result = await scrapeCitilink(query, options);
    } else {
      return NextResponse.json(
        { error: 'Неподдерживаемый магазин' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ошибка в API scrape:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}