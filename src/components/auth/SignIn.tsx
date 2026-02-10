'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      router.push('/'); // Redirect to home after successful sign in
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Google sign in redirects, so no need to redirect manually
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      <CardHeader className="space-y-1 p-6">
        <CardTitle className="text-2xl font-black">Вход</CardTitle>
        <CardDescription>Войдите в аккаунт, чтобы продолжить работу</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 p-6 pt-0">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vasha@pochta.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" title="Пароль" className="font-semibold text-sm">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 rounded-xl"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col p-6 pt-2">
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>

          <div className="relative w-full my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/50 px-2 text-muted-foreground backdrop-blur-sm">Или через</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-bold flex items-center gap-2 hover:bg-muted/50 transition-colors"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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

          <div className="mt-6 text-center text-sm text-muted-foreground font-medium">
            Нет аккаунта?{' '}
            <a href="/auth/signup" className="text-primary hover:underline font-bold transition-all">
              Зарегистрироваться
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>

  );
}