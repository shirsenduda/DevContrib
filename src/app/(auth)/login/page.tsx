'use client';

import { signIn } from 'next-auth/react';
import { GitBranch, Github, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <GitBranch className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">DevContrib</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="mb-1 text-center text-lg font-semibold tracking-tight">Welcome back</h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Sign in to continue to DevContrib
          </p>

          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </button>

          {/* Permissions */}
          <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-3.5">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Minimal permissions
            </div>
            <ul className="space-y-0.5 text-[11px] text-muted-foreground">
              <li>Read your public profile</li>
              <li>Read your email address</li>
              <li>Access public repositories</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By signing in, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
