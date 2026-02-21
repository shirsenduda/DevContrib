import { Logo } from './logo';

export function Footer({ href = '/dashboard' }: { href?: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Logo variant="small" href={href} />
          <span className="text-xs text-muted-foreground/50">|</span>
          <p className="text-xs text-muted-foreground">Developed by SHIR</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Making open source contributions easier.
        </p>
      </div>
    </footer>
  );
}
