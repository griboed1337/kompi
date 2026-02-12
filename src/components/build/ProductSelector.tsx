"use client";
import { useState, useEffect, useRef } from "react";
import { Product } from "@/lib/database";
import { ProductCard } from "./ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2, Info } from "lucide-react";
import { useLenis } from "lenis/react";
import { SmoothScroll } from "@/components/SmoothScroll";

interface ProductSelectorProps {
    category: string;
    categoryName: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
}

export function ProductSelector({ category, categoryName, isOpen, onClose, onSelect }: ProductSelectorProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [showFilters, setShowFilters] = useState(false);

    const lenis = useLenis();

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            setSelectedFilters({});
            document.body.style.overflow = 'hidden';
            lenis?.stop();
        } else {
            document.body.style.overflow = 'unset';
            lenis?.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            lenis?.start();
        };
    }, [isOpen, category, lenis]);

    const fetchProducts = async (searchQuery?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const hasSearch = searchQuery !== undefined && searchQuery.trim() !== "";
            let url = `/api/products?category=${encodeURIComponent(category)}&limit=20`;
            if (hasSearch) {
                url += `&q=${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setProducts(data.products || []);
            } else {
                setError(data.error || "Не удалось загрузить товары");
            }
        } catch (err) {
            setError("Ошибка соединения с сервером");
        } finally {
            setIsLoading(false);
        }
    };

    // Извлекаем уникальные значения характеристик для фильтров
    const getFilterOptions = () => {
        const options: Record<string, Set<string>> = {};
        products.forEach((p: Product) => {
            if (p.specs) {
                Object.entries(p.specs).forEach(([key, value]) => {
                    if (!options[key]) options[key] = new Set();
                    options[key].add(String(value));
                });
            }
        });
        return Object.fromEntries(
            Object.entries(options).map(([key, values]) => [key, Array.from(values).sort()])
        );
    };

    const toggleFilter = (key: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[key] || [];
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];

            const newState = { ...prev, [key]: next };
            if (next.length === 0) delete newState[key];
            return newState;
        });
    };

    const filteredProducts = products.filter((p: Product) => {
        if (Object.keys(selectedFilters).length === 0) return true;
        return Object.entries(selectedFilters).every(([key, values]) => {
            if (!p.specs || !p.specs[key]) return false;
            return values.includes(String(p.specs[key]));
        });
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts(query);
    };

    if (!isOpen) return null;

    const filterOptions = getFilterOptions();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Оверлей */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Контейнер модалки */}
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-card/40 backdrop-blur-2xl rounded-3xl border border-primary/20 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ring-1 ring-white/10">

                {/* Хедер */}
                <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span className="forge-gradient-text italic">Подбор:</span> {categoryName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            Выберите лучший вариант для вашей сборки
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-white/10 text-muted-foreground"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Поиск и Фильтры */}
                <div className="p-6 bg-muted/20 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Поиск в категории ${categoryName}...`}
                                className="pl-11 h-12 bg-background/50 border-primary/10 focus:border-primary/50 transition-all rounded-xl"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-12 px-6 rounded-xl border-primary/20 transition-all ${showFilters ? 'bg-primary/20 border-primary' : ''}`}
                        >
                            Фильтры {Object.keys(selectedFilters).length > 0 && `(${Object.keys(selectedFilters).length})`}
                        </Button>
                        <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Найти
                        </Button>
                    </form>

                    {/* Панель фильтров */}
                    {showFilters && Object.keys(filterOptions).length > 0 && (
                        <div className="p-4 bg-background/40 rounded-2xl border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-wrap gap-6">
                                {Object.entries(filterOptions).map(([key, values]) => (
                                    <div key={key} className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{key}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {values.map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => toggleFilter(key, val)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${selectedFilters[key]?.includes(val)
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30'
                                                        }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Список товаров */}
                <SmoothScroll root={false} className="flex-1">
                    <div className="p-6">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-bold animate-pulse italic">AI-ассистент ищет лучшие предложения...</p>
                            </div>
                        ) : error ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <X className="h-12 w-12 text-destructive mb-4" />
                                <h3 className="text-lg font-bold mb-2">Ошибка</h3>
                                <p className="text-muted-foreground max-w-xs">{error}</p>
                                <Button variant="outline" onClick={() => fetchProducts()} className="mt-4 rounded-xl">
                                    Попробовать снова
                                </Button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-bold mb-2">Ничего не найдено</h3>
                                <p className="text-muted-foreground max-w-xs italic">
                                    {Object.keys(selectedFilters).length > 0
                                        ? "Попробуйте сбросить фильтры или изменить поисковый запрос."
                                        : "Попробуйте изменить запрос или вернитесь позже, когда AI обновит базу."}
                                </p>
                                {Object.keys(selectedFilters).length > 0 && (
                                    <Button variant="link" onClick={() => setSelectedFilters({})} className="mt-2 text-primary">
                                        Сбросить фильтры
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-both">
                                        <ProductCard
                                            product={product}
                                            isSelected={false} // Можно добавить проверку, если нужно
                                            onSelect={(p) => {
                                                onSelect(p);
                                                onClose();
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SmoothScroll>
            </div>
        </div>
    );
}
