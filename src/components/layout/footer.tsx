import { GitBranch } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5" />
          <span>DevContrib</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Making open source contributions easier.
        </p>
      </div>
    </footer>
  );
}
