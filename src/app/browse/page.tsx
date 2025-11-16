"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BrowsePage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Обзор компонентов</h1>
        <p className="text-muted-foreground mt-2">
          Изучайте последние комплектующие для ПК с подробными характеристиками.
        </p>
        <div className="mt-6">
          <Link href="/build">
            <Button size="lg">Начать сборку</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}