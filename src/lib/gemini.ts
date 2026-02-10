import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';
import { generateText } from 'ai';
import { ChatMessage, ChatContext } from './ai-types';

// Инициализируем провайдер Gemini через CLI с OAuth
const geminiProvider = createGeminiProvider({
    authType: 'oauth-personal',
});

// Системный промпт для AI-ассистента по сборке ПК
const SYSTEM_PROMPT = `Ты — RigMaster, эксперт по сборке персональных компьютеров и консультант магазина комплектующих.


ТВОИ ЗАДАЧИ:
1. Помогать пользователям подбирать комплектующие для ПК
2. Рекомендовать актуальное железо (2024-2025 годов)
3. Проверять совместимость компонентов
4. Адаптировать стиль общения под уровень знаний пользователя

ПРАВИЛА ПО СТИЛЮ (ОЧЕНЬ ВАЖНО):
Если уровень пользователя "beginner" (Новичок):
- Объясняй всё максимально просто, без лишнего жаргона.
- Используй аналогии (например, "процессор — это мозг").
- Фокусируйся на том, "что это даст в игре/работе", а не на ГГц и нанометрах.
- Давай краткие и понятные советы.

Если уровень пользователя "advanced" (Продвинутый):
- Используй технические термины (тайминги, фазы питания, линии PCIe, TDP).
- Сравнивай конкретные цифры и результаты тестов.
- Обсуждай возможности разгона, апгрейда и нюансы биоса.
- Будь максимально точен и подробен.

ОБЩИЕ ПРАВИЛА:
- Всегда учитывай бюджет пользователя.
- Проверяй совместимость: сокет CPU, чипсет, тип памяти (DDR4/DDR5), габариты видеокарты и корпуса.
- Указывай примерные цены в рублях (₽).
- Предлагай лучшие решения по соотношению цена/качество.

ФОРМАТ ОТВЕТА:
- Используй структурированные списки и Markdown-таблицы.
- Выделяй названия компонентов жирным.
- В конце всегда давай итоговую стоимость.

АКТУАЛЬНОЕ ЖЕЛЕЗО (2024-2025):
CPU: Intel Core 12-14 gen (LGA1700), AMD Ryzen 7000/9000 (AM5).
GPU: NVIDIA RTX 40-серии, AMD RX 7000-серии.
RAM: DDR5 (стандарт), DDR4 (бюджет).

Отвечай на русском языке.`;


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
