# Supabase Authentication Setup

This document explains how to configure email and Google authentication in your Supabase project.

## 1. Configure Email Authentication

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to your project
3. Go to "Authentication" → "Settings"
4. Enable "Email" under "External OAuth providers"
5. Configure the following settings:
   - Enable "Email confirmations": ON
   - Set up your email templates as needed

## 2. Configure Google Authentication

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set the application type to "Web application"
6. Add your redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
7. Copy the "Client ID" and "Client Secret"
8. Go back to your Supabase Dashboard
9. Navigate to "Authentication" → "Settings"
10. Under "External OAuth providers", enable "Google"
11. Enter the Client ID and Client Secret from Google Cloud Console

## 3. Update Environment Variables

Make sure your `.env.local` file includes the correct Supabase configuration:

```env
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Configure Redirect URLs

In your Supabase project under "Authentication" → "URL Configuration":
- Set "Site URL" to your site URL (e.g., `http://localhost:3000`)
- Set "Redirect URLs" to include your callback URL: `http://localhost:3000/auth/callback`

## 5. Test Authentication

After completing the setup:

1. Run your application: `npm run dev`
2. Navigate to `/auth/signin` to test sign-in
3. Navigate to `/auth/signup` to test sign-up
4. The navbar should update automatically to show the user's email when signed in

## 6. Additional Security Settings

For production, consider:
- Enabling rate limiting
- Setting up custom email templates
- Configuring additional security policies
- Setting up email domain allowlists if needed