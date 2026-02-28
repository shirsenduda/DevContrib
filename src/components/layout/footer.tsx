import { Logo } from './logo';

export function Footer({ href = '/dashboard' }: { href?: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <Logo variant="small" href={href} />
          <span className="text-xs text-muted-foreground/50">|</span>
          <p className="text-xs text-muted-foreground">
            Developed by{' '}
            <a
              href="https://portfolio-g34i.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors text-blue-500 hover:text-blue-400"
            >
              SHIR
            </a>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/shirsenduda/DevContrib/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Feedback
          </a>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Making open source contributions easier.
          </p>
        </div>
      </div>
    </footer>
  );
}
