"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ComparePage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Сравнение компонентов</h1>
        <p className="text-muted-foreground mt-2">
          Сравнивайте характеристики и производительность различных компонентов ПК.
        </p>
        <div className="mt-6">
          <Link href="/browse">
            <Button size="lg">Обзор компонентов</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}