"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { AiChat } from "@/components/build/AiChat";
import { ProductSelector } from "@/components/build/ProductSelector";
import { Product } from "@/lib/database";
import { Sparkles, Trash2, ExternalLink, RefreshCcw } from "lucide-react";

export default function BuildPage() {
  const [budget, setBudget] = useState<string>("");
  const [usage, setUsage] = useState<string>("gaming");
  const [experience, setExperience] = useState<string>("beginner");
  const [isGeneratingBuild, setIsGeneratingBuild] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Состояние выбранных продуктов
  const [selectedProducts, setSelectedProducts] = useState<Record<string, Product>>({});

  // Состояние селектора
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{ id: string, name: string } | null>(null);

  const componentCategories = [
    { id: "cpu", name: "Процессор (CPU)" },
    { id: "gpu", name: "Видеокарта (GPU)" },
    { id: "ram", name: "Оперативная память (RAM)" },
    { id: "motherboard", name: "Материнская плата" },
    { id: "storage", name: "Накопитель" },
    { id: "psu", name: "Блок питания (PSU)" },
    { id: "case", name: "Корпус" },
    { id: "cooler", name: "Система охлаждения" },
  ];

  // Утилита для надежного парсинга цены
  const parsePrice = (price: any): number => {
    if (typeof price === 'number') return isNaN(price) ? 0 : price;
    if (typeof price === 'string') {
      // Удаляем всё, кроме цифр, точек и запятых
      const cleaned = price.replace(/[^\d.,-]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Расчет общей стоимости
  const totalPrice = useMemo(() => {
    return Object.values(selectedProducts).reduce((sum, p) => {
      return sum + parsePrice(p.price);
    }, 0);
  }, [selectedProducts]);

  const handleOpenSelector = (id: string, name: string) => {
    setActiveCategory({ id, name });
    setIsSelectorOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (activeCategory) {
      setSelectedProducts(prev => ({
        ...prev,
        [activeCategory.id]: product
      }));
    }
  };

  const handleRemoveProduct = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProducts(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  // Контекст для AI-ассистента
  const aiContext = {
    budget: budget ? parseInt(budget) : undefined,
    usage,
    experience,
    selectedProducts: Object.values(selectedProducts).map(p => p.title)
  };

  const handleSmartBuild = async () => {
    setIsGeneratingBuild(true);
    setGenerationError(null);
    try {
      const response = await fetch('/api/ai/generate-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: aiContext })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Ошибка генерации');

      // Применяем полученную сборку
      const newSelectedProducts: Record<string, Product> = {};

      data.build.forEach((item: any) => {
        if (item.product) {
          newSelectedProducts[item.category] = item.product;
        }
      });

      setSelectedProducts(prev => ({
        ...prev,
        ...newSelectedProducts
      }));

    } catch (err) {
      console.error('Smart build error:', err);
      setGenerationError(err instanceof Error ? err.message : 'Ошибка при подборе компонентов');
    } finally {
      setIsGeneratingBuild(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-12 py-8">
      <div className="max-w-[1440px] mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Сборка ПК
          </h1>
          <p className="text-muted-foreground mt-3 text-lg font-light italic">
            Создайте свою идеальную конфигурацию с помощью нейро-ассистента RigMaster
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Левая колонка - Параметры и компоненты */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
              <CardHeader className="p-6">
                <CardTitle className="text-2xl font-black">Параметры конфигурации</CardTitle>
                <CardDescription className="italic">
                  Укажите ваши предпочтения для подбора оптимального железа
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">

                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Бюджет (₽)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Напр. 100000"
                    value={budget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudget(e.target.value)}
                    className="bg-background/50 border-primary/10 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Назначение</Label>
                  <Select value={usage} onValueChange={setUsage}>
                    <SelectTrigger className="bg-background/50 border-primary/10 rounded-xl">
                      <SelectValue placeholder="Выберите назначение" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/90 backdrop-blur-xl border-primary/20 rounded-xl">
                      <SelectItem value="gaming">Гейминг / Киберспорт</SelectItem>
                      <SelectItem value="work">Работа / Рендеринг</SelectItem>
                      <SelectItem value="content">Стриминг / Контент</SelectItem>
                      <SelectItem value="general">Офис / Учеба</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ваш опыт</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="bg-background/50 border-primary/10 rounded-xl">
                      <SelectValue placeholder="Выберите ваш уровень" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/90 backdrop-blur-xl border-primary/20 rounded-xl">
                      <SelectItem value="beginner">Новичок</SelectItem>
                      <SelectItem value="intermediate">Средний</SelectItem>
                      <SelectItem value="advanced">Эксперт</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3 pt-2 flex flex-col gap-3">
                  <Button
                    onClick={handleSmartBuild}
                    disabled={isGeneratingBuild}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01]"
                  >
                    {isGeneratingBuild ? (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        RigMaster подбирает лучшее...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Сгенерировать лучшую сборку
                      </>
                    )}
                  </Button>
                  {generationError && (
                    <p className="text-[10px] text-destructive font-bold text-center italic">
                      {generationError}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 p-6">
                <div>
                  <CardTitle className="text-2xl font-black italic underline decoration-primary/30 underline-offset-8">Спецификация сборки</CardTitle>
                  <CardDescription className="mt-2">
                    Подбор компонентов в реальном времени из базы магазинов
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {componentCategories.map((category) => {
                    const selected = selectedProducts[category.id];
                    return (
                      <div
                        key={category.id}
                        onClick={() => handleOpenSelector(category.id, category.name)}
                        className={`group relative flex flex-col p-4 border border-muted-foreground/10 rounded-2xl hover:border-primary/50 transition-all cursor-pointer ${selected ? 'bg-primary/5 border-primary/30' : 'hover:bg-primary/5'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground/60 mb-1">{category.id}</span>
                            <h3 className="font-bold text-sm mb-1">{category.name}</h3>
                          </div>
                          {selected ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleRemoveProduct(category.id, e)}
                              className="h-7 w-7 rounded-full hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 rounded-xl border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all group-hover:scale-105"
                            >
                              Подбор
                            </Button>
                          )}
                        </div>

                        {selected ? (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                            <p className="text-xs font-bold text-primary line-clamp-1 group-hover:underline underline-offset-4">
                              {selected.title}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-black">{selected.price?.toLocaleString()} ₽</span>
                              <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{selected.store}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <p className="text-[10px] text-muted-foreground italic font-light">
                              Нажмите для подбора {category.name.toLowerCase()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка - AI Чат и Итого */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">

            {/* AI Чат */}
            <AiChat context={aiContext} />

            {/* Итого */}
            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden border-t-4 border-t-primary ring-1 ring-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black tracking-tight">Расчет конфигурации</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest italic">Ai-Estimator v1.0</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                    <span className="text-muted-foreground">Комплектующие:</span>
                    <span className="font-black italic">{Object.keys(selectedProducts).length} шт.</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-primary/20 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Ориентировочно:</span>
                      <span className="text-[10px] leading-tight text-muted-foreground italic mb-1">Финальная стоимость<br />из базы RigMaster</span>
                    </div>
                    <span className="text-3xl font-black text-primary tracking-tighter">
                      {totalPrice.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full mt-8 h-12 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 forge-border-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                  disabled={totalPrice === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Сохранить билд
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Селектор компонентов */}
      {activeCategory && (
        <ProductSelector
          category={activeCategory.id}
          categoryName={activeCategory.name}
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          onSelect={handleSelectProduct}
        />
      )}
    </div>
  );
}
