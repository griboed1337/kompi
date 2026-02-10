"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, RefreshCcw, Database, ShieldCheck } from "lucide-react";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const isAdmin = user?.email === 'olegshattskov1207@gmail.com';

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
                    <CardContent>
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
                            Запустить парсер
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

            <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/10">
                <h3 className="text-xl font-bold mb-4">Лог последних действий</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>• [Система] Приветствуем, Администратор Олег!</p>
                    <p>• [Auth] Вход выполнен через Google OAuth</p>
                    <p>• [RigMaster] AI-ассистент готов к работе</p>
                </div>
            </div>
        </div>
    );
}
