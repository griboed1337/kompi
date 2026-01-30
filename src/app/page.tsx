"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Computer, CheckCircle, Globe, Zap, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
      } else {
        console.error('Ошибка поиска:', data.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Ошибка при поиске:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Соберите свой идеальный ПК
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Настраивайте, сравнивайте и находите лучшие предложения на комплектующие для ПК с помощью нашего мощного инструмента.
          Проверяйте совместимость, цены и производительность в одном месте.
        </p>
      </div>

      {/* Поиск продуктов */}
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Поиск комплектующих (например, RTX 4060)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Результаты поиска */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {product.image && (
                  <img src={product.image} alt={product.title} className="w-full h-32 object-cover rounded mb-2" />
                )}
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.title}</h3>
                <p className="text-lg font-bold text-primary">{product.price}</p>
                <p className="text-xs text-muted-foreground">{product.store}</p>
                <Button asChild size="sm" className="mt-2 w-full">
                  <Link href={product.link} target="_blank">Посмотреть</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/build">Начать сборку</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/browse">Обзор компонентов</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl w-full">
        <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Computer className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Обзор компонентов</h3>
          <p className="text-muted-foreground text-sm">
            Изучайте последние комплектующие для ПК с подробными характеристиками и ценами.
          </p>
        </div>

        <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Проверка совместимости</h3>
          <p className="text-muted-foreground text-sm">
            Убедитесь, что все ваши компоненты отлично работают вместе с нашей интеллектуальной системой совместимости.
          </p>
        </div>

        <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Глобальные цены</h3>
          <p className="text-muted-foreground text-sm">
            Сравнивайте цены у разных ритейлеров и в разных регионах мира.
          </p>
        </div>
      </div>

      <div className="mt-16 max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-center mb-8">Почему выбирают наш PC Конфигуратор?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Подходит новичкам</h3>
              <p className="text-muted-foreground text-sm">
                Понятные объяснения и руководство для новичков в сборке ПК.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Экономия денег</h3>
              <p className="text-muted-foreground text-sm">
                Избегайте дорогостоящих ошибок с помощью проверки совместимости.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Глобальный охват</h3>
              <p className="text-muted-foreground text-sm">
                Сравнивайте цены в разных странах и магазинах.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Бесплатный доступ</h3>
              <p className="text-muted-foreground text-sm">
                Полностью бесплатный сервис, доступный для всех.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
