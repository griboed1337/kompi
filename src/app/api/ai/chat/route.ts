import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, ChatMessage, ChatContext } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages, context } = body as {
            messages: ChatMessage[];
            context?: ChatContext;
        };

        // Валидация
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: 'Сообщения обязательны' },
                { status: 400 }
            );
        }

        // Проверяем последнее сообщение от пользователя
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== 'user') {
            return NextResponse.json(
                { error: 'Последнее сообщение должно быть от пользователя' },
                { status: 400 }
            );
        }

        // Получаем ответ от AI
        const response = await generateAIResponse(messages, context);

        return NextResponse.json({
            success: true,
            message: {
                role: 'assistant',
                content: response
            }
        });

    } catch (error) {
        console.error('AI Chat API error:', error);

        // Проверяем тип ошибки
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';

        // Если проблема с API ключом
        if (errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'API ключ не настроен. Добавьте GEMINI_API_KEY в .env.local'
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Ошибка при обработке запроса',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
