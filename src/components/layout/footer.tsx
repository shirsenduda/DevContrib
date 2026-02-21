import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Logo variant="small" href="/dashboard" />
          <span className="text-xs text-muted-foreground/50">|</span>
          <p className="text-xs text-muted-foreground">Developed by Shirshendu</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Making open source contributions easier.
        </p>
      </div>
    </footer>
  );
}
