'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
}

export function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
        <div className="rounded-lg bg-secondary p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {description && (
        <p className="mt-2 text-[11px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
