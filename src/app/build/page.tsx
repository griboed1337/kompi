"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { AiChat } from "@/components/build/AiChat";
import { Sparkles } from "lucide-react";


export default function BuildPage() {
  const [budget, setBudget] = useState<string>("");
  const [usage, setUsage] = useState<string>("gaming");
  const [experience, setExperience] = useState<string>("beginner");

  const componentCategories = [
    { id: "cpu", name: "Процессор (CPU)", status: "not-selected" },
    { id: "gpu", name: "Видеокарта (GPU)", status: "not-selected" },
    { id: "ram", name: "Оперативная память (RAM)", status: "not-selected" },
    { id: "motherboard", name: "Материнская плата", status: "not-selected" },
    { id: "storage", name: "Накопитель", status: "not-selected" },
    { id: "psu", name: "Блок питания (PSU)", status: "not-selected" },
    { id: "case", name: "Корпус", status: "not-selected" },
    { id: "cooler", name: "Система охлаждения", status: "not-selected" },
  ];

  // Контекст для AI-ассистента
  const aiContext = {
    budget: budget ? parseInt(budget) : undefined,
    usage,
    experience,
  };

  return (
    <div className="container mx-auto px-4 md:px-12 py-8">
      <div className="max-w-[1440px] mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Сборка ПК
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Создайте свою идеальную конфигурацию с помощью AI-ассистента
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Левая колонка - Параметры и компоненты */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
              <CardHeader className="p-6">
                <CardTitle className="text-2xl font-bold">Параметры конфигурации</CardTitle>
                <CardDescription>
                  Укажите ваши предпочтения для подбора оптимальной конфигурации
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">

                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-sm font-semibold">Бюджет (₽)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Напр. 100000"
                    value={budget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudget(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage" className="text-sm font-semibold">Назначение сборки</Label>
                  <Select value={usage} onValueChange={setUsage}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Выберите назначение" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaming">Игры</SelectItem>
                      <SelectItem value="work">Работа/Офис</SelectItem>
                      <SelectItem value="content">Создание контента</SelectItem>
                      <SelectItem value="general">Для дома</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-semibold">Опыт сборки</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Выберите ваш уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Новичок</SelectItem>
                      <SelectItem value="intermediate">Средний</SelectItem>
                      <SelectItem value="advanced">Продвинутый</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 p-6">
                <div>
                  <CardTitle className="text-2xl font-bold">Выбранные компоненты</CardTitle>
                  <CardDescription>
                    Ваши текущие компоненты в сборке
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {componentCategories.map((category) => (
                    <div key={category.id} className="group flex items-center justify-between p-4 border border-muted-foreground/10 rounded-xl hover:border-primary/50 transition-all hover:bg-primary/5">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">{category.id}</span>
                        <h3 className="font-semibold text-sm">{category.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {category.status === "not-selected" ? "— не выбрано" : "✓ выбрано"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full px-4 h-8 text-xs font-bold border border-primary/20">
                        Выбрать
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>



          {/* Правая колонка - AI Чат и Итого */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">

            {/* AI Чат */}
            <AiChat context={aiContext} />

            {/* Итого */}
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Итоговая стоимость</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Компоненты:</span>
                    <span className="font-semibold">0 ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сборка и настройка:</span>
                    <span className="font-semibold text-green-500">Бесплатно</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка:</span>
                    <span className="font-semibold">0 ₽</span>
                  </div>
                  <div className="pt-4 mt-2 border-t flex justify-between items-end">
                    <span className="text-base font-bold">К оплате:</span>
                    <span className="text-2xl font-black text-primary">0 ₽</span>
                  </div>
                </div>
                <Button className="w-full mt-6 h-12 text-base font-bold shadow-lg shadow-primary/20" disabled>
                  Сохранить конфигурацию
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}