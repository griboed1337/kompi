"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { AiChat } from "@/components/build/AiChat";

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
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Сборка ПК</h1>
          <p className="text-muted-foreground mt-2">
            Создайте свою идеальную конфигурацию с помощью AI-ассистента
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Параметры и компоненты */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Параметры конфигурации</CardTitle>
                <CardDescription>
                  Укажите ваши предпочтения для подбора оптимальной конфигурации
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="budget">Бюджет (₽)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Введите ваш бюджет"
                    value={budget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudget(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage">Назначение сборки</Label>
                  <Select value={usage} onValueChange={setUsage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите назначение" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaming">Игры</SelectItem>
                      <SelectItem value="work">Работа/Офис</SelectItem>
                      <SelectItem value="content">Создание контента</SelectItem>
                      <SelectItem value="general">Повседневное использование</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Опыт сборки</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger>
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

            <Card>
              <CardHeader>
                <CardTitle>Выбранные компоненты</CardTitle>
                <CardDescription>
                  Ваши текущие компоненты в сборке
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {componentCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.status === "not-selected" ? "Не выбран" : "Выбран"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Выбрать
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка - AI Чат и Итого */}
          <div className="space-y-6">
            {/* AI Чат */}
            <AiChat context={aiContext} />

            {/* Итого */}
            <Card>
              <CardHeader>
                <CardTitle>Итого</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Компоненты:</span>
                    <span className="font-medium">0 ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Доставка:</span>
                    <span className="font-medium">0 ₽</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Всего:</span>
                    <span>0 ₽</span>
                  </div>
                </div>
                <Button className="w-full mt-4" disabled>
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