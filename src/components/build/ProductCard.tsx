"use client";
import { Product } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ExternalLink, Percent } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onSelect: (product: Product) => void;
    isSelected?: boolean;
}

export function ProductCard({ product, onSelect, isSelected }: ProductCardProps) {
    const parsePrice = (p: any): number => {
        if (typeof p === 'number') return isNaN(p) ? 0 : p;
        if (typeof p === 'string') {
            const cleaned = p.replace(/[^\d.,-]/g, '').replace(',', '.');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    };

    const numericPrice = parsePrice(product.price);
    const price = numericPrice > 0
        ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(numericPrice)
        : 'Цена не указана';

    return (
        <Card className={`group relative overflow-hidden transition-all duration-300 border-none bg-card/40 backdrop-blur-xl ring-1 ${isSelected ? 'ring-primary shadow-lg shadow-primary/20' : 'ring-border/50 hover:ring-primary/50'
            }`}>
            {/* Световой фон при ховере */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative p-4 flex flex-col h-full">
                {/* Хедер карточки */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground border">
                            {product.store || 'Магазин'}
                        </div>
                    </div>
                    {product.link && (
                        <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>

                {/* Название и характеристики */}
                <div className="flex-1 mb-4">
                    <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {product.title}
                    </h3>

                    {/* Характеристики (specs) */}
                    {product.specs && Object.keys(product.specs).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {Object.entries(product.specs).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-[9px] font-bold text-primary/80 uppercase tracking-tighter"
                                >
                                    <span className="opacity-60 mr-1">{key}:</span>
                                    <span>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {product.description && (
                        <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 font-light">
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Футер карточки */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium">Ориентировочно:</span>
                        <span className="text-lg font-black text-primary tracking-tight">
                            {price}
                        </span>
                    </div>

                    <Button
                        onClick={() => onSelect(product)}
                        size="sm"
                        className={`rounded-xl px-4 h-9 text-xs font-bold transition-all ${isSelected
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isSelected ? (
                            'Выбрано'
                        ) : (
                            <span className="flex items-center gap-2">
                                Выбрать
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
