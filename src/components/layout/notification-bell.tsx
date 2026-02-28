'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, GitMerge, XCircle, Clock, Hourglass, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatRelativeTime } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  ctaUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

const typeIcon: Record<string, typeof Bell> = {
  PR_MERGED: GitMerge,
  PR_CLOSED: XCircle,
  PR_WAITING_5D: Hourglass,
  PR_WAITING_10D: Hourglass,
  CONTRIBUTION_REMINDER: Clock,
};

const typeColor: Record<string, string> = {
  PR_MERGED: 'text-emerald-500 bg-emerald-500/10',
  PR_CLOSED: 'text-destructive bg-destructive/10',
  PR_WAITING_5D: 'text-amber-500 bg-amber-500/10',
  PR_WAITING_10D: 'text-amber-500 bg-amber-500/10',
  CONTRIBUTION_REMINDER: 'text-blue bg-blue/10',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: open ? false : 60_000,
    staleTime: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      fetch('/api/notifications', { method: 'PATCH' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneRead = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: 'PATCH' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.data ?? [];

  const handleNotificationClick = (n: Notification) => {
    if (!n.readAt) markOneRead.mutate(n.id);
    setOpen(false);
    if (n.ctaUrl) {
      if (n.ctaUrl.startsWith('http')) {
        window.open(n.ctaUrl, '_blank', 'noopener,noreferrer');
      } else {
        router.push(n.ctaUrl);
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-destructive">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] ?? Bell;
                const color = typeColor[n.type] ?? 'text-muted-foreground bg-secondary';
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                      !n.readAt && 'bg-blue/[0.04]',
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-medium leading-snug', !n.readAt && 'text-foreground')}>
                          {n.title}
                        </p>
                        {!n.readAt && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
