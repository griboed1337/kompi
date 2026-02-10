export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatContext {
    budget?: number;
    usage?: string;
    experience?: string;
}

// Быстрые вопросы для пользователя
export const QUICK_QUESTIONS = [
    'Собери ПК для игр за 80000₽',
    'Какой процессор лучше для игр?',
    'RTX 4060 vs RTX 4070 - что выбрать?',
    'Нужно ли мне DDR5?',
    'Какой БП нужен для RTX 4070?'
];
