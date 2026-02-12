import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';
import { generateText } from 'ai';
import { ChatMessage, ChatContext } from './ai-types';

// Инициализируем провайдер Gemini через CLI с OAuth
const geminiProvider = createGeminiProvider({
    authType: 'oauth-personal',
});

// Системный промпт для AI-ассистента по сборке ПК
// Системный промпт для ассистента
const SYSTEM_PROMPT = `Ты — RigMaster, эксперт по сборке персональных компьютеров... (остальной текст)`;

// Промпты для генерации данных о железе
const HARDWARE_FULL_PROMPT = `Ты — эксперт по рынку ПК комплектующих. 
Твоя задача: предоставить ПОЛНУЮ информацию о популярных комплектующих для категории: {category}.
Генерируй РОВНО {count} различных товаров.

ПРАВИЛА ИМЕНОВАНИЯ (ОЧЕНЬ ВАЖНО):
1. Используй унифицированный формат: [Бренд] [Серия/Линейка] [Модель] [Главная характеристика].
   Примеры: 
   - AMD Ryzen 5 7600
   - NVIDIA GeForce RTX 4070
   - Kingston FURY Beast 16GB DDR5
2. ДЛЯ ПРОЦЕССОРОВ: Генерируй ТОЛЬКО OEM версии. Игнорируй BOX-версии. Не добавляй слово "OEM" в название, если модель уникальна.
3. Исключай дубликаты. Обязательно ИСКЛЮЧИ следующие товары, если они указаны: {excludeList}.
4. Один и тот же продукт не должен встречаться дважды в твоем ответе.

ОТВЕТЬ ТОЛЬКО В ФОРМАТЕ JSON:
{
  "products": [
    {
      "title": "Название товара",
      "price": "50000 ₽",
      "original_price": "55000 ₽",
      "discount": "10%",
      "link": "https://example.com/product",
      "image": "https://images.unsplash.com/photo-...",
      "availability": "В наличии",
      "store": "Ситилинк",
      "rating": "4.8",
      "specs": {
        "CPU": {"cores": "6", "threads": "12", "base_clock": "3.8 GHz", "socket": "AM5"},
        "GPU": {"vram": "12 GB", "chipset": "RTX 4070", "pwr": "200W"},
        "RAM": {"capacity": "16 GB", "speed": "5200 MHz", "type": "DDR5"},
        "Storage": {"capacity": "1 TB", "type": "NVMe SSD"},
        "Motherboard": {"chipset": "B650", "socket": "AM5", "form_factor": "ATX"}
      }
    }
  ]
}
Важно: Обязательно добавляй объект "specs" с 3-5 ключевыми характеристиками, релевантными для категории. Отвечай строго в формате JSON без пояснений. Цены на начало 2025 года.`;

const HARDWARE_PRICES_PROMPT = `Ты — эксперт по ценам на ПК комплектующие. 
Твоя задача: обновить ТОЛЬКО ЦЕНЫ для моделей в категории: {category}.
Используй те же правила именования: [Бренд] [Модель]. Для процессоров — только OEM.

ВНИМАНИЕ: Поле 'link' является обязательным для базы данных.
ОТВЕТЬ ТОЛЬКО В ФОРМАТЕ JSON:
{
  "products": [
    {
      "title": "AMD Ryzen 5 7600",
      "price": "18500 ₽",
      "store": "DNS",
      "link": "https://www.dns-shop.ru/search/?q=AMD+Ryzen+5+7600+OEM"
    }
  ]
}
Важно: Только JSON.`;

const BUILD_SUGGESTION_PROMPT = `Ты — эксперт по сборке ПК. 
Твоя задача: предложить оптимальную конфигурацию ПК на основе параметров пользователя.
Учитывай бюджет, назначение и опыт пользователя.

ВНИМАНИЕ: Указанный бюджет является СТРОГИМ ВЕРХНИМ ПРЕДЕЛОМ. 
Итоговая стоимость всех комплектующих должна быть МЕНЬШЕ или РАВНА бюджету.
Старайся оставить запас в 5-10% от бюджета для точности совпадения цен.

ОТВЕТЬ ТОЛЬКО В ФОРМАТЕ JSON:
{
  "build": [
    {
      "category": "cpu",
      "suggestion": "Напр. Intel Core i5-13400F",
      "search_keywords": "Core i5-13400F",
      "reason": "Краткое обоснование выбора"
    },
    ... (другие категории: gpu, motherboard, ram, storage, psu, case, cooler)
  ],
  "estimated_total": "Суммарная стоимость",
  "summary": "Общее описание сборки и ее возможностей"
}
Важно: Предлагай РЕАЛЬНО СУЩЕСТВУЮЩИЕ модели. В поле search_keywords пиши ТОЛЬКО ключевое название модели без лишних слов. Только JSON без пояснений.`;


// Функция для генерации ответа от AI через Gemini OAuth
export async function generateAIResponse(
    messages: ChatMessage[],
    context?: ChatContext
): Promise<string> {
    try {
        // Формируем контекст сборки
        let contextPrompt = '';
        if (context) {
            const parts = [];
            if (context.budget) {
                parts.push(`Бюджет пользователя: ${context.budget} ₽`);
            }
            if (context.usage) {
                const usageMap: Record<string, string> = {
                    gaming: 'Игры',
                    work: 'Работа/Офис',
                    content: 'Создание контента (видео, стриминг)',
                    general: 'Повседневное использование'
                };
                parts.push(`Назначение: ${usageMap[context.usage] || context.usage}`);
            }
            if (context.experience) {
                const expMap: Record<string, string> = {
                    beginner: 'Новичок в сборке ПК',
                    intermediate: 'Средний уровень опыта',
                    advanced: 'Продвинутый пользователь'
                };
                parts.push(`Уровень пользователя: ${expMap[context.experience] || context.experience}`);
            }
            if (parts.length > 0) {
                contextPrompt = `\n\nКОНТЕКСТ ТЕКУЩЕЙ СБОРКИ:\n${parts.join('\n')}`;
            }
        }

        // Собираем полный системный промпт
        const fullSystemPrompt = SYSTEM_PROMPT + contextPrompt;

        // Вызываем Gemini 3 Flash через Vercel AI SDK
        const { text } = await generateText({
            model: geminiProvider('gemini-3-flash-preview'),
            system: fullSystemPrompt,
            messages: messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            })),
            temperature: 0.7,
        });

        if (!text) {
            return 'Извините, не удалось получить ответ. Попробуйте переформулировать вопрос.';
        }

        return text;
    } catch (error) {
        console.error('Ошибка Gemini OAuth:', error);

        if (error instanceof Error) {
            if (error.message.includes('Unauthorized') || error.message.includes('auth')) {
                throw new Error('Ошибка авторизации. Проверьте статус `gemini auth status`');
            }
            throw new Error(`Ошибка AI: ${error.message}`);
        }

        throw new Error('Неизвестная ошибка при обращении к AI');
    }
}

// Новая функция для прямой генерации данных о железе с поддержкой режимов
export async function generateHardwareData(
    category: string,
    mode: 'full' | 'prices' = 'full',
    count: number = 15,
    excludeTitles: string[] = []
): Promise<any[]> {
    try {
        const excludeList = excludeTitles.length > 0 ? excludeTitles.join(', ') : 'нет';
        const systemPrompt = (mode === 'full' ? HARDWARE_FULL_PROMPT : HARDWARE_PRICES_PROMPT)
            .replace('{category}', category)
            .replace('{count}', count.toString())
            .replace('{excludeList}', excludeList);

        const { text } = await generateText({
            model: geminiProvider('gemini-3-flash-preview'),
            system: systemPrompt,
            messages: [{ role: 'user', content: `Сгенерируй ${count} товаров для категории ${category} (режим: ${mode})` }],
            temperature: 0.4,
        });

        if (!text) throw new Error('Пустой ответ от AI');

        const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const data = JSON.parse(cleanJson);

        console.log(`[Gemini] Parsed ${data.products?.length || 0} products for ${category}`);
        if (data.products && data.products.length > 0) {
            console.log(`[Gemini] First product sample:`, JSON.stringify(data.products[0], null, 2));
        }

        return data.products || [];
    } catch (error) {
        console.error('Ошибка при генерации данных о железе:', error);
        throw error;
    }
}

export async function generateBuildSuggestion(context: ChatContext): Promise<any> {
    try {
        let contextText = `Бюджет: ${context.budget || 'не указан'} ₽. 
Назначение: ${context.usage || 'общее'}. 
Опыт пользователя: ${context.experience || 'новичок'}.`;

        const { text } = await generateText({
            model: geminiProvider('gemini-3-flash-preview'),
            system: BUILD_SUGGESTION_PROMPT,
            messages: [{ role: 'user', content: `Предложи сборку для следующих параметров:\n${contextText}` }],
            temperature: 0.5,
        });

        if (!text) throw new Error('Пустой ответ от AI');
        const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Ошибка при генерации сборки:', error);
        throw error;
    }
}
