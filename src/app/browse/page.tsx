"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BrowsePage() {
  return (
    <div className="container mx-auto px-4 md:px-12 py-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center space-y-4 animate-forge-fly-in">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Обзор <span className="forge-gradient-text italic animate-forge-glow">компонентов</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Изучайте последние комплектующие для ПК с подробными характеристиками и актуальными данными.
          </p>
          <div className="pt-8">
            <Link href="/build">
              <Button size="lg" className="forge-border-glow rounded-full px-8 h-12 text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                Начать сборку
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}