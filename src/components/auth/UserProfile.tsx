'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function UserProfile() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Or redirect to sign in page
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error?.message || error);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      <CardHeader className="p-8 pb-6">
        <CardTitle className="text-3xl font-black">Профиль пользователя</CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</h3>
            <p className="text-lg font-semibold">{user.email}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID Пользователя</h3>
            <p className="text-sm text-muted-foreground font-mono bg-muted/30 p-2 rounded-lg border">{user.id}</p>
          </div>
          <div className="pt-6">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full h-11 rounded-xl font-bold shadow-lg shadow-destructive/10"
            >
              Выйти из аккаунта
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

  );
}