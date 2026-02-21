import Link from 'next/link';

/**
 * Custom SVG logo mark — a merge arrow flowing into a code bracket,
 * representing developer contributions to open source.
 */
function LogoMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect width="32" height="32" rx="8" fill="var(--blue)" />
      {/* Left angle bracket '<' */}
      <path
        d="M14.5 10L9 16L14.5 22"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right angle bracket '>' merged with a branch dot */}
      <path
        d="M17.5 10L23 16L17.5 22"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Merge dot at center */}
      <circle cx="16" cy="16" r="2" fill="white" />
    </svg>
  );
}

/**
 * Full brand logo with icon + wordmark.
 * - variant="default": Navbar size
 * - variant="small": Footer size
 */
export function Logo({
  variant = 'default',
  href,
}: {
  variant?: 'default' | 'small';
  href?: string;
}) {
  const isSmall = variant === 'small';

  const content = (
    <span className={`flex items-center ${isSmall ? 'gap-1.5' : 'gap-2'}`}>
      <LogoMark size={isSmall ? 18 : 22} />
      <span
        className={`font-semibold tracking-tight ${isSmall ? 'text-xs' : 'text-base'}`}
      >
        <span className="font-normal">Dev</span>
        Contrib
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
