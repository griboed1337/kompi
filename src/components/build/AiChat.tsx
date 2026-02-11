"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, Bot, User, Sparkles, Brain, Zap } from "lucide-react";
import { QUICK_QUESTIONS, ChatMessage, ChatContext } from "@/lib/ai-types";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiChatProps {
    context?: ChatContext;
}

export function AiChat({ context }: AiChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'beginner' | 'advanced'>(context?.experience === 'advanced' ? 'advanced' : 'beginner');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Синхронизация режима с внешним контекстом, если он изменился
    useEffect(() => {
        if (context?.experience) {
            setMode(context.experience === 'advanced' ? 'advanced' : 'beginner');
        }
    }, [context?.experience]);

    useEffect(() => {
        if (messages.length > 0 && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: text };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput("");
        setIsLoading(true);
        setError(null);

        // Передаем выбранный режим в контекст
        const chatContext = {
            ...context,
            experience: mode
        };

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages, context: chatContext }),
            });

            const data = await response.json();

            if (data.success && data.message) {
                setMessages([...newMessages, data.message]);
            } else {
                setError(data.error || "Не удалось получить ответ");
            }
        } catch (err) {
            console.error("Ошибка отправки:", err);
            setError("Ошибка соединения с сервером");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Card className="flex flex-col h-[600px] border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            <CardHeader className="p-5 pb-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">

                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    AI-Консультант
                </CardTitle>
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none">Стиль ответов</span>
                    <div className="flex bg-background/50 p-1 rounded-xl border border-muted-foreground/10 items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode('beginner')}
                            className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${mode === 'beginner'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Brain className="h-3.5 w-3.5 mr-1.5" />
                            Просто
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode('advanced')}
                            className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${mode === 'advanced'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Zap className="h-3.5 w-3.5 mr-1.5" />
                            Эксперт
                        </Button>
                    </div>
                </div>

            </CardHeader>

            <CardContent className="flex flex-col flex-1 overflow-hidden p-4 pt-4">
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent"
                >
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Bot className="h-16 w-16 mx-auto text-primary/20 mb-6" />
                            <h3 className="text-xl font-bold mb-2">Чем я могу помочь?</h3>
                            <p className="text-muted-foreground mb-8 max-w-[300px] mx-auto text-sm">
                                Я помогу подобрать комплектующие, проверю совместимость или сравню видеокарты.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => sendMessage(q)}
                                        disabled={isLoading}
                                        className="text-xs hover:bg-primary/10 transition-colors"
                                    >
                                        {q}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-4 py-3 shadow-sm overflow-hidden ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted/50 border border-muted-foreground/10 rounded-tl-none font-light"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none 
                                            break-words
                                            prose-headings:font-bold prose-headings:mb-2 
                                            prose-p:leading-relaxed prose-p:mb-3 
                                            prose-li:list-disc prose-ul:ml-4
                                            prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-table:border-collapse
                                            prose-table:my-4 prose-table:text-xs
                                            prose-th:bg-muted prose-th:p-2 prose-th:text-xs prose-th:text-left prose-th:border
                                            prose-td:p-2 prose-td:border prose-td:text-xs">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                                        <User className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="bg-muted/50 border border-muted-foreground/10 rounded-2xl rounded-tl-none px-4 py-3">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-2 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl border">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Напишите ваш вопрос..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none px-4"
                    />
                    <Button
                        onClick={() => sendMessage()}
                        disabled={isLoading || !input.trim()}
                        className="rounded-xl h-10 w-10 p-0 shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}