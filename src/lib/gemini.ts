import { OpenAI } from 'openai';

// Системный промпт для AI-ассистента по сборке ПК
const SYSTEM_PROMPT = `Ты — эксперт по сборке персональных компьютеров и консультант магазина комплектующих.

ТВОИ ЗАДАЧИ:
1. Помогать пользователям подбирать комплектующие для ПК
2. Рекомендовать актуальное железо (2024-2025 годов)
3. Проверять совместимость компонентов
4. Объяснять технические термины простым языком

ПРАВИЛА:
- Всегда учитывай бюджет пользователя
- Проверяй совместимость: сокет CPU и материнской платы, тип памяти (DDR4/DDR5), мощность БП
- Указывай примерные цены в рублях (₽)
- Предлагай 2-3 варианта в разных ценовых категориях, если возможно
- Объясняй, почему рекомендуешь конкретный компонент
- Предупреждай о возможных проблемах (узкие места, перегрев, несовместимость)

ФОРМАТ ОТВЕТА:
- Используй структурированные списки
- Выделяй названия компонентов жирным
- Указывай ключевые характеристики
- В конце давай общую стоимость сборки

АКТУАЛЬНОЕ ЖЕЛЕЗО (приоритет):
CPU: Intel Core i5/i7/i9 12-14 поколения, AMD Ryzen 5/7/9 7000/9000 серии
GPU: NVIDIA RTX 4060/4070/4080/4090, AMD RX 7600/7700/7800/7900
RAM: DDR4 3200MHz+, DDR5 5600MHz+
SSD: NVMe PCIe 4.0/5.0
Материнские платы: Intel LGA1700, AMD AM5

Отвечай на русском языке.`;

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatContext {
    budget?: number;
    usage?: string;
    experience?: string;
}

// Инициализация клиента OpenAI для Hugging Face
const getClient = () => {
    const apiKey = process.env.HF_TOKEN;

    if (!apiKey) {
        throw new Error('HF_TOKEN не установлен в переменных окружения');
    }

    return new OpenAI({
        baseURL: 'https://router.huggingface.co/v1',
        apiKey,
    });
};

// Функция для генерации ответа от AI
export async function generateAIResponse(
    messages: ChatMessage[],
    context?: ChatContext
): Promise<string> {
    try {
        const client = getClient();

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

        // Формируем сообщения для API
        const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: fullSystemPrompt },
            ...messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }))
        ];

        // Создаем запрос к Hugging Face
        const chatCompletion = await client.chat.completions.create({
            model: 'openai/gpt-oss-120b:groq',
            messages: apiMessages,
            max_tokens: 2048,
            temperature: 0.7,
        });

        const text = chatCompletion.choices[0]?.message?.content;

        if (!text) {
            return 'Извините, не удалось получить ответ. Попробуйте переформулировать вопрос.';
        }

        return text;
    } catch (error) {
        console.error('Ошибка Hugging Face API:', error);

        // Более подробная информация об ошибке
        if (error instanceof Error) {
            if (error.message.includes('API key') || error.message.includes('token') || error.message.includes('401')) {
                throw new Error('Неверный токен. Проверьте HF_TOKEN в .env.local');
            }
            if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
                throw new Error('Превышен лимит запросов. Попробуйте позже.');
            }
            throw new Error(`Ошибка API: ${error.message}`);
        }

        throw new Error('Неизвестная ошибка при обращении к AI');
    }
}

// Быстрые вопросы для пользователя
export const QUICK_QUESTIONS = [
    'Собери ПК для игр за 80000₽',
    'Какой процессор лучше для игр?',
    'RTX 4060 vs RTX 4070 - что выбрать?',
    'Нужно ли мне DDR5?',
    'Какой БП нужен для RTX 4070?'
];
