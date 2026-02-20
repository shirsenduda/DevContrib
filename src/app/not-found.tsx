import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="mb-3 text-6xl font-bold tracking-tight text-muted-foreground/30">404</p>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Page not found</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-all hover:opacity-90"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
