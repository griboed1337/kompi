"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ComparePage() {
  return (
    <div className="container mx-auto px-4 md:px-12 py-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center space-y-4 animate-forge-fly-in">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Сравнение <span className="forge-gradient-text italic animate-forge-glow">компонентов</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Сравнивайте характеристики и производительность различных компонентов ПК для выбора лучшего решения.
          </p>
          <div className="pt-8">
            <Link href="/browse">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-bold transition-all hover:scale-105 active:scale-95 border-primary/20 hover:border-primary/50">
                Обзор компонентов
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}