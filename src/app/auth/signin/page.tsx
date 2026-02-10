import SignIn from '@/components/auth/SignIn';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-4">
      <SignIn />
    </div>

  );
}