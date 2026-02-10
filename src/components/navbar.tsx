"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut, loading, signInWithGoogle } = useAuth();


  const isAdmin = user?.email === 'olegshattskov1207@gmail.com';

  const navItems = [
    { name: "Главная", href: "/" },
    { name: "Обзор", href: "/browse" },
    { name: "Сборка", href: "/build" },
    { name: "Сравнение", href: "/compare" },
    { name: "Акции", href: "/deals" },
    ...(isAdmin ? [{ name: "Админ", href: "/admin" }] : []),
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error?.message || error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Error signing in with Google:', error?.message || error);
    }
  };

  return (
    <header className="border-b w-full bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto flex h-16 items-center justify-between px-4 md:px-12">


        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 group transition-all">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <span className="text-primary-foreground font-black text-xl italic">R</span>
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              RigMaster
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground",
                  item.name === "Админ" && "text-amber-500 hover:text-amber-600 font-bold"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="text-sm">Загрузка...</div>
          ) : user ? (
            <>
              <span className="text-sm hidden md:inline font-medium">Привет, <span className="text-primary">{user.email}</span></span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full">
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoogleSignIn}
                className="rounded-full flex items-center gap-2 px-4"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link href="/auth/signin">Войти</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full px-5">
                <Link href="/auth/signup">Регистрация</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>


  );
}