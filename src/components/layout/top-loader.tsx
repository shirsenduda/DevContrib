'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname + searchParams.toString());

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (currentPath === prevPathRef.current) return;
    prevPathRef.current = currentPath;

    cleanup();

    // Start loading
    setProgress(0);
    setVisible(true);

    // Quickly jump to ~30%, then slowly crawl
    timerRef.current = setTimeout(() => {
      setProgress(30);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slow down as it gets higher
          const increment = Math.max(1, (90 - prev) * 0.08);
          return Math.min(prev + increment, 90);
        });
      }, 200);
    }, 50);

    // Complete the bar
    const completeTimer = setTimeout(() => {
      cleanup();
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 400);

    return () => {
      cleanup();
      clearTimeout(completeTimer);
    };
  }, [pathname, searchParams, cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
    >
      <div
        className="h-full bg-blue"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 0.3s ease',
          boxShadow: '0 0 10px var(--blue), 0 0 5px var(--blue)',
        }}
      />
    </div>
  );
}
