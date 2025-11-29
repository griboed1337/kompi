import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    // Store the authorization code in a cookie for client-side processing
    const response = NextResponse.redirect(`${request.url.split('/auth/callback')[0]}${next}`);
    response.cookies.set('supabase-code', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });
    return response;
  }

  return NextResponse.redirect(`${request.url.split('/auth/callback')[0]}${next}`);
}