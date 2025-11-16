"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  title: string;
  price: string;
  link: string;
  image?: string;
  store: string;
}

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Используем API для получения продуктов из базы данных
        const response = await fetch('/api/products?store=DNS Shop');
        const data = await response.json();

        if (response.ok) {
          setProducts(data.products || []);
        } else {
          setError(data.error || "Не удалось загрузить данные о продуктах");
        }
      } catch (err) {
        console.error("Ошибка при загрузке продуктов:", err);
        setError("Не удалось загрузить данные о продуктах");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Специальные предложения</h1>
          <p className="text-muted-foreground mt-2">Загрузка продуктов...</p>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Специальные предложения</h1>
          <p className="text-red-500 mt-2">{error}</p>
          <div className="mt-6">
            <Button onClick={() => window.location.reload()} size="lg">
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Специальные предложения</h1>
          <p className="text-muted-foreground mt-2">
            Лучшие предложения на комплектующие из нашей базы данных
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Продукты не найдены</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Обновить
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                {product.image && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {product.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {product.price} • {product.store}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={product.link} target="_blank" rel="noopener noreferrer">
                      Посмотреть
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/browse">
            <Button size="lg" variant="outline">
              Обзор всех компонентов
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}