"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, RefreshCcw, Database, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const isAdmin = user?.email === 'olegshattskov1207@gmail.com';
    const [isParsing, setIsParsing] = useState(false);
    const [itemCount, setItemCount] = useState(15);
    const [selectedCategory, setSelectedCategory] = useState("процессоры");
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [lastActions, setLastActions] = useState([
        { id: 1, type: 'system', text: 'Приветствуем, Администратор Олег!', time: 'сейчас' },
        { id: 2, type: 'auth', text: 'Вход выполнен через Google OAuth', time: '5 мин. назад' },
        { id: 3, type: 'status', text: 'AI-ассистент готов к работе', time: 'сейчас' },
    ]);

    const handleStartParsing = async (mode: 'full' | 'prices' = 'full', categoryOverride?: string) => {
        const category = categoryOverride || selectedCategory;
        setIsParsing(true);
        setStatusMessage(null);
        try {
            const response = await fetch('/api/admin/generate-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, mode, count: itemCount })
            });

            const data = await response.json();

            if (data.success) {
                const actionType = mode === 'full' ? 'компонентов' : 'цен';
                setStatusMessage({
                    type: 'success',
                    text: `Проверка ${actionType} для "${category}" завершена! ${data.message}`
                });
                setLastActions(prev => [
                    {
                        id: Date.now(),
                        type: 'ai',
                        text: `ИИ: Обновление ${actionType} (${category}) — ${data.count} шт.`,
                        time: 'только что'
                    },
                    ...prev
                ]);
                return true;
            } else {
                throw new Error(data.error || 'Ошибка при генерации');
            }
        } catch (error) {
            console.error('Parsing error:', error);
            setStatusMessage({
                type: 'error',
                text: error instanceof Error ? error.message : `Не удалось выполнить проверку для "${category}"`
            });
            return false;
        } finally {
            setIsParsing(false);
        }
    };

    const handleGenerateAll = async () => {
        const categories = [
            'процессоры', 'видеокарты', 'материнские платы',
            'оперативная память', 'накопители SSD', 'блоки питания'
        ];

        setStatusMessage({ type: 'success', text: 'Запущена полная проверка всех компонентов...' });

        for (const cat of categories) {
            setSelectedCategory(cat);
            const success = await handleStartParsing('full', cat);
            if (!success) break;
            // Небольшая пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setStatusMessage({ type: 'success', text: 'Полная проверка компонентов успешно завершена!' });
    };

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [user, loading, isAdmin, router]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className="container mx-auto px-4 md:px-12 py-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <ShieldCheck className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Панель управления</h1>
                    <p className="text-muted-foreground">Панель администратора RigMaster</p>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Управление ценами */}
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-amber-200" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5 text-amber-500" />
                            Обновление цен
                        </CardTitle>
                        <CardDescription>
                            Запустить AI-парсинг актуальных цен на комплектующие
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase text-muted-foreground">Категория</Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                                disabled={isParsing}
                            >
                                <SelectTrigger id="category" className="w-full bg-background/50 border-muted-foreground/20">
                                    <SelectValue placeholder="Выберите категорию" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="процессоры">Процессоры (CPU)</SelectItem>
                                    <SelectItem value="видеокарты">Видеокарты (GPU)</SelectItem>
                                    <SelectItem value="материнские платы">Материнские платы</SelectItem>
                                    <SelectItem value="оперативная память">Оперативная память (RAM)</SelectItem>
                                    <SelectItem value="накопители SSD">Накопители (SSD/HDD)</SelectItem>
                                    <SelectItem value="блоки питания">Блоки питания (PSU)</SelectItem>
                                    <SelectItem value="корпуса">Корпуса</SelectItem>
                                    <SelectItem value="охлаждение">Охлаждение</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                                <span>Количество товаров:</span>
                                <span className="font-bold text-amber-600">{itemCount} шт.</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                step="5"
                                value={itemCount}
                                onChange={(e) => setItemCount(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                disabled={isParsing}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold flex flex-col items-center justify-center p-6 h-auto gap-2"
                                onClick={() => handleStartParsing('full')}
                                disabled={isParsing}
                            >
                                {isParsing ? (
                                    <RefreshCcw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Database className="h-5 w-5" />
                                )}
                                <span className="text-xs">Проверка компонентов</span>
                            </Button>
                            <Button
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex flex-col items-center justify-center p-6 h-auto gap-2"
                                onClick={() => handleStartParsing('prices')}
                                disabled={isParsing}
                            >
                                {isParsing ? (
                                    <RefreshCcw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-5 w-5" />
                                )}
                                <span className="text-xs">Проверка цен</span>
                            </Button>
                        </div>
                        <Button
                            variant="link"
                            className="w-full text-xs text-muted-foreground hover:text-amber-500 mt-2"
                            onClick={handleGenerateAll}
                            disabled={isParsing}
                        >
                            <RefreshCcw className={`h-3 w-3 mr-1 ${isParsing ? 'animate-spin' : ''}`} />
                            Запустить полную проверку всех типов
                        </Button>
                    </CardContent>
                </Card>

                {/* База данных */}
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-200" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            База компонентов
                        </CardTitle>
                        <CardDescription>
                            Просмотр и редактирование списка железа
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full font-bold">
                            Открыть базу
                        </Button>
                    </CardContent>
                </Card>

                {/* Статистика */}
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
                    <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-green-200" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutDashboard className="h-5 w-5 text-green-500" />
                            Статистика
                        </CardTitle>
                        <CardDescription>
                            Активность пользователей и запросы к AI
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full font-bold">
                            Посмотреть отчеты
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {statusMessage && (
                <div className={`mt-8 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${statusMessage.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-600'
                    : 'bg-red-500/10 border-red-500/20 text-red-600'
                    }`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium text-sm">{statusMessage.text}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-8 w-8 p-0"
                        onClick={() => setStatusMessage(null)}
                    >
                        ×
                    </Button>
                </div>
            )}

            <div className="mt-12 p-8 rounded-3xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Лог последних действий
                </h3>
                <div className="space-y-4">
                    {lastActions.map((action) => (
                        <div key={action.id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                            <div className="flex items-center gap-3">
                                {action.type === 'ai' ? (
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                ) : action.type === 'auth' ? (
                                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                                <span className="text-sm font-medium">{action.text}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{action.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
