'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(pathname + searchParams.toString());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setBarWidth = useCallback((percent: number) => {
    progressRef.current = percent;
    if (barRef.current) {
      barRef.current.style.width = `${percent}%`;
      barRef.current.style.transition = percent === 0 ? 'none' : 'width 0.3s ease';
    }
  }, []);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (currentPath === prevPathRef.current) return;
    prevPathRef.current = currentPath;

    cleanup();

    // Show the bar
    if (containerRef.current) containerRef.current.style.opacity = '1';
    setBarWidth(0);

    // Quickly jump to ~30%, then slowly crawl
    const t1 = setTimeout(() => {
      setBarWidth(30);

      intervalRef.current = setInterval(() => {
        const prev = progressRef.current;
        if (prev >= 90) return;
        const increment = Math.max(1, (90 - prev) * 0.08);
        setBarWidth(Math.min(prev + increment, 90));
      }, 200);
    }, 50);
    timersRef.current.push(t1);

    // Complete the bar
    const t2 = setTimeout(() => {
      cleanup();
      setBarWidth(100);

      const t3 = setTimeout(() => {
        if (containerRef.current) containerRef.current.style.opacity = '0';
        const t4 = setTimeout(() => setBarWidth(0), 300);
        timersRef.current.push(t4);
      }, 300);
      timersRef.current.push(t3);
    }, 400);
    timersRef.current.push(t2);

    return cleanup;
  }, [pathname, searchParams, cleanup, setBarWidth]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed top-0 right-0 left-0 z-9999 h-0.75"
      style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
    >
      <div
        ref={barRef}
        className="h-full bg-blue"
        style={{
          width: '0%',
          boxShadow: '0 0 10px var(--blue), 0 0 5px var(--blue)',
        }}
      />
    </div>
  );
}
